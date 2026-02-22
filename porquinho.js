/* ═══════════════════════════════════════════════════
   DebtView — porquinho.js
   Cofre pessoal de economia
   ═══════════════════════════════════════════════════ */

// ── ESTADO ────────────────────────────────────────
let depositos = JSON.parse(localStorage.getItem('debtview_depositos') || '[]');
let metaCofre = JSON.parse(localStorage.getItem('debtview_meta_cofre') || 'null');
let _editandoId  = null;
let _destinarDepId = null;

// ── FRASES MOTIVACIONAIS ──────────────────────────
const FRASES = [
  "Guardar dinheiro não é se privar — é escolher o seu futuro.",
  "Cada real guardado é um passo pra longe das dívidas.",
  "A liberdade financeira começa com um real de cada vez.",
  "Você não está economizando. Você está construindo uma saída.",
  "Dívidas prendem. Economia liberta. Você escolheu certo.",
  "O segredo dos ricos? Pagar a si mesmo primeiro.",
  "Hoje você guarda. Amanhã você respira.",
  "Um cofre cheio é a melhor resposta que você pode dar às suas dívidas.",
  "A disciplina de hoje é a paz de amanhã.",
  "Cada depósito é uma vitória. Pequena, mas real.",
  "Quem guarda tem. Quem guarda sempre tem mais.",
  "Não existe valor pequeno demais. Todo real importa.",
  "Você começou. Isso já é mais do que a maioria faz.",
  "A dívida tem pressa. A economia tem poder.",
  "Guardar é um ato de amor por quem você vai ser.",
];
const FRASES_MODAL = [
  "💛 Cada real que você guarda é um passo em direção à liberdade.",
  "🚀 Você está construindo o futuro que merece. Continue!",
  "🔑 Esse depósito é uma chave. Guarde-a com orgulho.",
  "⚡ A decisão de guardar sempre foi a certa. Vai fundo!",
  "🌱 Sementes pequenas crescem. Seu esforço vai virar colheita.",
  "🏆 Disciplina hoje, liberdade amanhã. Você tá no caminho certo.",
  "💪 Dívidas se pagam com constância. Você já entendeu isso.",
];
function _frase()      { return FRASES[Math.floor(Math.random() * FRASES.length)]; }
function _fraseModal() { return FRASES_MODAL[Math.floor(Math.random() * FRASES_MODAL.length)]; }

// ── HELPERS ───────────────────────────────────────
function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function _debts() {
  return JSON.parse(localStorage.getItem('debtview_debts') || '[]');
}
function salvar() {
  localStorage.setItem('debtview_depositos', JSON.stringify(depositos));
}

// ── MODAIS ────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('active');
  document.body.style.overflow = 'hidden';
  if (id === 'destinarModal') _setupDestinarPreview();
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('active');
  document.body.style.overflow = '';
  if (id === 'depositarModal') _editandoId = null;
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
  setTimeout(() => el.classList.remove('show'), 3200);
}

// ── CÁLCULOS ──────────────────────────────────────
function _saldoAtual() {
  let s = 0;
  depositos.forEach(d => { s += d.tipo === 'resgate' ? -d.valor : d.valor; });
  return Math.max(0, s);
}
function _totalDestinado() {
  return depositos.filter(d => d.tipo === 'deposito' && d.destinadoA).reduce((s, d) => s + d.valor, 0);
}
function _totalLivre() {
  const resgatado = depositos.filter(d => d.tipo === 'resgate').reduce((s, d) => s + d.valor, 0);
  const livre = depositos.filter(d => d.tipo === 'deposito' && !d.destinadoA).reduce((s, d) => s + d.valor, 0);
  return Math.max(0, livre - resgatado);
}

