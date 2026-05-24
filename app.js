// ============================================
// ZYTRIX AI — APPLICATION ENGINE v2.1
// Cinematic Premium Edition
// fal.ai · 9-Variation Generation
// ============================================

const FAL_KEY      = "8fa5fe7f-472c-45b7-94f9-039b3715248c:0c9f4b76dace16a94b9c25ad882d26a0";
const FAL_ENDPOINT = "https://fal.run/fal-ai/flux/dev/image-to-image";

// ============================================
// STATE
// ============================================
const state = {
  userPhotoBase64:   null,
  userPhotoFile:     null,
  refPhotoBase64:    null,
  refPhotoFile:      null,
  instructions:      "",
  generatedImages:   [],
  isGenerating:      false,
  favorites:         new Set(),
  currentLightboxIndex: -1,
  lastParams:        null
};

// ============================================
// UPLOAD HANDLERS
// ============================================
document.getElementById("inputUserPhoto").addEventListener("change", function(e) {
  const file = e.target.files[0];
  if (!file) return;
  state.userPhotoFile = file;
  const reader = new FileReader();
  reader.onload = (ev) => {
    state.userPhotoBase64 = ev.target.result;
    document.getElementById("previewUserImg").src = ev.target.result;
    document.getElementById("previewUser").style.display = "block";
    document.getElementById("uploadUserCard").querySelector(".upload-inner").style.display = "none";
  };
  reader.readAsDataURL(file);
});

document.getElementById("inputRefPhoto").addEventListener("change", function(e) {
  const file = e.target.files[0];
  if (!file) return;
  state.refPhotoFile = file;
  const reader = new FileReader();
  reader.onload = (ev) => {
    state.refPhotoBase64 = ev.target.result;
    document.getElementById("previewRefImg").src = ev.target.result;
    document.getElementById("previewRef").style.display = "block";
    document.getElementById("uploadRefCard").querySelector(".upload-inner").style.display = "none";
  };
  reader.readAsDataURL(file);
});

function removeUpload(type) {
  if (type === 'user') {
    state.userPhotoBase64 = null;
    state.userPhotoFile   = null;
    document.getElementById("previewUser").style.display  = "none";
    document.getElementById("uploadUserCard").querySelector(".upload-inner").style.display = "flex";
    document.getElementById("inputUserPhoto").value = "";
  } else {
    state.refPhotoBase64 = null;
    state.refPhotoFile   = null;
    document.getElementById("previewRef").style.display  = "none";
    document.getElementById("uploadRefCard").querySelector(".upload-inner").style.display = "flex";
    document.getElementById("inputRefPhoto").value = "";
  }
}

// ============================================
// COUNTER + TAGS
// ============================================
function updateCounter(el) {
  state.instructions = el.value;
  document.getElementById("charCounter").textContent = `${el.value.length} / 500`;
  if (el.value.length > 10) updateParamsPreview(el.value);
}

function addTag(tag) {
  const textarea  = document.getElementById("instructionsInput");
  const current   = textarea.value.trim();
  textarea.value  = current ? current + ", " + tag : tag;
  state.instructions = textarea.value;
  updateCounter(textarea);
}

