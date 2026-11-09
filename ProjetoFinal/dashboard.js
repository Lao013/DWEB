// Configuração padrão com o project_id identificado no projeto CORUS
const DEFAULT_SUPABASE_URL = "https://mxggneaqzqvkvdhkrswp.supabase.co";
const STORAGE_KEY_QUOTES = "corus_db_orcamentos_v1";
const STORAGE_KEY_CONFIG = "corus_db_config_v1";

const STATUS_META = {
  rascunho: { label: "Rascunho", color: "var(--text-secondary)" },
  em_analise: { label: "Em Análise", color: "var(--warning)" },
  enviado: { label: "Enviado ao Cliente", color: "var(--accent-primary)" },
  aprovado: { label: "Aprovado", color: "var(--success)" },
  rejeitado: { label: "Rejeitado", color: "var(--danger)" }
};

const SEED_DATA = [
  {
    id: "orc-101",
    codigo: "ORC-2026-001",
    titulo: "Automação de Célula Robotizada de Solda MIG",
    cliente: "Metalúrgica Atlas S.A.",
    cnpj: "12.345.678/0001-90",
    orcamentista: "Carlos Mendes",
    status: "aprovado",
    custo_base: 145000,
    margem_percentual: 22,
    impostos_percentual: 12,
    desconto: 3500,
    valor_total: 194620,
    validade: "2026-12-15",
    observacoes: "Incluso comissionamento, dispositivos e treinamento operacional.",
    itens: [
      { descricao: "Robô Industrial 6 Eixos + Controlador", qtd: 1, unitario: 98000 },
      { descricao: "Fonte de Solda Sinérgica 400A", qtd: 1, unitario: 32000 },
      { descricao: "Engenharia, CLP e Segurança NR-12", qtd: 1, unitario: 15000 }
    ],
    historico: [
      { data: "2026-10-20 09:30", acao: "Orçamento criado por Carlos Mendes" },
      { data: "2026-10-24 14:15", acao: "Status alterado para Enviado ao Cliente" },
      { data: "2026-10-29 11:00", acao: "Proposta aprovada pela diretoria do cliente" }
    ],
    created_at: "2026-10-20T09:30:00Z"
  },
  {
    id: "orc-102",
    codigo: "ORC-2026-002",
    titulo: "Modernização de Painel Elétrico e Telemetria",
    cliente: "Agroindústria Vale Verde",
    cnpj: "45.987.123/0001-11",
    orcamentista: "Fernanda Costa",
    status: "em_analise",
    custo_base: 68000,
    margem_percentual: 25,
    impostos_percentual: 12,
    desconto: 0,
    valor_total: 93160,
    validade: "2026-11-30",
    observacoes: "Aguardando validação técnica dos sensores pelo engenheiro residente.",
    itens: [
      { descricao: "Quadro de Comando QGBT Completo", qtd: 2, unitario: 24000 },
      { descricao: "Gateway IoT Industrial + Licenças", qtd: 1, unitario: 20000 }
    ],
    historico: [
      { data: "2026-11-01 10:00", acao: "Orçamento registrado no sistema" },
      { data: "2026-11-02 16:40", acao: "Enviado para revisão de engenharia (Em Análise)" }
    ],
    created_at: "2026-11-01T10:00:00Z"
  },
  {
    id: "orc-103",
    codigo: "ORC-2026-003",
    titulo: "Manutenção Preventiva de Linha de Montagem",
    cliente: "Autopeças Horizonte Ltda",
    cnpj: "78.111.222/0001-55",
    orcamentista: "Carlos Mendes",
    status: "enviado",
    custo_base: 42000,
    margem_percentual: 20,
    impostos_percentual: 10,
    desconto: 1200,
    valor_total: 53400,
    validade: "2026-11-25",
    observacoes: "Parada programada para o final de semana.",
    itens: [
      { descricao: "Kit de Reparos Mecânicos e Rolamentos", qtd: 4, unitario: 5500 },
      { descricao: "Equipe Técnica Especializada (40h)", qtd: 1, unitario: 20000 }
    ],
    historico: [
      { data: "2026-11-03 08:20", acao: "Orçamento elaborado" },
      { data: "2026-11-04 17:10", acao: "Proposta PDF enviada para compras@horizonte.com.br" }
    ],
    created_at: "2026-11-03T08:20:00Z"
  },
  {
    id: "orc-104",
    codigo: "ORC-2026-004",
    titulo: "Sistema de Exaustão Industrial Central",
    cliente: "Fundição São Jorge",
    cnpj: "33.444.555/0001-08",
    orcamentista: "Rafael Almeida",
    status: "rascunho",
    custo_base: 110000,
    margem_percentual: 18,
    impostos_percentual: 12,
    desconto: 0,
    valor_total: 143000,
    validade: "2026-12-20",
    observacoes: "Falta cotar tubulação em aço inox 304.",
    itens: [
      { descricao: "Exaustor Centrífugo 50CV", qtd: 2, unitario: 40000 },
      { descricao: "Filtro de Mangas Industrial", qtd: 1, unitario: 30000 }
    ],
    historico: [
      { data: "2026-11-05 09:00", acao: "Rascunho inicial iniciado" }
    ],
    created_at: "2026-11-05T09:00:00Z"
  }
];

