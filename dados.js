/* ═══════════════════════════════════════════════════
   DebtView — dados.js
   Exportar · Importar · Backup automático
   ═══════════════════════════════════════════════════ */

const DADOS_VERSION  = '1.0';
const BACKUP_KEY     = 'debtview_autobackup';
const BACKUP_TS_KEY  = 'debtview_backup_last';
const BACKUP_TIMER_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

/** Dados pendentes de confirmação de importação */
let _pendingImport = null;

// ── HELPERS ───────────────────────────────────────

function _fmtTs(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function _showToast(msg, icon = '✅') {
  const el = document.getElementById('toast');
  if (!el) return;
  document.getElementById('toastMsg').textContent  = msg;
  document.getElementById('toastIcon').textContent = icon;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3500);
}

// ── ATUALIZA INFO DO MODAL ─────────────────────────

function atualizarInfoDados() {
  const debts = JSON.parse(localStorage.getItem('debtview_debts') || '[]');
  const pagas = JSON.parse(localStorage.getItem('debtview_pagas') || '[]');
  const lastBackup = localStorage.getItem(BACKUP_TS_KEY);

  const elAt = document.getElementById('dataInfoAtivas');
  const elPg = document.getElementById('dataInfoPagas');
  const elDt = document.getElementById('dataInfoDate');
  if (elAt) elAt.textContent = `${debts.length} ativa${debts.length !== 1 ? 's' : ''}`;
  if (elPg) elPg.textContent = `${pagas.length} paga${pagas.length !== 1 ? 's' : ''}`;
  if (elDt) elDt.textContent = lastBackup ? `Último backup: ${_fmtTs(lastBackup)}` : 'Sem backup anterior';

  // Auto-backup toggle state
  const ativo = localStorage.getItem(BACKUP_KEY) === 'true';
  _atualizarToggleUI(ativo);
}

// ── EXPORTAR ──────────────────────────────────────

function exportarDados() {
  const debts = JSON.parse(localStorage.getItem('debtview_debts') || '[]');
  const pagas = JSON.parse(localStorage.getItem('debtview_pagas') || '[]');

  const payload = {
    versao:    DADOS_VERSION,
    exportadoEm: new Date().toISOString(),
    app:       'DebtView',
    debts,
    pagas,
  };

  const json     = JSON.stringify(payload, null, 2);
  const blob     = new Blob([json], { type: 'application/json' });
  const url      = URL.createObjectURL(blob);
  const dataStr  = new Date().toISOString().slice(0, 10);
  const filename = `debtview-backup-${dataStr}.json`;

  const a = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Registrar timestamp do último backup
  const ts = new Date().toISOString();
  localStorage.setItem(BACKUP_TS_KEY, ts);
  atualizarInfoDados();

  _showToast(`Backup salvo: ${filename}`, '💾');
}

// ── IMPORTAR ──────────────────────────────────────

function importarDados(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);

      // Validação mínima
      if (!data.versao || (!Array.isArray(data.debts) && !Array.isArray(data.pagas))) {
        _showToast('Arquivo inválido ou corrompido.', '❌');
        return;
      }

      _pendingImport = data;

      // Mostrar prévia
      const nDebts = (data.debts || []).length;
      const nPagas = (data.pagas || []).length;
      const exportTs = data.exportadoEm ? _fmtTs(data.exportadoEm) : '—';

      const previewEl = document.getElementById('importPreview');
      const bodyEl    = document.getElementById('importPreviewBody');

      bodyEl.innerHTML = `
        <div class="preview-row">
          <span class="preview-key">Exportado em</span>
          <span class="preview-val">${exportTs}</span>
        </div>
        <div class="preview-row">
          <span class="preview-key">Dívidas ativas</span>
          <span class="preview-val accent">${nDebts}</span>
        </div>
        <div class="preview-row">
          <span class="preview-key">Dívidas pagas</span>
          <span class="preview-val green">${nPagas}</span>
        </div>
        <div class="preview-row">
          <span class="preview-key">Versão</span>
          <span class="preview-val muted">${data.versao}</span>
        </div>
        <div class="preview-warn">⚠️ Os dados atuais serão substituídos.</div>
      `;

      previewEl.style.display = 'block';

    } catch (err) {
      _showToast('Erro ao ler o arquivo. Verifique se é um JSON válido.', '❌');
    }
  };

  reader.readAsText(file);
  // Reset input so mesmo arquivo pode ser selecionado novamente
  event.target.value = '';
}

