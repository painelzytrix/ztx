// ─────────────────────────────────────────────────────────────
//  ZYTRIX AI — app.js
//  Frontend puro — sem chave de API exposta
//  Todas as chamadas vão para o Cloudflare Worker
// ─────────────────────────────────────────────────────────────

// ── CONFIGURE AQUI: URL do seu Cloudflare Worker ──
const WORKER_URL = "https://twilight-hall-cb6a.arllisonmarinho1.workers.dev";

// ── STATE ──
const state = {
  fotoBase64: null,
  fotoMime: null,
  refBase64: null,
  refMime: null,
  activeTab: "foto-ref",
  qty: 3,
  modoTeste: false,
  generating: false,
  generatedImages: []
};

// ── ATALHOS ──
const ATALHOS = [
  { label: "Advogado",   prompt: "advogado sentado em escritório premium, terno escuro impecável, postura séria e confiante, fundo escuro desfocado, iluminação cinematográfica lateral" },
  { label: "Médico",     prompt: "médico profissional com jaleco branco imaculado, consultório moderno ao fundo, iluminação suave e clínica, expressão confiante" },
  { label: "Empresária", prompt: "empresária executiva, blazer elegante, ambiente corporativo moderno, luz natural lateral, composição editorial fashion" },
  { label: "Executivo",  prompt: "executivo corporativo, terno premium, escritório de vidro ao fundo, iluminação cinematográfica, postura poderosa" },
  { label: "Dentista",   prompt: "dentista profissional com jaleco, clínica moderna e sofisticada, sorriso confiante, iluminação clean" },
  { label: "Consultor",  prompt: "consultor de negócios, visual smart-casual premium, sala de reunião moderna, iluminação suave" },
  { label: "Corretor",   prompt: "corretor de imóveis, traje social elegante, ambiente premium, sorriso profissional" },
  { label: "Engenheiro", prompt: "engenheiro profissional, visual técnico premium, escritório de projetos moderno, postura competente" },
  { label: "Psicólogo",  prompt: "psicólogo em consultório sofisticado, expressão empática e calma, iluminação suave e acolhedora" },
  { label: "Professor",  prompt: "professor universitário, biblioteca moderna ao fundo, visual intelectual elegante, postura didática" }
];

// ── INIT ──
document.addEventListener("DOMContentLoaded", () => {
  buildShortcuts();
  bindEvents();
});

// ── ATALHOS ──
function buildShortcuts() {
  const wrap = document.getElementById("shortcuts");
  ATALHOS.forEach(item => {
    const btn = document.createElement("button");
    btn.className = "shortcut";
    btn.textContent = item.label;
    btn.addEventListener("click", () => {
      const ta = document.getElementById("textoInput");
      ta.value = item.prompt;
      ta.focus();
    });
    wrap.appendChild(btn);
  });
}

// ── EVENTOS ──
function bindEvents() {
  document.getElementById("fotoInput").addEventListener("change", e => handleUpload(e, "foto"));
  document.getElementById("refInput").addEventListener("change", e => handleUpload(e, "ref"));

  setupDragDrop("uploadArea1", "foto");
  setupDragDrop("uploadArea2", "ref");

  document.querySelectorAll(".tab").forEach(t =>
    t.addEventListener("click", () => switchTab(t.dataset.tab))
  );

  document.querySelectorAll(".qty-btn").forEach(b =>
    b.addEventListener("click", () => {
      document.querySelectorAll(".qty-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      state.qty = parseInt(b.dataset.qty);
    })
  );

  document.getElementById("modoTeste").addEventListener("change", e => {
    state.modoTeste = e.target.checked;
  });

  document.getElementById("clearJohnson").addEventListener("click", () => {
    document.getElementById("johnsonInput").value = "";
  });

  document.getElementById("clearTexto").addEventListener("click", () => {
    document.getElementById("textoInput").value = "";
  });

  document.getElementById("btnGerar").addEventListener("click", handleGerar);
  document.getElementById("btnDownloadAll").addEventListener("click", downloadAll);
}

// ── UPLOAD ──
function handleUpload(e, tipo) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { showError("Apenas imagens são aceitas."); return; }
  if (file.size > 5 * 1024 * 1024) { showError("Imagem muito grande. Use até 5MB."); return; }

  const reader = new FileReader();
  reader.onload = ev => {
    const base64 = ev.target.result.split(",")[1];
    if (tipo === "foto") {
      state.fotoBase64 = base64;
      state.fotoMime = file.type;
      showPreview("fotoPreview", "fotoName", ev.target.result, file.name);
      document.getElementById("card-foto").classList.add("active");
    } else {
      state.refBase64 = base64;
      state.refMime = file.type;
      showPreview("refPreview", "refName", ev.target.result, file.name);
    }
  };
  reader.readAsDataURL(file);
}