let supabaseClient = null;
let allQuotes = [];
let recentQuotesExpanded = false;

// Inicializa configuração do banco
function initDatabaseConnection() {
  const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY_CONFIG) || "{}");
  const url = savedConfig.url || DEFAULT_SUPABASE_URL;
  const key = savedConfig.key || "";

  document.getElementById("input-supabase-url").value = url;
  document.getElementById("input-supabase-key").value = key;

  const badge = document.getElementById("db-status-indicator");
  const badgeText = document.getElementById("db-status-text");

  if (url && key && window.supabase) {
    supabaseClient = window.supabase.createClient(url, key);
    badge.className = "db-badge supabase";
    badgeText.textContent = "Supabase PostgreSQL";
  } else {
    supabaseClient = null;
    badge.className = "db-badge local";
    badgeText.textContent = "Banco Local (Isolado)";
  }
}

// Busca orçamentos do Supabase ou do banco local compartilhado
async function fetchQuotes() {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from("orcamentos")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      allQuotes = data;
      localStorage.setItem(STORAGE_KEY_QUOTES, JSON.stringify(data));
      return allQuotes;
    }
    console.warn("Aviso Supabase (usando cache local):", error?.message);
  }

  const localRaw = localStorage.getItem(STORAGE_KEY_QUOTES);
  if (!localRaw) {
    localStorage.setItem(STORAGE_KEY_QUOTES, JSON.stringify(SEED_DATA));
    allQuotes = [...SEED_DATA];
  } else {
    allQuotes = JSON.parse(localRaw);
  }
  return allQuotes;
}

