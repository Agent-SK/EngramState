(() => {
  if (typeof examples === 'undefined') return;

  const displayedTiming = {
    timer: { promptMs: 7360, engramMs: 94 },
    alarm: { promptMs: 7368, engramMs: 106 },
    calendar: { promptMs: 7375, engramMs: 118 }
  };

  // Keep the walkthrough visually readable. These are playback durations only;
  // the clocks below display the selected query's TTFT values.
  const playback = { promptMs: 7301, engramMs: 259 };

  Object.values(examples).forEach(example => {
    example.promptMs = playback.promptMs;
    example.engramMs = playback.engramMs;
  });

  function activeKind() {
    return document.querySelector('[data-race-example].active')?.dataset.raceExample || 'timer';
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

  installMappedClock(document.getElementById('baseline-clock'), 'prompt');
  installMappedClock(document.getElementById('engram-clock'), 'engram');
})();