/* ═══════════════════════════════════════════════════
   DebtView — app.js
   ═══════════════════════════════════════════════════ */

// ── ESTADO ────────────────────────────────────────
let debts = JSON.parse(localStorage.getItem('debtview_debts') || '[]');

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

/**
 * Formata número como moeda BRL
 * @param {number} v
 * @returns {string}
 */
function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

/**
 * Formata data ISO (YYYY-MM-DD) em DD/MM/YYYY
 * @param {string|null} d
 * @returns {string}
 */
function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

/**
 * Retorna HTML de badge de status com base na data de vencimento
 * @param {string|null} vencimento
 * @returns {string}
 */
function statusBadge(vencimento, atraso) {
  // Tem valor em atraso → sempre atrasado, independente da data
  if (atraso && atraso > 0) return `<span class="badge badge-atrasado">⚠ Em atraso</span>`;
  if (!vencimento) return '';
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const v    = new Date(vencimento + 'T00:00:00');
  const diff = Math.round((v - hoje) / 86_400_000);

  if (diff < 0)  return `<span class="badge badge-atrasado">⚠ Atrasado</span>`;
  if (diff <= 7) return `<span class="badge badge-venc">⏰ Vence em ${diff}d</span>`;
  return `<span class="badge badge-ok">✓ Em dia</span>`;
}

/**
 * Gera ID único simples
 * @returns {string}
 */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Persiste estado no localStorage
 */
function save() {
  localStorage.setItem('debtview_debts', JSON.stringify(debts));
}

// ── MODALIDADE ───────────────────────────────────

const MODALIDADE_HINTS = {
  parcelado: '📦 As parcelas já incluem os juros. Ex: 3x de R$ 76,18 num saldo de R$ 189,78 — os juros são a diferença.',
  rotativo:  '🔄 Os juros incidem todo mês sobre o saldo restante. Ex: cartão em rotativo, cheque especial.',
  simples:   '📄 Sem juros. O valor cai conforme você paga. Ex: dívida com amigo, boleto sem encargo.',
};

