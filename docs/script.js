const demoStyles = document.createElement('link');
demoStyles.rel = 'stylesheet';
demoStyles.href = './demo.css';
document.head.appendChild(demoStyles);

const examples = {
  timer: {
    query: 'Set a timer for 20 minutes.',
    result: 'set_timer(20m)',
    state: 'timer_base.state',
    kind: 'timer',
    title: 'Timer',
    stateNote: 'timer schema and constraints already compiled offline',
    queryTokens: 8,
    promptTokens: 993,
    promptMs: 7360,
    engramMs: 94
  },
  alarm: {
    query: 'Wake me up at 7 tomorrow morning.',
    result: 'set_alarm(07:00)',
    state: 'alarm_base.state',
    kind: 'alarm',
    title: 'Alarm',
    stateNote: 'alarm semantics and time constraints already compiled offline',
    queryTokens: 9,
    promptTokens: 994,
    promptMs: 7368,
    engramMs: 106
  },
  calendar: {
    query: 'Add a team sync tomorrow at 3 PM.',
    result: 'create_event(15:00, "team sync")',
    state: 'calendar_base.state',
    kind: 'calendar',
    title: 'Calendar',
    stateNote: 'calendar schema and date handling already compiled offline',
    queryTokens: 10,
    promptTokens: 995,
    promptMs: 7375,
    engramMs: 118
  }
};

const promptTemplates = {
  timer: `<span class="schema-key">[SYSTEM]</span> You are an on-device assistant. Select the correct tool and emit a valid function call.

<span class="schema-key">tools:</span>
  - name: <span class="schema-value">set_timer</span>
    description: Start a countdown timer for a requested duration.
    arguments:
      minutes: integer, required
      seconds: integer, optional
      label: string, optional
    constraints:
      - normalize relative duration to minutes/seconds
      - reject negative values
      - preserve the exact requested duration
    examples:
      "twenty minutes" -> {"minutes":20}
      "90 seconds" -> {"minutes":1,"seconds":30}

  - name: <span class="schema-value">set_alarm</span>
    description: Create an alarm at an absolute local time.
    arguments: time, repeat, label
    constraints:
      - resolve tomorrow vs today
      - use local device timezone
      - preserve AM/PM semantics

  - name: <span class="schema-value">create_event</span>
    description: Add a calendar event.
    arguments: title, start_time, end_time, attendees
    constraints:
      - resolve relative dates
      - preserve event title
      - do not invent attendees

  - name: send_message
    description: Send a message to a known contact.

  - name: get_weather
    description: Get weather for a requested location and date.

<span class="schema-key">canonical_examples:</span>
... repeated descriptions, formats, edge cases, normalization rules,
and function-call examples for all tools ...

<span class="schema-key">user_query:</span> Set a timer for 20 minutes.`,

  alarm: `<span class="schema-key">[SYSTEM]</span> Select the correct mobile tool and emit exactly one valid function call.

<span class="schema-key">tools:</span>
  - name: set_timer
    description: Start a countdown timer.
    arguments: minutes, seconds, label

  - name: <span class="schema-value">set_alarm</span>
    description: Create an alarm at an absolute local time.
    arguments:
      time: HH:MM, required
      repeat: enum, optional
      label: string, optional
    constraints:
      - resolve tomorrow vs today
      - use local device timezone
      - preserve AM/PM semantics
      - map "morning" to the requested local time
    examples:
      "wake me at seven tomorrow" -> {"time":"07:00"}

  - name: create_event
    description: Add a calendar event.
    arguments: title, start_time, end_time, attendees

  - name: send_message
    description: Send a message to a known contact.

  - name: get_weather
    description: Retrieve weather information.

<span class="schema-key">canonical_examples:</span>
... repeated descriptions, value formats, time parsing rules,
edge cases, safety constraints, and examples ...

<span class="schema-key">user_query:</span> Wake me up at 7 tomorrow morning.`,

  calendar: `<span class="schema-key">[SYSTEM]</span> Select the correct mobile tool and emit exactly one valid function call.

<span class="schema-key">tools:</span>
  - name: set_timer
    description: Start a countdown timer.

  - name: set_alarm
    description: Create an alarm at an absolute local time.

  - name: <span class="schema-value">create_event</span>
    description: Add a calendar event.
    arguments:
      title: string, required
      start_time: ISO-8601, required
      end_time: ISO-8601, optional
      attendees: array, optional
    constraints:
      - resolve relative dates using local device time
      - preserve PM/AM semantics
      - preserve the event title
      - do not invent attendees
    examples:
      "team sync tomorrow at 3 PM"
      -> {"title":"team sync","start_time":"tomorrow 15:00"}

  - name: send_message
    description: Send a message to a known contact.

  - name: get_weather
    description: Retrieve weather information.

<span class="schema-key">canonical_examples:</span>
... repeated descriptions, date formats, timezone rules,
edge cases, and function-call examples ...

<span class="schema-key">user_query:</span> Add a team sync tomorrow at 3 PM.`
};

const demo = document.getElementById('demo');

