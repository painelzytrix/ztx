// ============================================
// ZYTRIX AI — APPLICATION ENGINE
// fal.ai Integration · 9-Variation Generation
// ============================================

const FAL_KEY = "8fa5fe7f-472c-45b7-94f9-039b3715248c:0c9f4b76dace16a94b9c25ad882d26a0";
const FAL_ENDPOINT = "https://fal.run/fal-ai/flux/dev/image-to-image";

// ============================================
// STATE
// ============================================
const state = {
  userPhotoBase64: null,
  userPhotoFile: null,
  refPhotoBase64: null,
  refPhotoFile: null,
  instructions: "",
  generatedImages: [],
  isGenerating: false,
  favorites: new Set(),
  currentLightboxIndex: -1,
  lastParams: null
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
    state.userPhotoFile = null;
    document.getElementById("previewUser").style.display = "none";
    document.getElementById("uploadUserCard").querySelector(".upload-inner").style.display = "flex";
    document.getElementById("inputUserPhoto").value = "";
  } else {
    state.refPhotoBase64 = null;
    state.refPhotoFile = null;
    document.getElementById("previewRef").style.display = "none";
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
  if (el.value.length > 10) {
    updateParamsPreview(el.value);
  }
}

function addTag(tag) {
  const textarea = document.getElementById("instructionsInput");
  const current = textarea.value.trim();
  textarea.value = current ? current + ", " + tag : tag;
  state.instructions = textarea.value;
  updateCounter(textarea);
}

// ============================================
// PARAMS PREVIEW — Parse instructions into JSON
// ============================================
function parseInstructionsToParams(text) {
  const lower = text.toLowerCase();
  const params = {};

  // Background
  if (lower.includes("fundo preto") || lower.includes("black background")) {
    params.background = "deep black studio";
  } else if (lower.includes("fundo branco") || lower.includes("white background")) {
    params.background = "clean white studio";
  } else if (lower.includes("fundo") || lower.includes("background")) {
    const bgMatch = text.match(/fundo\s+([\w\s]+?)(?:,|$)/i) || text.match(/background\s+([\w\s]+?)(?:,|$)/i);
    params.background = bgMatch ? bgMatch[1].trim() : "studio background";
  }

  // Lighting
  if (lower.includes("cinematográfica") || lower.includes("cinematica") || lower.includes("cinematic")) {
    params.lighting = "cinematic studio lighting";
  } else if (lower.includes("dramática") || lower.includes("dramatic")) {
    params.lighting = "dramatic side lighting";
  } else if (lower.includes("suave") || lower.includes("soft")) {
    params.lighting = "soft diffused studio light";
  } else if (lower.includes("luz") || lower.includes("light")) {
    params.lighting = "professional studio lighting";
  }

  // Clothing
  if (lower.includes("terno") || lower.includes("suit")) {
    params.clothing = "premium business suit";
  } else if (lower.includes("executiv")) {
    params.clothing = "executive business attire";
  } else if (lower.includes("médic") || lower.includes("doctor")) {
    params.clothing = "professional medical coat";
  } else if (lower.includes("advogad") || lower.includes("lawyer")) {
    params.clothing = "formal lawyer attire";
  } else if (lower.includes("roupa") || lower.includes("vestido")) {
    params.clothing = "elegant professional clothing";
  }

  // Expression
  if (lower.includes("séri") || lower.includes("serious") || lower.includes("confiante")) {
    params.expression = "serious, confident, professional";
  } else if (lower.includes("suave") || lower.includes("amigável") || lower.includes("sorriso")) {
    params.expression = "warm, friendly smile";
  } else if (lower.includes("expressão")) {
    params.expression = "professional expression";
  }

  // Quality
  if (lower.includes("ultra realista") || lower.includes("hyper realistic")) {
    params.quality = "hyperrealistic photography, 8K, photorealistic";
  } else if (lower.includes("fotográfica") || lower.includes("photographic")) {
    params.quality = "photographic quality, DSLR, 4K";
  } else {
    params.quality = "professional photography, high resolution";
  }

  // Skin
  if (lower.includes("pele") || lower.includes("skin")) {
    params.skin = lower.includes("natural") ? "natural refined skin texture" : "smooth professional skin";
  }

  // Pose
  if (lower.includes("pose corporativa") || lower.includes("corporate pose")) {
    params.pose = "corporate professional pose";
  } else if (lower.includes("pose") || lower.includes("postura")) {
    params.pose = "confident upright pose";
  }

  // Style
  params.style = "ultra photorealistic studio portrait photography";
  params.preserve_identity = true;
  params.face_preservation_strength = 0.85;

  return params;
}

