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

  const loadVisualRefresh = () => {
    if (document.querySelector('script[data-visual-refresh]')) return;
    const refreshScript = document.createElement('script');
    refreshScript.src = new URL('./visual-refresh.js', script.src).href;
    refreshScript.dataset.visualRefresh = 'true';
    document.body.appendChild(refreshScript);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadVisualRefresh, { once: true });
  } else {
    loadVisualRefresh();
  }
})();