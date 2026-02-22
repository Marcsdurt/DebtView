/* ═══════════════════════════════════════════════════
   DebtView — plano.js
   Simulador de saída das dívidas — linguagem humana
   ═══════════════════════════════════════════════════ */

// ── ESTADO ────────────────────────────────────────
let rendas     = JSON.parse(localStorage.getItem('debtview_rendas') || '[]');
let debts      = JSON.parse(localStorage.getItem('debtview_debts')  || '[]');

const fmt = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2);

function toast(msg, icon='✅') {
  const el = document.getElementById('toast');
  document.getElementById('toastMsg').textContent  = msg;
  document.getElementById('toastIcon').textContent = icon;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

// ── NAVEGAÇÃO ENTRE STEPS ─────────────────────────
function goStep(id) {
  document.querySelectorAll('.pstep').forEach(el => el.style.display = 'none');
  const el = document.getElementById(id);
  el.style.display = '';
  // Re-triggera animação
  el.classList.remove('pstep');
  void el.offsetWidth;
  el.classList.add('pstep');
  window.scrollTo({top: 0, behavior: 'smooth'});

  if (id === 's3') renderStep3();
  if (id === 's4') calcularPlano();
}

// ── STEP 2 — RENDA ────────────────────────────────
function onRendaChange() {
  const freq  = document.querySelector('input[name="freq"]:checked')?.value;
  const valor = parseFloat(document.getElementById('rValor').value) || 0;
  const dias  = [...document.querySelectorAll('#diasWrap input:checked')].map(c => parseInt(c.value));

  // Mostrar/esconder dias da semana
  document.getElementById('diasWrap').style.display = freq === 'dia' ? '' : 'none';

  // Calcular mensal
  const mensal = calcMensal(valor, freq, dias);

  // Preview
  const previewEl = document.getElementById('rendaPreview');
  if (mensal > 0) {
    document.getElementById('rendaPreviewVal').textContent = fmt(mensal);
    previewEl.style.display = '';

    // Texto explicativo
    let sub = 'por mês';
    if (freq === 'semana') sub = `(${fmt(valor)}/semana × 4,3 semanas)`;
    if (freq === 'dia' && dias.length > 0) sub = `(${fmt(valor)}/dia × ${dias.length} dias × 4,3 semanas)`;
    document.querySelector('.rp-bot').textContent = sub;
  } else {
    previewEl.style.display = 'none';
  }

  // Habilitar botão continuar se tem pelo menos uma renda salva OU tem valor preenchido
  const temValor = mensal > 0 && document.getElementById('rNome').value.trim();
  const temSalvas = rendas.length > 0;
  document.getElementById('btnNext2').disabled = !temValor && !temSalvas;
}

function calcMensal(valor, freq, dias = []) {
  if (!valor || !freq) return 0;
  switch (freq) {
    case 'mes':    return valor;
    case 'semana': return valor * 4.33;
    case 'dia':    return valor * (dias.length * 4.33);
    default: return 0;
  }
}

function adicionarRenda() {
  const nome  = document.getElementById('rNome').value.trim();
  const valor = parseFloat(document.getElementById('rValor').value) || 0;
  const freq  = document.querySelector('input[name="freq"]:checked')?.value;
  const dias  = [...document.querySelectorAll('#diasWrap input:checked')].map(c => parseInt(c.value));

  if (!nome)  return toast('Dê um nome pra essa renda.', '⚠️');
  if (!valor) return toast('Informe o valor.', '⚠️');
  if (freq === 'dia' && dias.length === 0) return toast('Selecione ao menos um dia.', '⚠️');

  const mensal = calcMensal(valor, freq, dias);

  rendas.push({ id: uid(), nome, valor, freq, dias, mensal });
  localStorage.setItem('debtview_rendas', JSON.stringify(rendas));

  // Limpar form
  document.getElementById('rNome').value  = '';
  document.getElementById('rValor').value = '';
  document.querySelector('input[name="freq"][value="mes"]').checked = true;
  document.querySelectorAll('#diasWrap input').forEach(c => c.checked = false);
  document.getElementById('diasWrap').style.display = 'none';
  document.getElementById('rendaPreview').style.display = 'none';

  renderRendasSalvas();
  toast(`${nome} adicionada!`, '💰');
  document.getElementById('btnNext2').disabled = false;
}

function renderRendasSalvas() {
  const wrap = document.getElementById('rendasSalvas');
  const list = document.getElementById('rendasSalvasList');

  if (rendas.length === 0) { wrap.style.display = 'none'; return; }
  wrap.style.display = '';

  list.innerHTML = rendas.map(r => `
    <div class="renda-salva">
      <span class="rs-nome">${r.nome}</span>
      <span class="rs-val">${fmt(r.mensal)}/mês</span>
      <button class="rs-del" onclick="removerRenda('${r.id}')" title="Remover">×</button>
    </div>`).join('');
}

function removerRenda(id) {
  rendas = rendas.filter(r => r.id !== id);
  localStorage.setItem('debtview_rendas', JSON.stringify(rendas));
  renderRendasSalvas();
  if (rendas.length === 0) document.getElementById('btnNext2').disabled = true;
}

// Se o usuário clica em "Continuar" sem salvar, auto-salva o que está preenchido
document.getElementById('btnNext2')?.addEventListener('click', function(e) {
  const nome  = document.getElementById('rNome').value.trim();
  const valor = parseFloat(document.getElementById('rValor').value) || 0;
  const freq  = document.querySelector('input[name="freq"]:checked')?.value;
  const dias  = [...document.querySelectorAll('#diasWrap input:checked')].map(c => parseInt(c.value));
  const mensal = calcMensal(valor, freq, dias);

  if (mensal > 0 && nome && rendas.length === 0) {
    // Auto-salva antes de avançar
    rendas.push({ id: uid(), nome, valor, freq, dias, mensal });
    localStorage.setItem('debtview_rendas', JSON.stringify(rendas));
  }
}, true); // capture para rodar antes do goStep

// ── STEP 3 — SLIDER ──────────────────────────────
function rendaMensalTotal() {
  return rendas.reduce((s, r) => s + r.mensal, 0);
}

function renderStep3() {
  const total = rendaMensalTotal();
  const badge = document.getElementById('rendaBadge');
  badge.innerHTML = `
    <span class="rb-label">Sua renda mensal total</span>
    <span class="rb-val">${fmt(total)}</span>`;
  onSlider();
}

function onSlider() {
  const pct     = parseInt(document.getElementById('pctSlider').value);
  const total   = rendaMensalTotal();
  const destina = total * (pct / 100);
  const sobra   = total - destina;

  // Cor do % conforme zona
  const display = document.getElementById('sliderPct');
  display.textContent = pct + '%';
  if (pct <= 40) display.style.color = 'var(--green)';
  else if (pct <= 60) display.style.color = 'var(--amber)';
  else display.style.color = 'var(--red)';

  document.getElementById('sliderReais').textContent = fmt(destina) + '/mês para dívidas';
  document.getElementById('sliderSobra').textContent = `Sobram ${fmt(sobra)} para seus outros gastos`;

  // Alertas
  const alertEl = document.getElementById('sliderAlert');
  if (pct > 60 && pct <= 80) {
    alertEl.className = 'slider-alert sa-yellow';
    alertEl.innerHTML = '⚠️ Destinar mais de 60% da renda para dívidas é arriscado. Garanta que seus gastos essenciais estejam cobertos.';
    alertEl.style.display = 'flex';
  } else if (pct > 80) {
    // Bloqueia — força de volta para 80
    document.getElementById('pctSlider').value = 80;
    alertEl.className = 'slider-alert sa-red';
    alertEl.innerHTML = '🚫 Acima de 80% não é sustentável. O plano foi limitado a 80% para proteger você.';
    alertEl.style.display = 'flex';
    onSlider(); return;
  } else {
    alertEl.style.display = 'none';
  }
}

// ── STEP 4 — CÁLCULO E RESULTADO ─────────────────
function calcularPlano() {
  const pct           = parseInt(document.getElementById('pctSlider').value);
  const rendaTotal    = rendaMensalTotal();
  const disponivelMes = rendaTotal * (pct / 100);

  if (debts.length === 0) {
    renderSemDividas(rendaTotal);
    return;
  }

  // Simulação mês a mês — estratégia avalanche (maior juros primeiro)
  let saldos = debts.map(d => ({
    id:        d.id,
    credor:    d.credor,
    tipo:      d.tipo,
    saldo:     d.valorTotal,
    original:  d.valorTotal,
    parcela:   d.parcela || 0,
    juros:     (d.juros || 0) / 100,
    quitadoMes: null,
    jurosAcum:  0,
  }));

  const MAX = 360;
  let mes = 0;
  let totalJuros = 0;
  const historico = [{ mes: 0, totalSaldo: saldos.reduce((s,d) => s+d.saldo, 0) }];

  while (saldos.some(s => s.saldo > 0.01) && mes < MAX) {
    mes++;
    let restante = disponivelMes;

    // Ordena por maior juros (avalanche)
    const ordem = [...saldos].filter(s => s.saldo > 0.01).sort((a, b) => b.juros - a.juros);

    // Pagar mínimo de todas
    for (const s of saldos) {
      if (s.saldo < 0.01) continue;
      // Acumula juros
      if (s.juros > 0) {
        const j = +(s.saldo * s.juros).toFixed(2);
        s.jurosAcum += j; totalJuros += j; s.saldo += j;
      }
      const min = Math.min(s.parcela || s.saldo, s.saldo, restante);
      s.saldo   = Math.max(0, +(s.saldo - min).toFixed(2));
      restante  = Math.max(0, restante - min);
      if (s.saldo < 0.01 && s.quitadoMes === null) s.quitadoMes = mes;
    }

    // Excedente vai para a prioritária
    for (const s of ordem) {
      if (s.saldo < 0.01 || restante < 0.01) continue;
      const extra = Math.min(restante, s.saldo);
      s.saldo   = Math.max(0, +(s.saldo - extra).toFixed(2));
      restante  = Math.max(0, restante - extra);
      if (s.saldo < 0.01 && s.quitadoMes === null) s.quitadoMes = mes;
    }

    if (mes % 2 === 0 || mes <= 6) {
      historico.push({ mes, totalSaldo: Math.max(0, saldos.reduce((s,d) => s+d.saldo, 0)) });
    }
  }

  // Adicionar ponto final
  historico.push({ mes, totalSaldo: 0 });

  const mesesReal  = Math.ceil(mes * 1.15); // margem 15%
  const impossivel = mes >= MAX;

  renderResultado({ saldos, disponivelMes, rendaTotal, totalJuros, mesesReal, impossivel, historico, pct });
}

function mesToDate(meses) {
  const d = new Date();
  d.setMonth(d.getMonth() + meses);
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function mesToDateShort(meses) {
  const d = new Date();
  d.setMonth(d.getMonth() + meses);
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.','');
}

// ── RENDER RESULTADO ──────────────────────────────
function renderResultado({ saldos, disponivelMes, rendaTotal, totalJuros, mesesReal, impossivel, historico, pct }) {

  // ── CARD LIBERTAÇÃO ──
  const totalDividas = saldos.reduce((s,d) => s + d.original, 0);
  const libCard = document.getElementById('libCard');

  if (impossivel) {
    libCard.innerHTML = `
      <span class="lib-emoji">😟</span>
      <div class="lib-h1">Sua renda atual não consegue quitar tudo</div>
      <div class="lib-data" style="color:var(--red)">Em 30 anos ainda restariam dívidas</div>
      <div class="lib-chips" style="margin-top:16px">
        <div class="lib-chip lc-a">⚠️ Tente aumentar a % destinada</div>
        <div class="lib-chip lc-a">💬 Ou renegocie suas dívidas</div>
      </div>`;
  } else {
    libCard.innerHTML = `
      <span class="lib-emoji">🔓</span>
      <div class="lib-h1">Em ${mesesReal} ${mesesReal===1?'mês':'meses'} você estará livre</div>
      <div class="lib-data">${mesToDate(mesesReal)}</div>
      <div class="lib-chips">
        <div class="lib-chip lc-g">✅ ${mesesReal} meses para quitar tudo</div>
        ${totalJuros > 0 ? `<div class="lib-chip lc-a">💸 ${fmt(totalJuros)} em juros</div>` : ''}
        <div class="lib-chip lc-p">📊 ${pct}% da renda destinados</div>
      </div>`;
  }

  // ── ANÁLISE ──
  const analise = document.getElementById('analiseBloco');
  const sobraLivre = rendaTotal - disponivelMes;
  const pctDivida  = Math.round((saldos.reduce((s,d)=>s+d.parcela,0) / rendaTotal) * 100);

  let saude, saudeIcon;
  if (pctDivida <= 20) { saude = 'boa'; saudeIcon = '💚'; }
  else if (pctDivida <= 35) { saude = 'aceitável'; saudeIcon = '🟡'; }
  else { saude = 'pressionada'; saudeIcon = '🔴'; }

  analise.innerHTML = `
    <div class="bloco-titulo">📊 Análise inteligente</div>
    <div class="analise-item">
      <span class="ai-icon">💰</span>
      <span class="ai-txt">Com sua renda de <strong>${fmt(rendaTotal)}/mês</strong>, você separa <strong>${fmt(disponivelMes)}</strong> para as dívidas e fica com <strong>${fmt(sobraLivre)}</strong> para seus outros gastos.</span>
    </div>
    ${!impossivel ? `
    <div class="analise-item">
      <span class="ai-icon">✅</span>
      <span class="ai-txt">Você quita tudo em <strong>${mesesReal} ${mesesReal===1?'mês':'meses'}</strong> — em <strong>${mesToDate(mesesReal)}</strong> você estará completamente livre.</span>
    </div>` : ''}
    ${totalJuros > 500 ? `
    <div class="analise-item">
      <span class="ai-icon">⚠️</span>
      <span class="ai-txt warn">No total você vai pagar <strong style="color:var(--amber)">${fmt(totalJuros)}</strong> em juros ao longo do plano. Quitar mais rápido economiza esse dinheiro.</span>
    </div>` : totalJuros > 0 ? `
    <div class="analise-item">
      <span class="ai-icon">💡</span>
      <span class="ai-txt">Seus juros ao longo do plano são <strong>${fmt(totalJuros)}</strong> — valor pequeno, você está em boa situação.</span>
    </div>` : ''}
    <div class="analise-item">
      <span class="ai-icon">${saudeIcon}</span>
      <span class="ai-txt">Sua saúde financeira está <strong>${saude}</strong> — ${pctDivida}% da sua renda está comprometida com parcelas de dívidas.</span>
    </div>`;

  // ── LINHA DO TEMPO ──
  const timeline = document.getElementById('timelineBloco');
  const sorted   = [...saldos].filter(s => s.quitadoMes).sort((a, b) => a.quitadoMes - b.quitadoMes);

  let tlHtml = `<div class="bloco-titulo">📅 Linha do tempo</div><div>`;

  // Hoje
  tlHtml += `
    <div class="tl-item">
      <div class="tl-left"><div class="tl-dot green"></div><div class="tl-line"></div></div>
      <div>
        <div class="tl-data">Hoje</div>
        <div class="tl-txt">Você começa separando <strong>${fmt(disponivelMes)}/mês</strong> para as dívidas.</div>
      </div>
    </div>`;

  // Cada dívida quitada
  sorted.forEach((s, i) => {
    const m = Math.ceil(s.quitadoMes * 1.15);
    const isLast = i === sorted.length - 1;
    tlHtml += `
      <div class="tl-item">
        <div class="tl-left"><div class="tl-dot ${isLast ? 'big' : 'amber'}"></div>${!isLast ? '<div class="tl-line"></div>' : ''}</div>
        <div>
          <div class="tl-data">${mesToDate(m)}</div>
          <div class="tl-txt ${isLast ? 'big' : 'amber'}">
            ${isLast
              ? `🎉 <strong>Você quita "${s.credor}" — LIVRE DE DÍVIDAS!</strong>`
              : `🔓 Você quita <strong>"${s.credor}"</strong> — libera ${fmt(s.parcela || 0)}/mês`}
          </div>
        </div>
      </div>`;
  });

  if (impossivel) {
    tlHtml += `<div class="tl-item"><div class="tl-left"><div class="tl-dot" style="background:var(--red)"></div></div><div><div class="tl-data">Indefinido</div><div class="tl-txt danger">Renda insuficiente para quitar tudo no plano atual.</div></div></div>`;
  }

  tlHtml += '</div>';
  timeline.innerHTML = tlHtml;

  // ── GRÁFICO DE QUEDA ──
  const grafico = document.getElementById('graficoBloco');
  const maxSaldo = historico[0]?.totalSaldo || 1;

  // Pegar pontos espaçados — máx 8 pontos
  const step   = Math.ceil(historico.length / 8);
  const pontos = historico.filter((_, i) => i % step === 0 || i === historico.length - 1);

  grafico.innerHTML = `
    <div class="bloco-titulo">📈 Queda da sua dívida</div>
    <div class="grafico-wrap">
      ${pontos.map(p => {
        const pct = Math.max(0, Math.min(100, (p.totalSaldo / maxSaldo) * 100));
        const cor = pct > 60 ? 'var(--red)' : pct > 30 ? 'var(--amber)' : 'var(--green)';
        return `
          <div class="grafico-row">
            <span class="grafico-label">${p.mes === 0 ? 'Hoje' : mesToDateShort(Math.ceil(p.mes*1.15))}</span>
            <div class="grafico-bar-wrap">
              <div class="grafico-bar" style="width:${pct}%;background:${cor}"></div>
            </div>
            <span class="grafico-val">${fmt(p.totalSaldo)}</span>
          </div>`;
      }).join('')}
    </div>`;

  // ── ORDEM DE PAGAMENTO ──
  const ordem = document.getElementById('ordemBloco');
  const sortedOrdem = [...saldos].sort((a, b) => {
    if (a.quitadoMes === null && b.quitadoMes === null) return 0;
    if (a.quitadoMes === null) return 1;
    if (b.quitadoMes === null) return -1;
    return a.quitadoMes - b.quitadoMes;
  });

  const medalhas = ['ouro', 'prata', 'bronze'];

  ordem.innerHTML = `
    <div class="bloco-titulo">🏆 Você paga nessa ordem</div>
    ${sortedOrdem.map((s, i) => {
      const m    = s.quitadoMes ? Math.ceil(s.quitadoMes * 1.15) : null;
      const cls  = medalhas[i] || '';
      return `
        <div class="ordem-item">
          <div class="ordem-num ${cls}">${i+1}</div>
          <div class="ordem-info">
            <div class="ordem-credor">${s.credor}</div>
            <div class="ordem-txt">
              ${m ? `Você paga essa primeiro → <strong>liberta em ${m} meses</strong>` : 'Não consegue quitar no plano atual'}
              ${s.jurosAcum > 0 ? ` · ${fmt(s.jurosAcum)} em juros` : ''}
            </div>
          </div>
          <div class="ordem-prazo">
            <div class="ordem-prazo-mes">${m ? m+' meses' : '—'}</div>
            <div class="ordem-prazo-data">${m ? mesToDate(m) : ''}</div>
          </div>
        </div>`;
    }).join('')}`;
}

function renderSemDividas(rendaTotal) {
  document.getElementById('libCard').innerHTML = `
    <span class="lib-emoji">🎉</span>
    <div class="lib-h1">Você não tem dívidas cadastradas!</div>
    <div class="lib-data" style="color:var(--green)">Você já está livre</div>
    <div class="lib-chips" style="margin-top:16px">
      <div class="lib-chip lc-g">✅ Nenhuma dívida ativa</div>
      <div class="lib-chip lc-p">💰 Renda de ${fmt(rendaTotal)}/mês disponível</div>
    </div>`;
  ['analiseBloco','timelineBloco','graficoBloco','ordemBloco'].forEach(id => {
    document.getElementById(id).innerHTML = '';
  });
}

// ── RESET ─────────────────────────────────────────
function resetForm() {
  rendas = [];
  localStorage.removeItem('debtview_rendas');
  document.getElementById('rNome').value  = '';
  document.getElementById('rValor').value = '';
  document.querySelector('input[name="freq"][value="mes"]').checked = true;
  document.querySelectorAll('#diasWrap input').forEach(c => c.checked = false);
  document.getElementById('diasWrap').style.display = 'none';
  document.getElementById('rendaPreview').style.display = 'none';
  document.getElementById('rendasSalvas').style.display = 'none';
  document.getElementById('btnNext2').disabled = true;
  document.getElementById('pctSlider').value = 20;
  localStorage.removeItem('debtview_plano_pct');
  const banner = document.getElementById('restoreBanner');
  if (banner) banner.remove();
}

// ── PERSISTÊNCIA DO SLIDER ────────────────────────
function savePct(pct) {
  localStorage.setItem('debtview_plano_pct', pct);
}

function loadPct() {
  return parseInt(localStorage.getItem('debtview_plano_pct') || '20');
}

// Salva % sempre que muda
const _origOnSlider = onSlider;
// patch onSlider to also persist
window.onSlider = function() {
  _origOnSlider();
  savePct(document.getElementById('pctSlider').value);
};

// ── INIT ──────────────────────────────────────────
(function init() {
  const pctSalvo = loadPct();
  document.getElementById('pctSlider').value = pctSalvo;

  if (rendas.length === 0) {
    // Nenhuma renda — mostra step 1 normalmente
    goStep('s1');
    return;
  }

  // Tem rendas salvas — restaura tudo
  renderRendasSalvas();
  document.getElementById('btnNext2').disabled = false;

  if (debts.length > 0) {
    // Tem renda + dívidas → vai direto ao resultado com banner "dados restaurados"
    goStep('s4');
    calcularPlano();
    showRestoreBanner();
  } else {
    // Tem renda mas sem dívidas → vai para o slider
    goStep('s3');
  }
})();

function showRestoreBanner() {
  // Banner discreto no topo do resultado
  const s4 = document.getElementById('s4');
  const existing = document.getElementById('restoreBanner');
  if (existing) return;

  const banner = document.createElement('div');
  banner.id = 'restoreBanner';
  banner.style.cssText = `
    background: rgba(124,92,252,.08);
    border: 1px solid rgba(124,92,252,.25);
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 13px;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 16px;
  `;
  banner.innerHTML = `
    <span>🔄 Seu plano foi restaurado automaticamente.</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:18px;line-height:1;padding:0">×</button>
  `;
  // Insere depois do back-btn
  const backBtn = s4.querySelector('.back-btn');
  backBtn.insertAdjacentElement('afterend', banner);
}

// ── SALVAR / CARREGAR PLANOS ──────────────────────

function salvarPlano() {
  const nome = document.getElementById('planoNome').value.trim()
    || `Plano de ${new Date().toLocaleDateString('pt-BR', {day:'2-digit',month:'short'})}`;

  const pct          = parseInt(document.getElementById('pctSlider').value);
  const rendaTotal   = rendaMensalTotal();
  const disponivelMes = rendaTotal * (pct / 100);

  // Calcula prazo para salvar no resumo
  let totalMeses = 0;
  if (debts.length > 0) {
    let saldos = debts.map(d => ({ saldo: d.valorTotal, parcela: d.parcela||0, juros:(d.juros||0)/100 }));
    let mes = 0;
    while (saldos.some(s=>s.saldo>0.01) && mes<360) {
      mes++;
      let rest = disponivelMes;
      saldos.sort((a,b) => b.juros - a.juros);
      for (const s of saldos) {
        if (s.saldo<0.01) continue;
        if (s.juros>0) { const j=+(s.saldo*s.juros).toFixed(2); s.saldo+=j; }
        const min=Math.min(s.parcela||s.saldo,s.saldo,rest);
        s.saldo=Math.max(0,+(s.saldo-min).toFixed(2)); rest=Math.max(0,rest-min);
      }
    }
    totalMeses = Math.ceil(mes * 1.15);
  }

  const totalDividas = debts.reduce((s,d)=>s+(d.valorTotal||0), 0);

  const plano = {
    id:          'plano_' + uid(),
    nome,
    savedAt:     new Date().toISOString(),
    pct,
    rendas:      JSON.parse(JSON.stringify(rendas)),
    rendaTotal,
    disponivelMes,
    totalDividas,
    totalMeses,
    impossivel:  totalMeses >= 360,
  };

  const planos = JSON.parse(localStorage.getItem('debtview_planos') || '[]');
  planos.unshift(plano); // mais recente primeiro
  // Máximo 10 planos salvos
  if (planos.length > 10) planos.pop();
  localStorage.setItem('debtview_planos', JSON.stringify(planos));

  document.getElementById('planoNome').value = '';
  toast(`"${nome}" salvo! 🎯`, '✅');
  renderPlanosSalvos();
}

function renderPlanosSalvos() {
  const planos = JSON.parse(localStorage.getItem('debtview_planos') || '[]');
  const wrap   = document.getElementById('planosSalvosWrap');
  const list   = document.getElementById('planosSalvosList');

  if (!wrap || !list) return;

  if (planos.length === 0) {
    wrap.style.display = 'none';
    return;
  }

  wrap.style.display = '';

  list.innerHTML = planos.map((p, i) => {
    const data    = new Date(p.savedAt).toLocaleDateString('pt-BR', {day:'2-digit', month:'short'});
    const cor     = p.impossivel ? '#e8354a' : p.totalMeses <= 12 ? '#27c47a' : p.totalMeses <= 24 ? '#f5a623' : '#7c5cfc';
    const prazo   = p.impossivel ? 'Não quitaria' : `${p.totalMeses} ${p.totalMeses===1?'mês':'meses'}`;
    const delay   = i * 60;

    return `
      <div class="plano-balao" style="animation-delay:${delay}ms" onclick="carregarPlano('${p.id}')">
        <button class="pb-del" onclick="event.stopPropagation(); deletarPlano('${p.id}')" title="Remover">×</button>
        <div class="pb-nome">${p.nome}</div>
        <div class="pb-prazo" style="color:${cor}">${prazo}</div>
        <div class="pb-meta">
          <span>${fmt(p.rendaTotal)}/mês</span>
          <span>·</span>
          <span>${p.pct}% destinado</span>
        </div>
        <div class="pb-data">${data}</div>
      </div>`;
  }).join('');
}

function carregarPlano(id) {
  const planos = JSON.parse(localStorage.getItem('debtview_planos') || '[]');
  const plano  = planos.find(p => p.id === id);
  if (!plano) return;

  // Restaura rendas do plano
  rendas = plano.rendas;
  localStorage.setItem('debtview_rendas', JSON.stringify(rendas));

  // Restaura %
  document.getElementById('pctSlider').value = plano.pct;
  savePct(plano.pct);

  // Vai direto ao resultado
  renderRendasSalvas();
  goStep('s4');
  toast(`"${plano.nome}" carregado!`, '📂');
}

function deletarPlano(id) {
  let planos = JSON.parse(localStorage.getItem('debtview_planos') || '[]');
  planos = planos.filter(p => p.id !== id);
  localStorage.setItem('debtview_planos', JSON.stringify(planos));
  renderPlanosSalvos();
  toast('Plano removido.', '🗑️');
}

// Renderiza balões na inicialização
renderPlanosSalvos();