// ============================================
// PARAMS — Parse natural language → JSON
// ============================================
function parseInstructionsToParams(text) {
  const lower = text.toLowerCase();
  const p = {};

  // Background
  if (lower.includes("fundo preto") || lower.includes("black background"))
    p.background = "deep black seamless studio backdrop";
  else if (lower.includes("fundo branco") || lower.includes("white background"))
    p.background = "clean white studio backdrop";
  else if (lower.includes("fundo") || lower.includes("background"))
    p.background = "professional studio backdrop";

  // Lighting
  if (lower.includes("cinematográfica") || lower.includes("cinematica") || lower.includes("cinematic"))
    p.lighting = "cinematic Rembrandt studio lighting";
  else if (lower.includes("dramática") || lower.includes("dramatic"))
    p.lighting = "dramatic split lighting, deep shadows";
  else if (lower.includes("suave") || lower.includes("soft"))
    p.lighting = "soft diffused large softbox lighting";
  else if (lower.includes("lateral"))
    p.lighting = "dramatic side key light, broad shadow";
  else if (lower.includes("luz") || lower.includes("light"))
    p.lighting = "professional three-point studio lighting";

  // Clothing
  if (lower.includes("terno") || lower.includes("suit"))
    p.clothing = "premium tailored business suit";
  else if (lower.includes("executiv"))
    p.clothing = "high-end executive business attire";
  else if (lower.includes("médic") || lower.includes("doctor"))
    p.clothing = "professional white medical coat";
  else if (lower.includes("advogad") || lower.includes("lawyer"))
    p.clothing = "formal dark lawyer attire";
  else if (lower.includes("roupa elegante") || lower.includes("elegant"))
    p.clothing = "refined elegant professional clothing";

  // Expression
  if (lower.includes("séri") || lower.includes("confiante") || lower.includes("serious"))
    p.expression = "serious, authoritative, confident";
  else if (lower.includes("sorriso") || lower.includes("amigável"))
    p.expression = "warm professional smile";
  else if (lower.includes("expressão"))
    p.expression = "composed professional expression";

  // Quality
  if (lower.includes("ultra realista") || lower.includes("hyper"))
    p.quality = "hyperrealistic photography, 8K UHD, photorealistic skin detail";
  else if (lower.includes("fotográfica") || lower.includes("photographic"))
    p.quality = "photographic quality, Hasselblad medium format, 4K";
  else
    p.quality = "professional studio photography, high resolution, sharp";

  // Skin
  if (lower.includes("pele"))
    p.skin = lower.includes("natural")
      ? "natural refined skin texture, pores visible, photorealistic"
      : "smooth professional skin, soft retouching";

  // Pose
  if (lower.includes("pose corporativa") || lower.includes("corporate"))
    p.pose = "confident upright corporate pose";
  else if (lower.includes("pose") || lower.includes("postura"))
    p.pose = "strong professional posture";

  // Core constants
  p.style                      = "ultra photorealistic professional portrait photography";
  p.preserve_identity          = true;
  p.face_preservation_strength = 0.85;

  return p;
}

function updateParamsPreview(text) {
  const params    = parseInstructionsToParams(text);
  state.lastParams = params;
  const jsonEl    = document.getElementById("paramsJson");
  const emptyEl   = document.querySelector(".params-empty");
  jsonEl.innerHTML = syntaxHighlight(JSON.stringify(params, null, 2));
  jsonEl.style.display  = "block";
  emptyEl.style.display = "none";
}

function syntaxHighlight(json) {
  return json
    .replace(/"([^"]+)":/g, '<span style="color:var(--gold)">\"$1\"</span>:')
    .replace(/: "([^"]+)"/g, ': <span style="color:rgba(237,232,224,0.75)">\"$1\"</span>')
    .replace(/: (true|false)/g, ': <span style="color:#7ecfa4">$1</span>')
    .replace(/: ([0-9.]+)/g, ': <span style="color:var(--silver)">$1</span>');
}

// ============================================
// PROMPT BUILDER
// ============================================
function buildPrompt(params, seed) {
  const cinematicVariations = [
    "front on, sharp symmetrical lighting, editorial portrait",
    "slight right angle, dramatic Rembrandt shadow, moody atmosphere",
    "three-quarter view, cinematic bokeh background, luxury feel",
    "low camera angle, authority pose, strong key light from above",
    "profile lighting, artistic shadow play, high contrast",
    "close crop portrait, catch light in eyes, magazine quality",
    "environmental portrait framing, architectural background blur",
    "overhead key light, editorial fashion photography style",
    "broad lighting, open expression, professional headshot standard"
  ];

  const parts = [
    params.style  || "ultra photorealistic professional portrait photography",
    params.background  ? `background: ${params.background}` : "",
    params.lighting    ? `lighting setup: ${params.lighting}` : "",
    params.clothing    ? `wearing: ${params.clothing}` : "",
    params.expression  ? `expression: ${params.expression}` : "",
    params.skin        ? `skin rendering: ${params.skin}` : "",
    params.pose        ? `pose: ${params.pose}` : "",
    params.quality     || "photorealistic, high resolution",
    cinematicVariations[seed % cinematicVariations.length],
    "preserve exact facial identity, preserve all facial features, realistic proportions, natural body",
    "studio photograph, NOT digital art, NOT painting, NOT illustration, 100% photorealistic"
  ].filter(Boolean).join(", ");

  return parts;
}

