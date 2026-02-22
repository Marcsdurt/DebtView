/* ═══════════════════════════════════════════════════
   DebtView — configuracoes.js
   ═══════════════════════════════════════════════════ */

const PAGES_TUT = [
  { key: 'index',     label: 'Dívidas',      icon: '💳' },
  { key: 'historico', label: 'Pagas',         icon: '🎊' },
  { key: 'plano',     label: 'Plano de Saída',icon: '🗺️' },
  { key: 'porquinho', label: 'Porquinho',     icon: '🐷' },
];

// ── TOGGLE HELPERS ────────────────────────────────
function setToggle(id, on) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('active', on);
}

function getToggle(id) {
  return document.getElementById(id)?.classList.contains('active');
}

// ── TOAST ─────────────────────────────────────────
function showToast(msg, icon = '✅') {
  const el = document.getElementById('toast');
  if (!el) return;
  document.getElementById('toastMsg').textContent  = msg;
  document.getElementById('toastIcon').textContent = icon;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3200);
}

// ── MODAL HELPERS ─────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('active');    document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); document.body.style.overflow = ''; }
function closeOnBackdrop(e, id) { if (e.target === document.getElementById(id)) closeModal(id); }

// ── TEMA ──────────────────────────────────────────
function renderTheme() {
  const theme = localStorage.getItem('debtview_theme') || 'light';
  setToggle('themeToggle', theme === 'dark');
  document.getElementById('themeLabel').textContent =
    theme === 'dark' ? 'Escuro (Dark)' : 'Claro (Light)';
}

function toggleTheme() {
  const current = localStorage.getItem('debtview_theme') || 'light';
  const next    = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('debtview_theme', next);
  // Adiciona classe de transição, aplica tema, remove depois
  document.documentElement.classList.add('theme-transitioning');
  document.documentElement.setAttribute('data-theme', next);
  setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 400);
  renderTheme();
  showToast(next === 'dark' ? 'Tema escuro ativado 🌙' : 'Tema claro ativado ☀️', '🎨');
}

// ── TUTORIAL ─────────────────────────────────────
function renderTutorialSection() {
  const disabled = localStorage.getItem('debtview_tut_disabled') === '1';
  setToggle('tutToggle', !disabled);

  // Contagem de páginas vistas
  const vistas = PAGES_TUT.filter(p => localStorage.getItem(`debtview_tut_${p.key}`) === '1').length;
  document.getElementById('tutPaginasVistas').textContent =
    vistas === 0 ? 'Nenhuma página visitada ainda'
    : vistas === PAGES_TUT.length ? '✅ Tour completo em todas as páginas'
    : `${vistas} de ${PAGES_TUT.length} páginas visitadas`;

  // Grid de tours por página
  const grid = document.getElementById('tutToursGrid');
  grid.innerHTML = PAGES_TUT.map(p => {
    const visto = localStorage.getItem(`debtview_tut_${p.key}`) === '1';
    return `
      <div class="cfg-tour-item">
        <div class="cfg-tour-name">
          <span>${p.icon}</span>${p.label}
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span class="cfg-tour-status ${visto ? 'visto' : 'pendente'}">${visto ? 'Visto' : 'Pendente'}</span>
          ${visto ? `<button class="cfg-tour-reset" onclick="resetarTutorial('${p.key}')" title="Resetar">↺</button>` : ''}
        </div>
      </div>`;
  }).join('');
}

function toggleTutorial() {
  const disabled = localStorage.getItem('debtview_tut_disabled') === '1';
  if (disabled) {
    // Reativar
    localStorage.removeItem('debtview_tut_disabled');
    showToast('Tutorial reativado! A bolinha ! vai aparecer novamente.', '🎓');
  } else {
    // Desativar
    localStorage.setItem('debtview_tut_disabled', '1');
    PAGES_TUT.forEach(p => localStorage.setItem(`debtview_tut_${p.key}`, '1'));
    showToast('Tutorial desativado.', '🔕');
  }
  renderTutorialSection();
}

