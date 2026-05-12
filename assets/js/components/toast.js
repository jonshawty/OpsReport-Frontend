(function () {
  function ensureContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  const ICONS = {
    success: '✓',
    error: '✕',
    warn: '⚠',
    info: 'ℹ',
  };

  function show(type, message, ms = 3500) {
    const c = ensureContainer();
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
      <span class="toast-icon" style="font-weight:700">${ICONS[type] || 'ℹ'}</span>
      <div class="toast-body">${escapeHtml(message)}</div>
    `;
    c.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      el.style.transition = 'all 0.2s ease';
      setTimeout(() => el.remove(), 220);
    }, ms);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  window.Toast = {
    success: (m, ms) => show('success', m, ms),
    error:   (m, ms) => show('error', m, ms),
    warn:    (m, ms) => show('warn', m, ms),
    info:    (m, ms) => show('info', m, ms),
  };
})();