function updateParamsPreview(text) {
  const params = parseInstructionsToParams(text);
  state.lastParams = params;
  const jsonEl = document.getElementById("paramsJson");
  const emptyEl = document.querySelector(".params-empty");
  const formatted = JSON.stringify(params, null, 2);
  jsonEl.innerHTML = syntaxHighlight(formatted);
  jsonEl.style.display = "block";
  emptyEl.style.display = "none";
}

function syntaxHighlight(json) {
  return json
    .replace(/"([^"]+)":/g, '<span style="color:#e50914">\"$1\"</span>:')
    .replace(/: "([^"]+)"/g, ': <span style="color:rgba(245,245,245,0.7)">\"$1\"</span>')
    .replace(/: (true|false)/g, ': <span style="color:#00ff88">$1</span>')
    .replace(/: ([0-9.]+)/g, ': <span style="color:#ff9900">$1</span>');
}

// ============================================
// BUILD PROMPT FROM PARAMS
// ============================================
function buildPrompt(params, variationSeed) {
  const variations = [
    "sharp focus, front lighting",
    "slight angle right, dramatic shadows",
    "soft background bokeh, warm fill",
    "three-quarter view, bold contrast",
    "profile lighting, cinematic mood",
    "overhead key light, editorial style",
    "low key lighting, luxury feel",
    "natural window light simulation",
    "studio strobe, maximum detail"
  ];

  const base = [
    params.style || "ultra photorealistic studio portrait photography",
    params.background ? `background: ${params.background}` : "",
    params.lighting ? `lighting: ${params.lighting}` : "",
    params.clothing ? `wearing: ${params.clothing}` : "",
    params.expression ? `expression: ${params.expression}` : "",
    params.skin ? `skin: ${params.skin}` : "",
    params.pose ? `pose: ${params.pose}` : "",
    params.quality || "photorealistic, 8K, professional",
    variations[variationSeed % variations.length],
    "preserve facial identity, preserve facial features, realistic proportions",
    "professional studio photograph, not digital art, not painting, photorealistic"
  ].filter(Boolean).join(", ");

  return base;
}

