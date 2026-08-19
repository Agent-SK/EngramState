<div align="center">

<img src="./docs/assets/engramstate-hero.webp" width="640" alt="EngramState — Load memory, not prompts" />

# EngramState

### Load memory, not prompts.

**Reusable recurrent states for efficient on-device LLM function calling.**

[Project Page](https://agent-sk.github.io/ES/) · [Interactive Demo](https://agent-sk.github.io/ES/#demo) · [Technical Blog](./docs/blog/)

</div>

---

## Overview

Function-calling agents usually retrieve relevant tools and inject their specifications into the prompt at every request. Even with Top-K retrieval, the model must repeatedly prefill the same static tool descriptions, schemas, and constraints.

**EngramState** moves that reusable tool knowledge out of the runtime prompt. It compiles each tool specification offline into loadable recurrent states, retrieves the relevant tool state for a user query, and restores that state before decoding. Runtime inference can therefore process the **user query only**, rather than re-encoding the selected tool specifications.

```text
OFFLINE
Tool specification ──► Base / Corrective states ──► State repository

ONLINE
User query ──► State Retriever ──► load state ──► Stateful LLM ──► Validator
                                      ▲                              │
                                      └──────── Router ◄─────────────┘
```

## Paper Results

Representative **DroidCall / RWKV-7 1.5B** results reported in the paper:

| Metric | Prompt (Top-4) | EngramState |
|---|---:|---:|
| Prompt tokens | 985 | **22** |
| Soft Accuracy | 0.8646 | **0.8960** |
| Exact Accuracy | 0.7800 | **0.7850** |
| TTFT | 7.301 s | **0.259 s** |
| Peak PSS | 1793.36 MiB | **1566.51 MiB** |

This corresponds to a **97.8% reduction in prompt tokens**. Mobile TTFT and Peak PSS were measured separately on a **Samsung Galaxy S25 Ultra** using an Android llama.cpp/ggml runtime; the Python research pipeline in this repository targets algorithmic reproduction rather than Android device benchmarking.

The state retriever uses the same RWKV backbone and trains only lightweight projection heads. The paper reports **2.16M trainable retriever parameters**, **8.24 MiB** retriever storage, **85% Top-1**, and **95% Top-4** retrieval accuracy.

## Method

EngramState has four main components:

1. **Retention-aware state construction**  
   Tool knowledge is split into two states because small recurrent models have limited state capacity.
   - **Base State:** Tool Name (TN), Tool Description (TD), Argument Schema (AS)
   - **Corrective State:** Argument Format (AF), Failure Rules (FR), Hard Cases (HC), with the tool identity needed for correction

2. **State compression**  
   Recurrent states are fixed-size but still costly when stored for many tools. The paper applies **4-bit channel-wise linear quantization** to the WKV state pool. For RWKV-7 1.5B, Base + Corrective states require about **24.76 MiB/tool** before compression and about **6.19 MiB/tool** with the reported 4-bit scheme.

3. **Same-backbone state retrieval**  
   Query and tool-summary states are encoded by the execution backbone. The default implementation selects the **Top-8 WKV tensors by AbsMax**, pools them into a compact feature, and maps query/tool features through separate 2-layer MLP heads into a shared retrieval space.

4. **Feedback-driven routing**  
   Generated calls are classified as `PASS`, `PARAM_ERR`, `TOOL_MISMATCH`, or `INVALID`. The router either accepts the call, loads the same tool's Corrective State, or moves to another retrieved Base State.

## Paper ↔ Code

The supplied reference implementation follows the paper's core pipeline:

| Paper component | Implementation |
|---|---|
| §3.1 Base / Corrective construction | `scripts/02_build_tool_prompts.py` |
| §3.1 Offline state compilation | `scripts/03_compile_states.py`, `engramstate/backbone.py` |
| §3.2 Channel-wise state compression | `engramstate/quantize.py`, `scripts/quantize_states.py` |
| §4.1 State features and retrieval | `engramstate/features.py`, `engramstate/retriever.py` |
| §4.1 Retriever training | `scripts/05_extract_selector_states.py`, `06_train_retriever.py`, `07_build_hard_negatives.py` |
| §4.2 Query-only execution | `engramstate/executor.py`, `scripts/run_engramstate.py` |
| §4.3 Validation and routing | `engramstate/validator.py`, `engramstate/router.py` |
| Evaluation | `scripts/evaluate.py`, `run_all.sh` |

The same merged RWKV-7 checkpoint must be used for **state compilation, query encoding, and execution**. Compiled recurrent states are checkpoint-specific.

## Quick Start

### 1. Install

A CUDA-capable environment is recommended for the default RWKV configuration.

```bash
git clone https://github.com/Agent-SK/ES.git
cd ES

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Core dependencies are PyTorch, NumPy, and the RWKV runtime. The implementation sets `RWKV_V7_ON=1`, `RWKV_JIT_ON=1`, and `RWKV_CUDA_ON=1` before loading RWKV.

### 2. Prepare data

Download DroidCall and place the following files under `data/`:

```text
data/
├── api.jsonl
├── DroidCall_train.jsonl
└── DroidCall_test.jsonl
```

See [`data/README.md`](data/README.md) for the expected schema. The test split is used only for inference/evaluation; prompt construction and retriever supervision use the training split.

### 3. Prepare the backbone

Use a merged RWKV-7 checkpoint fine-tuned for DroidCall. For the paper setup, LoRA uses rank 32, alpha 64, dropout 0.01, and 24 epochs before merging.

```bash
export MODEL=/path/to/rwkv7-1b5-droidcall.pth
export TAG=rwkv7_1b5
```

### 4. Run the full pipeline

The easiest way to reproduce the reference pipeline is:

```bash
MODEL=$MODEL TAG=$TAG bash run_all.sh
```

`run_all.sh` performs:

```text
Tool inventory
  → Base / Corrective prompts
  → recurrent-state compilation
  → selector dataset
  → state-feature extraction
  → retriever training
  → hard-negative mining + retriever refinement
  → Top-K state retrieval + query-only inference
  → evaluation
```

### 5. Run inference directly

After the offline artifacts are prepared:

```bash
python scripts/run_engramstate.py \
  --model_path "$MODEL" \
  --model_tag "$TAG" \
  --input data/DroidCall_test.jsonl \
  --inventory artifacts/inventory/tool_inventory.json \
  --state_dir artifacts/states \
  --tool_states artifacts/selector_states/tool_selector_states.pt \
  --selector_ckpt artifacts/retriever/best_selector_model_hardneg.pt \
  --top_k 4 \
  --output results/engramstate_${TAG}.jsonl \
  --metrics_json results/engramstate_${TAG}.metrics.json
```

Then score the generated calls:

```bash
python scripts/evaluate.py \
  --input results/engramstate_${TAG}.jsonl \
  --api data/api.jsonl \
  --output results/accuracy.json \
  --model_name engramstate \
  --task_name top4
```

## Outputs

```text
artifacts/
├── inventory/          # normalized tool inventory
├── prompts/            # Base / Corrective compilation prompts
├── states/             # compiled recurrent states
├── selector/           # retriever supervision splits
├── selector_states/    # state-derived query/tool features
└── retriever/          # trained projection heads + metrics

results/
├── engramstate_*.jsonl
├── engramstate_*.metrics.json
└── accuracy.json
```

## State Compression Study

To run the included state-compression analysis:

```bash
python scripts/quantize_states.py \
  --model_path "$MODEL" \
  --state_dir artifacts/states \
  --input data/DroidCall_test.jsonl \
  --out_dir results/quant
```

This evaluates reconstruction fidelity, outlier-position consistency, storage cost, and downstream decoding for the implemented quantization arms.

## Important Notes

- **States are checkpoint-bound.** Do not mix states compiled from one checkpoint with another checkpoint.
- **Retriever feature settings must match.** Query-side and tool-side features must use the same feature mode, selected tensor count, selection rule, and pooling configuration.
- **Mobile numbers require the Android runtime.** The paper's Galaxy S25 Ultra TTFT/PSS measurements use llama.cpp/ggml with GGUF models (Q8_0 unless otherwise stated); they are not produced by the Python scripts above.
- **No dataset is redistributed.** Download DroidCall from its original source and follow its license.

## Citation

Paper metadata / BibTeX will be added with the public paper release.

## License

No repository license has been added yet. Do not assume permission to redistribute or reuse the implementation until a license is explicitly provided.
