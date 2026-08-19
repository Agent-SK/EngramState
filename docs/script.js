const demoStyles = document.createElement('link');
demoStyles.rel = 'stylesheet';
demoStyles.href = './demo.css';
document.head.appendChild(demoStyles);

const examples = {
  timer: {
    query: 'Set a timer for 20 minutes.',
    call: 'set_timer(minutes=20)',
    screenTitle: 'Timer',
    digits: '20:00',
    toast: '20:00 timer started',
    result: 'set_timer(20m)',
    state: 'timer_base.state',
    promptFocus: 'set_timer'
  },
  alarm: {
    query: 'Wake me up at 7 tomorrow morning.',
    call: 'set_alarm(time="07:00")',
    screenTitle: 'Alarm',
    digits: '07:00',
    toast: 'Alarm set for 7:00 AM',
    result: 'set_alarm(07:00)',
    state: 'alarm_base.state',
    promptFocus: 'set_alarm'
  },
  calendar: {
    query: 'Add a team sync tomorrow at 3 PM.',
    call: 'create_event(time="15:00", title="team sync")',
    screenTitle: 'Calendar',
    digits: '15:00',
    toast: 'Team sync added',
    result: 'create_event(15:00)',
    state: 'calendar_base.state',
    promptFocus: 'create_event'
  }
};

const longPrompt = `<span class="schema-key">[SYSTEM]</span> You are an on-device assistant. Select the correct tool and emit a valid function call.

<span class="schema-key">tools:</span>
  - name: <span class="schema-value">set_timer</span>
    description: Start a countdown timer for a requested duration.
    arguments:
      minutes: integer, required
      seconds: integer, optional
    constraints:
      - normalize relative duration to minutes/seconds
      - reject negative values
      - preserve exact user intent
    examples:
      "twenty minutes" -> {"minutes":20}
      "90 seconds" -> {"minutes":1,"seconds":30}

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

  - name: <span class="schema-value">create_event</span>
    description: Add a calendar event.
    arguments:
      title: string, required
      start_time: ISO-8601, required
      end_time: ISO-8601, optional
      attendees: array, optional
    constraints:
      - resolve relative dates
      - do not invent attendees
      - preserve event title

  - name: <span class="schema-value">send_message</span>
    description: Send a message to a known contact.
    arguments: recipient, body
    safety: require recipient resolution before execution

  - name: <span class="schema-value">get_weather</span>
    description: Get weather for a requested location and date.
    arguments: location, date

<span class="schema-key">output_format:</span>
Return exactly one JSON function call with no prose.

<span class="schema-key">canonical_examples:</span>
... repeated tool descriptions, value formats, hard cases,
normalization rules, and function-call examples ...

<span class="schema-key">user_query:</span>`;

const demo = document.getElementById('demo');

