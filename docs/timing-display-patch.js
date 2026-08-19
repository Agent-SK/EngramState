(() => {
  if (typeof examples === 'undefined') return;

  const displayedTiming = {
    timer: { promptMs: 7360, engramMs: 196 },
    alarm: { promptMs: 7368, engramMs: 240 },
    calendar: { promptMs: 7397, engramMs: 282 }
  };

  const uiMeta = {
    timer: {
      query: 'Set a timer for 20 minutes.',
      queryTokens: 8,
      promptTokens: 993,
      result: 'set_timer(20m)'
    },
    alarm: {
      query: 'Wake me up at 7 tomorrow morning.',
      queryTokens: 9,
      promptTokens: 994,
      result: 'set_alarm(07:00)'
    },
    calendar: {
      query: 'Add a calendar event tomorrow at 3 PM for lab meeting.',
      queryTokens: 13,
      promptTokens: 998,
      result: 'create_event(15:00, "lab meeting")'
    }
  };

  // Playback stays readable; the visible clocks are mapped to measured TTFT.
  const playback = { promptMs: 7301, engramMs: 259 };

  examples.timer.queryTokens = uiMeta.timer.queryTokens;
  examples.timer.promptTokens = uiMeta.timer.promptTokens;
  examples.alarm.queryTokens = uiMeta.alarm.queryTokens;
  examples.alarm.promptTokens = uiMeta.alarm.promptTokens;
  examples.calendar.query = uiMeta.calendar.query;
  examples.calendar.queryTokens = uiMeta.calendar.queryTokens;
  examples.calendar.promptTokens = uiMeta.calendar.promptTokens;
  examples.calendar.result = uiMeta.calendar.result;

  Object.values(examples).forEach(example => {
    example.promptMs = playback.promptMs;
    example.engramMs = playback.engramMs;
  });

  function activeKind() {
    return document.querySelector('[data-race-example].active')?.dataset.raceExample || 'timer';
  }

  function cleanCaption() {
    document.querySelectorAll('.race-caption span').forEach(span => {
      const text = span.textContent || '';
      if (/Selected-query TTFT|TTFT updates|query length/i.test(text)) span.remove();
    });
  }

  function syncVisibleText() {
    const kind = activeKind();
    const m = uiMeta[kind] || uiMeta.timer;

    const raceQuery = document.getElementById('race-query');
    if (raceQuery) raceQuery.textContent = m.query;

    const raceQueryMeta = document.getElementById('race-query-meta');
    if (raceQueryMeta) raceQueryMeta.textContent = `≈${m.queryTokens} tokens`;

    document.querySelectorAll('[data-flow-query]').forEach(el => {
      el.textContent = `“${m.query}”`;
    });

    document.querySelectorAll('[data-flow-query-meta]').forEach(el => {
      el.textContent = `≈${m.queryTokens} query tokens`;
    });

    document.querySelectorAll('[data-flow-total]').forEach(el => {
      el.textContent = `≈${m.promptTokens} tokens total`;
    });

    const baselineMeta = document.querySelector('.race-lane.baseline .progress-meta span:last-child');
    const engramMeta = document.querySelector('.race-lane.engram .progress-meta span:last-child');
    if (baselineMeta) baselineMeta.textContent = `≈${m.promptTokens} total prefill tokens`;
    if (engramMeta) engramMeta.textContent = `≈${m.queryTokens} query tokens`;

    const baselineCall = document.getElementById('baseline-call');
    const engramCall = document.getElementById('engram-call');
    if (baselineCall) baselineCall.textContent = m.result;
    if (engramCall) engramCall.textContent = m.result;

    const stateNote = document.getElementById('state-note');
    if (stateNote && /Retriever will choose from the query/.test(stateNote.textContent || '')) {
      stateNote.textContent = `Retriever will choose from the query: “${m.query}”`;
    }

    cleanCaption();
  }

  function installMappedClock(element, lane) {
    if (!element) return;
    let ownWrite = null;

    const observer = new MutationObserver(() => {
      const currentText = element.textContent.trim();
      if (ownWrite !== null && currentText === ownWrite) {
        ownWrite = null;
        return;
      }

      const rawSeconds = Number.parseFloat(currentText);
      if (!Number.isFinite(rawSeconds)) return;

      const kind = activeKind();
      const target = displayedTiming[kind] || displayedTiming.timer;
      const playbackSeconds = (lane === 'prompt' ? playback.promptMs : playback.engramMs) / 1000;
      const targetSeconds = (lane === 'prompt' ? target.promptMs : target.engramMs) / 1000;
      const ratio = Math.min(Math.max(rawSeconds / playbackSeconds, 0), 1);
      const mappedText = `${(targetSeconds * ratio).toFixed(3)} s`;

      if (mappedText !== currentText) {
        ownWrite = mappedText;
        element.textContent = mappedText;
      }
    });

    observer.observe(element, { childList: true, characterData: true, subtree: true });
  }

  document.querySelectorAll('[data-race-example]').forEach(chip => {
    chip.addEventListener('click', () => setTimeout(syncVisibleText, 20));
  });

  const raceRun = document.getElementById('race-run');
  if (raceRun) raceRun.addEventListener('click', () => setTimeout(syncVisibleText, 20));

  installMappedClock(document.getElementById('baseline-clock'), 'prompt');
  installMappedClock(document.getElementById('engram-clock'), 'engram');

  syncVisibleText();
})();