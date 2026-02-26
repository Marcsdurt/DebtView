/* ═══════════════════════════════════════════════════
   DebtView — hamburger.js
   Controle do menu hambúrguer mobile
   ═══════════════════════════════════════════════════ */

(function () {
  const overlay = document.getElementById('hbgOverlay');
  const drawer  = document.getElementById('hbgDrawer');
  const btn     = document.getElementById('hamburgerBtn');

  function openDrawer() {
    if (!overlay || !drawer) return;
    // Torna visível e anima
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
    // Força reflow antes de adicionar 'open' para a transição funcionar
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('open');
        drawer.classList.add('open');
        btn && btn.classList.add('open');
      });
    });
  }

  function closeDrawer() {
    if (!overlay || !drawer) return;
    overlay.classList.remove('open');
    drawer.classList.remove('open');
    btn && btn.classList.remove('open');
    document.body.style.overflow = '';
    // Espera a animação acabar para esconder o overlay
    setTimeout(() => overlay.classList.remove('visible'), 320);
  }

  // Fechar clicando no overlay
  overlay && overlay.addEventListener('click', closeDrawer);

  // Fechar com Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  // Expõe globalmente
  window.openDrawer  = openDrawer;
  window.closeDrawer = closeDrawer;

  // Função para "Dados" — abre modal se existir, senão vai pra index
  window.openDadosDrawer = function () {
    closeDrawer();
    setTimeout(() => {
      const modal = document.getElementById('dataModal');
      if (modal && typeof openModal === 'function') {
        openModal('dataModal');
      } else {
        window.location.href = 'index.html';
      }
    }, 80);
  };
})();