function showPreview(previewId, nameId, src, name) {
  const img = document.getElementById(previewId);
  img.src = src;
  img.style.display = "block";
  const nameEl = document.getElementById(nameId);
  nameEl.textContent = "✓ " + name;
  nameEl.style.display = "block";
}

// ── DRAG & DROP ──
function setupDragDrop(areaId, tipo) {
  const area = document.getElementById(areaId);
  area.addEventListener("dragover", e => { e.preventDefault(); area.classList.add("drag"); });
  area.addEventListener("dragleave", () => area.classList.remove("drag"));
  area.addEventListener("drop", e => {
    e.preventDefault();
    area.classList.remove("drag");
    const file = e.dataTransfer.files[0];
    if (file) handleUpload({ target: { files: [file] } }, tipo);
  });
}

// ── TABS ──
function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.id === "tab-" + tab));
}

// ── ERRO ──
function showError(msg) {
  const box = document.getElementById("errorBox");
  box.textContent = "⚠ " + msg;
  box.style.display = "block";
  setTimeout(() => { box.style.display = "none"; }, 8000);
}

function hideError() {
  document.getElementById("errorBox").style.display = "none";
}

// ── STATUS BAR ──
function setStatus(current, total) {
  const bar = document.getElementById("statusBar");
  const fill = document.getElementById("statusFill");
  bar.style.display = "block";
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  fill.style.width = pct + "%";
}

function hideStatus() {
  document.getElementById("statusBar").style.display = "none";
  document.getElementById("statusFill").style.width = "0%";
}

// ── CHAMAR WORKER /analyze ──
async function callAnalyze(variationIndex) {
  const contexto = state.activeTab === "johnson"
    ? document.getElementById("johnsonInput").value.trim()
    : state.activeTab === "texto"
      ? document.getElementById("textoInput").value.trim()
      : "";

  const body = {
    fotoBase64: state.fotoBase64,
    fotoMime: state.fotoMime,
    activeTab: state.activeTab,
    variationIndex,
    contexto
  };

  if (state.activeTab === "foto-ref" && state.refBase64) {
    body.refBase64 = state.refBase64;
    body.refMime = state.refMime;
  }

  const resp = await fetch(`${WORKER_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Erro no servidor" }));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }

  const data = await resp.json();
  return data.description;
}

// ── CHAMAR WORKER /generate ──
async function callGenerate(description, index) {
  const resp = await fetch(`${WORKER_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, index })
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Erro ao gerar imagem" }));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }

  const data = await resp.json();
  return data.imageUrl;
}

// ── PRÉ-CARREGAR IMAGEM ──
function preloadImage(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = url;
    setTimeout(resolve, 35000);
  });
}

// ── HANDLER PRINCIPAL ──
async function handleGerar() {
  hideError();
  hideStatus();

  if (!state.fotoBase64) {
    showError("Envie a foto principal antes de gerar (Bloco 1 é obrigatório).");
    return;
  }

  if (state.generating) return;
  state.generating = true;
  state.generatedImages = [];

  const btn = document.getElementById("btnGerar");
  const btnLabel = document.getElementById("btnLabel");
  btn.disabled = true;
  btnLabel.textContent = "⏳ Iniciando...";

  const resultSection = document.getElementById("resultSection");
  const grid = document.getElementById("imageGrid");
  resultSection.style.display = "block";
  grid.innerHTML = "";
  document.getElementById("resultTitle").textContent = `Gerando ${state.qty} imagens...`;

  // Criar placeholders
  const placeholders = [];
  for (let i = 0; i < state.qty; i++) {
    const ph = createPlaceholderCard(i);
    grid.appendChild(ph);
    placeholders.push(ph);
  }

  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });

  let successCount = 0;

  for (let i = 0; i < state.qty; i++) {
    try {
      btnLabel.textContent = `⏳ Imagem ${i + 1} de ${state.qty}`;
      setStatus(i, state.qty);

      // Passo 1: Claude analisa e descreve
      const description = await callAnalyze(i);

      // Passo 2: Worker retorna URL da imagem
      const imageUrl = await callGenerate(description, i);

      // Passo 3: Aguarda imagem carregar
      await preloadImage(imageUrl);

      state.generatedImages[i] = imageUrl;
      const card = createImageCard(imageUrl, i, state.modoTeste);
      placeholders[i].replaceWith(card);
      successCount++;

    } catch (err) {
      console.error(`[ZYTRIX] Imagem ${i + 1} falhou:`, err);
      placeholders[i].replaceWith(createErrorCard(i, err.message));
    }
  }

  setStatus(state.qty, state.qty);

  document.getElementById("resultTitle").textContent =
    successCount === state.qty
      ? `✓ ${state.qty} imagens geradas`
      : `${successCount} de ${state.qty} imagens geradas`;

  setTimeout(hideStatus, 1200);
  btn.disabled = false;
  btnLabel.textContent = "⚡ GERAR IMAGENS";
  state.generating = false;
}

