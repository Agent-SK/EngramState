(() => {
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = './visual-refresh.css';
  document.head.appendChild(style);

  const flowStyle = document.createElement('link');
  flowStyle.rel = 'stylesheet';
  flowStyle.href = './flow-v2.css';
  document.head.appendChild(flowStyle);

  const meta = {
    timer: {
      query: 'Set a timer for 20 minutes.',
      tokens: 8,
      queryTime: '≈0.059 s',
      selected: 'Timer',
      state: 'timer_base.state',
      result: 'set_timer(minutes=20)',
      note: 'timer schema and constraints already compiled offline'
    },
    alarm: {
      query: 'Wake me up at 7 tomorrow morning.',
      tokens: 9,
      queryTime: '≈0.067 s',
      selected: 'Alarm',
      state: 'alarm_base.state',
      result: 'set_alarm(07:00)',
      note: 'alarm semantics and time constraints already compiled offline'
    },
    calendar: {
      query: 'Add a team sync tomorrow at 3 PM.',
      tokens: 10,
      queryTime: '≈0.074 s',
      selected: 'Calendar',
      state: 'calendar_base.state',
      result: 'create_event(15:00, "team sync")',
      note: 'calendar schema and date handling already compiled offline'
    }
  };

  let selectionTimer = null;

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

  function demoStateBankMarkup() {
    const items = [
      ['timer','⏱','Timer'],
      ['alarm','⏰','Alarm'],
      ['calendar','📅','Calendar'],
      ['message','💬','Message'],
      ['weather','☁','Weather']
    ];
    return items.map(([kind, icon, label]) => `
      <div class="demo-state-item" data-demo-state="${kind}">
        <span class="state-icon">${icon}</span><strong>${label}</strong>
      </div>`).join('');
  }

  function activeKind() {
    return document.querySelector('[data-race-example].active')?.dataset.raceExample || 'timer';
  }

  function updateFlowMeta(kind) {
    const m = meta[kind] || meta.timer;

    document.querySelectorAll('[data-flow-query]').forEach(el => el.textContent = `“${m.query}”`);
    document.querySelectorAll('[data-flow-query-meta]').forEach(el => {
      el.textContent = `≈${m.tokens} query tokens · ${m.queryTime} query-only prefill*`;
    });
    document.querySelectorAll('[data-flow-selected]').forEach(el => el.textContent = m.selected);
    document.querySelectorAll('[data-flow-total]').forEach(el => {
      el.textContent = `≈${985 + m.tokens} tokens total`;
    });

    const sharedMeta = document.getElementById('race-query-meta');
    if (sharedMeta) sharedMeta.textContent = `≈${m.tokens} tokens`;

    const baselineMeta = document.querySelector('.race-lane.baseline .progress-meta span:last-child');
    const engramMeta = document.querySelector('.race-lane.engram .progress-meta span:last-child');
    if (baselineMeta) baselineMeta.textContent = `≈${985 + m.tokens} total prefill tokens`;
    if (engramMeta) engramMeta.textContent = `≈${m.tokens} query tokens`;
  }

  function clearDemoSelection(kind) {
    const m = meta[kind] || meta.timer;
    const viewport = document.querySelector('.state-viewport.state-repository-view');
    viewport?.classList.remove('has-selection');

    document.querySelectorAll('[data-demo-state]').forEach(el => el.classList.remove('selected'));

    const header = document.querySelector('.demo-state-header b');
    if (header) header.textContent = 'Run to retrieve';

    const mark = document.querySelector('.demo-state-selection .selection-mark');
    const stateName = document.getElementById('state-name');
    const stateNote = document.getElementById('state-note');
    if (mark) mark.textContent = '…';
    if (stateName) stateName.textContent = 'No state selected';
    if (stateNote) stateNote.textContent = `Retriever will choose from the query: “${m.query}”`;
  }

  function revealDemoSelection(kind) {
    const m = meta[kind] || meta.timer;
    const viewport = document.querySelector('.state-viewport.state-repository-view');
    viewport?.classList.add('has-selection');

    document.querySelectorAll('[data-demo-state]').forEach(el => {
      el.classList.toggle('selected', el.dataset.demoState === kind);
    });

    const header = document.querySelector('.demo-state-header b');
    const mark = document.querySelector('.demo-state-selection .selection-mark');
    const stateName = document.getElementById('state-name');
    const stateNote = document.getElementById('state-note');
    if (header) header.textContent = `Retriever → ${m.selected}`;
    if (mark) mark.textContent = '↘';
    if (stateName) stateName.textContent = m.state;
    if (stateNote) stateNote.textContent = m.note;
  }

  function init() {
    const baselinePipeline = document.querySelector('.hero-card .lane.old .pipeline');
    if (baselinePipeline) {
      baselinePipeline.innerHTML = `
        <span>User query</span><i>→</i><span class="retrieve-pill">Retrieve</span><i>→</i>
        <span class="hot">+ 985 tool-prompt tokens</span><i>→</i><strong>Tool call</strong>`;
    }

    const baselineFlow = document.querySelector('.tool-example.baseline .flow-line');
    if (baselineFlow) {
      baselineFlow.innerHTML = `
        <span class="flow-pill">User query</span><span>→</span>
        <span class="flow-pill retrieve">State Retriever</span><span>→</span>
        <span class="flow-pill hot">Query + long tool specs</span><span>→</span>
        <span class="flow-pill hot">Prefill</span><span>→</span>
        <span class="flow-pill">Function call</span>`;
    }
    const baselineNote = document.querySelector('.tool-example.baseline .tool-example-note');
    if (baselineNote) baselineNote.textContent = 'The retriever chooses candidate tools, then the live query is concatenated with their static specifications and paid for again as prompt prefill.';

    const runtimeStack = document.querySelector('.tool-example.engram .runtime-stack');
    if (runtimeStack) {
      runtimeStack.className = 'state-concept state-concept-v2';
      runtimeStack.innerHTML = `
        <div class="state-concept-offline">
          <span><strong>Offline once</strong> · compile each tool specification into a reusable state</span>
          <span class="state-concept-arrow">spec → state</span>
        </div>

        <div class="concept-journey concept-journey-stacked">
          <div class="concept-top-row">
            <div class="concept-step concept-query">
              <span>1 · User query</span>
              <strong>“Set a timer for 20 minutes.”</strong>
              <small>≈8 query tokens</small>
            </div>
            <div class="concept-arrow">→</div>
            <div class="concept-step concept-retriever">
              <span>2 · State Retriever</span>
              <strong>Top-K candidate states</strong>
              <small>Timer is the best match</small>
            </div>
          </div>

          <div class="concept-down">↓</div>

          <div class="concept-step concept-repository">
            <div class="state-bank-title"><span>3 · State repository</span><span>Timer selected</span></div>
            <div class="state-bank">${stateBankMarkup('timer')}</div>
          </div>

          <div class="concept-down">↓</div>

          <div class="concept-bottom-row">
            <div class="concept-step concept-load">
              <span>4 · Load selected state</span>
              <strong>timer_base.state</strong>
              <small>restore only the selected memory</small>
            </div>
            <div class="concept-arrow">→</div>
            <div class="concept-step concept-generate">
              <span>5 · Generate</span>
              <strong>set_timer(minutes=20)</strong>
              <small>function call from query + loaded state</small>
            </div>
          </div>
        </div>`;
    }

    const raceQuery = document.querySelector('.race-query-wrap');
    if (raceQuery && !document.getElementById('race-query-meta')) {
      const qMeta = document.createElement('span');
      qMeta.id = 'race-query-meta';
      qMeta.className = 'race-query-meta';
      qMeta.textContent = '≈8 tokens';
      raceQuery.appendChild(qMeta);
    }

    const baselineLane = document.querySelector('.race-lane.baseline');
    const baselineHead = baselineLane?.querySelector('.race-lane-head');
    if (baselineHead && !baselineLane.querySelector('.lane-flow')) {
      baselineHead.insertAdjacentHTML('afterend', `
        <div class="lane-flow baseline-lane-flow">
          <div class="lane-flow-step">
            <span>User query</span>
            <strong data-flow-query>“Set a timer for 20 minutes.”</strong>
            <small data-flow-query-meta>≈8 query tokens · ≈0.059 s query-only prefill*</small>
          </div>
          <div class="lane-flow-arrow">→</div>
          <div class="lane-flow-step retriever-step">
            <span>State Retriever</span>
            <strong>Top-K tools</strong>
            <small>candidate tools selected</small>
          </div>
          <div class="lane-flow-arrow">→</div>
          <div class="lane-flow-step prompt-step">
            <span>Prompt package</span>
            <strong>query + 985 tool tokens</strong>
            <small data-flow-total>≈993 tokens total</small>
          </div>
        </div>`);
    }

    const engramLane = document.querySelector('.race-lane.engram');
    const engramHead = engramLane?.querySelector('.race-lane-head');
    if (engramHead && !engramLane.querySelector('.lane-flow')) {
      engramHead.insertAdjacentHTML('afterend', `
        <div class="lane-flow engram-lane-flow">
          <div class="lane-flow-step">
            <span>User query</span>
            <strong data-flow-query>“Set a timer for 20 minutes.”</strong>
            <small data-flow-query-meta>≈8 query tokens · ≈0.059 s query-only prefill*</small>
          </div>
          <div class="lane-flow-arrow">→</div>
          <div class="lane-flow-step retriever-step">
            <span>State Retriever</span>
            <strong>Top-K states</strong>
            <small>select from stored memories</small>
          </div>
          <div class="lane-flow-arrow">↓</div>
        </div>`);
    }

    document.querySelector('.baseline-retrieve-strip')?.remove();

    const baselineSubtitle = document.querySelector('.race-lane.baseline .race-lane-title span');
    if (baselineSubtitle) baselineSubtitle.textContent = 'User query → retriever → query + tool prompt';

    const engramSubtitle = document.querySelector('.race-lane.engram .race-lane-title span');
    if (engramSubtitle) engramSubtitle.textContent = 'User query → retriever → selected reusable state';

    const stateViewport = document.querySelector('.state-viewport');
    if (stateViewport) {
      stateViewport.classList.add('state-repository-view');
      stateViewport.innerHTML = `
        <div class="demo-state-header"><span>Candidate state repository</span><b>Run to retrieve</b></div>
        <div class="demo-state-bank">${demoStateBankMarkup()}</div>
        <div class="demo-state-selection">
          <div class="selection-mark">…</div>
          <strong id="state-name">No state selected</strong>
          <span id="state-note">Run comparison to retrieve from the live query.</span>
        </div>`;
    }

    const raceCaption = document.querySelector('.race-caption');
    if (raceCaption) {
      raceCaption.innerHTML = `
        <span><b>Representative measured TTFT:</b> 7.301 s vs 0.259 s.</span>
        <span>* Query-only time is an illustrative linear estimate from the 985-token baseline, not a separate device measurement.</span>
        <span>Device UI is a visual simulation; the Android demo will invoke real actions.</span>`;
    }

    document.querySelectorAll('[data-race-example]').forEach(chip => {
      chip.addEventListener('click', () => {
        if (selectionTimer) clearTimeout(selectionTimer);
        const kind = chip.dataset.raceExample;
        setTimeout(() => {
          updateFlowMeta(kind);
          clearDemoSelection(kind);
        }, 0);
      });
    });

    const runButton = document.getElementById('race-run');
    if (runButton) {
      runButton.addEventListener('click', () => {
        if (selectionTimer) clearTimeout(selectionTimer);
        const kind = activeKind();
        const m = meta[kind] || meta.timer;

        clearDemoSelection(kind);

        setTimeout(() => {
          const baselineStage = document.getElementById('baseline-stage');
          const baselineWait = document.getElementById('baseline-wait');
          const engramStage = document.getElementById('engram-stage');
          const engramWait = document.getElementById('engram-wait');
          if (baselineStage) baselineStage.textContent = 'Prefilling user query + retrieved tool specifications…';
          if (baselineWait) baselineWait.textContent = `Waiting for ≈${985 + m.tokens}-token prompt prefill…`;
          if (engramStage) engramStage.textContent = 'State Retriever is ranking candidate memories…';
          if (engramWait) engramWait.textContent = `Matching “${m.query}” to the state repository…`;
        }, 0);

        selectionTimer = setTimeout(() => {
          revealDemoSelection(kind);
          const engramStage = document.getElementById('engram-stage');
          const engramWait = document.getElementById('engram-wait');
          if (engramStage) engramStage.textContent = `${m.selected} state selected → loading…`;
          if (engramWait) engramWait.textContent = `Restoring ${m.state}…`;
        }, 120);
      }, true);
    }

    updateFlowMeta('timer');
    clearDemoSelection('timer');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();