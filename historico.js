/* ═══════════════════════════════════════════════════
   DebtView — historico.js
   Histórico de dívidas pagas
   ═══════════════════════════════════════════════════ */

// ── ESTADO ────────────────────────────────────────
let pagas = JSON.parse(localStorage.getItem('debtview_pagas') || '[]');

// ── MAPA DE TIPOS ─────────────────────────────────
const TYPE_MAP = {
  'Cartão de Crédito':   { emoji: '💳', color: '#7c5cfc' },
  'Empréstimo Pessoal':  { emoji: '💰', color: '#f5a623' },
  'Financiamento':       { emoji: '🏠', color: '#27c47a' },
  'Cheque Especial':     { emoji: '🏦', color: '#e8354a' },
  'Crédito Consignado':  { emoji: '📑', color: '#4da8ff' },
  'CDC':                 { emoji: '🚗', color: '#ff7d3b' },
  'Dívida Pessoal':      { emoji: '🤝', color: '#ff5db0' },
  'Boleto/Parcelamento': { emoji: '📄', color: '#9090a8' },
  'Outro':               { emoji: '🔖', color: '#686878' },
};

// ── HELPERS ───────────────────────────────────────

function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

function fmtDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateShort(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ── MODALS ────────────────────────────────────────

function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

function closeOnBackdrop(e, id) {
  if (e.target === document.getElementById(id)) closeModal(id);
}

// ── TOAST ─────────────────────────────────────────

function showToast(msg, icon = '✅') {
  const el = document.getElementById('toast');
  document.getElementById('toastMsg').textContent  = msg;
  document.getElementById('toastIcon').textContent = icon;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

// ── STATS ─────────────────────────────────────────

function renderStats() {
  const totalQuitado = pagas.reduce((s, d) => s + (d.valorPago || d.valorOriginal || 0), 0);
  const maior = pagas.length
    ? pagas.reduce((a, b) => (a.valorPago || 0) > (b.valorPago || 0) ? a : b)
    : null;

  // Sort by date for most recent
  const sorted = [...pagas].sort((a, b) => new Date(b.quitadoEm) - new Date(a.quitadoEm));
  const recente = sorted[0];

  document.getElementById('heroTotal').textContent = fmt(totalQuitado);
  document.getElementById('heroSub').textContent = pagas.length === 0
    ? 'Nenhuma dívida quitada ainda'
    : `${pagas.length} dívida${pagas.length !== 1 ? 's' : ''} eliminada${pagas.length !== 1 ? 's' : ''}`;

  document.getElementById('statCount').textContent = pagas.length;
  document.getElementById('statMaior').textContent  = maior ? maior.credor : '—';
  document.getElementById('statRecente').textContent = recente
    ? `${recente.credor} — ${fmtDateShort(recente.quitadoEm)}`
    : '—';
}

// ── RENDER LIST ───────────────────────────────────

function renderHistory() {
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();

  let lista = [...pagas]
    .filter(d => !query || d.credor.toLowerCase().includes(query) || (d.tipo || '').toLowerCase().includes(query))
    .sort((a, b) => new Date(b.quitadoEm) - new Date(a.quitadoEm));

  const container = document.getElementById('historyList');

  if (lista.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${query ? '🔍' : '🎊'}</div>
        <h3>${query ? 'Nenhum resultado encontrado' : 'Nenhuma dívida quitada ainda'}</h3>
        <p>${query ? `Nenhuma dívida corresponde a "${query}".` : 'Quando você quitar uma dívida, ela aparece aqui como histórico.'}</p>
      </div>`;
    return;
  }

  container.innerHTML = lista.map((d, i) => {
    const t = TYPE_MAP[d.tipo] || { emoji: '🔖', color: '#686878' };
    const totalPago = d.valorPago || (d.historicoPagamentos || []).reduce((s, p) => s + p.valor, 0) || 0;
    const nPagamentos = (d.historicoPagamentos || []).length;

    return `
      <div class="history-card" style="animation-delay:${i * 40}ms">

        <div class="history-type-badge" style="background:${t.color}22">${t.emoji}</div>

        <div class="history-info">
          <div class="history-creditor">${d.credor}</div>
          <div class="history-meta">
            <span>📋 ${d.tipo}</span>
            <span>🗓️ Quitado em ${fmtDate(d.quitadoEm)}</span>
            ${nPagamentos > 0 ? `<span>💳 ${nPagamentos} pagamento${nPagamentos !== 1 ? 's' : ''}</span>` : ''}
          </div>
        </div>

        <div class="history-numbers">
          <div class="history-amount">${fmt(totalPago)}</div>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">
            <span class="badge-quitado">✓ Quitada</span>
            <button class="icon-btn" title="Ver detalhes" onclick="openDetail('${d.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </button>
            <button class="icon-btn danger" title="Remover do histórico" onclick="removeFromHistory('${d.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
              </svg>
            </button>
          </div>
        </div>

      </div>`;
  }).join('');
}

// ── DETALHES ──────────────────────────────────────

function openDetail(id) {
  const d = pagas.find(x => x.id === id);
  if (!d) return;

  const t = TYPE_MAP[d.tipo] || { emoji: '🔖', color: '#686878' };
  const totalPago = d.valorPago || (d.historicoPagamentos || []).reduce((s, p) => s + p.valor, 0) || 0;
  const valorOriginalRef = d.valorOriginal || totalPago;

  document.getElementById('detailTitle').textContent = `${t.emoji} ${d.credor}`;

  // Build timeline HTML
  const hist = d.historicoPagamentos || [];
  const timelineHTML = hist.length > 0 ? `
    <div class="pay-timeline">
      <div class="pay-timeline-title">Histórico de pagamentos</div>
      ${hist.map(p => `
        <div class="pay-timeline-item">
          <div class="ptl-dot"></div>
          <div class="ptl-content">
            <div class="ptl-date">${fmtDate(p.data)}</div>
            <div class="ptl-val">${fmt(p.valor)}</div>
            ${p.obs ? `<div class="ptl-obs">${p.obs}</div>` : ''}
            <div class="ptl-saldo">Saldo: ${fmt(p.saldoAnterior)} → ${fmt(p.saldoApos)}</div>
          </div>
        </div>
      `).join('')}
    </div>` : '';

  document.getElementById('detailBody').innerHTML = `
    <div class="detail-section">
      <div class="detail-section-title">Resumo</div>
      <div class="detail-grid">
        <div class="detail-cell">
          <div class="dc-label">Total pago</div>
          <div class="dc-val green">${fmt(totalPago)}</div>
        </div>
        <div class="detail-cell">
          <div class="dc-label">Valor original</div>
          <div class="dc-val">${fmt(valorOriginalRef)}</div>
        </div>
        <div class="detail-cell">
          <div class="dc-label">Data de quitação</div>
          <div class="dc-val">${fmtDate(d.quitadoEm)}</div>
        </div>
        <div class="detail-cell">
          <div class="dc-label">Tipo</div>
          <div class="dc-val">${d.tipo}</div>
        </div>
        ${d.modalidade ? `
        <div class="detail-cell">
          <div class="dc-label">Modalidade</div>
          <div class="dc-val">${d.modalidade}</div>
        </div>` : ''}
        ${d.juros ? `
        <div class="detail-cell">
          <div class="dc-label">Taxa de juros</div>
          <div class="dc-val red">${d.juros}% a.m.</div>
        </div>` : ''}
        ${d.totalParcelas ? `
        <div class="detail-cell">
          <div class="dc-label">Parcelas</div>
          <div class="dc-val">${d.parcelasPagas || d.totalParcelas}/${d.totalParcelas}</div>
        </div>` : ''}
        ${d.criadoEm ? `
        <div class="detail-cell">
          <div class="dc-label">Cadastrada em</div>
          <div class="dc-val">${fmtDate(d.criadoEm)}</div>
        </div>` : ''}
      </div>
      ${d.obs ? `<div style="margin-top:12px;padding:12px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;font-size:13px;color:var(--text-dim);font-style:italic">"${d.obs}"</div>` : ''}
    </div>

    ${timelineHTML}
  `;

  openModal('detailModal');
}

// ── CRUD ──────────────────────────────────────────

/**
 * Remove uma dívida do histórico pelo ID
 * @param {string} id
 */
function removeFromHistory(id) {
  if (!confirm('Remover esta entrada do histórico?')) return;
  pagas = pagas.filter(d => d.id !== id);
  localStorage.setItem('debtview_pagas', JSON.stringify(pagas));
  renderStats();
  renderHistory();
  showToast('Removido do histórico.', '🗑️');
}

/**
 * Abre modal de confirmação para limpar tudo
 */
function confirmClearAll() {
  if (pagas.length === 0) {
    showToast('Histórico já está vazio.', '📭');
    return;
  }
  openModal('confirmModal');
}

/**
 * Limpa todo o histórico de dívidas pagas
 */
function clearAll() {
  pagas = [];
  localStorage.setItem('debtview_pagas', JSON.stringify(pagas));
  closeModal('confirmModal');
  renderStats();
  renderHistory();
  showToast('Histórico limpo.', '🗑️');
}

// ── INICIALIZAÇÃO ─────────────────────────────────
renderStats();
renderHistory();