// ── RENDER HERO ───────────────────────────────────
function renderHero() {
  const saldo = _saldoAtual();
  document.getElementById('heroTotal').textContent     = fmt(saldo);
  document.getElementById('statTotal').textContent     = fmt(saldo);
  document.getElementById('statLivre').textContent     = fmt(_totalLivre());
  document.getElementById('statDestinado').textContent = fmt(_totalDestinado());

  const hero = document.getElementById('heroSub');
  if      (saldo === 0)  hero.textContent = 'Seu cofre está vazio — hora de começar!';
  else if (saldo < 50)   hero.textContent = '🌱 A jornada começa com um passo. Você começou!';
  else if (saldo < 500)  hero.textContent = '💛 Você está construindo algo importante. Não pare!';
  else if (saldo < 2000) hero.textContent = '🔥 Impressionante! Sua disciplina está dando resultados.';
  else                   hero.textContent = '🏆 Você é uma máquina de economizar. Continue assim!';

  const phraseEl = document.getElementById('motivePhrase');
  if (phraseEl && !phraseEl.dataset.set) { phraseEl.textContent = _frase(); phraseEl.dataset.set = '1'; }

  if (metaCofre && metaCofre.valor > 0) {
    const pct = Math.min(100, (saldo / metaCofre.valor) * 100);
    document.getElementById('metaProgressWrap').style.display = 'block';
    document.getElementById('metaLabel').textContent = metaCofre.nome ? `${metaCofre.nome} — ${fmt(metaCofre.valor)}` : fmt(metaCofre.valor);
    document.getElementById('metaPct').textContent   = `${Math.round(pct)}%`;
    document.getElementById('metaBarFill').style.width = pct + '%';
  } else {
    document.getElementById('metaProgressWrap').style.display = 'none';
  }

  const piggy = document.getElementById('piggyIcon');
  piggy.textContent = saldo === 0 ? '🐷' : saldo < 100 ? '🐽' : saldo < 1000 ? '🐖' : '💰';

  renderAlertas();
}

// ── ALERTAS ───────────────────────────────────────
function renderAlertas() {
  const livre = _totalLivre();
  const debts = _debts().filter(d => (d.valorTotal || 0) > 0);
  const wrap  = document.getElementById('sugestaoAlerta');
  const inner = document.getElementById('alerta-sugestao-inner');

  if (livre >= 10 && debts.length > 0) {
    const sugerida = [...debts].sort((a, b) => (b.juros || 0) - (a.juros || 0))[0];
    wrap.style.display = 'block';
    inner.innerHTML = `<strong>💡 Você tem ${fmt(livre)} livre no cofre!</strong>
      Que tal destinar para <em>${sugerida.credor}</em>${sugerida.juros ? ` (${sugerida.juros}% a.m.)` : ''}?`;
    inner.onclick = () => abrirDestinar(null, sugerida.id);
  } else {
    wrap.style.display = 'none';
  }
}

// ── LIQUID HELPERS ────────────────────────────────
function _liquidHTML(pct, size = '') {
  const clampedPct = Math.min(100, Math.max(0, pct));
  return `
    <div class="liquid-container ${size}">
      <div class="liquid-fill" style="--liquid-pct:${clampedPct}%"></div>
      <div class="liquid-wave"></div>
      <div class="liquid-label">${clampedPct.toFixed(1)}%</div>
    </div>`;
}

function _animateLiquid() {
  document.querySelectorAll('.liquid-fill').forEach(el => {
    el.style.animation = 'none';
    el.getBoundingClientRect();
    el.style.animation = '';
  });
}

