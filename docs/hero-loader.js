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
})();
