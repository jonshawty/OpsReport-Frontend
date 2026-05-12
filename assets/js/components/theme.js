(function () {
  const KEY = window.AppConfig.themeKey;

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
    document.querySelectorAll('[data-theme-icon]').forEach((el) => {
      el.textContent = theme === 'light' ? '◐' : '●';
    });
  }

  function current() {
    return localStorage.getItem(KEY) || 'dark';
  }

  function toggle() {
    apply(current() === 'dark' ? 'light' : 'dark');
  }

  // Aplica imediatamente
  apply(current());

  window.Theme = { apply, toggle, current };
})();