// ── RENDER LIST ───────────────────────────────────
function renderList() {
  const lista     = [...depositos].reverse();
  const container = document.getElementById('depositList');
  const debts     = _debts();

  if (lista.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🐷</div>
        <h3>Seu cofre está vazio</h3>
        <p>Cada centavo guardado é um passo pra liberdade financeira. Comece agora!</p>
      </div>`;
    return;
  }

  container.innerHTML = lista.map((d, i) => {
    const isResgate   = d.tipo === 'resgate';
    const isDestinado = d.tipo === 'deposito' && d.destinadoA;
    const cls   = isResgate ? 'resgatado' : isDestinado ? 'destinado' : '';
    const icon  = isResgate ? '💸' : isDestinado ? '🎯' : '🐷';
    const color = isResgate ? 'rgba(232,53,74,0.15)' : isDestinado ? 'rgba(39,196,122,0.12)' : 'rgba(245,166,35,0.12)';

    // Cobertura líquida — só para destinados
    let coberturaHtml = '';
    if (isDestinado && d.destinadoId) {
      const debt = debts.find(x => x.id === d.destinadoId);
      if (debt && debt.valorTotal > 0) {
        const pct = Math.min(100, (d.valor / debt.valorTotal) * 100);
        coberturaHtml = `
          <div class="cobertura-wrap">
            ${_liquidHTML(pct, 'liquid-sm')}
            <div class="cobertura-label">da dívida<br><span>${fmt(debt.valorTotal)}</span></div>
          </div>`;
      }
    }

    let badge = isResgate
      ? `<span class="badge-resgatado">↩ Resgatado</span>`
      : isDestinado
        ? `<span class="badge-destinado">✓ ${d.destinadoA}</span>`
        : `<span class="badge-cofre">🐷 No cofre</span>`;

    const editBtn = !isResgate ? `
      <button class="icon-btn" title="Editar" onclick="abrirEdicao('${d.id}')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>` : '';

    const destinarBtn = !isResgate && !isDestinado ? `
      <button class="icon-btn" title="Destinar a uma dívida" onclick="abrirDestinar('${d.id}')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
        </svg>
      </button>` : '';

    return `
      <div class="deposit-card ${cls}" style="animation-delay:${i * 35}ms">
        <div class="deposit-badge" style="background:${color}">${icon}</div>
        <div class="deposit-info">
          <div class="deposit-desc">${d.desc || (isResgate ? 'Resgate' : 'Depósito')}</div>
          <div class="deposit-meta">
            <span>🗓️ ${fmtDate(d.data)}</span>
            ${d.destinadoA ? `<span>➡️ ${d.destinadoA}</span>` : ''}
            ${d.motivo && isResgate ? `<span>📝 ${d.motivo}</span>` : ''}
          </div>
        </div>
        <div class="deposit-numbers">
          ${coberturaHtml}
          <div class="deposit-amount">${isResgate ? '-' : '+'}${fmt(d.valor)}</div>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end;margin-top:4px">
            ${badge}${editBtn}${destinarBtn}
            <button class="icon-btn danger" title="Remover" onclick="removerDeposito('${d.id}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>`;
  }).join('');

  requestAnimationFrame(_animateLiquid);
}

function renderAll() { renderHero(); renderList(); }

// ── DEPOSITAR / EDITAR MODAL ──────────────────────
function _preencherDepositarModal(dep) {
  const isEdit = dep !== null;
  document.getElementById('depositModalTitle').textContent = isEdit ? '✏️ Editar depósito' : '🐷 Guardar dinheiro';
  document.getElementById('depositMotive').textContent = _fraseModal();
  document.getElementById('depositValor').value = isEdit ? dep.valor : '';
  document.getElementById('depositDesc').value  = isEdit ? (dep.desc || '') : '';
  document.getElementById('destinoPreview').style.display = 'none';

  // Atalhos rápidos
  const valores = [10, 20, 50, 100, 200, 500];
  document.getElementById('quickDepositBtns').innerHTML = valores.map(v =>
    `<button class="pay-quick-btn" onclick="setDepositVal(${v})">${fmt(v)}</button>`
  ).join('');

  // Select de dívidas
  const debts = _debts().filter(d => (d.valorTotal || 0) > 0);
  const sel = document.getElementById('depositDestino');
  sel.innerHTML = `<option value="">🐷 Deixar no cofre (sem destino)</option>` +
    debts.map(d =>
      `<option value="${d.id}" data-nome="${d.credor}" data-total="${d.valorTotal}"
        ${isEdit && dep.destinadoId === d.id ? 'selected' : ''}>
        ${d.credor} — ${fmt(d.valorTotal)}
      </option>`
    ).join('');

  // Se edição com destino, mostra preview + líquido imediatamente
  if (isEdit && dep.destinadoId) onDestinoChange();
}

function setDepositVal(v) {
  document.getElementById('depositValor').value = v;
  onDestinoChange();
}

function onDestinoChange() {
  const sel   = document.getElementById('depositDestino');
  const opt   = sel.options[sel.selectedIndex];
  const prev  = document.getElementById('destinoPreview');
  const valor = parseFloat(document.getElementById('depositValor').value) || 0;

  if (sel.value && opt && opt.dataset.total) {
    const nome  = opt.dataset.nome;
    const total = parseFloat(opt.dataset.total) || 0;
    const pct   = total > 0 ? Math.min(100, (valor / total) * 100) : 0;

    prev.style.display = 'block';
    prev.innerHTML = `
      <div class="dp-header">
        <div class="dp-text">
          <div class="dp-name">➡️ ${nome}</div>
          <div class="dp-saldo">Dívida total: ${fmt(total)}</div>
          ${pct >= 100 ? `<div class="dp-quita">🎉 Suficiente pra quitar!</div>` : ''}
        </div>
        <div class="dp-liquid-wrap">
          ${_liquidHTML(pct, 'liquid-sm')}
          <div class="dp-pct-label">da dívida<br>coberta</div>
        </div>
      </div>`;
    requestAnimationFrame(_animateLiquid);
  } else {
    prev.style.display = 'none';
  }
}