// ── PLACEHOLDER ──
function createPlaceholderCard(index) {
  const card = document.createElement("div");
  card.className = "img-card";
  card.id = `ph-${index}`;
  card.innerHTML = `
    <div class="img-card-placeholder">
      <div class="spin"></div>
      <span>Gerando</span>
    </div>
  `;
  return card;
}

// ── CARD COM IMAGEM ──
function createImageCard(imageUrl, index, watermark) {
  const card = document.createElement("div");
  card.className = "img-card";

  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:relative; overflow:hidden;";

  const img = document.createElement("img");
  img.src = imageUrl;
  img.alt = `Imagem ${index + 1}`;
  img.loading = "lazy";

  wrapper.appendChild(img);

  if (watermark) {
    const wm = document.createElement("div");
    wm.className = "watermark-overlay";
    wm.innerHTML = `<span class="watermark-text">ZYTRIX AI</span>`;
    wrapper.appendChild(wm);
  }

  const actions = document.createElement("div");
  actions.className = "img-card-actions";

  const dlBtn = document.createElement("button");
  dlBtn.className = "img-action-btn";
  dlBtn.textContent = "⬇ Baixar";
  dlBtn.addEventListener("click", () => downloadImage(imageUrl, `zytrix-${index + 1}.jpg`));

  const regenBtn = document.createElement("button");
  regenBtn.className = "img-action-btn";
  regenBtn.textContent = "↺ Gerar";
  regenBtn.addEventListener("click", () => regenerateOne(card, index));

  actions.appendChild(dlBtn);
  actions.appendChild(regenBtn);
  card.appendChild(wrapper);
  card.appendChild(actions);

  return card;
}

// ── REGENERAR UMA ──
async function regenerateOne(card, index) {
  if (!state.fotoBase64 || state.generating) return;
  state.generating = true;

  const ph = createPlaceholderCard(index);
  card.replaceWith(ph);

  try {
    const offset = index + Math.floor(Math.random() * 100);
    const description = await callAnalyze(offset);
    const imageUrl = await callGenerate(description, offset + Date.now());
    await preloadImage(imageUrl);
    state.generatedImages[index] = imageUrl;
    ph.replaceWith(createImageCard(imageUrl, index, state.modoTeste));
  } catch (err) {
    ph.replaceWith(createErrorCard(index, err.message));
  }

  state.generating = false;
}

// ── CARD ERRO ──
function createErrorCard(index, message) {
  const card = document.createElement("div");
  card.className = "img-card";
  const msg = (message || "Erro desconhecido").substring(0, 100);
  card.innerHTML = `
    <div class="img-card-placeholder" style="padding:16px;">
      <span style="font-size:20px; opacity:0.6;">✕</span>
      <span style="color:#ff5555; font-size:9px; text-align:center; line-height:1.6; font-weight:700; letter-spacing:0.5px;">${msg}</span>
    </div>
  `;
  return card;
}

// ── DOWNLOAD INDIVIDUAL ──
function downloadImage(url, filename) {
  fetch(url, { mode: "cors" })
    .then(r => r.blob())
    .then(blob => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    })
    .catch(() => {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
}

// ── BAIXAR TODAS ──
async function downloadAll() {
  const imgs = document.querySelectorAll(".img-card img");
  if (!imgs.length) return;

  const btn = document.getElementById("btnDownloadAll");
  btn.disabled = true;
  btn.textContent = "⏳ Baixando...";

  let count = 0;
  for (const img of imgs) {
    if (img.src && img.complete && !img.src.startsWith("data:")) {
      count++;
      downloadImage(img.src, `zytrix-${count}.jpg`);
      await new Promise(r => setTimeout(r, 800));
    }
  }

  btn.disabled = false;
  btn.textContent = "⬇ Baixar Todas";
}
