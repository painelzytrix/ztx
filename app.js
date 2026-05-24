/* ═══════════════════════════════════════
   ZYTRIX AI — APPLICATION LOGIC
═══════════════════════════════════════ */

let currentMode    = 1;
let photoFile      = null;
let refFile        = null;
let currentPromptJSON = null;
let generatedImages   = [];
let favCount       = 0;
let sessionCount   = 0;
let lightboxIndex  = -1;

const FAL_KEY_DEFAULT = '8fa5fe7f-472c-45b7-94f9-039b3715248c:0c9f4b76dace16a94b9c25ad882d26a0';

/* ── API KEY ── */
function getApiKey() {
  return document.getElementById('apiKeyInput').value.trim() || FAL_KEY_DEFAULT;
}

function saveApiKey() {
  showToast('✓ API Key salva com sucesso');
}

/* ════════════════════════
   MODE SWITCHING
════════════════════════ */
function setMode(m) {
  currentMode = m;

  document.querySelectorAll('.mode-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i + 1 === m);
  });

  const refBlock    = document.getElementById('refBlock');
  const promptBlock = document.getElementById('promptBlock');
  const promptLabel = document.getElementById('promptLabel');
  const promptDesc  = document.getElementById('promptDesc');
  const promptText  = document.getElementById('promptText');

  if (m === 1) {
    refBlock.classList.remove('hidden');
    promptBlock.classList.add('hidden');
  } else if (m === 2) {
    refBlock.classList.add('hidden');
    promptBlock.classList.remove('hidden');
    promptLabel.textContent = 'Descrição do Estilo';
    promptDesc.textContent  = 'Descreva como quer aparecer. Ex: terno preto, luz cinematográfica, executivo.';
    promptText.placeholder  = 'terno preto premium, fundo escuro, luz cinematográfica, executivo profissional...';
  } else {
    refBlock.classList.add('hidden');
    promptBlock.classList.remove('hidden');
    promptLabel.textContent = 'JSON de Configuração';
    promptDesc.textContent  = 'Cole o JSON completo. O sistema detecta e processa automaticamente em segundo plano.';
    promptText.placeholder  = '{"style":"executive","lighting":"cinematic","background":"dark studio",...}';
  }

  // reset prompt state on mode switch
  currentPromptJSON = null;
  onPromptInput();
}

/* ════════════════════════
   FILE UPLOADS
════════════════════════ */
function handleFile(input, varName, zoneId, previewId, nameId) {
  const file = input.files[0];
  if (!file) return;
  storeFile(varName, file);
  activateZone(file, zoneId, previewId, nameId);
}

function storeFile(varName, file) {
  if (varName === 'photoFile') photoFile = file;
  if (varName === 'refFile')   refFile   = file;
}

function activateZone(file, zoneId, previewId, nameId) {
  const zone    = document.getElementById(zoneId);
  const preview = document.getElementById(previewId);
  const nameEl  = document.getElementById(nameId);
  zone.classList.add('has-file');
  nameEl.textContent = '✓ ' + file.name;
  const reader = new FileReader();
  reader.onload = e => { preview.src = e.target.result; };
  reader.readAsDataURL(file);
}

function handleDrag(e, zoneId) {
  e.preventDefault();
  document.getElementById(zoneId).classList.add('drag-over');
}

function handleDragLeave(zoneId) {
  document.getElementById(zoneId).classList.remove('drag-over');
}

function handleDrop(e, varName, zoneId, previewId, nameId) {
  e.preventDefault();
  document.getElementById(zoneId).classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (!file) return;
  storeFile(varName, file);
  activateZone(file, zoneId, previewId, nameId);
}

/* ════════════════════════
   PROMPT / JSON DETECTION
   — always reprocessed from scratch on every keystroke
════════════════════════ */
function onPromptInput() {
  const textarea  = document.getElementById('promptText');
  const badge     = document.getElementById('promptTypeBadge');
  const charCount = document.getElementById('charCount');
  const val       = textarea ? textarea.value : '';

  if (charCount) charCount.textContent = val.length + ' caracteres';

  // reset every time — never cache old result
  currentPromptJSON = null;

  if (!val.trim()) {
    if (badge) {
      badge.textContent = 'TEXTO';
      badge.className   = 'prompt-type-badge type-text';
    }
    return;
  }

  const trimmed = val.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      currentPromptJSON = JSON.parse(trimmed);
      if (badge) {
        badge.textContent = 'JSON DETECTADO';
        badge.className   = 'prompt-type-badge type-json';
      }
    } catch {
      currentPromptJSON = null;
      if (badge) {
        badge.textContent = 'JSON INVÁLIDO';
        badge.className   = 'prompt-type-badge type-json';
      }
    }
  } else {
    currentPromptJSON = null;
    if (badge) {
      badge.textContent = 'TEXTO';
      badge.className   = 'prompt-type-badge type-text';
    }
  }
}

