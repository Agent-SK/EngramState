const examples = {
  timer: {
    query: "Set a timer for 20 minutes.",
    call: "set_timer(minutes=20)",
    state: "timer"
  },
  alarm: {
    query: "Wake me up at 7 tomorrow morning.",
    call: "set_alarm(time=\"07:00\")",
    state: "alarm"
  },
  calendar: {
    query: "Add a team sync tomorrow at 3 PM.",
    call: "create_event(time=\"15:00\", title=\"team sync\")",
    state: "calendar"
  }
};

const chips = document.querySelectorAll('.example-chip');
const query = document.getElementById('demo-query');
const call = document.getElementById('demo-call');
const run = document.getElementById('run-demo');
const traces = [...document.querySelectorAll('#trace-panel .trace')];
let active = 'timer';

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    active = chip.dataset.example;
    query.textContent = examples[active].query;
    call.textContent = examples[active].call;
    resetTrace();
  });
});

function resetTrace() {
  traces.forEach(trace => {
    trace.classList.remove('active', 'pulse');
    const status = trace.querySelector('em');
    if (status) status.textContent = '';
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

run?.addEventListener('click', async () => {
  resetTrace();
  run.disabled = true;
  run.textContent = 'Running…';

  for (let i = 0; i < traces.length; i++) {
    traces[i].classList.add('active', 'pulse');
    const status = traces[i].querySelector('em');
    if (status) status.textContent = '✓';
    await wait(i === 1 ? 430 : 320);
    traces[i].classList.remove('pulse');
  }

  run.textContent = 'Run again';
  run.disabled = false;
});