function atualizarHintModalidade() {
  const val    = document.getElementById('fModalidade')?.value;
  const hint   = document.getElementById('modalidadeHint');
  const campo  = document.getElementById('fieldJuros');
  if (!hint || !campo) return;
  hint.textContent = MODALIDADE_HINTS[val] || '';
  // Campo de taxa só aparece no rotativo
  campo.style.display = val === 'rotativo' ? '' : 'none';
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

// ── CRUD ──────────────────────────────────────────

/** ID da dívida sendo editada (null = modo criação) */
let editingId = null;

/** Lê todos os campos do formulário e retorna objeto */
function lerFormulario() {
  return {
    tipo:          document.getElementById('fTipo').value,
    modalidade:    document.getElementById('fModalidade').value,
    credor:        document.getElementById('fCredor').value.trim(),
    valorTotal:    parseFloat(document.getElementById('fValorTotal').value)    || 0,
    parcela:       parseFloat(document.getElementById('fParcela').value)       || null,
    juros:         parseFloat(document.getElementById('fJuros').value)         || null,
    vencimento:    document.getElementById('fVencimento').value                || null,
    totalParcelas: parseInt(document.getElementById('fTotalParcelas').value)   || null,
    parcelasPagas: parseInt(document.getElementById('fParcelasPagas').value)   || 0,
    parcialPago:   parseFloat(document.getElementById('fParcialPago').value)   || null,
    atraso:        parseFloat(document.getElementById('fAtraso').value)        || null,
    iof:           parseFloat(document.getElementById('fIOF').value)           || null,
    valorOriginal: parseFloat(document.getElementById('fValorOriginal').value) || null,
    obs:           document.getElementById('fObs').value.trim()                || null,
  };
}

/** Preenche o formulário com os dados de uma dívida */
function preencherFormulario(d) {
  document.getElementById('fTipo').value          = d.tipo          || '';
  document.getElementById('fModalidade').value    = d.modalidade    || '';
  atualizarHintModalidade();
  document.getElementById('fCredor').value        = d.credor        || '';
  document.getElementById('fValorTotal').value    = d.valorTotal    || '';
  document.getElementById('fParcela').value       = d.parcela       || '';
  document.getElementById('fJuros').value         = d.juros         || '';
  document.getElementById('fVencimento').value    = d.vencimento    || '';
  document.getElementById('fTotalParcelas').value = d.totalParcelas || '';
  document.getElementById('fParcelasPagas').value = d.parcelasPagas ?? '';
  document.getElementById('fParcialPago').value   = d.parcialPago   || '';
  document.getElementById('fAtraso').value        = d.atraso        || '';
  document.getElementById('fIOF').value           = d.iof           || '';
  document.getElementById('fValorOriginal').value = d.valorOriginal || '';
  document.getElementById('fObs').value           = d.obs           || '';
}

/**
 * Abre modal no modo edição, pré-preenchido
 * @param {string} id
 */
function openEditModal(id) {
  const d = debts.find(x => x.id === id);
  if (!d) return;

  editingId = id;
  preencherFormulario(d);

  document.getElementById('addModalTitle').textContent   = '✏️ Editar Dívida';
  document.getElementById('addModalBtnLabel').textContent = 'Salvar Alterações';

  closeModal('detailModal');
  openModal('addModal');
  atualizarHintModalidade();
}

/**
 * Abre modal no modo criação (limpo)
 */
function openModal_add() {
  editingId = null;
  document.getElementById('debtForm').reset();
  document.getElementById('addModalTitle').textContent    = 'Nova Dívida';
  document.getElementById('addModalBtnLabel').textContent = 'Salvar Dívida';
  openModal('addModal');
  atualizarHintModalidade();
}

/**
 * Submit unificado — cria ou atualiza conforme editingId
 * @param {Event} e
 */
function submitDebtForm(e) {
  e.preventDefault();
  const campos = lerFormulario();

  if (editingId) {
    // ── Modo edição ────────────────────────────────
    const idx = debts.findIndex(x => x.id === editingId);
    if (idx === -1) return;
    debts[idx] = { ...debts[idx], ...campos };
    save();
    renderAll();
    closeModal('addModal');
    document.getElementById('debtForm').reset();
    editingId = null;
    document.getElementById('addModalTitle').textContent    = 'Nova Dívida';
    document.getElementById('addModalBtnLabel').textContent = 'Salvar Dívida';
    showToast('Dívida atualizada! ✏️', '✏️');
  } else {
    // ── Modo criação ───────────────────────────────
    debts.push({ id: uid(), ...campos, criadoEm: new Date().toISOString() });
    save();
    renderAll();
    closeModal('addModal');
    document.getElementById('debtForm').reset();
    showToast('Dívida cadastrada com sucesso!');
  }
}

/**
 * Remove dívida por ID
 * @param {string} id
 */
function deleteDebt(id) {
  if (!confirm('Remover esta dívida?')) return;
  debts = debts.filter(d => d.id !== id);
  save();
  renderAll();
  showToast('Dívida removida.', '🗑️');
}

// ── DETALHES ──────────────────────────────────────

/** Instância global do Chart para destruir antes de recriar */
let debtChart = null;

/**
 * Calcula a evolução mês a mês do saldo devedor.
 * Retorna array de { mes, saldo, jurosAcum, amortzAcum }
 * @param {object} d - dívida
 * @returns {Array}
 */
function calcularEvolucao(d) {
  const modalidade = d.modalidade || 'rotativo';
  const parcela    = d.parcela || 0;
  const n          = d.totalParcelas || (d.vencimento
    ? Math.max(1, Math.ceil((new Date(d.vencimento) - new Date()) / (30.44 * 86400000)) + 1)
    : 24);

  const pontos = [];

  // ── PARCELAMENTO CONTRATADO ───────────────────────
  // O banco já embutiu os juros nas parcelas na hora da contratação.
  // NÃO recalculamos juros — apenas mostramos o saldo caindo linearmente.
  if (modalidade === 'parcelado') {
    // Saldo começa no total restante a pagar (parcelas × n, descontando já pagas)
    const totalContratado = +(parcela * n).toFixed(2);
    const jaAmortizado    = +(parcela * (d.parcelasPagas || 0)).toFixed(2);
    let saldo = +(totalContratado - jaAmortizado).toFixed(2);
    const restantes = n - (d.parcelasPagas || 0);

    pontos.push({ mes: 0, saldo: saldo, amortzAcum: jaAmortizado });
    for (let m = 1; m <= restantes; m++) {
      saldo = Math.max(0, +(saldo - parcela).toFixed(2));
      pontos.push({ mes: m, saldo: saldo, amortzAcum: +(jaAmortizado + parcela * m).toFixed(2) });
      if (saldo === 0) break;
    }
    return pontos;
  }

  // ── DÍVIDA SIMPLES (sem juros) ────────────────────
  if (modalidade === 'simples') {
    let saldo    = d.valorTotal;
    const queda  = parcela > 0 ? parcela : (n > 0 ? d.valorTotal / n : d.valorTotal);
    pontos.push({ mes: 0, saldo: +saldo.toFixed(2), amortzAcum: 0 });
    for (let m = 1; m <= n; m++) {
      saldo = Math.max(0, +(saldo - queda).toFixed(2));
      pontos.push({ mes: m, saldo: saldo, amortzAcum: +(queda * m).toFixed(2) });
      if (saldo === 0) break;
    }
    return pontos;
  }

  // ── ROTATIVO (juros compostos mensais) ────────────
  const taxa     = (d.juros || 0) / 100;
  let saldo      = d.valorTotal;
  let jurosAcum  = 0;
  let amortzAcum = 0;

  pontos.push({ mes: 0, saldo: saldo, jurosAcum: 0, amortzAcum: 0 });

  for (let m = 1; m <= n; m++) {
    const jurosMes = +(saldo * taxa).toFixed(2);
    const amortiz  = parcela > 0 ? Math.max(0, parcela - jurosMes) : 0;

    jurosAcum  = +(jurosAcum + jurosMes).toFixed(2);
    amortzAcum = +(amortzAcum + amortiz).toFixed(2);
    saldo       = taxa > 0
      ? +(saldo * (1 + taxa) - parcela).toFixed(2)
      : +(saldo - (parcela > 0 ? parcela : saldo / n)).toFixed(2);

    if (saldo < 0) saldo = 0;
    pontos.push({ mes: m, saldo: saldo, jurosAcum: jurosAcum, amortzAcum: amortzAcum });
    if (saldo === 0) break;
  }
  return pontos;
}

/**
 * Gera labels de mês (Fev/25, Mar/25...)
 * @param {number} n - quantidade de meses
 * @returns {string[]}
 */
function gerarLabels(n) {
  const labels = [];
  const base   = new Date();
  for (let i = 0; i <= n; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
    labels.push(d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('. ', '/').replace('.',''));
  }
  return labels;
}

/**
 * Abre modal de detalhes completo com gráfico de evolução
 * @param {string} id
 */
function openDetail(id) {
  const d = debts.find(x => x.id === id);
  if (!d) return;

  const t         = TYPE_MAP[d.tipo] || { emoji: '🔖', color: '#686878' };
  const restantes = d.totalParcelas ? d.totalParcelas - d.parcelasPagas : null;
  const pct       = d.totalParcelas ? Math.round((d.parcelasPagas / d.totalParcelas) * 100) : null;

  // ── Cálculos financeiros ─────────────────────────
  const evolucao    = calcularEvolucao(d);
  const totalMeses  = evolucao.length - 1;
  const modalidade  = d.modalidade || 'rotativo';

  // Base de referência para calcular juros (usa valorOriginal se disponível)
  const baseRef = d.valorOriginal || d.valorTotal;

  // Juros reais dependem da modalidade:
  let totalJuros, totalContratado, totalFinal;

  if (modalidade === 'parcelado' && d.parcela && d.totalParcelas) {
    // Juros já embutidos: total_parcelas - base
    totalContratado = +(d.parcela * d.totalParcelas).toFixed(2);
    totalJuros      = +Math.max(0, totalContratado - baseRef).toFixed(2);
    // Total real = total das parcelas + encargos extras (IOF já é parte do contrato)
    totalFinal      = totalContratado;
  } else if (modalidade === 'rotativo') {
    // Juros acumulados simulados mês a mês
    totalJuros  = evolucao[totalMeses]?.jurosAcum || 0;
    totalFinal  = +(d.valorTotal + totalJuros).toFixed(2);
    totalContratado = totalFinal;
  } else {
    // Simples: sem juros
    totalJuros      = 0;
    totalFinal      = d.valorTotal;
    totalContratado = d.valorTotal;
  }

  const pctJuros = baseRef > 0 ? ((totalJuros / baseRef) * 100).toFixed(1) : 0;

  // Dívida crescendo? (rotativo onde parcela < juros mensais)
  const crescendo = modalidade === 'rotativo' && d.juros && d.parcela
    && d.parcela <= (d.juros / 100) * d.valorTotal;

  // ── Projeções em datas reais ──────────────────────
  function dataFutura(meses) {
    const dt = new Date();
    dt.setMonth(dt.getMonth() + meses);
    return dt.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  // Saldo em 3, 6 e 12 meses
  const saldo3m  = evolucao[Math.min(3,  totalMeses)]?.saldo ?? 0;
  const saldo6m  = evolucao[Math.min(6,  totalMeses)]?.saldo ?? 0;
  const saldo12m = evolucao[Math.min(12, totalMeses)]?.saldo ?? 0;

  // Data estimada de quitação
  const ultimoPonto    = evolucao[totalMeses];
  const dataQuitacao   = totalMeses > 0 ? dataFutura(totalMeses) : null;
  const saldoFinalEst  = ultimoPonto?.saldo ?? d.valorTotal;
  const jaPaga         = d.totalParcelas && d.parcelasPagas > 0;

  // Mês em que saldo cai pela metade
  const metade    = evolucao.find(p => p.saldo <= d.valorTotal / 2);
  const dataMeio  = metade ? dataFutura(metade.mes) : null;

  // ── Card de projeção amigável ─────────────────────
  let projecaoHTML = '';

  // ── Card de projeção para atraso ──────────────────
  if (d.atraso && d.atraso > 0) {
    const parcelaRestante = d.parcela ? (d.parcela - (d.parcialPago || 0)) : d.atraso;
    projecaoHTML = `
      <div class="proj-card proj-danger">
        <div class="proj-icon">🚨</div>
        <div class="proj-text">
          <strong>Tem um valor em aberto nessa dívida</strong>
          <p>Ainda faltam <strong>${fmt(d.atraso)}</strong> da parcela que entrou em atraso.
          ${d.parcialPago ? `Você já pagou ${fmt(d.parcialPago)} dela.` : ''}
          Quanto antes quitar esse valor, menos chance de crescer com multa e juros adicionais.</p>
          ${d.iof ? `<p style="margin-top:6px">Lembrando que já foram cobrados <strong>${fmt(d.iof)}</strong> de IOF nessa operação.</p>` : ''}
        </div>
      </div>`;
  } else if (crescendo) {
    projecaoHTML = `
      <div class="proj-card proj-danger">
        <div class="proj-icon">😰</div>
        <div class="proj-text">
          <strong>Atenção: sua dívida está crescendo!</strong>
          <p>O valor da sua parcela (${fmt(d.parcela)}) é menor do que os juros cobrados por mês.
          Isso significa que mesmo pagando, o saldo continua subindo.
          Tente renegociar ou aumentar o valor pago.</p>
          <p style="margin-top:6px">Em 12 meses, se nada mudar, você estará devendo <strong>${fmt(saldo12m)}</strong>.</p>
        </div>
      </div>`;
  } else if (saldoFinalEst <= 0 && dataQuitacao) {
    projecaoHTML = `
      <div class="proj-card proj-good">
        <div class="proj-icon">🎯</div>
        <div class="proj-text">
          <strong>Você está no caminho certo!</strong>
          <p>Se continuar pagando ${d.parcela ? fmt(d.parcela) + ' por mês' : 'normalmente'},
          essa dívida some em <strong>${dataQuitacao}</strong>. Boa disciplina! 💪</p>
          ${dataMeio && metade?.mes > 0 && metade.mes < totalMeses ? `<p style="margin-top:6px">A metade já fica para trás em <strong>${dataMeio}</strong>.</p>` : ''}
        </div>
      </div>`;
  } else if (d.parcela || d.totalParcelas) {
    const saldoRef = saldo12m > 0 ? saldo12m : saldo6m;
    const dataRef  = saldo12m > 0 ? dataFutura(12) : dataFutura(6);
    projecaoHTML = `
      <div class="proj-card proj-neutral">
        <div class="proj-icon">📅</div>
        <div class="proj-text">
          <strong>Como fica essa dívida no tempo</strong>
          <p>Se continuar pagando normalmente, em <strong>${dataRef}</strong> você ainda estará devendo
          aproximadamente <strong>${fmt(saldoRef)}</strong>.</p>
          ${dataMeio ? `<p style="margin-top:6px">A metade da dívida fica para trás em <strong>${dataMeio}</strong>.</p>` : ''}
        </div>
      </div>`;
  }

  // ── HTML do modal ────────────────────────────────
  document.getElementById('detailTitle').textContent = `${t.emoji} ${d.credor}`;
  document.getElementById('detailBody').innerHTML = `

    <!-- KPIs topo — variam por modalidade -->
    <div class="detail-kpis">

      ${modalidade === 'parcelado' ? `
        <!-- PARCELADO: valores reais contratados, sem simulação -->
        <div class="detail-kpi">
          <span class="detail-kpi-label">Valor financiado</span>
          <span class="detail-kpi-val">${fmt(d.valorTotal)}</span>
        </div>
        <div class="detail-kpi">
          <span class="detail-kpi-label">Parcela × ${d.totalParcelas || '?'}</span>
          <span class="detail-kpi-val amber">${fmt(d.parcela)} / mês</span>
        </div>
        ${totalJuros > 0 ? `
        <div class="detail-kpi">
          <span class="detail-kpi-label">📦 Juros já embutidos</span>
          <span class="detail-kpi-val" style="color:var(--red-dim)">${fmt(totalJuros)}</span>
        </div>` : ''}
        <div class="detail-kpi">
          <span class="detail-kpi-label">Total das parcelas</span>
          <span class="detail-kpi-val">${fmt(totalContratado)}</span>
        </div>
        ${d.iof ? `
        <div class="detail-kpi" style="border-color:rgba(245,166,35,0.3)">
          <span class="detail-kpi-label">IOF cobrado</span>
          <span class="detail-kpi-val amber">${fmt(d.iof)}</span>
        </div>` : ''}
        ${d.atraso ? `
        <div class="detail-kpi" style="border-color:rgba(232,53,74,0.4);background:rgba(232,53,74,0.07)">
          <span class="detail-kpi-label">⚠️ Em atraso</span>
          <span class="detail-kpi-val red">${fmt(d.atraso)}</span>
        </div>` : ''}
      ` : modalidade === 'rotativo' ? `
        <!-- ROTATIVO: saldo atual + simulação de juros futuros -->
        <div class="detail-kpi">
          <span class="detail-kpi-label">Saldo devedor</span>
          <span class="detail-kpi-val red">${fmt(d.valorTotal)}</span>
        </div>
        ${d.parcela ? `
        <div class="detail-kpi">
          <span class="detail-kpi-label">Você paga por mês</span>
          <span class="detail-kpi-val amber">${fmt(d.parcela)}</span>
        </div>` : ''}
        ${totalJuros > 0 ? `
        <div class="detail-kpi">
          <span class="detail-kpi-label">🔄 Juros estimados</span>
          <span class="detail-kpi-val" style="color:var(--red-dim)">${fmt(totalJuros)}</span>
        </div>
        <div class="detail-kpi">
          <span class="detail-kpi-label">Total estimado a pagar</span>
          <span class="detail-kpi-val">${fmt(totalFinal)}</span>
        </div>` : ''}
        ${d.atraso ? `
        <div class="detail-kpi" style="border-color:rgba(232,53,74,0.4);background:rgba(232,53,74,0.07)">
          <span class="detail-kpi-label">⚠️ Em atraso</span>
          <span class="detail-kpi-val red">${fmt(d.atraso)}</span>
        </div>` : ''}
      ` : `
        <!-- SIMPLES: sem juros -->
        <div class="detail-kpi">
          <span class="detail-kpi-label">Quanto você deve</span>
          <span class="detail-kpi-val red">${fmt(d.valorTotal)}</span>
        </div>
        ${d.parcela ? `
        <div class="detail-kpi">
          <span class="detail-kpi-label">Você paga por mês</span>
          <span class="detail-kpi-val amber">${fmt(d.parcela)}</span>
        </div>` : ''}
        ${d.atraso ? `
        <div class="detail-kpi" style="border-color:rgba(232,53,74,0.4);background:rgba(232,53,74,0.07)">
          <span class="detail-kpi-label">⚠️ Em atraso</span>
          <span class="detail-kpi-val red">${fmt(d.atraso)}</span>
        </div>` : ''}
      `}

    </div>

    <!-- Card de projeção amigável -->
    ${projecaoHTML}

    <!-- Barra de progresso -->
    ${pct !== null ? `
    <div class="detail-section">
      <div class="detail-section-title">Quanto já foi pago</div>
      <div class="progress-wrap" style="margin-top:0">
        <div class="progress-label">
          <span>${d.parcelasPagas} de ${d.totalParcelas} parcelas pagas</span>
          <span>${pct}% quitado</span>
        </div>
        <div class="progress-bar" style="height:8px">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="progress-sub">
          <span>Faltam ${restantes} parcela${restantes !== 1 ? 's' : ''}</span>
          ${dataMeio && metade?.mes > 1 ? `<span>Metade em ${dataMeio}</span>` : ''}
        </div>
      </div>
    </div>` : ''}

    <!-- Gráfico de evolução -->
    ${evolucao.length > 1 ? `
    <div class="detail-section">
      <div class="detail-section-title">Como o saldo muda ao longo do tempo</div>
      <p class="chart-desc">${
        modalidade === 'parcelado'
          ? 'O saldo cai de forma linear conforme você paga as parcelas fixas. Sem surpresas — o que foi contratado é o que aparece aqui.'
          : modalidade === 'rotativo'
          ? 'O saldo pode cair devagar ou até crescer dependendo da taxa. A linha tracejada mostra os juros acumulando ao longo do tempo.'
          : 'O saldo cai conforme os pagamentos, sem juros envolvidos.'
      }</p>
      <div class="chart-wrap">
        <canvas id="debtEvolutionChart"></canvas>
      </div>
      <div class="chart-legend">
        <span class="legend-dot" style="background:var(--red)"></span>&nbsp;Saldo a pagar
        ${modalidade === 'rotativo' && d.juros ? `&nbsp;&nbsp;<span class="legend-dot" style="background:rgba(232,53,74,0.4)"></span>&nbsp;Juros acumulados` : ''}
        ${d.parcela ? `&nbsp;&nbsp;<span class="legend-dot" style="background:rgba(39,196,122,0.6)"></span>&nbsp;Total amortizado` : ''}
      </div>
    </div>` : ''}

    <!-- Dados técnicos (dobráveis) -->
    <div class="detail-section">
      <div class="detail-section-title">Mais detalhes</div>
      <div class="detail-list">
        <div class="detail-row">
          <span class="detail-key">Tipo de dívida</span>
          <span class="detail-val">${d.tipo}</span>
        </div>
        ${modalidade === 'parcelado' && d.parcela && d.totalParcelas ? `
        <div class="detail-row">
          <span class="detail-key">Total contratado (${d.totalParcelas}x ${fmt(d.parcela)})</span>
          <span class="detail-val">${fmt(totalContratado)}</span>
        </div>
        ${totalJuros > 0 ? `
        <div class="detail-row">
          <span class="detail-key">📦 Juros embutidos</span>
          <span class="detail-val" style="color:var(--red-dim)">${fmt(totalJuros)} <span style="color:var(--text-muted);font-size:11px">(${d.totalParcelas}x${fmt(d.parcela)} − ${fmt(baseRef)} = ${fmt(totalJuros)})</span></span>
        </div>` : ''}
        ${d.iof ? `
        <div class="detail-row">
          <span class="detail-key">IOF cobrado</span>
          <span class="detail-val amber">${fmt(d.iof)}</span>
        </div>` : ''}
        ` : ''}
        ${modalidade === 'rotativo' && d.juros ? `
        <div class="detail-row">
          <span class="detail-key">Juros cobrados (rotativo)</span>
          <span class="detail-val">${d.juros}% ao mês <span style="color:var(--text-muted);font-size:12px">(≈ ${((Math.pow(1 + d.juros/100, 12) - 1) * 100).toFixed(1)}% ao ano)</span></span>
        </div>
        <div class="detail-row">
          <span class="detail-key">Juros estimados até quitar</span>
          <span class="detail-val" style="color:var(--red)">${fmt(totalJuros)} <span style="color:var(--text-muted);font-size:12px">(+${pctJuros}% do saldo atual)</span></span>
        </div>` : ''}
        <div class="detail-row">
          <span class="detail-key">Data de vencimento</span>
          <span class="detail-val">${fmtDate(d.vencimento)} ${statusBadge(d.vencimento, d.atraso)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-key">Cadastrado em</span>
          <span class="detail-val">${new Date(d.criadoEm).toLocaleDateString('pt-BR')}</span>
        </div>
        ${d.valorOriginal ? `
        <div class="detail-row">
          <span class="detail-key">Valor original (antes da renegociação)</span>
          <span class="detail-val">${fmt(d.valorOriginal)}</span>
        </div>` : ''}
        ${d.iof ? `
        <div class="detail-row">
          <span class="detail-key">IOF / Encargos cobrados</span>
          <span class="detail-val" style="color:var(--amber)">${fmt(d.iof)}</span>
        </div>` : ''}
        ${d.atraso ? `
        <div class="detail-row">
          <span class="detail-key">Valor em atraso</span>
          <span class="detail-val" style="color:var(--red);font-weight:600">${fmt(d.atraso)}</span>
        </div>` : ''}
        ${d.parcialPago ? `
        <div class="detail-row">
          <span class="detail-key">Já pago na parcela atual</span>
          <span class="detail-val" style="color:var(--green)">${fmt(d.parcialPago)}</span>
        </div>` : ''}
      </div>
      ${d.obs ? `<div class="detail-obs">"${d.obs}"</div>` : ''}
    </div>

    <!-- Ações -->
    <div style="display:flex;gap:10px;margin-top:8px">
      <button class="btn btn-ghost" style="justify-content:center" onclick="closeModal('detailModal')">Fechar</button>
      <button class="btn btn-accent" style="flex:1;justify-content:center" onclick="openEditModal('${d.id}')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Editar
      </button>
      <button class="btn btn-primary" style="justify-content:center;background:var(--red-dim)" onclick="deleteDebt('${d.id}');closeModal('detailModal')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        Remover
      </button>
    </div>
  `;

  openModal('detailModal');

  // ── Renderiza gráfico após DOM estar pronto ──────
  if ((d.juros || d.parcela || d.totalParcelas) && evolucao.length > 1) {
    if (debtChart) { debtChart.destroy(); debtChart = null; }

    const labels  = gerarLabels(evolucao.length - 1);
    const saldos  = evolucao.map(p => p.saldo);
    const jurosAc = evolucao.map(p => p.jurosAcum);
    const pagoAc  = evolucao.map(p => p.amortzAcum);

    // Marca o ponto atual (parcelas pagas)
    const pontoAtual = Math.min(d.parcelasPagas, evolucao.length - 1);

    const ctx = document.getElementById('debtEvolutionChart');
    if (!ctx) return;

    debtChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Saldo Devedor',
            data: saldos,
            borderColor: '#e8354a',
            backgroundColor: 'rgba(232,53,74,0.08)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointRadius: saldos.map((_, i) => i === pontoAtual ? 7 : 0),
            pointBackgroundColor: saldos.map((_, i) => i === pontoAtual ? '#fff' : 'transparent'),
            pointBorderColor: saldos.map((_, i) => i === pontoAtual ? '#e8354a' : 'transparent'),
            pointBorderWidth: 2,
          },
          ...(d.juros && modalidade === 'rotativo' ? [{
            label: 'Juros Acumulados',
            data: jurosAc,
            borderColor: 'rgba(232,53,74,0.35)',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderDash: [5, 4],
            fill: false,
            tension: 0.35,
            pointRadius: 0,
          }] : []),
          ...(d.parcela ? [{
            label: 'Amortização Acumulada',
            data: pagoAc,
            borderColor: 'rgba(39,196,122,0.5)',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderDash: [3, 3],
            fill: false,
            tension: 0.35,
            pointRadius: 0,
          }] : []),
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e1e26',
            borderColor: '#2a2a35',
            borderWidth: 1,
            titleColor: '#9090a8',
            bodyColor: '#eaeaf0',
            titleFont: { family: 'DM Mono', size: 11 },
            bodyFont: { family: 'DM Sans', size: 13 },
            padding: 12,
            callbacks: {
              title: (items) => `Mês ${items[0].dataIndex} — ${items[0].label}`,
              label: (item) => ` ${item.dataset.label}: ${fmt(item.raw)}`,
            }
          },
          annotation: {},
        },
        scales: {
          x: {
            ticks: {
              color: '#686878',
              font: { family: 'DM Mono', size: 10 },
              maxTicksLimit: 8,
              maxRotation: 0,
            },
            grid: { color: 'rgba(42,42,53,0.6)' },
          },
          y: {
            ticks: {
              color: '#686878',
              font: { family: 'DM Mono', size: 10 },
              callback: (v) => 'R$ ' + Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(v),
            },
            grid: { color: 'rgba(42,42,53,0.6)' },
          }
        }
      }
    });
  }
}

