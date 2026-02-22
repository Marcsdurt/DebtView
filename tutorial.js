/* ═══════════════════════════════════════════════════
   DebtView — tutorial.js
   Sistema de tour interativo com spotlight
   Inclua em qualquer página: <script src="tutorial.js"></script>
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── DETECTAR PÁGINA ATUAL ─────────────────────────
  const PAGE = (() => {
    const p = location.pathname.split('/').pop() || 'index.html';
    if (p.includes('historico')) return 'historico';
    if (p.includes('plano'))     return 'plano';
    if (p.includes('porquinho')) return 'porquinho';
    return 'index';
  })();

  // ── TOURS POR PÁGINA ──────────────────────────────
  const TOURS = {

    index: [
      {
        selector: '.hero-section',
        title: 'Visão Geral',
        emoji: '📊',
        body: 'Aqui fica o <strong>total de todas as suas dívidas somadas</strong>. Quanto menor esse número, mais perto você está da liberdade. Foque nele!',
        tip: 'O número muda automaticamente conforme você cadastra e paga.',
        arrow: 'bottom',
        position: 'below',
      },
      {
        selector: '.stats-row',
        title: 'Seus Números',
        emoji: '🔢',
        body: 'Três indicadores essenciais: <strong>quantas dívidas ativas</strong> você tem, sua <strong>parcela mensal total</strong> e o <strong>credor mais pesado</strong>.',
        tip: 'Clique em "Ver quais são" para ver a lista completa rapidinho.',
        arrow: 'bottom',
        position: 'below',
      },
      {
        selector: 'button[onclick="openModal_add()"], .btn-primary',
        title: 'Cadastrar Dívida',
        emoji: '➕',
        body: 'Clique aqui para <strong>adicionar uma nova dívida</strong>. Informe o credor, tipo, valor e parcela. O app calcula tudo automaticamente.',
        tip: 'Quanto mais detalhes você colocar, melhor será a análise do seu plano de saída.',
        arrow: 'bottom',
        position: 'below',
      },
      {
        selector: '.debt-list',
        title: 'Lista de Dívidas',
        emoji: '💳',
        body: 'Cada card mostra uma dívida. Você pode <em>pagar parcialmente</em>, <em>editar os dados</em> ou <em>marcar como quitada</em> usando os botões no canto direito.',
        tip: 'O ícone verde (💵) registra um pagamento. O lápis edita. A lixeira remove.',
        arrow: 'top',
        position: 'above',
      },
      {
        selector: 'a[href="historico.html"], a[href*="historico"]',
        title: 'Dívidas Pagas',
        emoji: '🎊',
        body: 'Quando você quitar uma dívida, ela vai automaticamente para o <strong>histórico de quitações</strong>. É sua linha do tempo de vitórias!',
        arrow: 'bottom',
        position: 'below',
      },
      {
        selector: 'a[href="plano.html"], a[href*="plano"]',
        title: 'Plano de Saída',
        emoji: '🗺️',
        body: 'O <strong>Plano de Saída</strong> calcula, com base na sua renda, em quanto tempo você consegue quitar tudo — e em qual ordem atacar as dívidas.',
        tip: 'Use as estratégias Avalanche (maiores juros primeiro) ou Bola de Neve (menores dívidas primeiro).',
        arrow: 'bottom',
        position: 'below',
      },
      {
        selector: 'a[href="porquinho.html"], a[href*="porquinho"]',
        title: 'O Porquinho 🐷',
        emoji: '🐷',
        body: 'Seu <strong>cofre pessoal</strong>. Registre todo dinheiro que você guardar e destine diretamente a uma dívida. Veja visualmente quanto % de cada dívida você já cobriu.',
        tip: 'O app avisa quando você tem dinheiro guardado sem destino!',
        arrow: 'bottom',
        position: 'below',
      },
      {
        selector: null,
        title: 'Você está pronto! 🚀',
        emoji: '🏆',
        body: 'Isso é tudo que você precisa saber pra começar. <strong>Cada dívida cadastrada é um passo</strong> em direção ao controle da sua vida financeira.\n\nVá em frente — você consegue!',
        arrow: 'none',
        position: 'center',
      },
    ],

    historico: [
      {
        selector: '.hero-section',
        title: 'Total Quitado',
        emoji: '🎊',
        body: 'Aqui aparece <strong>quanto você já pagou no total</strong> de todas as dívidas quitadas. Esse número só cresce — comemore cada avanço!',
        arrow: 'bottom',
        position: 'below',
      },
      {
        selector: '.stats-row',
        title: 'Suas Conquistas',
        emoji: '🏅',
        body: 'Veja <strong>quantas dívidas você já eliminou</strong>, qual foi a maior quitação e a mais recente. São provas concretas do seu progresso.',
        arrow: 'bottom',
        position: 'below',
      },
      {
        selector: '.search-input',
        title: 'Busca Rápida',
        emoji: '🔍',
        body: 'Procure por <strong>nome do credor ou tipo de dívida</strong>. Útil quando você tiver muitas quitações no histórico.',
        arrow: 'bottom',
        position: 'below',
      },
      {
        selector: '.debt-list, #historyList',
        title: 'Histórico de Quitações',
        emoji: '📋',
        body: 'Cada card mostra uma dívida quitada. Clique no <em>ícone de informações</em> (ⓘ) para ver o histórico completo de pagamentos e a linha do tempo.',
        tip: 'O botão de lixeira remove o registro do histórico sem afetar suas dívidas ativas.',
        arrow: 'top',
        position: 'above',
      },
      {
        selector: null,
        title: 'Guarde suas vitórias!',
        emoji: '🌟',
        body: 'Esse histórico é a prova do seu esforço. <strong>Nunca apague</strong> — nos dias difíceis, olhe aqui e lembre de quanto você já superou.',
        arrow: 'none',
        position: 'center',
      },
    ],

    plano: [
      {
        selector: '#s1, .pstep',
        title: 'Plano de Saída',
        emoji: '🗺️',
        body: 'O Plano de Saída usa sua <strong>renda mensal</strong> e o valor que você pode separar para calcular <em>exatamente quando você vai se livrar de cada dívida</em>.',
        arrow: 'bottom',
        position: 'below',
      },
      {
        selector: null,
        title: 'Como funciona?',
        emoji: '⚙️',
        body: '<strong>3 passos simples:</strong>\n\n1️⃣ Informe se tem renda\n2️⃣ Diga quanto ganha e com que frequência\n3️⃣ Escolha % da renda pras dívidas\n\nO app gera um plano completo com linha do tempo e gráficos.',
        arrow: 'none',
        position: 'center',
      },
      {
        selector: null,
        title: 'Estratégias de pagamento',
        emoji: '🧠',
        body: '<strong>Avalanche:</strong> paga primeiro as dívidas com <em>maior juro</em>. Economiza mais dinheiro no total.\n\n<strong>Bola de Neve:</strong> paga primeiro as <em>menores dívidas</em>. Dá mais motivação com vitórias rápidas.',
        tip: 'Sem disciplina financeira, avalanche. Precisando de motivação, bola de neve.',
        arrow: 'none',
        position: 'center',
      },
      {
        selector: null,
        title: 'Pronto!',
        emoji: '🚀',
        body: 'Agora é só seguir o plano. <strong>Volte aqui sempre que sua renda mudar</strong> ou quitar uma dívida — o plano se atualiza automaticamente.',
        arrow: 'none',
        position: 'center',
      },
    ],

    porquinho: [
      {
        selector: '.hero-section',
        title: 'Seu Cofre',
        emoji: '🐷',
        body: 'O Porquinho é seu <strong>cofre pessoal de economia</strong>. Registre qualquer valor que você guardar — do freela, do troco, do que vier.',
        tip: 'O porquinho muda de emoji conforme seu cofre enche! 🐷 → 🐽 → 🐖 → 💰',
        arrow: 'bottom',
        position: 'below',
      },
      {
        selector: '.stats-row',
        title: 'Controle do Cofre',
        emoji: '📊',
        body: 'Veja o <strong>total guardado</strong>, quanto está <em>sem destino definido</em> e quanto já foi <em>destinado a dívidas</em> específicas.',
        tip: 'O card "Sem destino" fica roxo e sugere uma dívida pra você atacar!',
        arrow: 'bottom',
        position: 'below',
      },
      {
        selector: '.btn-amber, button.btn-amber',
        title: 'Depositar',
        emoji: '💰',
        body: 'Clique aqui para <strong>registrar um depósito</strong>. Você pode deixar o dinheiro no cofre sem destino, ou já <em>destinar diretamente a uma dívida</em>.',
        tip: 'Ao escolher uma dívida, aparece uma visualização líquida mostrando quantos % do total você está cobrindo!',
        arrow: 'bottom',
        position: 'below',
      },
      {
        selector: '#depositList, .debt-list',
        title: 'Seus Depósitos',
        emoji: '🧾',
        body: 'Cada registro mostra <strong>quanto você guardou, quando e pra onde foi</strong>. Depósitos destinados mostram uma bolinha líquida verde com o % coberto da dívida.',
        tip: 'Use o botão ✏️ para editar o valor ou mudar o destino. Use ✓ para destinar agora.',
        arrow: 'top',
        position: 'above',
      },
      {
        selector: 'button[onclick*="metaModal"], button[onclick*="openModal(\'metaModal\')"]',
        title: 'Meta de Economia',
        emoji: '🎯',
        body: 'Defina um <strong>valor alvo</strong> (ex: R$ 500) e o app mostra uma barra de progresso no topo. Ótimo pra ter um objetivo claro.',
        arrow: 'bottom',
        position: 'below',
      },
      {
        selector: null,
        title: 'O segredo do Porquinho',
        emoji: '💡',
        body: 'O app <strong>avisa automaticamente</strong> quando você tem dinheiro guardado sem destino e sugere a dívida com maior juro pra você atacar primeiro.\n\nCada real guardado é um passo pra longe das dívidas. 💛',
        arrow: 'none',
        position: 'center',
      },
    ],
  };

  const steps = TOURS[PAGE] || TOURS.index;
  let current = 0;
  let isRunning = false;

  // ── DOM ───────────────────────────────────────────
  let backdrop, ring, tooltip, fab, menu;

  function buildDOM() {
    // Inject CSS
    if (!document.getElementById('tut-style-link')) {
      const link = document.createElement('link');
      link.id   = 'tut-style-link';
      link.rel  = 'stylesheet';
      link.href = 'tutorial.css';
      document.head.appendChild(link);
    }

    // Backdrop (escuridão)
    backdrop = document.createElement('div');
    backdrop.className = 'tut-backdrop';
    backdrop.innerHTML = `
      <svg class="tut-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="tut-mask">
            <rect width="100%" height="100%" fill="white"/>
            <rect id="tut-hole" x="0" y="0" width="0" height="0" rx="14" fill="black"/>
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(13,13,15,0.82)" mask="url(#tut-mask)"/>
      </svg>`;
    document.body.appendChild(backdrop);

    // Ring (borda brilhante)
    ring = document.createElement('div');
    ring.className = 'tut-ring';
    document.body.appendChild(ring);

    // Tooltip
    tooltip = document.createElement('div');
    tooltip.className = 'tut-tooltip';
    document.body.appendChild(tooltip);

    // FAB — bolinha "!"
    fab = document.createElement('button');
    fab.className = 'tut-fab pulse';
    fab.title = 'Tutorial';
    fab.textContent = '!';
    fab.addEventListener('click', (e) => { e.stopPropagation(); togglePopover(); });
    document.body.appendChild(fab);

    // Popover do FAB
    const popover = document.createElement('div');
    popover.className = 'tut-fab-popover';
    popover.id = 'tutPopover';
    popover.innerHTML = `
      <div class="tut-pop-title">Tutorial</div>
      <button class="tut-pop-btn" id="tutPopOpen">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        Ver tutorial
      </button>
      <div class="tut-pop-divider"></div>
      <button class="tut-pop-btn danger" id="tutPopHide">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        Não ver mais
      </button>
    `;
    document.body.appendChild(popover);

    document.getElementById('tutPopOpen').addEventListener('click', () => { closePopover(); showMenu(); });
    document.getElementById('tutPopHide').addEventListener('click', () => { naoVerMais(); });

    // Fecha popover clicando fora
    document.addEventListener('click', (e) => {
      if (!fab.contains(e.target) && !popover.contains(e.target)) closePopover();
    });

    // Menu inicial
    menu = document.createElement('div');
    menu.className = 'tut-menu';
    menu.innerHTML = `
      <div class="tut-menu-box">
        <div class="tut-menu-pig">🐷</div>
        <div class="tut-menu-title">Como o DebtView funciona?</div>
        <p class="tut-menu-sub">Escolha um tour rápido ou explore por tópico. Leva menos de 2 minutos!</p>
        <div class="tut-menu-topics" id="tutTopics"></div>
        <div class="tut-menu-btns">
          <button class="tut-menu-btn-main" id="tutBtnStart">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Iniciar tour completo
          </button>
          <button class="tut-menu-btn-sec" id="tutBtnClose">Agora não</button>
        </div>
      </div>`;
    document.body.appendChild(menu);

    // Tópicos rápidos por página
    const topicDefs = {
      index:     [{ icon:'💳', label:'Cadastrar dívida', step:2 }, { icon:'💵', label:'Registrar pagamento', step:3 }, { icon:'📊', label:'Ver totais', step:0 }, { icon:'🗺️', label:'Plano de saída', step:5 }],
      historico: [{ icon:'🎊', label:'Total quitado', step:0 }, { icon:'🔍', label:'Buscar dívidas', step:2 }, { icon:'📋', label:'Ver detalhes', step:3 }],
      plano:     [{ icon:'⚙️', label:'Como funciona', step:1 }, { icon:'🧠', label:'Estratégias', step:2 }],
      porquinho: [{ icon:'💰', label:'Depositar', step:2 }, { icon:'🎯', label:'Definir meta', step:4 }, { icon:'💡', label:'Sugestões', step:5 }],
    };

    const topicsEl = document.getElementById('tutTopics');
    const topics   = topicDefs[PAGE] || [];
    topicsEl.innerHTML = topics.map(t =>
      `<button class="tut-topic-btn" data-step="${t.step}">
        <span class="tut-topic-icon">${t.icon}</span>${t.label}
      </button>`
    ).join('');

    topicsEl.querySelectorAll('.tut-topic-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        current = parseInt(btn.dataset.step) || 0;
        closeMenu();
        startTour();
      });
    });

    document.getElementById('tutBtnStart').addEventListener('click', () => {
      current = 0;
      closeMenu();
      startTour();
    });
    document.getElementById('tutBtnClose').addEventListener('click', closeMenu);

    // Fechar tutorial com ESC
    document.addEventListener('keydown', e => {
      if (!isRunning) return;
      if (e.key === 'Escape') endTour();
      if (e.key === 'ArrowRight') nextStep();
      if (e.key === 'ArrowLeft')  prevStep();
    });
  }

  // ── MENU ─────────────────────────────────────────
  function showMenu() {
    menu.classList.add('visible');
  }
  function closeMenu() {
    menu.classList.remove('visible');
  }

  // ── POPOVER FAB ───────────────────────────────────
  function togglePopover() {
    const pop = document.getElementById('tutPopover');
    if (!pop) return;
    pop.classList.toggle('visible');
  }
  function closePopover() {
    const pop = document.getElementById('tutPopover');
    if (pop) pop.classList.remove('visible');
  }

  // ── NÃO VER MAIS ─────────────────────────────────
  function naoVerMais() {
    closePopover();
    // Marca TODAS as páginas como vistas + flag global
    ['index','historico','plano','porquinho'].forEach(p =>
      localStorage.setItem(`debtview_tut_${p}`, '1')
    );
    localStorage.setItem('debtview_tut_disabled', '1');
    fab.style.display = 'none';
    // Pequena confirmação visual
    const msg = document.createElement('div');
    msg.style.cssText = `position:fixed;bottom:28px;right:24px;z-index:9999;
      background:#15151a;border:1px solid rgba(255,255,255,0.08);
      border-radius:10px;padding:10px 16px;font-size:13px;color:#9090a8;
      font-family:'DM Sans',sans-serif;box-shadow:0 8px 32px rgba(0,0,0,0.5);
      animation:fadeIn .25s ease;pointer-events:none`;
    msg.innerHTML = 'Tutorial desativado. <span style="color:#7c5cfc">Reativar nas Configurações.</span>';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3500);
  }

  // ── TOUR ─────────────────────────────────────────
  function startTour() {
    isRunning = true;
    fab.classList.remove('pulse');
    backdrop.classList.add('visible');
    showStep(current);
  }

  function endTour() {
    isRunning = false;
    backdrop.classList.remove('visible');
    tooltip.classList.remove('visible');
    ring.classList.remove('visible');
    fab.classList.add('pulse');
    // Salva que já viu o tutorial desta página
    localStorage.setItem(`debtview_tut_${PAGE}`, '1');
  }

  function showStep(idx) {
    const step = steps[idx];
    if (!step) { endTour(); return; }
    current = idx;

    const isLast   = idx === steps.length - 1;
    const isCenter = step.position === 'center' || !step.selector;

    // ── Spotlight ─────────────────────────────────
    const el = step.selector ? document.querySelector(step.selector) : null;

    if (el && !isCenter) {
      const r    = el.getBoundingClientRect();
      const pad  = 10;
      const x    = r.left - pad;
      const y    = r.top  - pad;
      const w    = r.width  + pad * 2;
      const h    = r.height + pad * 2;
      const rad  = window.getComputedStyle(el).borderRadius || '14px';

      const hole = document.getElementById('tut-hole');
      hole.setAttribute('x', x);
      hole.setAttribute('y', y);
      hole.setAttribute('width', w);
      hole.setAttribute('height', h);
      hole.setAttribute('rx', parseInt(rad) + pad || 14);

      ring.style.left         = x + 'px';
      ring.style.top          = y + 'px';
      ring.style.width        = w + 'px';
      ring.style.height       = h + 'px';
      ring.style.borderRadius = rad;
      ring.classList.add('visible');

      // Scroll suave pro elemento
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      // Centro — sem spotlight
      const hole = document.getElementById('tut-hole');
      hole.setAttribute('width', 0);
      hole.setAttribute('height', 0);
      ring.classList.remove('visible');
    }

    // ── Tooltip HTML ──────────────────────────────
    const tipHtml = step.tip
      ? `<div class="tut-tip">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          ${step.tip}
         </div>`
      : '';

    const dotsHtml = steps.map((_, i) =>
      `<div class="tut-dot ${i < idx ? 'done' : i === idx ? 'current' : ''}"></div>`
    ).join('');

    const bodyText = (step.body || '').replace(/\n/g, '<br>');

    tooltip.setAttribute('data-arrow', isCenter ? 'none' : (step.arrow || 'top'));
    tooltip.innerHTML = `
      <div class="tut-header">
        <div class="tut-emoji">${step.emoji || '💡'}</div>
        <div class="tut-titles">
          <div class="tut-step-label">Passo ${idx + 1} de ${steps.length}</div>
          <div class="tut-title">${step.title}</div>
        </div>
      </div>
      <div class="tut-body">${bodyText}${tipHtml}</div>
      <div class="tut-progress">${dotsHtml}</div>
      <div class="tut-footer">
        <button class="tut-btn-skip" id="tutSkip">Pular tutorial</button>
        <div class="tut-nav">
          <button class="tut-btn-prev" id="tutPrev" ${idx === 0 ? 'disabled' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button class="tut-btn-next" id="tutNext">
            ${isLast
              ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Concluir`
              : `Próximo <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`
            }
          </button>
        </div>
      </div>`;

    document.getElementById('tutSkip').addEventListener('click', endTour);
    document.getElementById('tutPrev').addEventListener('click', prevStep);
    document.getElementById('tutNext').addEventListener('click', isLast ? endTour : nextStep);

    // ── Posicionar tooltip ────────────────────────
    tooltip.classList.remove('visible');
    requestAnimationFrame(() => positionTooltip(el, step, isCenter));
  }

  function positionTooltip(el, step, isCenter) {
    const TW = tooltip.offsetWidth  || 320;
    const TH = tooltip.offsetHeight || 260;
    const VW = window.innerWidth;
    const VH = window.innerHeight;
    const PAD = 16;

    let top, left;

    if (isCenter || !el) {
      top  = (VH - TH) / 2;
      left = (VW - TW) / 2;
    } else {
      const r   = el.getBoundingClientRect();
      const pos = step.position || 'below';

      if (pos === 'below') {
        top  = r.bottom + 20;
        left = r.left;
      } else if (pos === 'above') {
        top  = r.top - TH - 20;
        left = r.left;
      } else if (pos === 'right') {
        top  = r.top;
        left = r.right + 20;
      } else {
        top  = r.top;
        left = r.left - TW - 20;
      }

      // Manter dentro da tela
      left = Math.max(PAD, Math.min(left, VW - TW - PAD));
      top  = Math.max(PAD, Math.min(top,  VH - TH - PAD));
    }

    tooltip.style.top  = top  + 'px';
    tooltip.style.left = left + 'px';
    tooltip.classList.add('visible');
  }

  function nextStep() { showStep(current + 1); }
  function prevStep() { if (current > 0) showStep(current - 1); }

  // ── AUTO-INICIAR NA PRIMEIRA VEZ ─────────────────
  function checkAutoStart() {
    const disabled = localStorage.getItem('debtview_tut_disabled') === '1';
    if (disabled) {
      fab.style.display = 'none';
      return;
    }
    const visto = localStorage.getItem(`debtview_tut_${PAGE}`);
    if (!visto) {
      setTimeout(() => showMenu(), 1200);
    }
  }

  // ── INIT ─────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    buildDOM();
    checkAutoStart();
  });
  if (document.readyState !== 'loading') {
    buildDOM();
    checkAutoStart();
  }

})();
