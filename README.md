# ES

> A lightweight research project for efficient on-device tool use.

<p align="center">
  <a href="./docs/index.html"><b>Project Page</b></a> ·
  <a href="#demo"><b>Demo</b></a> ·
  <a href="#results"><b>Results</b></a> ·
  <a href="#citation"><b>Citation</b></a>
</p>

---

## Overview

ES explores a state-based approach to reducing repeated prompt processing for on-device tool use.
Instead of re-reading the same tool information for every request, reusable states are prepared once and loaded at inference time.

> **Note**  
> This repository is currently under active development. Code, paper links, and final project details will be added later.

## Why ES?

Traditional tool-use pipelines repeatedly process tool descriptions together with each user query. ES is designed to move reusable tool knowledge out of the repeated inference path.

```text
Traditional
User Query + Tool Specifications  ->  Prefill  ->  Tool Call

ES
User Query  ->  Retrieve State  ->  Load State  ->  Tool Call
```

## Highlights

- Efficient on-device inference
- Reusable tool-specific states
- Lightweight state retrieval
- Reduced repeated prompt processing
- Mobile-oriented design

## Demo

A mobile demo is planned to visualize the full execution flow:

```text
User Query
   |
   v
State Retriever
   |
   v
Load State
   |
   v
Function Call
   |
   v
Device Action
```

The demo application will be added under `demo/`.

## Results

Final results will be added after the project is publicly released.

| Metric | Baseline | ES |
|---|---:|---:|
| Prompt tokens | TBD | TBD |
| TTFT | TBD | TBD |
| Accuracy | TBD | TBD |
| Storage | TBD | TBD |

## Repository Structure

```text
ES/
├── README.md
├── core/          # Core implementation (to be added)
├── eval/          # Evaluation scripts (to be added)
├── examples/      # Minimal examples (to be added)
├── demo/          # Mobile demo (to be added)
├── assets/        # Figures, screenshots, GIFs
└── docs/          # GitHub Pages project website
```

## Project Page

A lightweight project website lives in [`docs/`](./docs/).
It is designed for GitHub Pages and can later include:

- visual method explanation
- mobile demo video
- interactive execution mockup
- main results
- paper / code / citation links
- technical blog posts

## Status

- [x] Repository initialized
- [x] Project page scaffold
- [ ] Core implementation
- [ ] Evaluation scripts
- [ ] Mobile demo
- [ ] Demo video
- [ ] Public paper link

## Citation

Citation information will be added after public release.

## License

No open-source license has been selected yet.