// ── LISTA RESUMIDA ────────────────────────────────

function openListModal() {
  if (debts.length === 0) {
    showToast('Nenhuma dívida cadastrada.', '📭');
    return;
  }

  document.getElementById('listBody').innerHTML = debts.map(d => {
    const t = TYPE_MAP[d.tipo] || { emoji: '🔖' };
    return `
      <div class="list-modal-item">
        <div>
          <div style="font-weight:600;margin-bottom:2px">${t.emoji} ${d.credor}</div>
          <div style="font-size:12px;color:var(--text-muted)">${d.tipo}</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:'Bebas Neue';font-size:18px;color:var(--red)">${fmt(d.valorTotal)}</div>
          ${statusBadge(d.vencimento, d.atraso)}
        </div>
      </div>`;
  }).join('');

  openModal('listModal');
}

// ── RENDER ────────────────────────────────────────

function renderAll() {
  renderStats();
  renderList();
}

function renderStats() {
  const total = debts.reduce((s, d) => s + (d.valorTotal || 0), 0);
  const mensal = debts.reduce((s, d) => s + (d.parcela   || 0), 0);
  const maior  = debts.length
    ? debts.reduce((a, b) => a.valorTotal > b.valorTotal ? a : b)
    : null;

  document.getElementById('heroTotal').textContent = fmt(total);
  document.getElementById('heroSub').textContent   = total === 0
    ? 'Nenhuma dívida cadastrada'
    : `Distribuído em ${debts.length} dívida${debts.length !== 1 ? 's' : ''}`;

  document.getElementById('statAtivas').textContent = debts.length;
  document.getElementById('statMensal').textContent = fmt(mensal);
  document.getElementById('statMaior').textContent  = maior ? maior.credor : '—';
}