// ============================================
// FAL.AI API CALL
// ============================================
async function generateSingleImage(imageBase64, prompt, index) {
  const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
  const mimeMatch = imageBase64.match(/data:([^;]+);/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  const payload = {
    image_url: imageBase64,
    prompt: prompt,
    num_inference_steps: 28,
    guidance_scale: 7.5,
    strength: 0.55,
    seed: Math.floor(Math.random() * 9999999) + index * 1000,
    image_size: "portrait_4_3",
    num_images: 1,
    enable_safety_checker: false
  };

  const response = await fetch(FAL_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Key ${FAL_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`FAL API error ${response.status}: ${errText}`);
  }

  const data = await response.json();

  // fal.ai returns images array
  if (data.images && data.images.length > 0) {
    return data.images[0].url;
  } else if (data.image && data.image.url) {
    return data.image.url;
  } else {
    throw new Error("No image returned from fal.ai");
  }
}

// ============================================
// MAIN GENERATION FLOW
// ============================================
async function startGeneration() {
  if (state.isGenerating) return;

  if (!state.userPhotoBase64) {
    showToast("⚠ Envie uma foto do usuário antes de gerar.");
    return;
  }

  if (!state.instructions.trim() && !state.refPhotoBase64) {
    showToast("⚠ Adicione instruções ou uma imagem de referência.");
    return;
  }

  state.isGenerating = true;
  state.generatedImages = [];

  const btn = document.getElementById("generateBtn");
  btn.disabled = true;
  btn.querySelector(".gen-label").textContent = "GERANDO...";

  // Parse params if not already done
  if (state.instructions.trim()) {
    updateParamsPreview(state.instructions);
  }

  const params = state.lastParams || parseInstructionsToParams(state.instructions || "professional portrait");

  // Build grid
  buildGrid();
  showProgress(true);

  const total = 9;
  let completed = 0;

  // Generate all 9 in parallel (batched 3 at a time to avoid rate limits)
  const batches = [[0,1,2], [3,4,5], [6,7,8]];

  for (const batch of batches) {
    const promises = batch.map(async (i) => {
      const prompt = buildPrompt(params, i);
      updateCellLoading(i, true);
      logProgress(`Gerando variação ${i + 1}...`);

      try {
        const imageUrl = await generateSingleImage(state.userPhotoBase64, prompt, i);
        state.generatedImages[i] = imageUrl;
        setCellImage(i, imageUrl);
        completed++;
        updateProgress(completed, total);
      } catch (err) {
        console.error(`Variation ${i+1} failed:`, err);
        setCellError(i, err.message);
        completed++;
        updateProgress(completed, total);
      }
    });

    await Promise.all(promises);
  }

  // Done
  state.isGenerating = false;
  btn.disabled = false;
  btn.querySelector(".gen-label").textContent = "GERAR IMAGENS";
  showProgress(false);
  document.getElementById("refineBlock").style.display = "block";
  document.getElementById("resultActions").style.display = "flex";
  logProgress(`✓ ${completed} variações geradas com sucesso.`);
}

// ============================================
// GRID BUILDER
// ============================================
function buildGrid() {
  const container = document.getElementById("gridContainer");
  container.innerHTML = `<div class="image-grid" id="imageGrid"></div>`;

  const grid = document.getElementById("imageGrid");
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "image-cell";
    cell.id = `cell-${i}`;
    cell.style.animationDelay = `${i * 0.06}s`;
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
  const loading = document.getElementById(`loading-${i}`);
  if (loading) loading.style.display = show ? "flex" : "none";
}

function setCellImage(i, url) {
  const cell = document.getElementById(`cell-${i}`);
  if (!cell) return;
  updateCellLoading(i, false);

  const img = document.createElement("img");
  img.src = url;
  img.alt = `Variação ${i + 1}`;
  img.loading = "lazy";

  const overlay = document.createElement("div");
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
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px;padding:16px;text-align:center">
      <span style="color:var(--red);font-size:20px">✕</span>
      <span style="font-family:var(--mono);font-size:9px;color:rgba(245,245,245,0.3);letter-spacing:1px">FALHA NA VARIAÇÃO ${i+1}</span>
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
  document.getElementById("progressFill").style.width = pct + "%";
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
  document.getElementById("lightboxImg").src = url;
  document.getElementById("lightboxInfo").textContent = `VARIAÇÃO ${String(i + 1).padStart(2, '0')} · ZYTRIX AI`;
  document.getElementById("lightbox").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLightbox(e) {
  if (e && e.target !== document.getElementById("lightbox") && !e.target.classList.contains("lightbox-close")) return;
  if (!e) {
    document.getElementById("lightbox").classList.remove("active");
    document.body.style.overflow = "";
    return;
  }
  document.getElementById("lightbox").classList.remove("active");
  document.body.style.overflow = "";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("lightbox").classList.remove("active");
    document.body.style.overflow = "";
  }
});

function downloadLightbox() {
  const i = state.currentLightboxIndex;
  if (i >= 0) downloadImage(i);
}

function favoriteFromLightbox() {
  const i = state.currentLightboxIndex;
  if (i >= 0) toggleFavorite(i);
}

function redoVariation() {
  const i = state.currentLightboxIndex;
  if (i >= 0) {
    closeLightbox();
    redoSingle(i);
  }
}

// ============================================
// FAVORITE
// ============================================
function toggleFavorite(i) {
  const favBtn = document.getElementById(`fav-${i}`);
  if (state.favorites.has(i)) {
    state.favorites.delete(i);
    if (favBtn) { favBtn.classList.remove("fav-active"); favBtn.textContent = "♡ FAV"; }
  } else {
    state.favorites.add(i);
    if (favBtn) { favBtn.classList.add("fav-active"); favBtn.textContent = "♥ FAV"; }
    showToast(`♥ Variação ${i + 1} adicionada aos favoritos`);
  }
}