// ============================================
// FAL.AI API
// ============================================
async function generateSingleImage(imageBase64, prompt, index) {
  const payload = {
    image_url:            imageBase64,
    prompt:               prompt,
    num_inference_steps:  28,
    guidance_scale:       7.5,
    strength:             0.55,
    seed:                 Math.floor(Math.random() * 9999999) + index * 1337,
    image_size:           "portrait_4_3",
    num_images:           1,
    enable_safety_checker: false
  };

  const response = await fetch(FAL_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Key ${FAL_KEY}`,
      "Content-Type":  "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`FAL ${response.status}: ${errText.slice(0, 120)}`);
  }

  const data = await response.json();

  if (data.images && data.images.length > 0) return data.images[0].url;
  if (data.image && data.image.url)           return data.image.url;
  throw new Error("No image in fal.ai response");
}

// ============================================
// MAIN GENERATION
// ============================================
async function startGeneration() {
  if (state.isGenerating) return;

  if (!state.userPhotoBase64) {
    showToast("⚠  Envie uma foto do usuário antes de gerar.");
    return;
  }
  if (!state.instructions.trim() && !state.refPhotoBase64) {
    showToast("⚠  Adicione instruções ou uma imagem de referência.");
    return;
  }

  state.isGenerating    = true;
  state.generatedImages = [];

  const btn = document.getElementById("generateBtn");
  btn.disabled = true;
  btn.querySelector(".gen-label").textContent = "GERANDO...";

  if (state.instructions.trim()) updateParamsPreview(state.instructions);
  const params = state.lastParams || parseInstructionsToParams(state.instructions || "professional portrait");

  buildGrid();
  showProgress(true);

  const total   = 9;
  let completed = 0;
  const batches = [[0,1,2],[3,4,5],[6,7,8]];

  for (const batch of batches) {
    await Promise.all(batch.map(async (i) => {
      const prompt = buildPrompt(params, i);
      updateCellLoading(i, true);
      logProgress(`Processando variação ${i + 1} de ${total}...`);
      try {
        const url = await generateSingleImage(state.userPhotoBase64, prompt, i);
        state.generatedImages[i] = url;
        setCellImage(i, url);
      } catch (err) {
        console.error(`Variation ${i+1}:`, err);
        setCellError(i, err.message);
      } finally {
        completed++;
        updateProgress(completed, total);
      }
    }));
  }

  state.isGenerating = false;
  btn.disabled = false;
  btn.querySelector(".gen-label").textContent = "GERAR IMAGENS";
  showProgress(false);
  document.getElementById("refineBlock").style.display   = "block";
  document.getElementById("resultActions").style.display = "flex";
  logProgress(`✓ Geração concluída — ${completed} variações prontas.`);
}

// ============================================
// GRID BUILDER
// ============================================
function buildGrid() {
  const container = document.getElementById("gridContainer");
  container.innerHTML = `<div class="image-grid" id="imageGrid"></div>`;
  const grid = document.getElementById("imageGrid");

  for (let i = 0; i < 9; i++) {
    const cell     = document.createElement("div");
    cell.className = "image-cell";
    cell.id        = `cell-${i}`;
    cell.style.animationDelay = `${i * 0.055}s`;
    cell.innerHTML = `
      <div class="cell-loading" id="loading-${i}">
        <div class="cell-spinner"></div>
        <div class="cell-loading-text">VARIAÇÃO ${i + 1}</div>
      </div>
      <span class="cell-num">${String(i + 1).padStart(2, '0')}</span>
    `;
    grid.appendChild(cell);
  }
}

function updateCellLoading(i, show) {
  const el = document.getElementById(`loading-${i}`);
  if (el) el.style.display = show ? "flex" : "none";
}

function setCellImage(i, url) {
  const cell = document.getElementById(`cell-${i}`);
  if (!cell) return;
  updateCellLoading(i, false);

  const img   = document.createElement("img");
  img.src     = url;
  img.alt     = `Variação ${i + 1}`;
  img.loading = "lazy";

  const overlay   = document.createElement("div");
  overlay.className = "cell-overlay";
  overlay.innerHTML = `
    <div class="cell-actions">
      <button class="cell-btn" onclick="openLightbox(${i})">⤢ AMPLIAR</button>
      <button class="cell-btn" onclick="downloadImage(${i})">↓ BAIXAR</button>
      <button class="cell-btn" onclick="redoSingle(${i})">↺ REFAZER</button>
      <button class="cell-btn fav-btn" id="fav-${i}" onclick="toggleFavorite(${i})">♡ FAV</button>
    </div>
  `;

  cell.appendChild(img);
  cell.appendChild(overlay);
  cell.style.animationDelay = "0s";
}

function setCellError(i, msg) {
  const cell = document.getElementById(`cell-${i}`);
  if (!cell) return;
  updateCellLoading(i, false);
  cell.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px;padding:16px;text-align:center">
      <span style="color:var(--gold-dim);font-size:18px;opacity:0.6">✕</span>
      <span style="font-family:var(--mono);font-size:8px;color:rgba(237,232,224,0.25);letter-spacing:1px">FALHA — VARIAÇÃO ${i+1}</span>
      <button class="cell-btn" onclick="redoSingle(${i})" style="margin-top:4px">↺ TENTAR NOVAMENTE</button>
    </div>
  `;
}

// ============================================
// PROGRESS
// ============================================
function showProgress(show) {
  document.getElementById("progressBlock").style.display = show ? "block" : "none";
}

function updateProgress(done, total) {
  const pct = Math.round((done / total) * 100);
  document.getElementById("progressFill").style.width     = pct + "%";
  document.getElementById("progressCount").textContent = `${done} / ${total}`;
}

function logProgress(msg) {
  document.getElementById("progressLog").textContent = msg;
}

// ============================================
// LIGHTBOX
// ============================================
function openLightbox(i) {
  const url = state.generatedImages[i];
  if (!url) return;
  state.currentLightboxIndex = i;
  document.getElementById("lightboxImg").src     = url;
  document.getElementById("lightboxInfo").textContent = `VARIAÇÃO ${String(i+1).padStart(2,'0')}  ·  ZYTRIX AI`;
  document.getElementById("lightbox").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLightbox(e) {
  if (e && e.target !== document.getElementById("lightbox") && !e.target.classList.contains("lightbox-close")) return;
  document.getElementById("lightbox").classList.remove("active");
  document.body.style.overflow = "";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("lightbox").classList.remove("active");
    document.body.style.overflow = "";
  }
});

