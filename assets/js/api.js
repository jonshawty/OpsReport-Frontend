/**
 * api.js - cliente HTTP central + endpoints tipados via funções.
 * Depende de Axios carregado via CDN (window.axios).
 */

(function () {
  const C = window.AppConfig;

  const http = axios.create({
    baseURL: C.apiBaseUrl,
    timeout: 30000,
  });

  // Injeta token em todas as requests
  http.interceptors.request.use((cfg) => {
    const token = localStorage.getItem(C.tokenKey);
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
  });

  // 401 -> volta pro login
  http.interceptors.response.use(
    (r) => r,
    (err) => {
      if (err?.response?.status === 401) {
        localStorage.removeItem(C.tokenKey);
        localStorage.removeItem(C.userKey);
        if (!location.pathname.endsWith('index.html') && location.pathname !== '/') {
          location.href = '/index.html';
        }
      }
      return Promise.reject(err);
    }
  );

  function unwrapError(err) {
    if (err?.response?.data?.error) return err.response.data.error;
    if (err?.message) return err.message;
    return 'Erro desconhecido';
  }

  const api = {
    http,
    unwrapError,

    // Auth
    login: (email, password) => http.post('/auth/login', { email, password }).then((r) => r.data),
    me: () => http.get('/auth/me').then((r) => r.data),

    // Tickets
    preview: (text) => http.post('/tickets/preview', { text }).then((r) => r.data),
    previewFile: (file) => {
      const fd = new FormData();
      fd.append('file', file);
      return http.post('/tickets/preview-file', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data);
    },
    saveTickets: (payload) => http.post('/tickets', payload).then((r) => r.data),
    listTickets: (params) => http.get('/tickets', { params }).then((r) => r.data),
    updateTicket: (id, patch) => http.patch(`/tickets/${id}`, patch).then((r) => r.data),
    deleteTicket: (id) => http.delete(`/tickets/${id}`).then((r) => r.data),
    exportTickets: (tickets, format = 'xlsx') =>
      http.post(`/tickets/export?format=${format}`, { tickets }, { responseType: 'blob' })
          .then((r) => r.data),

    // Dashboard
    metrics: () => http.get('/dashboard/metrics').then((r) => r.data),

    // Imports
    listImports: (params) => http.get('/imports', { params }).then((r) => r.data),
    importTickets: (id) => http.get(`/imports/${id}/tickets`).then((r) => r.data),
    deleteImport: (id) => http.delete(`/imports/${id}`).then((r) => r.data),

    // Health
    health: () => http.get('/health').then((r) => r.data),
  };

  window.Api = api;
})();
