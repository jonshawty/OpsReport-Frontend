/**
 * history.js - aba "Histórico" de importações
 */
(function () {
  const $ = (id) => document.getElementById(id);

  async function load() {
    const tbody = $('imports-tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="text-muted" style="text-align:center; padding:2rem;">Carregando...</td></tr>';
    try {
      const { items } = await Api.listImports({ pageSize: 50 });
      if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-muted" style="text-align:center; padding:2rem;">Nenhuma importação ainda.</td></tr>';
        return;
      }
      tbody.innerHTML = items.map((imp) => {
        const dt = new Date(imp.createdAt).toLocaleString('pt-BR');
        return `
          <tr data-id="${imp.id}">
            <td class="mono">${dt}</td>
            <td><span class="badge">${imp.source}</span></td>
            <td class="mono">${imp.fileName || '<span class="text-muted">—</span>'}</td>
            <td class="mono text-accent">${imp.ticketCount}</td>
            <td class="mono">${imp.parseErrors ? `<span style="color:var(--warn)">${imp.parseErrors}</span>` : '0'}</td>
            <td class="text-secondary mono" style="font-size:.75rem;">${imp.user?.email || '—'}</td>
            <td>
              <button class="btn btn-danger" data-action="delete" data-id="${imp.id}">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/></svg>
              </button>
            </td>
          </tr>`;
      }).join('');

      tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('Apagar esta importação e seus chamados?')) return;
          try {
            await Api.deleteImport(btn.dataset.id);
            Toast.success('Importação removida');
            load();
          } catch (err) {
            Toast.error(Api.unwrapError(err));
          }
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-muted" style="text-align:center; padding:2rem;">${Api.unwrapError(err)}</td></tr>`;
    }
  }

  window.HistoryUI = { load };
})();