function downloadLightbox()   { const i = state.currentLightboxIndex; if (i >= 0) downloadImage(i); }
function favoriteFromLightbox(){ const i = state.currentLightboxIndex; if (i >= 0) toggleFavorite(i); }
function redoVariation()      { const i = state.currentLightboxIndex; if (i >= 0) { closeLightbox(); redoSingle(i); } }

// ============================================
// FAVORITES
// ============================================
function toggleFavorite(i) {
  const btn = document.getElementById(`fav-${i}`);
  if (state.favorites.has(i)) {
    state.favorites.delete(i);
    if (btn) { btn.classList.remove("fav-active"); btn.textContent = "♡ FAV"; }
  } else {
    state.favorites.add(i);
    if (btn) { btn.classList.add("fav-active"); btn.textContent = "♥ FAV"; }
    showToast(`♥  Variação ${i+1} adicionada aos favoritos`);
  }
}

// ============================================
// DOWNLOAD
// ============================================
function downloadImage(i) {
  const url = state.generatedImages[i];
  if (!url) return;
  const a       = document.createElement("a");
  a.href        = url;
  a.download    = `zytrix-portrait-${String(i+1).padStart(2,'0')}.jpg`;
  a.target      = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadAll() {
  state.generatedImages.forEach((url, i) => {
    if (url) setTimeout(() => downloadImage(i), i * 280);
  });
}

// ============================================
// REDO SINGLE
// ============================================
async function redoSingle(i) {
  if (!state.userPhotoBase64) return;
  const params = state.lastParams || parseInstructionsToParams(state.instructions || "professional portrait");
  const prompt = buildPrompt(params, i + Math.floor(Math.random() * 200));
  setCellLoadingState(i);
  try {
    const url = await generateSingleImage(state.userPhotoBase64, prompt, i + 500);
    state.generatedImages[i] = url;
    setCellImage(i, url);
  } catch(err) {
    setCellError(i, err.message);
  }
}

function setCellLoadingState(i) {
  const cell = document.getElementById(`cell-${i}`);
  if (!cell) return;
  cell.innerHTML = `
    <div class="cell-loading" id="loading-${i}">
      <div class="cell-spinner"></div>
      <div class="cell-loading-text">REFAZENDO ${i+1}</div>
    </div>
    <span class="cell-num">${String(i+1).padStart(2,'0')}</span>
  `;
}

// ============================================
// REFINE
// ============================================
async function refineGeneration() {
  const refineText = document.getElementById("refineInput").value.trim();
  if (!refineText) return;
  const merged    = (state.instructions ? state.instructions + ", " : "") + interpretRefinement(refineText);
  const textarea  = document.getElementById("instructionsInput");
  textarea.value  = merged;
  state.instructions = merged;
  updateCounter(textarea);
  document.getElementById("refineInput").value = "";
  showToast("↺  Reinterpretando e regerando...");
  await startGeneration();
}

function interpretRefinement(text) {
  const lower = text.toLowerCase();
  const map = {
    "mais elegante":      "elegant refined high-end aesthetic, sophisticated",
    "mais escuro":        "darker tones, moody low-key atmosphere, deep shadows",
    "mais claro":         "brighter high-key exposure, clean open light",
    "luz mais forte":     "stronger key light, high contrast, bold dramatic lighting",
    "mais contrastado":   "high contrast, deep blacks, bright highlights",
    "mais natural":       "natural ambient lighting, organic unprocessed feel",
    "mais profissional":  "corporate executive style, polished professional",
    "mais moderno":       "contemporary editorial style, modern aesthetic",
    "mais sóbrio":        "understated elegance, minimal refined aesthetic",
    "fundo mais escuro":  "very dark near-black background, minimal detail",
    "mais nítido":        "ultra sharp tack focus, maximum micro-detail"
  };
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) return val;
  }
  return text;
}