// ============================================
// DOWNLOAD
// ============================================
function downloadImage(i) {
  const url = state.generatedImages[i];
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = `zytrix-variacao-${String(i + 1).padStart(2, '0')}.jpg`;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadAll() {
  state.generatedImages.forEach((url, i) => {
    if (url) {
      setTimeout(() => downloadImage(i), i * 300);
    }
  });
}

// ============================================
// REDO SINGLE VARIATION
// ============================================
async function redoSingle(i) {
  if (!state.userPhotoBase64) return;
  const params = state.lastParams || parseInstructionsToParams(state.instructions || "professional portrait");
  const prompt = buildPrompt(params, i + Math.floor(Math.random() * 100));

  setCellLoadingState(i);

  try {
    const url = await generateSingleImage(state.userPhotoBase64, prompt, i + 100);
    state.generatedImages[i] = url;
    setCellImage(i, url);
  } catch (err) {
    setCellError(i, err.message);
  }
}

function setCellLoadingState(i) {
  const cell = document.getElementById(`cell-${i}`);
  if (!cell) return;
  cell.innerHTML = `
    <div class="cell-loading" id="loading-${i}">
      <div class="cell-spinner"></div>
      <div class="cell-loading-text">REFAZENDO ${i + 1}</div>
    </div>
    <span class="cell-num">${String(i + 1).padStart(2, '0')}</span>
  `;
}

// ============================================
// REFINE GENERATION
// ============================================
async function refineGeneration() {
  const refineText = document.getElementById("refineInput").value.trim();
  if (!refineText) return;

  // Merge refinement with existing instructions
  const merged = (state.instructions ? state.instructions + ", " : "") + interpretRefinement(refineText);
  document.getElementById("instructionsInput").value = merged;
  state.instructions = merged;
  updateCounter(document.getElementById("instructionsInput"));
  document.getElementById("refineInput").value = "";

  showToast("↺ Reinterpretando instruções e regerando...");
  await startGeneration();
}

function interpretRefinement(text) {
  const lower = text.toLowerCase();
  const mappings = {
    "mais elegante": "elegant, refined, high-end aesthetic",
    "mais escuro": "darker tones, moody atmosphere, low key",
    "mais claro": "brighter exposure, high key, clean light",
    "luz mais forte": "stronger key light, high contrast, dramatic lighting",
    "mais contrastado": "high contrast, bold shadows",
    "mais natural": "natural lighting, organic feel, less processed",
    "mais profissional": "corporate professional, executive style",
    "mais moderno": "contemporary style, modern aesthetic",
    "mais sóbrio": "sober, minimal, understated elegance",
    "fundo mais escuro": "very dark background, near black",
    "mais nitido": "ultra sharp, tack sharp focus, maximum detail"
  };

  for (const [key, val] of Object.entries(mappings)) {
    if (lower.includes(key)) return val;
  }

  // Fallback: use text as-is appended
  return text;
}

// ============================================
// CLEAR RESULTS
// ============================================
function clearResults() {
  state.generatedImages = [];
  state.favorites.clear();
  document.getElementById("gridContainer").innerHTML = `
    <div class="grid-placeholder">
      <div class="placeholder-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.3">
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
  document.getElementById("refineBlock").style.display = "none";
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(msg) {
  const existing = document.querySelector(".zytrix-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "zytrix-toast";
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: var(--black-4, #161616);
    border: 1px solid rgba(229,9,20,0.4);
    color: rgba(245,245,245,0.85);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 1px;
    padding: 12px 24px;
    border-radius: 4px;
    z-index: 9999;
    opacity: 0;
    transition: all 0.3s ease;
    white-space: nowrap;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================
// INIT
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  // Live param preview as user types
  document.getElementById("instructionsInput").addEventListener("input", function() {
    if (this.value.length > 5) {
      updateParamsPreview(this.value);
    }
  });

  // Drag and drop for user photo
  const uploadCards = document.querySelectorAll(".upload-card");
  uploadCards.forEach((card, idx) => {
    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      card.style.borderColor = "var(--red)";
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
      const input = document.getElementById(inputId);
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event("change"));
    });
  });

  console.log("%c ZYTRIX AI v2.1 — INITIALIZED ", "background:#e50914;color:white;font-family:monospace;font-size:14px;padding:4px 8px;");
});