function abrirEdicao(id) {
  const dep = depositos.find(d => d.id === id);
  if (!dep) return;
  _editandoId = id;
  const el = document.getElementById('depositarModal');
  el.classList.add('active');
  document.body.style.overflow = 'hidden';
  _preencherDepositarModal(dep);
}

// Chamado pelo botão "Depositar" (novo)
function abrirDepositar() {
  _editandoId = null;
  const el = document.getElementById('depositarModal');
  el.classList.add('active');
  document.body.style.overflow = 'hidden';
  _preencherDepositarModal(null);
}

function salvarDeposito() {
  const valor = parseFloat(document.getElementById('depositValor').value);
  if (!valor || valor <= 0) { showToast('Informe um valor válido.', '❌'); return; }

  const desc      = document.getElementById('depositDesc').value.trim();
  const destinoId = document.getElementById('depositDestino').value;
  const debtObj   = _debts().find(d => d.id === destinoId);

  if (_editandoId) {
    const dep = depositos.find(d => d.id === _editandoId);
    if (dep) {
      dep.valor       = valor;
      dep.desc        = desc || (debtObj ? `Para ${debtObj.credor}` : dep.desc || 'Depósito');
      dep.destinadoA  = debtObj ? debtObj.credor : null;
      dep.destinadoId = destinoId || null;
    }
    showToast('Depósito atualizado! ✏️', '✅');
  } else {
    depositos.push({
      id:          crypto.randomUUID(),
      tipo:        'deposito',
      valor,
      desc:        desc || (debtObj ? `Para ${debtObj.credor}` : 'Depósito'),
      data:        new Date().toISOString(),
      destinadoA:  debtObj ? debtObj.credor : null,
      destinadoId: destinoId || null,
    });
    showToast(debtObj
      ? `🎯 ${fmt(valor)} destinado a ${debtObj.credor}! Você está no caminho certo.`
      : `🐷 ${fmt(valor)} guardado no cofre! Continue assim!`, '💛');
  }

  salvar();
  renderAll();
  closeModal('depositarModal');
}

// ── DESTINAR MODAL ────────────────────────────────
function abrirDestinar(depId, debtIdSugerido) {
  _destinarDepId = depId;

  const debts = _debts().filter(d => (d.valorTotal || 0) > 0);
  if (debts.length === 0) { showToast('Não há dívidas ativas para destinar.', '🎊'); return; }

  const sel = document.getElementById('destinarSelect');
  sel.innerHTML = debts.map(d =>
    `<option value="${d.id}" data-total="${d.valorTotal}" ${d.id === debtIdSugerido ? 'selected' : ''}>
      ${d.credor} — ${fmt(d.valorTotal)}
    </option>`
  ).join('');

  const dep = depositos.find(d => d.id === depId);
  document.getElementById('destinarValor').value = dep ? dep.valor : '';

  openModal('destinarModal');
}

function _setupDestinarPreview() {
  const sel   = document.getElementById('destinarSelect');
  const opt   = sel ? sel.options[sel.selectedIndex] : null;
  const valor = parseFloat(document.getElementById('destinarValor')?.value) || 0;
  const wrap  = document.getElementById('destinarLiquidWrap');
  if (!wrap) return;

  const total = parseFloat(opt?.dataset?.total) || 0;
  if (total > 0) {
    const pct = Math.min(100, (valor / total) * 100);
    wrap.style.display = 'flex';
    wrap.innerHTML = `
      ${_liquidHTML(pct, 'liquid-md')}
      <div class="destinar-liquid-info">
        <div class="dli-title">${opt.text.split('—')[0].trim()}</div>
        <div class="dli-total">Total: ${fmt(total)}</div>
        <div class="dli-cobre">Esse valor cobre <strong>${pct.toFixed(1)}%</strong> da dívida</div>
        ${pct >= 100 ? '<div class="dli-badge">🎉 Suficiente pra quitar!</div>' : ''}
      </div>`;
    requestAnimationFrame(_animateLiquid);
  } else {
    wrap.style.display = 'none';
  }
}

function onDestinarChange() {
  _setupDestinarPreview();
}

