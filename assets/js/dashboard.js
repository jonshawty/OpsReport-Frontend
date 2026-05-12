/**
 * dashboard.js - métricas e gráficos.
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const charts = {};

  function color(idx) {
    const palette = [
      'rgba(0, 214, 143, 0.8)', 'rgba(96, 165, 250, 0.8)', 'rgba(251, 191, 36, 0.8)',
      'rgba(167, 139, 250, 0.8)', 'rgba(248, 113, 113, 0.8)', 'rgba(249, 115, 22, 0.8)',
      'rgba(250, 204, 21, 0.8)', 'rgba(56, 189, 248, 0.8)',
    ];
    return palette[idx % palette.length];
  }

  function destroyAll() {
    Object.values(charts).forEach((c) => c?.destroy());
  }

  function commonOpts() {
    const root = getComputedStyle(document.documentElement);
    const text = root.getPropertyValue('--text-secondary').trim();
    const grid = root.getPropertyValue('--border').trim();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: text, font: { family: 'Inter', size: 11 } } },
      },
      scales: {
        x: { ticks: { color: text }, grid: { color: grid } },
        y: { ticks: { color: text }, grid: { color: grid }, beginAtZero: true },
      },
    };
  }

  function renderMetrics(data) {
    const grid = $('metric-grid');
    grid.innerHTML = `
      <div class="metric-card">
        <div class="metric-label">Total de Incidentes</div>
        <div class="metric-value">${data.totals.incidents.toLocaleString('pt-BR')}</div>
        <div class="metric-sub">acumulado</div>
      </div>
      <div class="metric-card warn">
        <div class="metric-label">Restarts</div>
        <div class="metric-value">${data.totals.restarts.toLocaleString('pt-BR')}</div>
        <div class="metric-sub">aplicações reiniciadas</div>
      </div>
      <div class="metric-card info">
        <div class="metric-label">Sistemas Distintos</div>
        <div class="metric-value">${data.bySystem.length}</div>
        <div class="metric-sub">categorizados</div>
      </div>
      <div class="metric-card danger">
        <div class="metric-label">Prioridade P1/P2</div>
        <div class="metric-value">${
          data.byPriority.filter(p => ['P1','P2'].includes(p.label)).reduce((a,b)=>a+b.count,0)
        }</div>
        <div class="metric-sub">críticos</div>
      </div>
    `;
  }

  function renderCharts(data) {
    destroyAll();
    const opts = commonOpts();

    charts.system = new Chart($('chart-system'), {
      type: 'bar',
      data: {
        labels: data.bySystem.map(s => s.label),
        datasets: [{
          label: 'Chamados',
          data: data.bySystem.map(s => s.count),
          backgroundColor: data.bySystem.map((_, i) => color(i)),
          borderRadius: 4,
        }],
      },
      options: { ...opts, plugins: { ...opts.plugins, legend: { display: false } } },
    });

    charts.tech = new Chart($('chart-tech'), {
      type: 'doughnut',
      data: {
        labels: data.byTechnology.map(s => s.label),
        datasets: [{
          data: data.byTechnology.map(s => s.count),
          backgroundColor: data.byTechnology.map((_, i) => color(i)),
          borderWidth: 0,
        }],
      },
      options: { ...opts, scales: {} },
    });

    charts.priority = new Chart($('chart-priority'), {
      type: 'bar',
      data: {
        labels: data.byPriority.map(s => s.label),
        datasets: [{
          data: data.byPriority.map(s => s.count),
          backgroundColor: data.byPriority.map(p => {
            const map = { P1:'#ef4444', P2:'#f97316', P3:'#facc15', P4:'#60a5fa', P5:'#a78bfa' };
            return map[p.label] || '#9ca3af';
          }),
          borderRadius: 4,
        }],
      },
      options: { ...opts, plugins: { ...opts.plugins, legend: { display: false } } },
    });

    charts.status = new Chart($('chart-status'), {
      type: 'doughnut',
      data: {
        labels: data.byStatus.map(s => s.label),
        datasets: [{
          data: data.byStatus.map(s => s.count),
          backgroundColor: data.byStatus.map((s) => {
            const m = { 'Resolvido':'#00d68f','Aberto':'#fbbf24','Em Monitoramento':'#60a5fa','Direcionado':'#a78bfa' };
            return m[s.label] || '#9ca3af';
          }),
          borderWidth: 0,
        }],
      },
      options: { ...opts, scales: {} },
    });

    charts.trend = new Chart($('chart-trend'), {
      type: 'line',
      data: {
        labels: data.trend.map(t => t.date),
        datasets: [{
          label: 'Chamados por dia',
          data: data.trend.map(t => t.count),
          borderColor: '#00d68f',
          backgroundColor: 'rgba(0, 214, 143, 0.1)',
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#00d68f',
        }],
      },
      options: opts,
    });
  }

  async function load() {
    try {
      const data = await Api.metrics();
      renderMetrics(data);
      renderCharts(data);
    } catch (err) {
      Toast.error(Api.unwrapError(err));
    }
  }

  window.DashboardUI = { load };
})();