function cancelarImport() {
  _pendingImport = null;
  const previewEl = document.getElementById('importPreview');
  if (previewEl) previewEl.style.display = 'none';
}

function confirmarImport() {
  if (!_pendingImport) return;

  const data = _pendingImport;

  // Sobrescrever localStorage
  localStorage.setItem('debtview_debts', JSON.stringify(data.debts || []));
  localStorage.setItem('debtview_pagas', JSON.stringify(data.pagas || []));

  // Atualizar estado em memória (compatibilidade com as páginas)
  if (typeof debts !== 'undefined') {
    // estamos na index.html
    debts.length = 0;
    (data.debts || []).forEach(d => debts.push(d));
    if (typeof renderAll === 'function') renderAll();
  }
  if (typeof pagas !== 'undefined') {
    // estamos na historico.html
    pagas.length = 0;
    (data.pagas || []).forEach(d => pagas.push(d));
    if (typeof renderHistory === 'function') { renderStats(); renderHistory(); }
  }

  _pendingImport = null;
  const previewEl = document.getElementById('importPreview');
  if (previewEl) previewEl.style.display = 'none';

  atualizarInfoDados();
  _showToast('Dados importados com sucesso!', '📥');

  if (typeof closeModal === 'function') closeModal('dataModal');
}

// ── BACKUP AUTOMÁTICO ─────────────────────────────

let _backupTimer = null;

function _agendarBackup() {
  if (_backupTimer) clearTimeout(_backupTimer);

  const lastTs = localStorage.getItem(BACKUP_TS_KEY);
  const agora  = Date.now();
  const ultimo = lastTs ? new Date(lastTs).getTime() : 0;
  const delay  = Math.max(0, BACKUP_TIMER_MS - (agora - ultimo));

  const nextDate = new Date(agora + delay);

  const msgEl = document.getElementById('autoBackupNextMsg');
  if (msgEl) {
    msgEl.textContent = delay < 1000
      ? 'Lembrete: faça um backup agora!'
      : `Próximo lembrete: ${nextDate.toLocaleDateString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}`;
  }

  _backupTimer = setTimeout(() => {
    _showToast('⏰ Lembrete: faça um backup dos seus dados!', '💾');
    // Re-agenda para o próximo ciclo
    if (localStorage.getItem(BACKUP_KEY) === 'true') {
      localStorage.setItem(BACKUP_TS_KEY, new Date().toISOString());
      _agendarBackup();
    }
  }, delay);
}

function _atualizarToggleUI(ativo) {
  const toggle = document.getElementById('autoBackupToggle');
  const label  = document.getElementById('autoBackupLabel');
  const msgEl  = document.getElementById('autoBackupNextMsg');

  if (toggle) toggle.classList.toggle('active', ativo);
  if (label)  label.textContent = ativo ? 'Ativado' : 'Desativado';
  if (msgEl && !ativo) msgEl.textContent = '';
}

function toggleAutoBackup() {
  const ativo = localStorage.getItem(BACKUP_KEY) === 'true';
  const novoEstado = !ativo;

  localStorage.setItem(BACKUP_KEY, String(novoEstado));
  _atualizarToggleUI(novoEstado);

  if (novoEstado) {
    _agendarBackup();
    _showToast('Backup automático ativado!', '⏰');
  } else {
    if (_backupTimer) clearTimeout(_backupTimer);
    _backupTimer = null;
    _showToast('Backup automático desativado.', '🔕');
    const msgEl = document.getElementById('autoBackupNextMsg');
    if (msgEl) msgEl.textContent = '';
  }
}

// ── INIT ──────────────────────────────────────────

(function init() {
  // Atualiza infos toda vez que o modal de dados é aberto
  const dataModal = document.getElementById('dataModal');
  if (dataModal) {
    const observer = new MutationObserver(() => {
      if (dataModal.classList.contains('active')) atualizarInfoDados();
    });
    observer.observe(dataModal, { attributes: true, attributeFilter: ['class'] });
  }

  // Reativar backup automático se estava ligado
  if (localStorage.getItem(BACKUP_KEY) === 'true') {
    _agendarBackup();
  }
})();