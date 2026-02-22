# DebtView 💳

**Controle total das suas dívidas — 100% no navegador, sem servidores, sem cadastro.**

DebtView é um app de gestão financeira pessoal focado em quem tem dívidas e quer um plano real de saída. Ele calcula juros, projeta datas de quitação, sugere estratégias de pagamento e ainda tem um cofre para guardar dinheiro e destinar às dívidas certas.

---

## ✨ Funcionalidades

### 💳 Gestão de Dívidas
- Cadastro completo com credor, tipo, valor, juros, parcela e vencimento
- Suporte a três modalidades: **parcelado**, **rotativo** e **sem juros**
- Cálculo automático de evolução mês a mês com juros compostos
- Alerta quando a parcela é menor que os juros (dívida que nunca acaba)
- Registro de pagamentos parciais e totais com histórico
- Indicadores de status: em dia, vencendo em breve, atrasado

### 🗺️ Plano de Saída
- Simula mês a mês em quanto tempo você quita todas as dívidas
- Estratégia **Avalanche** (maior juro primeiro) — economiza mais dinheiro
- Estratégia **Bola de Neve** (menor dívida primeiro) — mais motivação
- Entrada de múltiplas fontes de renda com diferentes frequências (mensal, semanal, quinzenal, diária)
- Slider para definir qual % da renda vai para dívidas
- Linha do tempo visual de quitação por dívida
- Gráfico de queda do saldo devedor total
- Cálculo de total de juros pagos e data de liberdade financeira

### 🏆 Histórico de Quitações
- Arquivo permanente de todas as dívidas quitadas
- Timeline de pagamentos por dívida
- Totais acumulados e maior quitação
- Busca por credor ou tipo

### 🐷 Porquinho (Cofre Pessoal)
- Registra valores guardados com descrição e data
- Destina dinheiro diretamente a uma dívida específica
- **Visualização líquida animada** mostrando quantos % da dívida aquele valor cobre
- Meta de economia com barra de progresso
- Alertas automáticos quando há saldo livre sem destino, sugerindo a dívida com maior juro
- Histórico de depósitos, destinações e resgates

### 🎓 Tutorial Interativo
- Tour com **spotlight real** — escurece a tela e ilumina o elemento explicado
- Tour específico para cada página (Dívidas, Pagas, Plano, Porquinho)
- Menu de boas-vindas na primeira visita com acesso rápido por tópico
- Bolinha `!` discreta no canto da tela com opção de desativar
- Navegação por botões, setas do teclado ou ESC

### ⚙️ Configurações
- Ativar/desativar tutorial por página
- Resetar tours individualmente ou todos de uma vez
- Exportar backup completo em `.json`
- Lembrete de backup automático
- Apagar todos os dados (com confirmação)

---

## 🛠️ Tecnologia

| Camada | Decisão |
|---|---|
| Framework | Nenhum — HTML, CSS e JavaScript puros |
| Persistência | `localStorage` (100% local, zero servidor) |
| Fontes | Bebas Neue + DM Sans + DM Mono (Google Fonts) |
| Gráficos | Canvas API nativo |
| Distribuição | Abrir o `index.html` no navegador |

Sem dependências externas. Sem build. Sem npm. Funciona offline.

---

## 📁 Estrutura de Arquivos

```
debtview/
│
├── index.html              # Página principal — lista de dívidas
├── script.js               # Lógica de dívidas (CRUD, pagamentos, cálculos)
├── dados.js                # Exportar / importar dados
├── style.css               # Design system base
│
├── historico.html          # Dívidas quitadas
├── historico.js
├── historico.css
│
├── plano.html              # Plano de saída (simulação mês a mês)
├── plano.js
├── plano.css
│
├── porquinho.html          # Cofre pessoal de economia
├── porquinho.js
├── porquinho.css
│
├── tutorial.js             # Motor de tour interativo (funciona em todas as páginas)
├── tutorial.css
│
├── configuracoes.html      # Configurações do app
├── configuracoes.js
├── configuracoes.css
│
└── icons/
    └── favicon.ico
```

---

## 🚀 Como usar

**Opção 1 — Localmente**

```bash
git clone https://github.com/seu-usuario/debtview.git
cd debtview
# Abra o index.html no seu navegador
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

**Opção 2 — GitHub Pages**

1. Fork este repositório
2. Vá em **Settings → Pages**
3. Source: `Deploy from a branch` → `main` → `/ (root)`
4. Acesse `https://seu-usuario.github.io/debtview`

**Opção 3 — Qualquer hospedagem estática**

Copie todos os arquivos para qualquer servidor de arquivos estáticos (Netlify, Vercel, S3, etc.). Não precisa de backend.

---

## 📊 Como funciona o cálculo

### Modalidades de dívida

**Parcelado contratado** — você já sabe o número de parcelas. O app calcula o saldo caindo linearmente a cada parcela. Ideal para: financiamentos, CDC, crédito consignado.

**Rotativo** — juros incidem sobre o saldo todo mês. O app usa juros compostos:

```
saldo_próx = saldo_atual × (1 + taxa) - parcela
```

Ideal para: cartão em rotativo, cheque especial, empréstimos pessoais.

**Sem juros** — saldo cai conforme pagamentos. Ideal para: dívidas pessoais, boletos sem encargo.

### Plano de saída (Avalanche)

A cada mês simulado:
1. Aplica o mínimo de cada dívida
2. O dinheiro restante vai 100% para a dívida com maior taxa de juro
3. Quando uma dívida zera, o valor vai para a próxima
4. Repete até o saldo total chegar a zero

---

## 📸 Telas

| Dívidas | Plano de Saída |
|---------|----------------|
| Lista de dívidas com status, parcela e projeção de quitação | Simulação mês a mês com linha do tempo e gráfico de queda |

| Porquinho | Configurações |
|-----------|---------------|
| Cofre com visualização líquida animada de cobertura de dívida | Tutorial interativo, backup de dados e preferências |

---

## 🔒 Privacidade

Nenhum dado é enviado para qualquer servidor. Tudo fica salvo no `localStorage` do seu navegador. Para não perder dados ao limpar o histórico do navegador, use a função **Exportar dados** nas configurações regularmente.

---

## 🗺️ Roadmap

- [ ] PWA com instalação e funcionamento offline completo
- [ ] Notificações push para vencimentos próximos
- [ ] Sincronização via link compartilhável (criptografado)
- [ ] Modo casal — duas pessoas, uma visão de dívidas
- [ ] Importação de extratos PDF/CSV
- [ ] Dark/Light mode toggle
- [ ] Relatório mensal em PDF

---

## 🤝 Contribuindo

Pull requests são bem-vindos! Para mudanças grandes, abra uma issue primeiro para discutir o que você gostaria de mudar.

```bash
# Fork → clone → branch → commit → PR
git checkout -b feature/minha-feature
git commit -m 'feat: adiciona minha feature'
git push origin feature/minha-feature
```

---

## 📄 Licença

MIT — faça o que quiser, só não culpe a gente se você finalmente ver quanto deve no cartão.

---

<div align="center">
  <strong>Debt<span>View</span></strong> — Feito para quem quer sair das dívidas de verdade. 💛
</div>