function renderList() {
  const container = document.getElementById('debtList');

  if (debts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💳</div>
        <h3>Nenhuma dívida cadastrada</h3>
        <p>Clique em "Nova Dívida" para começar a controlar suas finanças.</p>
      </div>`;
    return;
  }

  container.innerHTML = debts.map((d, i) => {
    const t   = TYPE_MAP[d.tipo] || { emoji: '🔖', color: '#686878' };
    const pct = d.totalParcelas
      ? Math.round((d.parcelasPagas / d.totalParcelas) * 100)
      : null;

    return `
      <div class="debt-card" style="animation-delay:${i * 40}ms">

        <div class="debt-type-badge" style="background:${t.color}22">${t.emoji}</div>

        <div class="debt-info">
          <div class="debt-creditor">${d.credor}</div>
          <div class="debt-meta">
            <span>📋 ${d.tipo}</span>
            ${d.vencimento    ? `<span>📅 ${fmtDate(d.vencimento)}</span>` : ''}
            ${d.juros         ? `<span>📈 ${d.juros}% a.m.</span>`         : ''}
            ${d.totalParcelas ? `<span>🔢 ${d.parcelasPagas}/${d.totalParcelas} parcelas</span>` : ''}
            ${d.atraso ? `<span style="color:var(--red);font-weight:600">⚠️ Atraso: ${fmt(d.atraso)}</span>` : ''}
          </div>
          ${pct !== null ? `
          <div class="progress-wrap" style="margin-top:8px">
            <div class="progress-label"><span>Pago</span><span>${pct}%</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          </div>` : ''}
        </div>

        <!-- Desktop: coluna direita (valor + ações) -->
        <div class="debt-numbers" style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
          <div>
            <div class="debt-total" style="text-align:right">${fmt(d.valorTotal)}</div>
            ${d.parcela ? `<div class="debt-installment" style="text-align:right">${fmt(d.parcela)}/mês</div>` : ''}
          </div>
          <div class="debt-actions">
            ${statusBadge(d.vencimento, d.atraso)}
            <button class="icon-btn" title="Ver detalhes" onclick="openDetail('${d.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </button>
            <button class="icon-btn edit" title="Editar" onclick="openEditModal('${d.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="icon-btn pay" title="Registrar pagamento" onclick="openPayModal('${d.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </button>
            <button class="icon-btn danger" title="Remover" onclick="deleteDebt('${d.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile: rodapé da linha inferior -->
        <div class="debt-footer-mobile">
          <div class="debt-numbers">
            <div class="debt-total">${fmt(d.valorTotal)}</div>
            ${d.parcela ? `<div class="debt-installment">${fmt(d.parcela)}/mês</div>` : ''}
          </div>
          <div class="debt-actions">
            ${statusBadge(d.vencimento, d.atraso)}
            <button class="icon-btn" title="Ver detalhes" onclick="openDetail('${d.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </button>
            <button class="icon-btn edit" title="Editar" onclick="openEditModal('${d.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="icon-btn pay" title="Registrar pagamento" onclick="openPayModal('${d.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </button>
            <button class="icon-btn danger" title="Remover" onclick="deleteDebt('${d.id}')">
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

// ── INICIALIZAÇÃO ─────────────────────────────────
renderAll();
// ── PAGAMENTOS ─────────────────────────────────────

/** ID da dívida em processo de pagamento */
let payingId = null;
/** Valor pago pendente de confirmação (para fluxo de quitação) */
let pendingPayValue = 0;
let pendingPayObs = '';

/**
 * Abre modal de pagamento para a dívida indicada
 * @param {string} id
 */
function openPayModal(id) {
  const d = debts.find(x => x.id === id);
  if (!d) return;
  payingId = id;

  const t = TYPE_MAP[d.tipo] || { emoji: '🔖', color: '#686878' };

  // Info da dívida
  document.getElementById('payDebtInfo').innerHTML = `
    <div class="pdi-emoji">${t.emoji}</div>
    <div>
      <div class="pdi-name">${d.credor}</div>
      <div class="pdi-bal">Saldo devedor: <strong>${fmt(d.valorTotal)}</strong></div>
      ${d.parcela ? `<div class="pdi-bal">Parcela mensal: <strong style="color:var(--amber)">${fmt(d.parcela)}</strong></div>` : ''}
    </div>`;

  // Sugestões rápidas
  const sugestoes = [];
  if (d.parcela && d.parcela < d.valorTotal) sugestoes.push({ label: `Parcela (${fmt(d.parcela)})`, val: d.parcela });
  if (d.atraso && d.atraso > 0) sugestoes.push({ label: `Atraso (${fmt(d.atraso)})`, val: d.atraso });
  sugestoes.push({ label: `Total (${fmt(d.valorTotal)})`, val: d.valorTotal });

  document.getElementById('payQuickBtns').innerHTML = sugestoes.map(s =>
    `<button class="pay-quick-btn" onclick="setPayValue(${s.val})">${s.label}</button>`
  ).join('');

  // Reset campos
  document.getElementById('payValue').value = '';
  document.getElementById('payObs').value = '';
  document.getElementById('payHint').textContent = '';
  document.getElementById('payModalTitle').textContent = `💸 Pagar — ${d.credor}`;

  openModal('payModal');
  setTimeout(() => document.getElementById('payValue').focus(), 100);
}

/**
 * Preenche valor no campo de pagamento (botões rápidos)
 * @param {number} val
 */
function setPayValue(val) {
  document.getElementById('payValue').value = val.toFixed(2);
  onPayValueChange();
}

/**
 * Atualiza hint ao digitar valor
 */
function onPayValueChange() {
  const d = payingId ? debts.find(x => x.id === payingId) : null;
  if (!d) return;
  const val = parseFloat(document.getElementById('payValue').value) || 0;
  const hint = document.getElementById('payHint');

  if (val <= 0) {
    hint.textContent = '';
    return;
  }

  const restante = d.valorTotal - val;

  if (val >= d.valorTotal) {
    hint.textContent = `✅ Pagamento integral — vai quitar a dívida!`;
    hint.style.color = 'var(--green)';
  } else {
    hint.textContent = `Saldo restante após pagamento: ${fmt(Math.max(0, restante))}`;
    hint.style.color = 'var(--text-muted)';
  }
}

/**
 * Processa confirmação do pagamento
 */
function confirmarPagamento() {
  const d = payingId ? debts.find(x => x.id === payingId) : null;
  if (!d) return;

  const val = parseFloat(document.getElementById('payValue').value) || 0;
  if (val <= 0) {
    showToast('Informe um valor válido.', '⚠️');
    return;
  }

  pendingPayValue = val;
  pendingPayObs = document.getElementById('payObs').value.trim();

  if (val >= d.valorTotal) {
    // Pagamento total → perguntar se quer quitar
    document.getElementById('closingDebtMsg').textContent =
      `Você pagou ${fmt(val)} — o valor total desta dívida com ${d.credor}!`;
    closeModal('payModal');
    openModal('closeDebtModal');
  } else {
    // Pagamento parcial → dar baixa e continuar
    aplicarPagamento(false);
  }
}

/**
 * Aplica o pagamento parcial ou total sem quitar a dívida
 * @param {boolean} fecharModal - se deve fechar closeDebtModal
 */
function aplicarPagamento(fecharModal) {
  const idx = debts.findIndex(x => x.id === payingId);
  if (idx === -1) return;

  const d = debts[idx];
  const val = pendingPayValue;
  const novoSaldo = Math.max(0, d.valorTotal - val);

  // Registrar no histórico de pagamentos da dívida
  const historico = d.historicoPagamentos || [];
  historico.push({
    data: new Date().toISOString(),
    valor: val,
    obs: pendingPayObs,
    saldoAnterior: d.valorTotal,
    saldoApos: novoSaldo,
  });

  // Atualizar parcelas pagas se aplicável
  let novasParcelasPagas = d.parcelasPagas || 0;
  if (d.parcela && val >= d.parcela) {
    novasParcelasPagas = Math.min(d.totalParcelas || 9999, novasParcelasPagas + Math.floor(val / d.parcela));
  }

  // Atualizar atraso
  let novoAtraso = d.atraso || 0;
  if (novoAtraso > 0) {
    novoAtraso = Math.max(0, novoAtraso - val);
  }

  debts[idx] = {
    ...d,
    valorTotal: novoSaldo,
    parcelasPagas: novasParcelasPagas,
    atraso: novoAtraso > 0 ? novoAtraso : null,
    historicoPagamentos: historico,
  };

  save();
  renderAll();
  if (fecharModal) closeModal('closeDebtModal');
  closeModal('payModal');
  showToast(`Pagamento de ${fmt(val)} registrado!`, '💸');

  payingId = null;
  pendingPayValue = 0;
}

/**
 * Usuário optou por quitar a dívida (mover para histórico)
 */
function quitarDivida() {
  const idx = debts.findIndex(x => x.id === payingId);
  if (idx === -1) return;

  const d = debts[idx];
  const val = pendingPayValue;

  // Registrar pagamento final
  const historico = d.historicoPagamentos || [];
  historico.push({
    data: new Date().toISOString(),
    valor: val,
    obs: pendingPayObs || 'Pagamento final — dívida quitada',
    saldoAnterior: d.valorTotal,
    saldoApos: 0,
  });

  // Mover para histórico de dívidas pagas
  const pagas = JSON.parse(localStorage.getItem('debtview_pagas') || '[]');
  pagas.push({
    ...d,
    valorTotal: 0,
    valorPago: (d.valorOriginal || d.valorTotal) + val,
    quitadoEm: new Date().toISOString(),
    historicoPagamentos: historico,
  });
  localStorage.setItem('debtview_pagas', JSON.stringify(pagas));

  // Remover da lista ativa
  debts.splice(idx, 1);
  save();
  renderAll();
  closeModal('closeDebtModal');
  showToast(`🎊 ${d.credor} quitada com sucesso!`, '🎉');

  payingId = null;
  pendingPayValue = 0;
}

/**
 * Usuário optou por apenas dar baixa sem quitar
 */
function naoQuitarDivida() {
  aplicarPagamento(true);
}