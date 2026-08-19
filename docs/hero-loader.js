(() => {
  const script = document.currentScript;
  if (!script) return;

  document.querySelectorAll('.hero-art-note').forEach(note => note.remove());

  const base = new URL('./assets/hero/', script.src);
  const parts = [1, 2, 3, 4].map(i => new URL(`part${i}.txt`, base));

  Promise.all(parts.map(async url => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load artwork chunk: ${url}`);
    return (await response.text()).trim();
  }))
    .then(chunks => {
      const src = `data:image/webp;base64,${chunks.join('')}`;

      document.querySelectorAll('img[data-engram-art]').forEach(img => {
        img.addEventListener('load', () => img.classList.add('engram-art-ready'), { once: true });
        img.src = src;
      });

      document.querySelectorAll('[data-engram-art-bg]').forEach(el => {
        el.style.backgroundImage = `url("${src}")`;
        el.classList.add('engram-art-ready');
      });
    })
    .catch(error => {
      console.warn('EngramState artwork could not be loaded.', error);
      document.documentElement.classList.add('engram-art-fallback');
    });

  const deployment = document.querySelector('.storage-section');
  if (deployment && !deployment.querySelector('.device-proof')) {
    const title = deployment.querySelector('h2');
    const proof = document.createElement('div');
    proof.className = 'device-proof';
    proof.innerHTML = `
      <div class="device-proof-badge">REAL-DEVICE EVALUATION</div>
      <div class="device-proof-copy">
        <strong>Measured on Samsung Galaxy S25 Ultra</strong>
        <span>RWKV-7 1.5B executes locally on the phone with state loading and model inference performed on-device. The reported mobile latency is not a remote model-serving round trip.</span>
      </div>
      <div class="device-proof-metric"><b>0.259 s</b><small>representative TTFT</small></div>
    `;
    title.insertAdjacentElement('afterend', proof);

    const css = document.createElement('style');
    css.textContent = `
      .device-proof{display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center;margin:22px 0 32px;padding:18px 20px;border:1px solid #bcd9f6;border-radius:20px;background:linear-gradient(135deg,#edf7ff,#fffaf0);box-shadow:0 12px 34px rgba(31,83,139,.08)}
      .device-proof-badge{padding:7px 10px;border-radius:999px;background:#0b315d;color:#fff;font-size:9px;font-weight:800;letter-spacing:.12em;white-space:nowrap}
      .device-proof-copy{display:flex;flex-direction:column;gap:3px}.device-proof-copy strong{color:#0b315d;font-size:14px}.device-proof-copy span{color:#617a96;font-size:12px;line-height:1.55}
      .device-proof-metric{text-align:right}.device-proof-metric b{display:block;color:#2479e8;font-size:24px;letter-spacing:-.04em}.device-proof-metric small{color:#7a8fa7;font-size:9px;text-transform:uppercase;letter-spacing:.08em}
      @media(max-width:760px){.device-proof{grid-template-columns:1fr}.device-proof-metric{text-align:left}}
    `;
    document.head.appendChild(css);
  }

  // Landing-page updates requested for the logo, retrieval flow, and state selection visuals.
  if (!document.getElementById('overview')) return;

  const brandMark = document.querySelector('.brand .brand-mark');
  if (brandMark) {
    const logo = document.createElement('img');
    logo.className = 'brand-symbol-img';
    logo.alt = '';
    logo.setAttribute('aria-hidden', 'true');
    logo.src = 'data:image/webp;base64,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';
    brandMark.replaceWith(logo);
  }

  const baselinePipeline = document.querySelector('.hero-card .lane.old .pipeline');
  if (baselinePipeline) {
    baselinePipeline.innerHTML = '<span>User query</span><i>→</i><span>Retrieve tool spec</span><b>+</b><span class="hot">985 tool-prompt tokens</span><i>→</i><span>Long prefill</span><i>→</i><strong>Tool call</strong>';
  }

  const baselineFlow = document.querySelector('.tool-example.baseline .flow-line');
  if (baselineFlow) {
    baselineFlow.innerHTML = '<span class="flow-pill">User query</span><span>→</span><span class="flow-pill">Retrieve relevant tool spec</span><span>→</span><span class="flow-pill hot">Query + long tool specs</span><span>→</span><span class="flow-pill hot">Prefill</span><span>→</span><span class="flow-pill">Function call</span>';
  }

  const overviewState = document.querySelector('.tool-example.engram .runtime-stack');
  if (overviewState) {
    overviewState.className = 'state-overview';
    overviewState.innerHTML = `
      <div class="compile-mini">
        <span class="state-overview-label">OFFLINE · ONE TIME</span>
        <div class="compile-source">set_timer specification</div>
        <span class="compile-arrow">→</span>
        <div class="compile-state"><strong>timer_base.state</strong><small>compiled once</small></div>
      </div>
      <div class="state-library-panel">
        <div class="state-library-head"><span>REUSABLE STATE LIBRARY</span><small>many states available · one selected</small></div>
        <div class="state-library-grid">
          <div class="state-choice selected"><span class="state-choice-icon">◷</span><strong>timer_base.state</strong><small>selected</small></div>
          <div class="state-choice"><span class="state-choice-icon">◉</span><strong>alarm_base.state</strong><small>stored</small></div>
          <div class="state-choice"><span class="state-choice-icon">▦</span><strong>calendar_base.state</strong><small>stored</small></div>
          <div class="state-choice"><span class="state-choice-icon">⌕</span><strong>search_base.state</strong><small>stored</small></div>
        </div>
      </div>
      <div class="state-overview-bottom">
        <div><span>LIVE QUERY</span><strong>“Set a timer for 20 minutes.”</strong></div>
        <div class="retrieved"><span>RETRIEVED</span><strong>✓ timer_base.state</strong></div>
        <div class="generated"><span>OUTPUT</span><strong>set_timer(minutes=20)</strong></div>
      </div>
    `;
  }

  const requestedCss = document.createElement('style');
  requestedCss.textContent = `
    .brand-symbol-img{display:block;width:25px;height:36px;object-fit:contain;flex:0 0 auto;filter:drop-shadow(0 5px 10px rgba(36,121,232,.15))}
    .state-overview{padding:18px 20px 20px;display:grid;gap:12px}.compile-mini{display:grid;grid-template-columns:1fr auto 1fr;gap:9px;align-items:center;padding:11px 12px;border:1px solid #dce7f3;border-radius:13px;background:#f9fbff}.state-overview-label{grid-column:1/-1;font-size:9px;letter-spacing:.13em;font-weight:800;color:#7890ae}.compile-source,.compile-state{padding:9px 10px;border:1px solid #dfe7f2;border-radius:10px;background:#fff;font-size:10px;color:#405771}.compile-state{background:#edf5ff;border-color:#bdd5f6;color:#245fae}.compile-state strong{display:block;font:700 10px "JetBrains Mono",monospace}.compile-state small{display:block;margin-top:2px;color:#7290b2;font-size:8px}.compile-arrow{color:#8293a8;font-size:13px;text-align:center}.state-library-panel{padding:13px;border:1px solid #d7e4f2;border-radius:14px;background:linear-gradient(180deg,#fbfdff,#f5f9ff)}.state-library-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}.state-library-head span{font-size:9px;letter-spacing:.12em;font-weight:800;color:#6f87a5}.state-library-head small{font-size:9px;color:#8798aa}.state-library-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.state-choice{position:relative;padding:10px;border:1px solid #dfe7f1;border-radius:11px;background:#fff;min-width:0}.state-choice-icon{display:inline-grid;place-items:center;width:23px;height:23px;border-radius:8px;background:#f1f6fc;color:#65809e;font-size:12px;margin-bottom:7px}.state-choice strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:700 9px "JetBrains Mono",monospace;color:#40556d}.state-choice small{display:block;margin-top:3px;font-size:8px;color:#8a99aa}.state-choice.selected{border-color:#79aef0;background:#eef6ff;box-shadow:0 7px 18px rgba(36,121,232,.10)}.state-choice.selected:after{content:"✓";position:absolute;right:7px;top:7px;width:18px;height:18px;border-radius:50%;display:grid;place-items:center;background:#2479e8;color:#fff;font-size:9px;font-weight:800}.state-choice.selected .state-choice-icon{background:#dcecff;color:#2479e8}.state-choice.selected strong{color:#174f93}.state-choice.selected small{color:#2479e8;font-weight:700}.state-overview-bottom{display:grid;grid-template-columns:1.2fr 1fr 1.1fr;gap:8px}.state-overview-bottom>div{padding:10px 11px;border:1px solid #dfe7f2;border-radius:11px;background:#fff;min-width:0}.state-overview-bottom span{display:block;font-size:8px;letter-spacing:.11em;font-weight:800;color:#8797a8;margin-bottom:4px}.state-overview-bottom strong{display:block;font-size:9px;line-height:1.45;color:#344a62;overflow-wrap:anywhere}.state-overview-bottom .retrieved{background:#eef6ff;border-color:#bdd8f8}.state-overview-bottom .retrieved strong{font-family:"JetBrains Mono",monospace;color:#2465b6}.state-overview-bottom .generated{background:#eefaf4;border-color:#cbe9d8}.state-overview-bottom .generated strong{font-family:"JetBrains Mono",monospace;color:#1d7652}
    .state-viewport[data-library-enhanced="true"]{display:block;padding:13px;text-align:left;background:linear-gradient(180deg,#fbfdff,#f5f9ff)}.state-legacy{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;opacity:0!important;pointer-events:none!important}.demo-state-library{height:100%;display:flex;flex-direction:column;gap:9px}.demo-state-library-head{display:flex;justify-content:space-between;gap:10px;align-items:center}.demo-state-library-head span{font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;color:#7087a4}.demo-state-library-head small{font-size:9px;color:#8a9aaa}.demo-state-options{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;flex:1;min-height:0}.demo-state-option{position:relative;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:10px;border:1px solid #dbe5f0;border-radius:11px;background:#fff;min-width:0;transition:.18s ease}.demo-state-icon{display:grid;place-items:center;width:25px;height:25px;border-radius:8px;background:#f1f6fb;color:#6d86a4;font-size:12px;margin-bottom:7px}.demo-state-option strong{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:700 9px "JetBrains Mono",monospace;color:#42566d}.demo-state-option small{font-size:8px;color:#8a99aa;margin-top:3px}.demo-state-option.selected{border-color:#72a9ec;background:#eef6ff;box-shadow:0 8px 18px rgba(36,121,232,.11)}.demo-state-option.selected:after{content:"✓";position:absolute;right:7px;top:7px;width:18px;height:18px;border-radius:50%;display:grid;place-items:center;background:#2479e8;color:#fff;font-size:9px;font-weight:800}.demo-state-option.selected .demo-state-icon{background:#dbeaff;color:#2479e8}.demo-state-option.selected strong{color:#174f93}.demo-state-option.selected small{color:#2479e8;font-weight:700}.demo-state-picked{display:flex;align-items:center;justify-content:center;gap:7px;min-height:26px;padding:5px 9px;border:1px solid #bed8f6;border-radius:999px;background:#f0f7ff;color:#5f7691;font-size:9px}.demo-state-picked strong{font:700 9px "JetBrains Mono",monospace;color:#2465b6}.race-lane.running.engram .demo-state-option.selected{animation:stateCardPulse .42s ease}@keyframes stateCardPulse{0%{transform:scale(.97);opacity:.7}70%{transform:scale(1.015);opacity:1}100%{transform:scale(1)}}
    @media(max-width:520px){.state-overview-bottom{grid-template-columns:1fr}.state-library-grid{grid-template-columns:1fr 1fr}.demo-state-options{grid-template-columns:1fr 1fr}.demo-state-option:last-child{display:none}}
  `;
  document.head.appendChild(requestedCss);

  const enhanceDemoStateLibrary = () => {
    const viewport = document.querySelector('.state-viewport');
    if (!viewport || viewport.dataset.libraryEnhanced === 'true') return;
    const legacy = viewport.firstElementChild;
    if (!legacy) return;

    viewport.dataset.libraryEnhanced = 'true';
    legacy.classList.add('state-legacy');
    legacy.insertAdjacentHTML('afterend', `
      <div class="demo-state-library" aria-label="Reusable state candidates">
        <div class="demo-state-library-head"><span>Reusable states</span><small>many available · one selected</small></div>
        <div class="demo-state-options">
          <div class="demo-state-option selected" data-state-option="timer"><span class="demo-state-icon">◷</span><strong>timer_base.state</strong><small>Timer</small></div>
          <div class="demo-state-option" data-state-option="alarm"><span class="demo-state-icon">◉</span><strong>alarm_base.state</strong><small>Alarm</small></div>
          <div class="demo-state-option" data-state-option="calendar"><span class="demo-state-icon">▦</span><strong>calendar_base.state</strong><small>Calendar</small></div>
        </div>
        <div class="demo-state-picked"><span>Retrieved</span><strong data-selected-state>timer_base.state</strong></div>
      </div>
    `;

    const syncStateSelection = () => {
      const active = document.querySelector('[data-race-example].active')?.dataset.raceExample || 'timer';
      viewport.querySelectorAll('[data-state-option]').forEach(option => {
        option.classList.toggle('selected', option.dataset.stateOption === active);
      });
      const selectedName = document.getElementById('state-name')?.textContent || `${active}_base.state`;
      const picked = viewport.querySelector('[data-selected-state]');
      if (picked) picked.textContent = selectedName;
    };

    document.querySelectorAll('[data-race-example]').forEach(button => {
      button.addEventListener('click', () => setTimeout(syncStateSelection, 0));
    });
    syncStateSelection();
  };

  setTimeout(enhanceDemoStateLibrary, 0);
})();