function formatBRL(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function renderDashboard(quotes, filterText = "") {
  // 1. Cálculo de KPIs
  const totalCount = quotes.length;
  const pipelineValue = quotes.reduce((acc, q) => acc + Number(q.valor_total || 0), 0);

  const approvedQuotes = quotes.filter((q) => q.status === "aprovado");
  const approvedValue = approvedQuotes.reduce((acc, q) => acc + Number(q.valor_total || 0), 0);
  const conversionRate = totalCount > 0 ? Math.round((approvedQuotes.length / totalCount) * 100) : 0;

  const pendingQuotes = quotes.filter(
    (q) => q.status === "em_analise" || q.status === "enviado" || q.status === "rascunho"
  );
  const pendingValue = pendingQuotes.reduce((acc, q) => acc + Number(q.valor_total || 0), 0);

  document.getElementById("kpi-total-count").textContent = totalCount;
  document.getElementById("kpi-total-sub").textContent = `${approvedQuotes.length} aprovados no período`;
  document.getElementById("kpi-pipeline-value").textContent = formatBRL(pipelineValue);
  document.getElementById("kpi-approved-value").textContent = formatBRL(approvedValue);
  document.getElementById("kpi-conversion-rate").textContent = `Taxa de conversão: ${conversionRate}%`;
  document.getElementById("kpi-pending-count").textContent = pendingQuotes.length;
  document.getElementById("kpi-pending-value").textContent = `${formatBRL(pendingValue)} em aberto`;

  // 2. Gráfico de Barras por Status
  const distContainer = document.getElementById("status-distribution");
  distContainer.innerHTML = "";

  Object.entries(STATUS_META).forEach(([statusKey, meta]) => {
    const group = quotes.filter((q) => q.status === statusKey);
    const pct = totalCount > 0 ? Math.round((group.length / totalCount) * 100) : 0;
    const sumVal = group.reduce((acc, q) => acc + Number(q.valor_total || 0), 0);

    const row = document.createElement("div");
    row.className = "status-row";
    row.innerHTML = `
      <div class="status-row-header">
        <span><strong>${meta.label}</strong> (${group.length})</span>
        <span>${formatBRL(sumVal)}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: ${pct}%; background-color: ${meta.color};"></div>
      </div>
    `;
    distContainer.appendChild(row);
  });

  // 3. Tabela de Orçamentos Recentes
  const tbody = document.getElementById("recent-quotes-tbody");
  const recentQuotesCard = document.getElementById("recent-quotes-card");
  const recentQuotesList = document.getElementById("recent-quotes-list");
  const recentQuotesToggle = document.getElementById("recent-quotes-toggle");
  tbody.innerHTML = "";

  const normalizedFilter = filterText.trim().toLowerCase();
  const filtered = quotes.filter((q) => {
    if (!normalizedFilter) return true;
    return (
      q.codigo.toLowerCase().includes(normalizedFilter) ||
      q.cliente.toLowerCase().includes(normalizedFilter) ||
      q.titulo.toLowerCase().includes(normalizedFilter)
    );
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8;">Nenhum orçamento encontrado.</td></tr>`;
  } else {
    filtered.forEach((q) => {
      const statusInfo = STATUS_META[q.status] || { label: q.status };
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${q.codigo}</strong></td>
        <td>
          <div>${q.cliente}</div>
          <small style="color: #94a3b8;">${q.titulo}</small>
        </td>
        <td>${q.orcamentista}</td>
        <td><span class="badge badge-${q.status}">${statusInfo.label}</span></td>
        <td><strong>${formatBRL(q.valor_total)}</strong></td>
        <td>
          <a class="link-action" href="orcamentos.html?id=${encodeURIComponent(q.id)}">
            Abrir Detalhes →
          </a>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  const canExpandRecentQuotes = filtered.length > 2;
  const isExpanded = recentQuotesExpanded && canExpandRecentQuotes;
  recentQuotesCard.classList.toggle("is-expanded", isExpanded);
  recentQuotesList.classList.toggle("is-expanded", isExpanded);
  recentQuotesToggle.hidden = !canExpandRecentQuotes;
  recentQuotesToggle.textContent = isExpanded ? "Ver menos" : "Ver mais";
  recentQuotesToggle.setAttribute("aria-expanded", String(isExpanded));
}

function initKpiCarousel() {
  const track = document.getElementById("kpi-track");
  const previous = document.getElementById("kpi-prev");
  const next = document.getElementById("kpi-next");
  const viewport = track.parentElement;

  const updateControls = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    previous.disabled = track.scrollLeft <= 1;
    next.disabled = maxScroll <= 1 || track.scrollLeft >= maxScroll - 1;
    viewport.classList.toggle("has-left-fade", track.scrollLeft > 1);
    viewport.classList.toggle("has-right-fade", maxScroll > 1 && track.scrollLeft < maxScroll - 1);
  };

  previous.addEventListener("click", () => {
    track.scrollBy({ left: -track.clientWidth * 0.8, behavior: "smooth" });
  });
  next.addEventListener("click", () => {
    track.scrollBy({ left: track.clientWidth * 0.8, behavior: "smooth" });
  });
  track.addEventListener("scroll", updateControls, { passive: true });
  window.addEventListener("resize", updateControls);

  let dragStartX = 0;
  let dragStartScroll = 0;
  let targetScroll = 0;
  let isDragging = false;
  let dragFrame = null;

  track.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0 || track.scrollWidth <= track.clientWidth) return;
    isDragging = true;
    dragStartX = event.clientX;
    dragStartScroll = track.scrollLeft;
    targetScroll = track.scrollLeft;
    track.classList.add("is-dragging");
    track.setPointerCapture(event.pointerId);
  });

  track.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    targetScroll = dragStartScroll - (event.clientX - dragStartX);
    targetScroll = Math.max(0, Math.min(targetScroll, track.scrollWidth - track.clientWidth));

    if (dragFrame !== null) return;
    const easeDrag = () => {
      const difference = targetScroll - track.scrollLeft;
      track.scrollLeft += difference * 0.28;

      if (Math.abs(difference) > 0.5) {
        dragFrame = requestAnimationFrame(easeDrag);
      } else {
        track.scrollLeft = targetScroll;
        dragFrame = null;
        if (!isDragging) finishDrag();
      }
    };
    dragFrame = requestAnimationFrame(easeDrag);
  });

  const finishDrag = () => {
    track.classList.remove("is-dragging");
    const cards = Array.from(track.querySelectorAll(".kpi-card"));
    const trackRect = track.getBoundingClientRect();
    const snapInset = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const snapPosition = trackRect.left + snapInset;
    const nearestCard = cards.reduce((nearest, card) => {
      return Math.abs(card.getBoundingClientRect().left - snapPosition) <
        Math.abs(nearest.getBoundingClientRect().left - snapPosition)
        ? card
        : nearest;
    }, cards[0]);
    if (nearestCard) {
      const cardPosition = nearestCard.getBoundingClientRect().left - trackRect.left + track.scrollLeft;
      track.scrollTo({
        left: Math.max(0, cardPosition - snapInset),
        behavior: "smooth"
      });
    }
  };

  const stopDragging = () => {
    if (!isDragging) return;
    isDragging = false;
    if (dragFrame === null) finishDrag();
  };
  track.addEventListener("pointerup", stopDragging);
  track.addEventListener("pointercancel", stopDragging);

  updateControls();
}