function confirmarDestinar() {
  const debtId = document.getElementById('destinarSelect').value;
  const valor  = parseFloat(document.getElementById('destinarValor').value);
  const debt   = _debts().find(d => d.id === debtId);
  if (!debt || !valor || valor <= 0) { showToast('Informe um valor e uma dívida.', '❌'); return; }

  if (_destinarDepId) {
    const dep = depositos.find(d => d.id === _destinarDepId);
    if (dep) { dep.destinadoA = debt.credor; dep.destinadoId = debt.id; dep.desc = dep.desc || `Para ${debt.credor}`; }
  } else {
    depositos.push({ id: crypto.randomUUID(), tipo: 'deposito', valor, desc: `Para ${debt.credor}`, data: new Date().toISOString(), destinadoA: debt.credor, destinadoId: debt.id });
  }

  salvar(); renderAll(); closeModal('destinarModal'); _destinarDepId = null;
  showToast(`✅ ${fmt(valor)} destinado a ${debt.credor}. Excelente decisão!`, '🎯');
}

// ── META ──────────────────────────────────────────
function salvarMeta() {
  const valor = parseFloat(document.getElementById('metaValorInput').value);
  const nome  = document.getElementById('metaNomeInput').value.trim();
  if (!valor || valor <= 0) { showToast('Informe um valor válido para a meta.', '❌'); return; }
  metaCofre = { valor, nome: nome || null };
  localStorage.setItem('debtview_meta_cofre', JSON.stringify(metaCofre));
  closeModal('metaModal'); renderAll(); showToast('🎯 Meta definida! Agora foco total!', '✅');
}
function limparMeta() {
  metaCofre = null; localStorage.removeItem('debtview_meta_cofre');
  closeModal('metaModal'); renderAll(); showToast('Meta removida.', '🗑️');
}

// ── RESGATAR ──────────────────────────────────────
function abrirResgate() {
  document.getElementById('resgatarValor').value  = '';
  document.getElementById('resgatarMotivo').value = '';
  openModal('resgatarModal');
}

function confirmarResgate() {
  const valor  = parseFloat(document.getElementById('resgatarValor').value);
  const motivo = document.getElementById('resgatarMotivo').value.trim();
  if (!valor || valor <= 0) { showToast('Informe o valor a resgatar.', '❌'); return; }
  const saldo = _saldoAtual();
  if (valor > saldo) { showToast(`Saldo insuficiente. Disponível: ${fmt(saldo)}`, '❌'); return; }
  depositos.push({ id: crypto.randomUUID(), tipo: 'resgate', valor, motivo: motivo || 'Resgate', data: new Date().toISOString(), desc: motivo || 'Resgate' });
  salvar(); renderAll(); closeModal('resgatarModal');
  showToast('Resgate registrado. Tente repor assim que puder! 💪', '💸');
}

// ── REMOVER ───────────────────────────────────────
function removerDeposito(id) {
  if (!confirm('Remover este registro?')) return;
  depositos = depositos.filter(d => d.id !== id);
  salvar(); renderAll(); showToast('Registro removido.', '🗑️');
}

// ── INIT ──────────────────────────────────────────
(function init() {
  renderAll();

  const phraseEl = document.getElementById('motivePhrase');
  setInterval(() => {
    if (!phraseEl) return;
    phraseEl.style.opacity = '0';
    setTimeout(() => { phraseEl.textContent = _frase(); phraseEl.style.opacity = '1'; }, 400);
  }, 12000);

  if (metaCofre) {
    const inp = document.getElementById('metaValorInput');
    const inpN = document.getElementById('metaNomeInput');
    if (inp)  inp.value  = metaCofre.valor;
    if (inpN) inpN.value = metaCofre.nome || '';
  }

  // Botão resgatar
  const main = document.querySelector('main');
  if (main && !document.getElementById('resgatarBtnWrap')) {
    const wrap = document.createElement('div');
    wrap.id = 'resgatarBtnWrap';
    wrap.style.cssText = 'display:flex;justify-content:flex-end;margin-bottom:16px;margin-top:-10px;';
    wrap.innerHTML = `
      <button class="btn btn-ghost" style="color:var(--red);border-color:rgba(232,53,74,0.25);font-size:13px" onclick="abrirResgate()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Resgatar valor
      </button>`;
    const sh = main.querySelector('.section-header');
    if (sh) main.insertBefore(wrap, sh);
  }
})();