if (demo) {
  demo.innerHTML = `
    <div class="section-kicker">04 · INTERACTIVE WALKTHROUGH</div>
    <h2>Same action.<br>Very different wait.</h2>
    <p class="section-copy">Run the same request through both paths. The prompt baseline visibly reads a long tool specification before acting, while EngramState restores reusable tool knowledge and reaches the device action almost immediately.</p>

    <div class="race-demo">
      <div class="race-head">
        <div class="race-query-wrap">
          <span class="race-query-label">USER QUERY</span>
          <div id="race-query" class="race-query">Set a timer for 20 minutes.</div>
        </div>
        <div class="race-controls">
          <button class="race-chip active" data-race-example="timer">Timer</button>
          <button class="race-chip" data-race-example="alarm">Alarm</button>
          <button class="race-chip" data-race-example="calendar">Calendar</button>
          <button id="race-run" class="race-run">Run comparison</button>
        </div>
      </div>

      <div class="race-grid">
        <section id="baseline-lane" class="race-lane baseline">
          <div class="race-lane-head">
            <div class="race-lane-title"><strong>Prompt baseline</strong><span>Prefill tool specifications every request</span></div>
            <div class="race-time"><strong id="baseline-clock">0.000 s</strong><span>TTFT</span></div>
          </div>
          <div class="prompt-viewport"><div id="prompt-scroll" class="prompt-scroll"></div></div>
          <div class="progress-wrap">
            <div class="progress-meta"><span id="baseline-stage">Waiting to run</span><span>≈993 total prefill tokens</span></div>
            <div class="progress-track"><div class="progress-fill"></div></div>
          </div>
          <div class="action-stage">
            <div class="action-wait"><b></b><span id="baseline-wait">Device action waits for prefill</span></div>
            <div id="baseline-screen" class="device-screen"></div>
          </div>
          <div id="baseline-result" class="race-result"><span>Function call</span><strong id="baseline-call">set_timer(20m)</strong></div>
        </section>

        <section id="engram-lane" class="race-lane engram">
          <div class="race-lane-head">
            <div class="race-lane-title"><strong>EngramState</strong><span>Retrieve and restore reusable state</span></div>
            <div class="race-time"><strong id="engram-clock">0.000 s</strong><span>TTFT</span></div>
          </div>
          <div class="state-viewport">
            <div>
              <div class="state-orb">STATE</div>
              <div class="state-copy"><strong id="state-name">timer_base.state</strong><span id="state-note">tool knowledge already compiled offline</span></div>
            </div>
          </div>
          <div class="progress-wrap">
            <div class="progress-meta"><span id="engram-stage">Waiting to run</span><span>≈8 query tokens</span></div>
            <div class="progress-track"><div class="progress-fill"></div></div>
          </div>
          <div class="action-stage">
            <div class="action-wait"><b></b><span id="engram-wait">Ready to load state</span></div>
            <div id="engram-screen" class="device-screen"></div>
          </div>
          <div id="engram-result" class="race-result"><span>Function call</span><strong id="engram-call">set_timer(20m)</strong></div>
        </section>
      </div>

      <div class="race-caption">
        <span>TTFT updates with the selected query length.</span>
        <span>Device UI is a visual simulation; the Android demo will invoke real actions.</span>
      </div>
    </div>
  `;

  const chips = [...document.querySelectorAll('[data-race-example]')];
  const run = document.getElementById('race-run');
  const query = document.getElementById('race-query');
  const promptScroll = document.getElementById('prompt-scroll');
  const baselineLane = document.getElementById('baseline-lane');
  const engramLane = document.getElementById('engram-lane');
  const baselineClock = document.getElementById('baseline-clock');
  const engramClock = document.getElementById('engram-clock');
  const baselineScreen = document.getElementById('baseline-screen');
  const engramScreen = document.getElementById('engram-screen');
  const baselineResult = document.getElementById('baseline-result');
  const engramResult = document.getElementById('engram-result');
  const baselineStage = document.getElementById('baseline-stage');
  const engramStage = document.getElementById('engram-stage');
  const baselineWait = document.getElementById('baseline-wait');
  const engramWait = document.getElementById('engram-wait');
  const stateNote = document.getElementById('state-note');

  let active = 'timer';
  let timeouts = [];
  let intervals = [];

  const later = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timeouts.push(id);
    return id;
  };

  function stopAsync() {
    timeouts.forEach(clearTimeout);
    intervals.forEach(clearInterval);
    timeouts = [];
    intervals = [];
  }

  function restartAnimation(node) {
    node.classList.remove('running');
    void node.offsetWidth;
  }

  function formatCountdown(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function formatSeconds(ms) {
    return `${(ms / 1000).toFixed(3)} s`;
  }

  function deviceMarkup(example) {
    if (example.kind === 'timer') {
      return `
        <div class="mock-device timer-device">
          <div class="device-status"><span>Clock</span><span class="status-dot">●</span></div>
          <div class="timer-face">
            <div class="timer-ring"><div class="timer-number" data-countdown>20:00</div></div>
            <div class="device-success">Timer running</div>
            <div class="device-detail">20 minute timer · on device</div>
          </div>
        </div>`;
    }

    if (example.kind === 'alarm') {
      return `
        <div class="mock-device alarm-device">
          <div class="device-status"><span>Alarm</span><span class="status-dot">●</span></div>
          <div class="alarm-card">
            <div><span class="alarm-time">07:00</span><small>Tomorrow morning</small></div>
            <div class="alarm-toggle"><i></i></div>
          </div>
          <div class="device-success">Alarm set</div>
          <div class="device-detail">Local device time · tomorrow</div>
        </div>`;
    }

    return `
      <div class="mock-device calendar-device">
        <div class="device-status"><span>Calendar</span><span class="status-dot">●</span></div>
        <div class="calendar-date"><strong>20</strong><span>AUG</span></div>
        <div class="calendar-event">
          <span class="event-bar"></span>
          <div><strong>Team sync</strong><small>Tomorrow · 3:00 PM</small></div>
        </div>
        <div class="device-success">Event added to calendar</div>
      </div>`;
  }

  function startDevice(screen, example) {
    screen.className = `device-screen show ${example.kind}`;
    screen.innerHTML = deviceMarkup(example);

    if (example.kind === 'timer') {
      const counter = screen.querySelector('[data-countdown]');
      let seconds = 1200;
      const id = setInterval(() => {
        seconds = Math.max(0, seconds - 1);
        counter.textContent = formatCountdown(seconds);
        if (seconds === 0) clearInterval(id);
      }, 1000);
      intervals.push(id);
    }
  }

  function resetRace() {
    stopAsync();
    restartAnimation(baselineLane);
    restartAnimation(engramLane);
    baselineScreen.className = 'device-screen';
    engramScreen.className = 'device-screen';
    baselineScreen.innerHTML = '';
    engramScreen.innerHTML = '';
    baselineResult.classList.remove('done');
    engramResult.classList.remove('done');
    baselineClock.textContent = '0.000 s';
    engramClock.textContent = '0.000 s';
    baselineStage.textContent = 'Waiting to run';
    engramStage.textContent = 'Waiting to run';
    baselineWait.textContent = 'Device action waits for prefill';
    engramWait.textContent = 'Ready to load state';
    run.disabled = false;
    run.textContent = 'Run comparison';
  }

  function renderExample() {
    const ex = examples[active];
    query.textContent = ex.query;
    promptScroll.innerHTML = promptTemplates[active];
    const stateName = document.getElementById('state-name');
    if (stateName) stateName.textContent = ex.state;
    if (stateNote) stateNote.textContent = ex.stateNote;
    document.getElementById('baseline-call').textContent = ex.result;
    document.getElementById('engram-call').textContent = ex.result;
    const baselineMeta = document.querySelector('.race-lane.baseline .progress-meta span:last-child');
    const engramMeta = document.querySelector('.race-lane.engram .progress-meta span:last-child');
    if (baselineMeta) baselineMeta.textContent = `≈${ex.promptTokens} total prefill tokens`;
    if (engramMeta) engramMeta.textContent = `≈${ex.queryTokens} query tokens`;
    baselineLane.style.setProperty('--baseline-duration', `${ex.promptMs}ms`);
    engramLane.style.setProperty('--engram-duration', `${ex.engramMs}ms`);
    resetRace();
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      active = chip.dataset.raceExample;
      renderExample();
    });
  });

  function animateClock(element, duration) {
    const start = performance.now();
    const id = setInterval(() => {
      const elapsed = Math.min((performance.now() - start) / 1000, duration / 1000);
      element.textContent = `${elapsed.toFixed(3)} s`;
      if (elapsed >= duration / 1000) clearInterval(id);
    }, 24);
    intervals.push(id);
  }

  function revealAction(screen, result, stage, waitText, clock, value) {
    const ex = examples[active];
    startDevice(screen, ex);
    result.classList.add('done');
    stage.textContent = 'Function call generated ✓';
    waitText.textContent = 'Device action invoked ✓';
    clock.textContent = value;
  }

  run.addEventListener('click', () => {
    resetRace();
    const ex = examples[active];
    run.disabled = true;
    run.textContent = 'Race running…';

    baselineLane.style.setProperty('--baseline-duration', `${ex.promptMs}ms`);
    engramLane.style.setProperty('--engram-duration', `${ex.engramMs}ms`);
    baselineLane.classList.add('running');
    engramLane.classList.add('running');
    baselineStage.textContent = 'Prefilling user query + retrieved tool specifications…';
    engramStage.textContent = 'Retrieving + loading selected state…';
    baselineWait.textContent = `Waiting for ≈${ex.promptTokens}-token prompt prefill…`;
    engramWait.textContent = `Restoring ${ex.state}…`;

    animateClock(baselineClock, ex.promptMs);
    animateClock(engramClock, ex.engramMs);

    later(() => {
      revealAction(engramScreen, engramResult, engramStage, engramWait, engramClock, formatSeconds(ex.engramMs));
    }, ex.engramMs);

    later(() => {
      revealAction(baselineScreen, baselineResult, baselineStage, baselineWait, baselineClock, formatSeconds(ex.promptMs));
      run.disabled = false;
      run.textContent = 'Run again';
    }, ex.promptMs);
  });

  renderExample();
}