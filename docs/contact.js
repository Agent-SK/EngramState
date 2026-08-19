(() => {
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = './contact.css';
  document.head.appendChild(style);

  const closing = document.querySelector('.closing');
  if (!closing || document.querySelector('.contact-collab')) return;

  const section = document.createElement('section');
  section.className = 'contact-collab shell';
  section.innerHTML = `
    <div class="contact-card">
      <div class="contact-copy">
        <span class="contact-kicker">CONTACT & COLLABORATION</span>
        <h3 class="contact-name">Seulkee Lee</h3>
        <p class="contact-role">On-device AI · Embedded Systems · LLM Agents</p>
        <p class="contact-intro">Open to research collaborations, startup opportunities, and technical or business discussions around on-device AI and intelligent agents.</p>
        <span class="contact-note">For research, product, startup, and collaboration inquiries.</span>
      </div>
      <div class="contact-actions">
        <a class="contact-link linkedin" href="https://www.linkedin.com/in/seulkee-lee" target="_blank" rel="noopener noreferrer"><span class="contact-icon">in</span>LinkedIn ↗</a>
        <a class="contact-link email" href="mailto:seulkee.lee@skku.edu"><span class="contact-icon">✉</span>Email</a>
      </div>
    </div>`;

  closing.insertAdjacentElement('afterend', section);
})();