function resetarTutorial(page) {
  localStorage.removeItem(`debtview_tut_${page}`);
  localStorage.removeItem('debtview_tut_disabled');
  renderTutorialSection();
  showToast(`Tour da página resetado! Será exibido na próxima visita.`, '🔄');
}

function resetarTodosTutoriais() {
  PAGES_TUT.forEach(p => localStorage.removeItem(`debtview_tut_${p.key}`));
  localStorage.removeItem('debtview_tut_disabled');
  renderTutorialSection();
  showToast('Todos os tours resetados! Serão exibidos na próxima visita.', '🔄');
}

// ── DADOS ─────────────────────────────────────────
function renderDados() {
  const debts    = JSON.parse(localStorage.getItem('debtview_debts')    || '[]');
  const pagas    = JSON.parse(localStorage.getItem('debtview_pagas')    || '[]');
  const depositos= JSON.parse(localStorage.getItem('debtview_depositos')|| '[]');

  const totalDividas = debts.reduce((s, d) => s + (d.valorTotal || 0), 0);
  const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  document.getElementById('cfgResumo').innerHTML =
    `${debts.length} dívidas ativas (${fmt(totalDividas)}) · ${pagas.length} quitadas · ${depositos.filter(d=>d.tipo!=='resgate').length} depósitos no cofre`;
}

function exportarDados() {
  const data = {
    exportadoEm: new Date().toISOString(),
    versao: '1.0',
    debtview_debts:     JSON.parse(localStorage.getItem('debtview_debts')    || '[]'),
    debtview_pagas:     JSON.parse(localStorage.getItem('debtview_pagas')    || '[]'),
    debtview_depositos: JSON.parse(localStorage.getItem('debtview_depositos')|| '[]'),
    debtview_meta_cofre:JSON.parse(localStorage.getItem('debtview_meta_cofre')|| 'null'),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `debtview-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);

  localStorage.setItem('debtview_ultimo_backup', Date.now().toString());
  showToast('Backup exportado com sucesso!', '💾');
}

// ── AUTO BACKUP ───────────────────────────────────
function toggleAutoBackupCfg() {
  const on = !getToggle('autoBackupToggle');
  setToggle('autoBackupToggle', on);
  localStorage.setItem('debtview_auto_backup', on ? '1' : '0');
  showToast(on ? 'Lembrete de backup ativado.' : 'Lembrete de backup desativado.', on ? '✅' : '🔕');
}

// ── ANIMAÇÕES ─────────────────────────────────────
function toggleAnim() {
  const on = !getToggle('animToggle');
  setToggle('animToggle', on);
  localStorage.setItem('debtview_reducir_anim', on ? '1' : '0');
  document.documentElement.classList.toggle('reducir-anim', on);
  showToast(on ? 'Animações reduzidas.' : 'Animações normais.', '🎨');
}

// ── APAGAR TUDO ───────────────────────────────────
function confirmarApagarTudo() {
  openModal('apagarModal');
}

function apagarTudo() {
  const keys = [
    'debtview_debts','debtview_pagas','debtview_depositos',
    'debtview_meta_cofre','debtview_tut_disabled','debtview_auto_backup',
    'debtview_reducir_anim','debtview_ultimo_backup',
    ...PAGES_TUT.map(p => `debtview_tut_${p.key}`),
  ];
  keys.forEach(k => localStorage.removeItem(k));
  closeModal('apagarModal');
  showToast('Todos os dados apagados.', '🗑️');
  setTimeout(() => { window.location.href = 'index.html'; }, 1800);
}

// ── INIT ─────────────────────────────────────────
(function init() {
  renderTutorialSection();
  renderDados();
  renderTheme();

  // Toggle estados salvos
  setToggle('tutToggle',        localStorage.getItem('debtview_tut_disabled') !== '1');
  setToggle('autoBackupToggle', localStorage.getItem('debtview_auto_backup')  === '1');
  setToggle('animToggle',       localStorage.getItem('debtview_reducir_anim') === '1');

  if (localStorage.getItem('debtview_reducir_anim') === '1') {
    document.documentElement.classList.add('reducir-anim');
  }
})();
