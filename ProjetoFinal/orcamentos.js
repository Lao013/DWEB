const DEFAULT_SUPABASE_URL = "https://mxggneaqzqvkvdhkrswp.supabase.co";
const STORAGE_KEY_QUOTES = "corus_db_orcamentos_v1";
const STORAGE_KEY_CONFIG = "corus_db_config_v1";

const STATUS_META = {
  rascunho: { label: "Rascunho" },
  em_analise: { label: "Em Análise" },
  enviado: { label: "Enviado ao Cliente" },
  aprovado: { label: "Aprovado" },
  rejeitado: { label: "Rejeitado" }
};

let supabaseClient = null;
let quotes = [];
let selectedQuoteId = null;

function initSupabase() {
  const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY_CONFIG) || "{}");
  const url = savedConfig.url || DEFAULT_SUPABASE_URL;
  const key = savedConfig.key || "";

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

// Cálculo financeiro do orçamento (Custo Base + Margem + Impostos - Desconto)
function calcularValorTotal(custoBase, margemPct, impostosPct, desconto) {
  const custo = Number(custoBase || 0);
  const margem = custo * (Number(margemPct || 0) / 100);
  const subtotalComMargem = custo + margem;
  const impostos = subtotalComMargem * (Number(impostosPct || 0) / 100);
  const total = subtotalComMargem + impostos - Number(desconto || 0);
  return Math.max(0, Math.round(total * 100) / 100);
}

function formatBRL(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function nowFormatted() {
  const d = new Date();
  return d.toISOString().slice(0, 16).replace("T", " ");
}

async function loadQuotesFromDB() {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from("orcamentos")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      quotes = data;
      localStorage.setItem(STORAGE_KEY_QUOTES, JSON.stringify(data));
      return;
    }
  }

  const raw = localStorage.getItem(STORAGE_KEY_QUOTES);
  quotes = raw ? JSON.parse(raw) : [];
}

async function saveQuoteToDB(quoteObj, isNew = false) {
  if (supabaseClient) {
    if (isNew) {
      await supabaseClient.from("orcamentos").insert([quoteObj]);
    } else {
      await supabaseClient.from("orcamentos").update(quoteObj).eq("id", quoteObj.id);
    }
  }

  const idx = quotes.findIndex((q) => q.id === quoteObj.id);
  if (idx >= 0) {
    quotes[idx] = quoteObj;
  } else {
    quotes.unshift(quoteObj);
  }
  localStorage.setItem(STORAGE_KEY_QUOTES, JSON.stringify(quotes));
}

async function deleteQuoteFromDB(id) {
  if (supabaseClient) {
    await supabaseClient.from("orcamentos").delete().eq("id", id);
  }
  quotes = quotes.filter((q) => q.id !== id);
  localStorage.setItem(STORAGE_KEY_QUOTES, JSON.stringify(quotes));
}

function renderQuotesList() {
  const search = document.getElementById("filter-search").value.trim().toLowerCase();
  const statusFilter = document.getElementById("filter-status").value;
  const quoteSelect = document.getElementById("quotes-list-container");
  quoteSelect.innerHTML = "";

  const filtered = quotes.filter((q) => {
    const matchStatus = statusFilter === "todos" || q.status === statusFilter;
    const matchSearch =
      !search ||
      q.codigo.toLowerCase().includes(search) ||
      q.cliente.toLowerCase().includes(search) ||
      q.titulo.toLowerCase().includes(search);
    return matchStatus && matchSearch;
  });

  document.getElementById("quotes-list-count").textContent =
    `Exibindo ${filtered.length} de ${quotes.length} orçamentos`;

  const selectedQuote = quotes.find((q) => q.id === selectedQuoteId);
  if (selectedQuote && !filtered.some((q) => q.id === selectedQuote.id)) {
    const option = document.createElement("option");
    option.value = selectedQuote.id;
    option.textContent = `Selecionado (fora dos filtros): ${selectedQuote.codigo} — ${selectedQuote.titulo}`;
    option.selected = true;
    quoteSelect.appendChild(option);
  }

  if (filtered.length === 0) {
    if (!selectedQuote) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Nenhum orçamento encontrado";
      quoteSelect.appendChild(option);
    }
    return;
  }

  filtered.forEach((q) => {
    const option = document.createElement("option");
    option.value = q.id;
    const statusLabel = STATUS_META[q.status]?.label || q.status;
    option.textContent = `${q.codigo} — ${q.titulo} | ${q.cliente} | ${statusLabel} | ${formatBRL(q.valor_total)}`;
    option.selected = q.id === selectedQuoteId;
    quoteSelect.appendChild(option);
  });
}

