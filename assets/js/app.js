/**
 * app.js - bootstrap geral
 *  - verifica auth
 *  - monta sidebar
 *  - alterna abas
 *  - chama health
 */
(function () {
  // Guard de auth
  if (!localStorage.getItem(window.AppConfig.tokenKey)) {
    location.href = '/index.html';
    return;
  }

  Sidebar.mount();
  ParserUI.init();
  TicketsUI.init();

  const titleMap = {
    processar: 'Processar Chamados',
    dashboard: 'Dashboard',
    tickets: 'Chamados',
    historico: 'Histórico',
  };

  function navigate(tab) {
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    document.querySelector(`.tab-panel[data-panel="${tab}"]`)?.classList.add('active');
    document.getElementById('page-title').textContent = titleMap[tab] || tab;

    if (tab === 'dashboard') DashboardUI.load();
    if (tab === 'tickets') TicketsUI.load({});
    if (tab === 'historico') HistoryUI.load();
  }

  document.addEventListener('app:navigate', (e) => navigate(e.detail.tab));

  // Mobile menu
  document.getElementById('mobile-menu')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  // Health check periódico
  async function ping() {
    const el = document.getElementById('health-status');
    try {
      const h = await Api.health();
      el.textContent = 'online';
      el.style.color = 'var(--accent)';
    } catch {
      el.textContent = 'offline';
      el.style.color = 'var(--danger)';
    }
  }
  ping();
  setInterval(ping, 30000);
})();
