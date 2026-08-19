(() => {
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = './visual-refresh.css';
  document.head.appendChild(style);

  const notes = {
    timer: 'timer schema and constraints already compiled offline',
    alarm: 'alarm semantics and time constraints already compiled offline',
    calendar: 'calendar schema and date handling already compiled offline'
  };

  function stateBankMarkup(selected = 'timer') {
    const items = [
      ['timer','⏱','Timer','timer_base.state'],
      ['alarm','⏰','Alarm','alarm_base.state'],
      ['calendar','📅','Calendar','calendar_base.state'],
      ['message','💬','Message','message_base.state'],
      ['weather','☁','Weather','weather_base.state']
    ];
    return items.map(([kind, icon, label, file]) => `
      <div class="state-mini ${kind === selected ? 'selected' : ''}" data-concept-state="${kind}">
        <i>${icon}</i><b>${label}</b><small>${file.replace('_base.state','')}</small>
      </div>`).join('');
  }

  function demoStateBankMarkup(selected = 'timer') {
    const items = [
      ['timer','⏱','Timer'],
      ['alarm','⏰','Alarm'],
      ['calendar','📅','Calendar'],
      ['message','💬','Message'],
      ['weather','☁','Weather']
    ];
    return items.map(([kind, icon, label]) => `
      <div class="demo-state-item ${kind === selected ? 'selected' : ''}" data-demo-state="${kind}">
        <span class="state-icon">${icon}</span><strong>${label}</strong>
      </div>`).join('');
  }

  function updateDemoSelection(kind) {
    document.querySelectorAll('[data-demo-state]').forEach(el => {
      el.classList.toggle('selected', el.dataset.demoState === kind);
    });
    const note = document.getElementById('state-note');
    if (note && notes[kind]) note.textContent = notes[kind];
  }

  function init() {
    const baselinePipeline = document.querySelector('.hero-card .lane.old .pipeline');
    if (baselinePipeline) {
      baselinePipeline.innerHTML = `
        <span>User query</span><i>→</i><span class="retrieve-pill">Retrieve</span><i>→</i>
        <span class="hot">+ 985 tool-prompt tokens</span><i>→</i><span>Long prefill</span><i>→</i><strong>Tool call</strong>`;
    }

    const baselineFlow = document.querySelector('.tool-example.baseline .flow-line');
    if (baselineFlow) {
      baselineFlow.innerHTML = `
        <span class="flow-pill">User query</span><span>→</span>
        <span class="flow-pill retrieve">Retrieve tools</span><span>→</span>
        <span class="flow-pill hot">+ Long tool specs</span><span>→</span>
        <span class="flow-pill hot">Prefill</span><span>→</span>
        <span class="flow-pill">Function call</span>`;
    }
    const baselineNote = document.querySelector('.tool-example.baseline .tool-example-note');
    if (baselineNote) baselineNote.textContent = 'Retrieval selects the candidate tools, but their static specifications are still concatenated and reread on every request.';

    const runtimeStack = document.querySelector('.tool-example.engram .runtime-stack');
    if (runtimeStack) {
      runtimeStack.className = 'state-concept';
      runtimeStack.innerHTML = `
        <div class="state-concept-offline">
          <span><strong>Offline once</strong> · compile tool specifications into reusable states</span>
          <span class="state-concept-arrow">spec → state</span>
        </div>
        <div class="state-concept-runtime">
          <div class="state-query-row">
            <span class="state-query-label">Live query</span>
            <div class="state-query-bubble">“Set a timer for 20 minutes.”</div>
            <span class="state-retrieve-badge">Retriever → Timer</span>
          </div>
          <div class="state-bank-title"><span>State repository</span><span>one state selected</span></div>
          <div class="state-bank">${stateBankMarkup('timer')}</div>
          <div class="state-selected-result">
            <span>Loaded</span><strong>timer_base.state</strong><code>set_timer(minutes=20)</code>
          </div>
        </div>`;
    }

    const baselineSubtitle = document.querySelector('.race-lane.baseline .race-lane-title span');
    if (baselineSubtitle) baselineSubtitle.textContent = 'Retrieve candidate tools, then prefill their specifications';
    const promptViewport = document.querySelector('.race-lane.baseline .prompt-viewport');
    if (promptViewport && !document.querySelector('.baseline-retrieve-strip')) {
      const strip = document.createElement('div');
      strip.className = 'baseline-retrieve-strip';
      strip.innerHTML = '<span>RETRIEVER</span><strong>Top-K tools selected</strong><em>→ 985 prompt tokens</em>';
      promptViewport.insertAdjacentElement('beforebegin', strip);
    }

    const stateViewport = document.querySelector('.state-viewport');
    if (stateViewport) {
      stateViewport.classList.add('state-repository-view');
      stateViewport.innerHTML = `
        <div class="demo-state-header"><span>State repository</span><b>Retriever selects one</b></div>
        <div class="demo-state-bank">${demoStateBankMarkup('timer')}</div>
        <div class="demo-state-selection">
          <div class="selection-mark">↘</div>
          <strong id="state-name">timer_base.state</strong>
          <span id="state-note">timer schema and constraints already compiled offline</span>
        </div>`;
    }

    document.querySelectorAll('[data-race-example]').forEach(chip => {
      chip.addEventListener('click', () => updateDemoSelection(chip.dataset.raceExample));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();