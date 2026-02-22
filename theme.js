/* ═══════════════════════════════════════════════════
   DebtView — theme.js
   Injete no <head> de todas as páginas (antes do CSS)
   para evitar flash de tema errado.
   ═══════════════════════════════════════════════════ */

(function () {
  const saved = localStorage.getItem('debtview_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
})();
