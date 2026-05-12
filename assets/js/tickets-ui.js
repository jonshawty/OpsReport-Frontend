/**
 * tickets-ui.js - aba "Chamados" (listagem com filtros).
 */
(function () {
  const $ = (id) => document.getElementById(id);
  let grid = null;
  let lastFilters = {};

  function priorityBadge(p) {
    if (!p) return '';
    return `<span class="badge badge-${p.toLowerCase()}">${p}</span>`;
  }
  function statusBadge(s) {
    const map = { 'Resolvido':'badge-resolved','Aberto':'badge-open','Em Monitoramento':'badge-monitoring','Direcionado':'badge-directed' };
    return s ? `<span class="badge ${map[s]||''}">${s}</span>` : '';
  }

  async function load(filters = {}) {
    lastFilters = filters;
    const container = $('grid-list');
    container.innerHTML = '<div style="padding:2rem; text-align:center;"><span class="spinner spinner-lg"></span></div>';

    try {
      const { items, total } = await Api.listTickets({ ...filters, pageSize: 100 });
      const rows = items.map((t) => [
        t.ticketId || '',
        t.date ? new Date(t.date).toISOString().slice(0, 10) : (t.rawDate || ''),
        t.environment || '',
        t.system || '',
        t.technology || '',
        t.hostname || '',
        t.priority || '',
        t.status || '',
        t.solverGroup || '',
        t.analyst || '',
        t.description || '',
        t.id,
      ]);

      container.innerHTML = '';
      grid = new gridjs.Grid({
        columns: [
          { name: 'ID', width: '95px', formatter: (v) => gridjs.html(`<span class="mono text-accent">${v}</span>`) },
          { name: 'Data', width: '110px' },
          { name: 'Amb', width: '70px' },
          { name: 'Sistema', width: '90px' },
          { name: 'Tecnologia', width: '140px' },
          { name: 'Hostname', width: '140px' },
          { name: 'Prio', width: '70px', formatter: (v) => gridjs.html(priorityBadge(v)) },
          { name: 'Status', width: '150px', formatter: (v) => gridjs.html(statusBadge(v)) },
          { name: 'Grupo', width: '130px' },
          { name: 'Analista', width: '140px' },
          { name: 'Descrição' },
          { name: '_id', hidden: true },
        ],
        data: rows,
        search: { enabled: true },
        pagination: { limit: 20, summary: true },
        sort: true,
        resizable: true,
        language: {
          search: { placeholder: 'Filtrar resultados...' },
          noRecordsFound: 'Nenhum chamado encontrado',
          pagination: { previous: '←', next: '→', showing: 'Mostrando', of: 'de', to: 'até', results: () => 'registros' },
        },
      }).render(container);

      const total_ = total ?? rows.length;
      Toast.info(`${total_} chamado(s) carregado(s)`, 1800);
    } catch (err) {
      container.innerHTML = `<div style="padding:2rem; text-align:center;" class="text-muted">${Api.unwrapError(err)}</div>`;
      Toast.error(Api.unwrapError(err));
    }
  }

  function readFilters() {
    return {
      q: $('f-q').value.trim() || undefined,
      system: $('f-system').value.trim() || undefined,
      hostname: $('f-host').value.trim() || undefined,
      dateFrom: $('f-date-from').value || undefined,
    };
  }

  function init() {
    $('btn-search').addEventListener('click', () => load(readFilters()));
    [$('f-q'), $('f-system'), $('f-host'), $('f-date-from')].forEach((el) =>
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') load(readFilters()); }));

    $('btn-export-all-csv').addEventListener('click', () => exportFiltered('csv'));
    $('btn-export-all-xlsx').addEventListener('click', () => exportFiltered('xlsx'));
  }

  async function exportFiltered(format) {
    try {
      // Exporta com base nos filtros atuais buscando direto na API
      const params = new URLSearchParams({ format, ...lastFilters });
      const url = `${window.AppConfig.apiBaseUrl}/tickets/export?${params.toString()}`;
      const token = localStorage.getItem(window.AppConfig.tokenKey);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickets: [] }), // vazio = exporta tudo filtrado
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `opsreport-${Date.now()}.${format}`;
      document.body.appendChild(a); a.click(); a.remove();
    } catch (err) {
      Toast.error(err.message || 'Falha ao exportar');
    }
  }

  window.TicketsUI = { init, load };
})();