function renderQuoteDetail() {
  const panel = document.getElementById("quote-detail-panel");
  const quote = quotes.find((q) => q.id === selectedQuoteId);

  if (!quote) {
    panel.innerHTML = `
      <div style="text-align:center; padding: 3rem 1rem; color: #94a3b8;">
        <h3>Selecione um orçamento na lista acima</h3>
        <p style="margin-top:0.5rem;">Ou clique em "+ Criar Orçamento" para cadastrar uma nova proposta no banco.</p>
      </div>
    `;
    return;
  }

  const statusLabel = STATUS_META[quote.status]?.label || quote.status;
  const itens = Array.isArray(quote.itens) ? quote.itens : [];
  const historico = Array.isArray(quote.historico) ? quote.historico : [];

  const itensRows = itens
    .map(
      (item, idx) => `
      <tr>
        <td>${item.descricao}</td>
        <td>${item.qtd}</td>
        <td>${formatBRL(item.unitario)}</td>
        <td><strong>${formatBRL(Number(item.qtd) * Number(item.unitario))}</strong></td>
        <td>
          <button class="btn-danger" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="removerItem('${quote.id}', ${idx})">Remover</button>
        </td>
      </tr>
    `
    )
    .join("");

  const historicoRows = historico
    .map((h) => `<li><strong>${h.data}</strong> — ${h.acao}</li>`)
    .join("");

  panel.innerHTML = `
    <div class="detail-header">
      <div>
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.4rem;">
          <h2>${quote.codigo}</h2>
          <span class="badge badge-${quote.status}">${statusLabel}</span>
        </div>
        <p style="font-size:1.05rem; color:var(--text-primary);">${quote.titulo}</p>
      </div>
      <div class="detail-actions">
        <select id="quick-status-select" class="quick-status-select">
          <option value="rascunho" ${quote.status === "rascunho" ? "selected" : ""}>Status: Rascunho</option>
          <option value="em_analise" ${quote.status === "em_analise" ? "selected" : ""}>Status: Em Análise</option>
          <option value="enviado" ${quote.status === "enviado" ? "selected" : ""}>Status: Enviado</option>
          <option value="aprovado" ${quote.status === "aprovado" ? "selected" : ""}>Status: Aprovado</option>
          <option value="rejeitado" ${quote.status === "rejeitado" ? "selected" : ""}>Status: Rejeitado</option>
        </select>
        <button class="btn-secondary" id="btn-edit-quote">Editar Dados</button>
        <button class="btn-danger" id="btn-delete-quote">Excluir</button>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <span>Cliente</span>
        <strong>${quote.cliente}</strong>
      </div>
      <div class="info-box">
        <span>CNPJ</span>
        <strong>${quote.cnpj || "Não informado"}</strong>
      </div>
      <div class="info-box">
        <span>Orçamentista Responsável</span>
        <strong>${quote.orcamentista}</strong>
      </div>
      <div class="info-box">
        <span>Validade da Proposta</span>
        <strong>${quote.validade || "-"}</strong>
      </div>
    </div>

    <div class="financial-summary">
      <div class="fin-item">
        <span>Custo Base</span>
        <strong>${formatBRL(quote.custo_base)}</strong>
      </div>
      <div class="fin-item">
        <span>Margem / BDI</span>
        <strong>${quote.margem_percentual}%</strong>
      </div>
      <div class="fin-item">
        <span>Impostos</span>
        <strong>${quote.impostos_percentual}%</strong>
      </div>
      <div class="fin-item">
        <span>Desconto</span>
        <strong>${formatBRL(quote.desconto)}</strong>
      </div>
      <div class="fin-item">
        <span>Valor Final da Proposta</span>
        <strong style="color:var(--success); font-size:1.2rem;">${formatBRL(quote.valor_total)}</strong>
      </div>
    </div>

    <div class="info-box" style="margin-bottom:1.5rem;">
      <span>Observações Técnicas e Condições Comerciais</span>
      <p style="font-size:0.88rem; margin-top:0.35rem; line-height:1.4;">${quote.observacoes || "Sem observações registradas."}</p>
    </div>

    <h4 class="section-title">Itens de Composição do Orçamento (${itens.length})</h4>
    <table class="items-table">
      <thead>
        <tr>
          <th>Descrição do Item / Serviço</th>
          <th>Qtd</th>
          <th>Custo Unitário</th>
          <th>Subtotal</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${itensRows || `<tr><td colspan="5" style="color:#94a3b8; text-align:center;">Nenhum item cadastrado neste orçamento.</td></tr>`}
      </tbody>
    </table>

    <div class="add-item-bar">
      <input type="text" id="new-item-desc" placeholder="Descrição do novo item ou serviço..." />
      <input type="number" id="new-item-qtd" placeholder="Qtd" value="1" min="1" />
      <input type="number" id="new-item-unit" placeholder="Valor Unit. (R$)" step="0.01" />
      <button class="btn-secondary" id="btn-add-item">+ Adicionar Item</button>
    </div>

    <h4 class="section-title">Trilha de Auditoria e Histórico</h4>
    <ul class="audit-list">
      ${historicoRows}
    </ul>
  `;

  // Evento de troca rápida de status
  document.getElementById("quick-status-select").addEventListener("change", async (e) => {
    const novoStatus = e.target.value;
    quote.status = novoStatus;
    quote.historico = quote.historico || [];
    quote.historico.unshift({
      data: nowFormatted(),
      acao: `Status alterado para "${STATUS_META[novoStatus].label}"`
    });
    await saveQuoteToDB(quote, false);
    renderQuotesList();
    renderQuoteDetail();
  });

  // Evento de adicionar item e recalcular custo base
  document.getElementById("btn-add-item").addEventListener("click", async () => {
    const desc = document.getElementById("new-item-desc").value.trim();
    const qtd = Number(document.getElementById("new-item-qtd").value || 1);
    const unitario = Number(document.getElementById("new-item-unit").value || 0);
    if (!desc || unitario <= 0) return;

    quote.itens = Array.isArray(quote.itens) ? quote.itens : [];
    quote.itens.push({ descricao: desc, qtd, unitario });

    // Recalcula custo base pela soma dos itens
    quote.custo_base = quote.itens.reduce((acc, i) => acc + Number(i.qtd) * Number(i.unitario), 0);
    quote.valor_total = calcularValorTotal(
      quote.custo_base,
      quote.margem_percentual,
      quote.impostos_percentual,
      quote.desconto
    );
    quote.historico.unshift({
      data: nowFormatted(),
      acao: `Item adicionado: ${desc} (${qtd}x ${formatBRL(unitario)})`
    });

    await saveQuoteToDB(quote, false);
    renderQuotesList();
    renderQuoteDetail();
  });

  // Editar orçamento
  document.getElementById("btn-edit-quote").addEventListener("click", () => {
    openQuoteModal(quote);
  });

  // Excluir orçamento
  document.getElementById("btn-delete-quote").addEventListener("click", async () => {
    if (!confirm(`Deseja realmente excluir o orçamento ${quote.codigo}?`)) return;
    await deleteQuoteFromDB(quote.id);
    selectedQuoteId = quotes[0]?.id || null;
    renderQuotesList();
    renderQuoteDetail();
  });
}