function addTag(tagText) {
  const ta = document.getElementById('promptText');
  ta.value = tagText;
  onPromptInput(); // reprocess from scratch
  ta.focus();
}

/* ════════════════════════
   FILE → BASE64
════════════════════════ */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ════════════════════════
   BUILD FINAL PROMPT
   — reads current state fresh every time
════════════════════════ */
function buildPromptText() {
  const baseQuality = 'Ultra-realistic professional studio photograph, photorealistic, commercial quality, sharp facial focus, cinematic color grade, 8K resolution, preserve exact facial identity and likeness.';

  if (currentMode === 1) {
    return `${baseQuality} Recreate the aesthetic style from the reference image: lighting, background, composition, clothing style. The person's face must remain identical.`;
  }

  if (currentMode === 2) {
    const desc = document.getElementById('promptText').value.trim();
    return `${baseQuality} Style details: ${desc}.`;
  }

  if (currentMode === 3) {
    // if valid JSON was parsed, extract structured prompt
    if (currentPromptJSON) {
      const j = currentPromptJSON;

      // if JSON already has a full prompt string, use it
      if (j.prompt && typeof j.prompt === 'string') {
        return j.prompt;
      }

      // otherwise build from JSON fields
      const parts = [];
      if (j.style)      parts.push('style: '      + j.style);
      if (j.lighting)   parts.push('lighting: '   + j.lighting);
      if (j.background) parts.push('background: ' + j.background);
      if (j.clothing)   parts.push('clothing: '   + j.clothing);
      if (j.mood)       parts.push('mood: '       + j.mood);
      if (j.camera)     parts.push('camera: '     + j.camera);
      if (j.color)      parts.push('color grade: '+ j.color);

      return `${baseQuality} ${parts.join(', ')}.`;
    }

    // fallback: treat as plain text
    const raw = document.getElementById('promptText').value.trim();
    return `${baseQuality} ${raw}.`;
  }

  return baseQuality;
}

/* ════════════════════════
   FAL.AI API CALL
════════════════════════ */
async function callFalAI(promptText, photoBase64, refBase64, seed) {
  const key = getApiKey();

  const useImageToImage = !!photoBase64;
  const endpoint = useImageToImage
    ? 'https://fal.run/fal-ai/flux/dev/image-to-image'
    : 'https://fal.run/fal-ai/flux/dev';

  const body = {
    prompt:               promptText,
    image_size:           'portrait_4_3',
    num_inference_steps:  28,
    guidance_scale:       3.5,
    num_images:           1,
    enable_safety_checker: false,
    seed:                 seed
  };

  if (useImageToImage) {
    body.image_url = 'data:image/jpeg;base64,' + photoBase64;
    body.strength  = 0.72;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': 'Key ' + key,
      'Content-Type':  'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error('FAL ' + response.status + ': ' + errText.substring(0, 120));
  }

  const data = await response.json();

  if (data.images && data.images.length > 0) return data.images[0].url;
  if (data.image)                             return data.image.url || data.image;

  throw new Error('Resposta inesperada da API FAL.AI');
}

/* ════════════════════════
   LOADING SYSTEM
════════════════════════ */
const LOADING_MESSAGES = [
  'Inicializando redes neurais...',
  'Analisando identidade facial...',
  'Processando referências visuais...',
  'Calibrando modelo generativo...',
  'Aplicando correção de iluminação...',
  'Renderizando detalhes faciais...',
  'Refinando qualidade cinemática...',
  'Otimizando resolução comercial...',
  'Finalizando composição...'
];

let loadingInterval = null;
let statusIndex     = 0;

function showLoading() {
  document.getElementById('loadingOverlay').classList.add('active');
  document.getElementById('loadingBar').style.width = '0%';
  document.getElementById('loadingCount').textContent = '0 / 9 imagens';
  statusIndex = 0;
  document.getElementById('loadingStatus').textContent = LOADING_MESSAGES[0];
  loadingInterval = setInterval(() => {
    statusIndex = (statusIndex + 1) % LOADING_MESSAGES.length;
    document.getElementById('loadingStatus').textContent = LOADING_MESSAGES[statusIndex];
  }, 2200);
}