// Eventos da Interface
document.addEventListener("DOMContentLoaded", async () => {
  initKpiCarousel();
  document.getElementById("recent-quotes-toggle").addEventListener("click", () => {
    recentQuotesExpanded = !recentQuotesExpanded;
    renderDashboard(allQuotes, document.getElementById("search-dashboard").value);
  });
  initDatabaseConnection();
  await fetchQuotes();
  renderDashboard(allQuotes);

  document.getElementById("search-dashboard").addEventListener("input", (e) => {
    renderDashboard(allQuotes, e.target.value);
  });

  document.getElementById("btn-refresh").addEventListener("click", async () => {
    await fetchQuotes();
    renderDashboard(allQuotes, document.getElementById("search-dashboard").value);
  });

  // Modal de Banco de Dados
  const modal = document.getElementById("db-modal");
  document.getElementById("btn-open-db-modal").addEventListener("click", () => {
    modal.classList.remove("hidden");
  });
  document.getElementById("btn-close-db-modal").addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  document.getElementById("btn-save-db-config").addEventListener("click", async () => {
    const url = document.getElementById("input-supabase-url").value.trim() || DEFAULT_SUPABASE_URL;
    const key = document.getElementById("input-supabase-key").value.trim();
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({ url, key }));
    initDatabaseConnection();
    await fetchQuotes();
    renderDashboard(allQuotes);
    modal.classList.add("hidden");
  });

  document.getElementById("btn-reset-seed").addEventListener("click", async () => {
    localStorage.setItem(STORAGE_KEY_QUOTES, JSON.stringify(SEED_DATA));
    await fetchQuotes();
    renderDashboard(allQuotes);
    modal.classList.add("hidden");
  });
});