// Função global para remover item da composição
window.removerItem = async function (quoteId, itemIndex) {
  const quote = quotes.find((q) => q.id === quoteId);
  if (!quote) return;
  const removido = quote.itens.splice(itemIndex, 1)[0];
  quote.custo_base = quote.itens.reduce((acc, i) => acc + Number(i.qtd) * Number(i.unitario), 0);
  quote.valor_total = calcularValorTotal(
    quote.custo_base,
    quote.margem_percentual,
    quote.impostos_percentual,
    quote.desconto
  );
  quote.historico.unshift({
    data: nowFormatted(),
    acao: `Item removido: ${removido?.descricao || "Item"}`
  });
  await saveQuoteToDB(quote, false);
  renderQuotesList();
  renderQuoteDetail();
};

function openQuoteModal(quote = null) {
  const modal = document.getElementById("quote-form-modal");
  document.getElementById("modal-form-title").textContent = quote
    ? `Editar ${quote.codigo}`
    : "Criar Novo Orçamento";

  document.getElementById("form-id").value = quote ? quote.id : "";
  document.getElementById("form-codigo").value =
    quote ? quote.codigo : `ORC-2026-00${quotes.length + 1}`;
  document.getElementById("form-status").value = quote ? quote.status : "rascunho";
  document.getElementById("form-titulo").value = quote ? quote.titulo : "";
  document.getElementById("form-cliente").value = quote ? quote.cliente : "";
  document.getElementById("form-cnpj").value = quote ? quote.cnpj || "" : "";
  document.getElementById("form-orcamentista").value = quote ? quote.orcamentista : "";
  document.getElementById("form-validade").value =
    quote ? quote.validade : new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);
  document.getElementById("form-custo").value = quote ? quote.custo_base : 0;
  document.getElementById("form-margem").value = quote ? quote.margem_percentual : 20;
  document.getElementById("form-impostos").value = quote ? quote.impostos_percentual : 12;
  document.getElementById("form-desconto").value = quote ? quote.desconto : 0;
  document.getElementById("form-observacoes").value = quote ? quote.observacoes || "" : "";

  modal.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", async () => {
  initSupabase();
  await loadQuotesFromDB();

  const params = new URLSearchParams(window.location.search);
  const idParam = params.get("id");
  const novoParam = params.get("novo");

  if (idParam && quotes.some((q) => q.id === idParam)) {
    selectedQuoteId = idParam;
  } else if (quotes.length > 0) {
    selectedQuoteId = quotes[0].id;
  }

  renderQuotesList();
  renderQuoteDetail();

  if (novoParam === "1") {
    openQuoteModal(null);
  }

  document.getElementById("quotes-list-container").addEventListener("change", (e) => {
    selectedQuoteId = e.target.value || null;
    const url = new URL(window.location);
    if (selectedQuoteId) {
      url.searchParams.set("id", selectedQuoteId);
    } else {
      url.searchParams.delete("id");
    }
    window.history.replaceState({}, "", url);
    renderQuotesList();
    renderQuoteDetail();
  });
  document.getElementById("filter-search").addEventListener("input", renderQuotesList);
  document.getElementById("filter-status").addEventListener("change", renderQuotesList);

  document.getElementById("btn-new-quote").addEventListener("click", () => openQuoteModal(null));
  document.getElementById("btn-close-form-modal").addEventListener("click", () => {
    document.getElementById("quote-form-modal").classList.add("hidden");
  });
  document.getElementById("btn-cancel-form").addEventListener("click", () => {
    document.getElementById("quote-form-modal").classList.add("hidden");
  });

  document.getElementById("quote-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const existingId = document.getElementById("form-id").value;
    const isNew = !existingId;
    const existingQuote = quotes.find((q) => q.id === existingId);

    const custo_base = Number(document.getElementById("form-custo").value || 0);
    const margem_percentual = Number(document.getElementById("form-margem").value || 0);
    const impostos_percentual = Number(document.getElementById("form-impostos").value || 0);
    const desconto = Number(document.getElementById("form-desconto").value || 0);

    const quoteObj = {
      id: existingId || `orc-${Date.now()}`,
      codigo: document.getElementById("form-codigo").value.trim(),
      status: document.getElementById("form-status").value,
      titulo: document.getElementById("form-titulo").value.trim(),
      cliente: document.getElementById("form-cliente").value.trim(),
      cnpj: document.getElementById("form-cnpj").value.trim(),
      orcamentista: document.getElementById("form-orcamentista").value.trim(),
      validade: document.getElementById("form-validade").value,
      custo_base,
      margem_percentual,
      impostos_percentual,
      desconto,
      valor_total: calcularValorTotal(custo_base, margem_percentual, impostos_percentual, desconto),
      observacoes: document.getElementById("form-observacoes").value.trim(),
      itens: existingQuote ? existingQuote.itens : [],
      historico: existingQuote
        ? [
            { data: nowFormatted(), acao: "Dados do orçamento atualizados" },
            ...existingQuote.historico
          ]
        : [{ data: nowFormatted(), acao: "Orçamento criado no sistema" }],
      created_at: existingQuote ? existingQuote.created_at : new Date().toISOString()
    };

    await saveQuoteToDB(quoteObj, isNew);
    selectedQuoteId = quoteObj.id;
    document.getElementById("quote-form-modal").classList.add("hidden");
    renderQuotesList();
    renderQuoteDetail();
  });
});