if (demo) {
  demo.innerHTML = `
    <div class="section-kicker">04 · INTERACTIVE WALKTHROUGH</div>
    <h2>Same action.<br>Very different wait.</h2>
    <p class="section-copy">Run the same request through both paths. The prompt baseline visibly reads the long tool specification before acting, while EngramState restores reusable tool knowledge and reaches the device action almost immediately.</p>

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
          <div class="prompt-viewport">
            <div id="prompt-scroll" class="prompt-scroll">${longPrompt}</div>
          </div>
          <div class="progress-wrap">
            <div class="progress-meta"><span id="baseline-stage">Waiting to run</span><span>985 prompt tokens</span></div>
            <div class="progress-track"><div class="progress-fill"></div></div>
          </div>
          <div class="action-stage">
            <div class="action-wait"><b></b><span id="baseline-wait">Device action waits for prefill</span></div>
            <div id="baseline-screen" class="android-screen">
              <div class="android-status"><span>12:42</span><span>● ● ●</span></div>
              <div id="baseline-screen-title" class="clock-title">Timer</div>
              <div id="baseline-digits" class="timer-digits">20:00</div>
              <div class="timer-ring"></div>
              <div class="timer-caption">Running on device</div>
              <div id="baseline-toast" class="android-toast">20:00 timer started</div>
            </div>
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
              <div class="state-copy"><strong id="state-name">timer_base.state</strong><span>tool knowledge already compiled offline</span></div>
            </div>
          </div>
          <div class="progress-wrap">
            <div class="progress-meta"><span id="engram-stage">Waiting to run</span><span>22 live tokens</span></div>
            <div class="progress-track"><div class="progress-fill"></div></div>
          </div>
          <div class="action-stage">
            <div class="action-wait"><b></b><span id="engram-wait">Ready to load state</span></div>
            <div id="engram-screen" class="android-screen">
              <div class="android-status"><span>12:42</span><span>● ● ●</span></div>
              <div id="engram-screen-title" class="clock-title">Timer</div>
              <div id="engram-digits" class="timer-digits">20:00</div>
              <div class="timer-ring"></div>
              <div class="timer-caption">Running on device</div>
              <div id="engram-toast" class="android-toast">20:00 timer started</div>
            </div>
          </div>
          <div id="engram-result" class="race-result"><span>Function call</span><strong id="engram-call">set_timer(20m)</strong></div>
        </section>
      </div>

      <div class="race-caption">
        <span><b>Playback uses the representative TTFT values reported above:</b> 7.301 s vs 0.259 s.</span>
        <span>UI is an explanatory simulation; the Android demo will invoke real device actions.</span>
      </div>
    </div>
  `;

  const chips = [...document.querySelectorAll('[data-race-example]')];
  const run = document.getElementById('race-run');
  const query = document.getElementById('race-query');
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
  let active = 'timer';
  let timers = [];
  let intervals = [];

  const later = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  };

  function stopAsync() {
    timers.forEach(clearTimeout);
    intervals.forEach(clearInterval);
    timers = [];
    intervals = [];
  }

  function forceAnimationRestart(node) {
    node.classList.remove('running');
    void node.offsetWidth;
  }

  function resetRace() {
    stopAsync();
    forceAnimationRestart(baselineLane);
    forceAnimationRestart(engramLane);
    baselineScreen.classList.remove('show');
    engramScreen.classList.remove('show');
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
    document.getElementById('state-name').textContent = ex.state;
    document.getElementById('baseline-call').textContent = ex.result;
    document.getElementById('engram-call').textContent = ex.result;
    ['baseline', 'engram'].forEach(prefix => {
      document.getElementById(`${prefix}-screen-title`).textContent = ex.screenTitle;
      document.getElementById(`${prefix}-digits`).textContent = ex.digits;
      document.getElementById(`${prefix}-toast`).textContent = ex.toast;
    });
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
    }, 32);
    intervals.push(id);
  }

  function revealAction(screen, result, stage, waitText, finalTime) {
    screen.classList.add('show');
    result.classList.add('done');
    stage.textContent = 'Function call generated ✓';
    waitText.textContent = 'Device action invoked';
    finalTime && (finalTime.element.textContent = finalTime.value);
    later(() => screen.classList.remove('show'), 2100);
  }

  run.addEventListener('click', () => {
    resetRace();
    run.disabled = true;
    run.textContent = 'Race running…';

    baselineLane.classList.add('running');
    engramLane.classList.add('running');
    baselineStage.textContent = 'Prefilling long tool prompt…';
    engramStage.textContent = 'Retrieving + loading state…';
    baselineWait.textContent = 'Waiting for 985-token prefill…';
    engramWait.textContent = 'Restoring recurrent state…';

    animateClock(baselineClock, 7301);
    animateClock(engramClock, 259);

    later(() => {
      revealAction(
        engramScreen,
        engramResult,
        engramStage,
        engramWait,
        { element: engramClock, value: '0.259 s' }
      );
    }, 259);

    later(() => {
      revealAction(
        baselineScreen,
        baselineResult,
        baselineStage,
        baselineWait,
        { element: baselineClock, value: '7.301 s' }
      );
      run.disabled = false;
      run.textContent = 'Run again';
    }, 7301);
  });
}
