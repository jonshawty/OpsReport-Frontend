/**
 * Sidebar - injeta a navegação lateral. Use data-sidebar-mount.
 * Aceita atributo data-active="processar|dashboard|tickets|historico"
 */
(function () {
  const ICON = {
    processar: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7h4m0 0l-2 3m2-3l-2-3M3 17h4m0 0l-2 3m2-3l-2-3M11 7h10M11 12h10M11 17h10"/></svg>',
    dashboard: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h4v11H3zM10 3h4v18h-4zM17 14h4v7h-4z"/></svg>',
    tickets: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6M5 8h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2zm0-3h14"/></svg>',
    historico: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    sun: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.36-6.36l-.71.71M6.34 17.66l-.71.71m12.73 0l-.71-.71M6.34 6.34l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
    out: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>',
  };

  function mount() {
    const mountPoint = document.querySelector('[data-sidebar-mount]');
    if (!mountPoint) return;
    const active = mountPoint.dataset.active || 'processar';
    const user = JSON.parse(localStorage.getItem(window.AppConfig.userKey) || 'null');

    mountPoint.innerHTML = `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-logo">OR</div>
          <div class="sidebar-brand-text">
            OpsReport
            <small>NOC TOOLKIT</small>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="section-title">Operação</div>
          <a class="sidebar-link ${active === 'processar' ? 'active' : ''}" data-tab="processar">
            ${ICON.processar}<span>Processar Chamados</span>
          </a>
          <a class="sidebar-link ${active === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
            ${ICON.dashboard}<span>Dashboard</span>
          </a>
          <a class="sidebar-link ${active === 'tickets' ? 'active' : ''}" data-tab="tickets">
            ${ICON.tickets}<span>Chamados</span>
          </a>
          <a class="sidebar-link ${active === 'historico' ? 'active' : ''}" data-tab="historico">
            ${ICON.historico}<span>Histórico</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div style="display:flex;align-items:center;gap:.6rem;padding:.5rem .75rem;font-size:.8rem;color:var(--text-secondary);">
            <span class="status-dot"></span>
            <span class="mono" style="font-size:.7rem;">${user?.email || 'anônimo'}</span>
          </div>
          <button class="btn btn-ghost" id="btn-theme" title="Alternar tema" style="justify-content:flex-start;">
            ${ICON.sun}<span>Tema</span>
          </button>
          <button class="btn btn-ghost" id="btn-logout" style="justify-content:flex-start;color:var(--danger);">
            ${ICON.out}<span>Sair</span>
          </button>
        </div>
      </aside>
    `;

    // Bind eventos
    mountPoint.querySelectorAll('[data-tab]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = a.dataset.tab;
        document.dispatchEvent(new CustomEvent('app:navigate', { detail: { tab } }));
        mountPoint.querySelectorAll('.sidebar-link').forEach((x) => x.classList.remove('active'));
        a.classList.add('active');
        document.getElementById('sidebar')?.classList.remove('open');
      });
    });

    document.getElementById('btn-theme')?.addEventListener('click', () => window.Theme.toggle());
    document.getElementById('btn-logout')?.addEventListener('click', () => {
      localStorage.removeItem(window.AppConfig.tokenKey);
      localStorage.removeItem(window.AppConfig.userKey);
      location.href = '/index.html';
    });
  }

  window.Sidebar = { mount };
})();