// ============================================
// CLEAR
// ============================================
function clearResults() {
  state.generatedImages = [];
  state.favorites.clear();
  document.getElementById("gridContainer").innerHTML = `
    <div class="grid-placeholder">
      <div class="placeholder-icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.7" opacity="0.25">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>
      <div class="placeholder-text">AGUARDANDO GERAÇÃO</div>
      <div class="placeholder-sub">Configure os parâmetros e clique em GERAR IMAGENS</div>
      <div class="placeholder-grid-preview">
        <div class="ph-cell"></div><div class="ph-cell"></div><div class="ph-cell"></div>
        <div class="ph-cell"></div><div class="ph-cell"></div><div class="ph-cell"></div>
        <div class="ph-cell"></div><div class="ph-cell"></div><div class="ph-cell"></div>
      </div>
    </div>
  `;
  document.getElementById("resultActions").style.display = "none";
  document.getElementById("refineBlock").style.display   = "none";
}

// ============================================
// TOAST
// ============================================
function showToast(msg) {
  document.querySelector(".zytrix-toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "zytrix-toast";
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%) translateY(16px);
    background: #0f0f14;
    border: 1px solid rgba(201,168,76,0.3);
    color: rgba(237,232,224,0.8);
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 1.5px;
    padding: 11px 22px;
    border-radius: 3px;
    z-index: 9999;
    opacity: 0;
    transition: all 0.3s ease;
    white-space: nowrap;
    box-shadow: 0 8px 40px rgba(0,0,0,0.7), 0 0 20px rgba(201,168,76,0.08);
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity   = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  });
  setTimeout(() => {
    toast.style.opacity   = "0";
    toast.style.transform = "translateX(-50%) translateY(8px)";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ============================================
// INIT
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  // Live param preview
  document.getElementById("instructionsInput").addEventListener("input", function() {
    if (this.value.length > 5) updateParamsPreview(this.value);
  });

  // Drag-and-drop
  document.querySelectorAll(".upload-card").forEach((card, idx) => {
    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      card.style.borderColor = "var(--border-gold)";
    });
    card.addEventListener("dragleave", () => {
      card.style.borderColor = "";
    });
    card.addEventListener("drop", (e) => {
      e.preventDefault();
      card.style.borderColor = "";
      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith("image/")) return;
      const inputId = idx === 0 ? "inputUserPhoto" : "inputRefPhoto";
      const input   = document.getElementById(inputId);
      const dt      = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event("change"));
    });
  });

  console.log(
    "%c ZYTRIX AI v2.1 — CINEMATIC EDITION ",
    "background:#c9a84c;color:#060608;font-family:monospace;font-size:13px;padding:4px 10px;border-radius:2px;"
  );
});