function updateLoadingProgress(done) {
  const pct = Math.round((done / 9) * 100);
  document.getElementById('loadingBar').style.width = pct + '%';
  document.getElementById('loadingCount').textContent = done + ' / 9 imagens';
}

function hideLoading() {
  clearInterval(loadingInterval);
  document.getElementById('loadingOverlay').classList.remove('active');
}

/* ════════════════════════
   MAIN GENERATION
════════════════════════ */
async function startGeneration() {
  // validations
  if (!photoFile) {
    showToast('⚠ Envie uma foto primeiro');
    return;
  }
  if (currentMode === 1 && !refFile) {
    showToast('⚠ Envie uma imagem de referência');
    return;
  }
  if ((currentMode === 2 || currentMode === 3) && !document.getElementById('promptText').value.trim()) {
    showToast('⚠ Preencha a descrição ou JSON');
    return;
  }

  document.getElementById('generateBtn').disabled = true;
  showLoading();

  // reset output
  generatedImages = [];
  const grid = document.getElementById('imageGrid');
  grid.innerHTML = '';
  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('outputScroll').classList.remove('hidden');

  // spawn 9 skeleton cards
  for (let i = 0; i < 9; i++) {
    grid.appendChild(createSkeletonCard(i));
  }

  // encode files once
  let photoBase64 = null;
  let refBase64   = null;
  try {
    photoBase64 = await fileToBase64(photoFile);
    if (refFile) refBase64 = await fileToBase64(refFile);
  } catch (err) {
    showToast('❌ Erro ao processar imagens locais');
    hideLoading();
    document.getElementById('generateBtn').disabled = false;
    return;
  }

  // build prompt once (fresh read — no cache)
  const promptText = buildPromptText();

  // generate all 9 in parallel
  let doneCount = 0;

  const tasks = Array.from({ length: 9 }, (_, i) => {
    const seed = Math.floor(Math.random() * 999999) + i * 13;
    return callFalAI(promptText, photoBase64, refBase64, seed)
      .then(url => {
        doneCount++;
        updateLoadingProgress(doneCount);
        swapCardWithImage(i, url);
        generatedImages[i] = url;
      })
      .catch(err => {
        doneCount++;
        updateLoadingProgress(doneCount);
        swapCardWithError(i, err.message);
        generatedImages[i] = null;
        console.error('[ZYTRIX] Card', i, err);
      });
  });

  await Promise.allSettled(tasks);

  hideLoading();
  document.getElementById('generateBtn').disabled = false;

  const successCount = generatedImages.filter(Boolean).length;
  sessionCount += successCount;
  document.getElementById('statGenerated').textContent = successCount;
  document.getElementById('statSession').textContent   = sessionCount;

  showToast(`✓ ${successCount} imagens geradas com sucesso`);
}

/* ════════════════════════
   CARD HELPERS
════════════════════════ */
function createSkeletonCard(i) {
  const card = document.createElement('div');
  card.className = 'image-card';
  card.id = 'card-' + i;
  card.style.animationDelay = (i * 0.06) + 's';
  card.innerHTML = `
    <div class="card-skeleton">
      <div class="skeleton-icon">✦</div>
      <div class="skeleton-label">Gerando #${i + 1}</div>
    </div>
    <div class="card-index">#${String(i + 1).padStart(2, '0')}</div>
    <div class="card-fav-badge">★</div>
    <div class="card-overlay">
      <div class="card-actions">
        <button class="card-action-btn" onclick="openLightbox(${i})">🔍 Ampliar</button>
        <button class="card-action-btn" onclick="downloadImage(${i})">⬇ Baixar</button>
        <button class="card-action-btn" onclick="regenCard(${i})">↻ Regen</button>
        <button class="card-action-btn fav" id="fav-${i}" onclick="toggleFav(${i})">★</button>
      </div>
    </div>
  `;
  return card;
}

function swapCardWithImage(i, url) {
  const card = document.getElementById('card-' + i);
  if (!card) return;
  const skeleton = card.querySelector('.card-skeleton');
  if (skeleton) skeleton.remove();
  const img = document.createElement('img');
  img.src = url;
  img.alt = 'ZYTRIX #' + (i + 1);
  img.loading = 'lazy';
  card.insertBefore(img, card.firstChild);
  card.onclick = () => openLightbox(i);
}

