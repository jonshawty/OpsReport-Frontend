/**
 * parser-ui.js - controla a aba "Processar Chamados".
 * Mantém o estado dos tickets parseados em memória (window.ParserState.tickets)
 * e expõe métodos para renderizar a tabela editável via Grid.js.
 */
(function () {
  const SAMPLE = `30/03 - Alert
#520992: PRD | MOVEL | MSE brux1044 - Realizado o restart da aplicação. Normalizado.

30/03 - Alert
#520993: PRD | FIXO | BPEL brux1608 - Sem atuação. Normalizado.

Alert
#580731: PRD | MOVEL | MSE
❗ Priority
P1
✅ Status
Open
🧯 Responders
CLBR-TI-OPS-PROD-WEB
🏷️ Tags
Splunk ITSI, Automatic
Description
Entidades Raiz:
* CLMSELX7352
Informações dos Alertas:
* LOW DISK SPACE
URLs Ativas:
* https://splunk.example.com/itsi/alert/580731

Alert
#580800: PRD | MOVEL | OSB
❗ Priority
P2
✅ Status
Open
🧯 Responders
CLBR-TI-OPS-PROD-INTEGRACAO
🏷️ Tags
Splunk ITSI
Description
Entidades Raiz:
* CLNETSMSLX6445
Informações dos Alertas:
* HIGH CPU USAGE - Em monitoramento`;

  const State = {
    tickets: [],
    logs: [],
    source: 'paste',
    fileName: null,
    rawSize: 0,
    grid: null,
  };
  window.ParserState = State;

  // ===== util =====
  const $ = (id) => document.getElementById(id);
  const btnPrimary = (label, attrs = '') => `<button class="btn btn-secondary" ${attrs}>${label}</button>`;

  function priorityBadge(p) {
    if (!p) return '';
    const cls = `badge-${p.toLowerCase()}`;
    return `<span class="badge ${cls}">${p}</span>`;
  }
  function statusBadge(s) {
    if (!s) return '';
    const map = {
      'Resolvido': 'badge-resolved',
      'Aberto': 'badge-open',
      'Em Monitoramento': 'badge-monitoring',
      'Direcionado': 'badge-directed',
    };
    return `<span class="badge ${map[s] || ''}">${s}</span>`;
  }

  // ===== render Grid editável =====
  function renderGrid() {
    const container = $('grid-edit');
    if (!container) return;
    container.innerHTML = '';

    if (!State.tickets.length) {
      $('parse-result').style.display = 'none';
      return;
    }

    $('parse-result').style.display = 'block';
    $('result-count').textContent = State.tickets.length;
    const warn = State.logs.length;
    $('result-warnings').textContent = warn ? `${warn} avisos` : '';
    $('result-warnings').style.display = warn ? '' : 'none';

    // Linhas como arrays na mesma ordem das colunas
    const rows = State.tickets.map((t, idx) => [
      idx,
      t.ticketId || '',
      t.rawDate || (t.date ? new Date(t.date).toISOString().slice(0,10) : ''),
      t.environment || '',
      t.segment || '',
      t.system || '',
      t.technology || '',
      t.hostname || '',
      t.priority || '',
      t.status || '',
      t.solverGroup || '',
      t.isRestart ? 'Sim' : 'Não',
      t.description || '',
    ]);

    State.grid = new gridjs.Grid({
      columns: [
        { name: '#', width: '50px', formatter: (v) => gridjs.html(`<span class="mono text-muted">${v + 1}</span>`) },
        { name: 'ID', width: '95px', formatter: (v, row) => editableCell(v, row.cells[0].data, 'ticketId') },
        { name: 'Data', width: '110px', formatter: (v, row) => editableCell(v, row.cells[0].data, 'rawDate') },
        { name: 'Amb', width: '70px', formatter: (v, row) => editableCell(v, row.cells[0].data, 'environment') },
        { name: 'Seg', width: '85px', formatter: (v, row) => editableCell(v, row.cells[0].data, 'segment') },
        { name: 'Sys', width: '70px', formatter: (v, row) => editableCell(v, row.cells[0].data, 'system') },
        { name: 'Tecnologia', width: '130px', formatter: (v, row) => editableCell(v, row.cells[0].data, 'technology') },
        { name: 'Hostname', width: '130px', formatter: (v, row) => editableCell(v, row.cells[0].data, 'hostname') },
        { name: 'Prio', width: '60px', formatter: (v) => gridjs.html(priorityBadge(v)) },
        { name: 'Status', width: '140px', formatter: (v) => gridjs.html(statusBadge(v)) },
        { name: 'Grupo', width: '130px' },
        { name: 'Restart', width: '70px' },
        { name: 'Descrição', formatter: (v, row) => editableCell(v, row.cells[0].data, 'description') },
      ],
      data: rows,
      search: true,
      pagination: { limit: 15, summary: true },
      resizable: true,
      sort: true,
      language: {
        search: { placeholder: 'Filtrar...' },
        pagination: { previous: '←', next: '→', showing: 'Mostrando', of: 'de', to: 'até', results: () => 'registros' },
      },
    }).render(container);
  }

  function editableCell(value, idx, field) {
    const safe = String(value || '').replace(/"/g, '&quot;');
    return gridjs.html(`<input class="cell-edit" data-idx="${idx}" data-field="${field}" value="${safe}" />`);
  }

  // delegação para edição inline
  document.addEventListener('input', (e) => {
    if (!e.target.classList?.contains('cell-edit')) return;
    const idx = parseInt(e.target.dataset.idx, 10);
    const field = e.target.dataset.field;
    if (Number.isFinite(idx) && State.tickets[idx]) {
      State.tickets[idx][field] = e.target.value;
      // se editou system, refaz tecnologia
      if (field === 'system') {
        const map = { MSE:'Weblogic', BPEL:'SOA Suite', OSB:'Oracle Service Bus', EDOC:'Weblogic', SPG:'Wildfly', WPP:'Weblogic' };
        State.tickets[idx].technology = map[String(e.target.value).toUpperCase()] || State.tickets[idx].technology;
        // re-render para refletir
        renderGrid();
      }
    }
  });

  // ===== ações =====
  async function processText() {
    const text = $('paste-area').value;
    if (!text.trim()) return Toast.warn('Cole algum chamado primeiro');
    const btn = $('btn-process');
    btn.disabled = true;
    try {
      const result = await Api.preview(text);
      State.tickets = result.tickets;
      State.logs = result.logs || [];
      State.source = 'paste';
      State.fileName = null;
      State.rawSize = text.length;
      Toast.success(`${result.tickets.length} chamado(s) processado(s)`);
      renderGrid();
      renderLogs();
    } catch (err) {
      Toast.error(Api.unwrapError(err));
    } finally {
      btn.disabled = false;
    }
  }

  async function processFile(file) {
    if (!file) return;
    $('upload-status').textContent = `Processando ${file.name}...`;
    try {
      const result = await Api.previewFile(file);
      State.tickets = result.tickets;
      State.logs = result.logs || [];
      State.source = (file.name.split('.').pop() || 'txt').toLowerCase();
      State.fileName = file.name;
      State.rawSize = file.size;
      $('upload-status').textContent = `✓ ${file.name} • ${result.tickets.length} chamados`;
      Toast.success(`${result.tickets.length} chamado(s) lido(s) de ${file.name}`);
      renderGrid();
      renderLogs();
    } catch (err) {
      $('upload-status').textContent = `✗ ${Api.unwrapError(err)}`;
      Toast.error(Api.unwrapError(err));
    }
  }

  function renderLogs() {
    const box = $('logs-box');
    if (!State.logs.length) {
      box.innerHTML = '<div class="text-muted mono" style="font-size:.75rem;">Sem avisos de parsing.</div>';
      return;
    }
    box.innerHTML = State.logs.map((l) =>
      `<div class="mono" style="font-size:.75rem; padding:.25rem 0;">
         <span class="text-muted">[bloco ${l.blockIndex}]</span>
         <span class="text-accent">${l.ticketId || 'sem id'}</span>
         <span style="color:var(--warn);"> ${l.warnings.join('; ')}</span>
       </div>`
    ).join('');
  }

  async function save() {
    if (!State.tickets.length) return;
    const btn = $('btn-save');
    btn.disabled = true;
    try {
      const res = await Api.saveTickets({
        tickets: State.tickets,
        source: State.source,
        fileName: State.fileName,
        rawSize: State.rawSize,
        parseErrors: State.logs.length,
      });
      Toast.success(`Importação salva (${res.count} chamados)`);
      // Reset
      State.tickets = []; State.logs = [];
      $('paste-area').value = '';
      $('upload-status').textContent = '';
      const ai = $('analyst-input');
      if (ai) { ai.value = ''; }
      const as_ = $('analyst-status');
      if (as_) { as_.textContent = ''; }
      renderGrid();
    } catch (err) {
      Toast.error(Api.unwrapError(err));
    } finally {
      btn.disabled = false;
    }
  }

  async function exportClient(format) {
    if (!State.tickets.length) return;
    try {
      const blob = await Api.exportTickets(State.tickets, format);
      downloadBlob(blob, `opsreport-${Date.now()}.${format}`);
    } catch (err) {
      Toast.error(Api.unwrapError(err));
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  // ===== init =====
  function init() {
    const paste = $('paste-area');
    paste.addEventListener('input', () => {
      $('paste-counter').textContent = `${paste.value.length} chars`;
    });

    $('btn-process').addEventListener('click', processText);
    $('btn-clear').addEventListener('click', () => {
      paste.value = '';
      $('paste-counter').textContent = '0 chars';
      State.tickets = []; State.logs = [];
      const ai = $('analyst-input');
      if (ai) { ai.value = ''; }
      const as_ = $('analyst-status');
      if (as_) { as_.textContent = ''; }
      renderGrid();
    });
    $('btn-load-sample').addEventListener('click', () => {
      paste.value = SAMPLE;
      $('paste-counter').textContent = `${SAMPLE.length} chars`;
    });

    $('btn-save').addEventListener('click', save);
    $('btn-export-csv').addEventListener('click', () => exportClient('csv'));
    $('btn-export-xlsx').addEventListener('click', () => exportClient('xlsx'));

    // Painel de analista responsável
    const analystInput = $('analyst-input');
    const analystStatus = $('analyst-status');

    // Ao digitar no campo, aplica imediatamente a todos os tickets
    analystInput.addEventListener('input', () => {
      const name = analystInput.value.trim();
      State.tickets.forEach((t) => { t.analyst = name; });
      analystStatus.textContent = name
        ? `✓ "${name}" definido em ${State.tickets.length} chamado(s)`
        : '';
    });

    // Botão "Aplicar a todos" - força sincronização (útil se colaram nome)
    $('btn-analyst-all').addEventListener('click', () => {
      const name = analystInput.value.trim();
      if (!name) { Toast.warn('Digite o nome do analista primeiro'); return; }
      State.tickets.forEach((t) => { t.analyst = name; });
      analystStatus.textContent = `✓ "${name}" aplicado a ${State.tickets.length} chamado(s)`;
      Toast.success(`Analista "${name}" aplicado a todos os chamados`);
    });
    $('btn-toggle-logs').addEventListener('click', () => {
      const box = $('logs-box');
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
    });

    // Upload
    const dz = $('dropzone');
    const fi = $('file-input');
    dz.addEventListener('click', () => fi.click());
    fi.addEventListener('change', (e) => processFile(e.target.files[0]));

    ['dragenter', 'dragover'].forEach((ev) =>
      dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach((ev) =>
      dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('dragover'); }));
    dz.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    });
  }

  window.ParserUI = { init, renderGrid };
})();