function swapCardWithError(i, message) {
  const card = document.getElementById('card-' + i);
  if (!card) return;
  const skeleton = card.querySelector('.card-skeleton');
  if (skeleton) {
    skeleton.style.animation  = 'none';
    skeleton.style.background = 'var(--graphite-800)';
    skeleton.innerHTML = `
      <div style="color:#ff6060;font-size:22px;margin-bottom:8px;">⚠</div>
      <div style="color:#ff6060;font-family:var(--font-mono);font-size:10px;letter-spacing:1px;">Erro na geração</div>
      <div style="color:var(--silver-500);font-family:var(--font-mono);font-size:9px;margin-top:6px;padding:0 12px;text-align:center;">${message.substring(0, 80)}</div>
    `;
  }
}

/* ════════════════════════
   LIGHTBOX
════════════════════════ */
function openLightbox(i) {
  const url = generatedImages[i];
  if (!url) return;
  lightboxIndex = i;
  document.getElementById('lightboxImg').src = url;
  document.getElementById('lightbox').classList.add('active');
}

function closeLightbox(e) {
  if (!e || e.target.id === 'lightbox') {
    document.getElementById('lightbox').classList.remove('active');
    lightboxIndex = -1;
  }
}

function downloadLightbox() {
  if (lightboxIndex >= 0) downloadImage(lightboxIndex);
}

function regenLightbox() {
  if (lightboxIndex < 0) return;
  const idx = lightboxIndex;
  closeLightbox();
  regenCard(idx);
}

function favLightbox() {
  if (lightboxIndex >= 0) toggleFav(lightboxIndex);
}

/* ════════════════════════
   IMAGE ACTIONS
════════════════════════ */
function downloadImage(i) {
  const url = generatedImages[i];
  if (!url) return;
  const a = document.createElement('a');
  a.href     = url;
  a.download = 'ZYTRIX_' + String(i + 1).padStart(2, '0') + '.jpg';
  a.target   = '_blank';
  a.click();
  showToast('⬇ Baixando imagem #' + (i + 1));
}

async function regenCard(i) {
  const card = document.getElementById('card-' + i);
  if (!card) return;

  // remove existing image
  const img = card.querySelector('img');
  if (img) img.remove();

  // show fresh skeleton
  let skeleton = card.querySelector('.card-skeleton');
  if (!skeleton) {
    skeleton = document.createElement('div');
    skeleton.className = 'card-skeleton';
    card.insertBefore(skeleton, card.firstChild);
  }
  skeleton.style.animation  = '';
  skeleton.style.background = '';
  skeleton.innerHTML = `<div class="skeleton-icon">✦</div><div class="skeleton-label">Regenerando...</div>`;

  if (!photoFile) { showToast('⚠ Foto principal não encontrada'); return; }

  let photoBase64 = null;
  let refBase64   = null;
  try {
    photoBase64 = await fileToBase64(photoFile);
    if (refFile) refBase64 = await fileToBase64(refFile);
  } catch {
    showToast('❌ Erro ao processar arquivo');
    return;
  }

  // fresh prompt read — no cache
  const promptText = buildPromptText();
  const seed       = Math.floor(Math.random() * 999999) + 200 + i;

  try {
    const url = await callFalAI(promptText, photoBase64, refBase64, seed);
    generatedImages[i] = url;
    swapCardWithImage(i, url);
    showToast('↻ Imagem #' + (i + 1) + ' regenerada');
  } catch (err) {
    swapCardWithError(i, err.message);
    showToast('❌ Erro ao regenerar');
  }
}

function toggleFav(i) {
  const card   = document.getElementById('card-' + i);
  const favBtn = document.getElementById('fav-' + i);
  if (!card) return;

  const isNowFav = !card.classList.contains('is-fav');
  card.classList.toggle('is-fav', isNowFav);
  if (favBtn) favBtn.classList.toggle('active', isNowFav);

  favCount += isNowFav ? 1 : -1;
  favCount  = Math.max(0, favCount);
  document.getElementById('statFav').textContent = favCount;

  showToast(isNowFav ? '★ Adicionada aos favoritos' : '☆ Removida dos favoritos');
}

/* ════════════════════════
   TOAST
════════════════════════ */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ════════════════════════
   INIT
════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  setMode(1);
});
