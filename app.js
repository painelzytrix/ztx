const WORKER_URL = "https://twilight-hall-cb6a.arllisonmarinho1.workers.dev";

// Elementos
const uploadZone   = document.getElementById("uploadZone");
const photoInput   = document.getElementById("photoInput");
const uploadContent = document.getElementById("uploadContent");
const photoPreview = document.getElementById("photoPreview");
const styleSelect  = document.getElementById("styleSelect");
const referenceText = document.getElementById("referenceText");
const btnGenerate  = document.getElementById("btnGenerate");
const btnText      = document.getElementById("btnText");
const errorBox     = document.getElementById("errorBox");
const errorMsg     = document.getElementById("errorMsg");
const resultsSection = document.getElementById("resultsSection");
const imagesGrid   = document.getElementById("imagesGrid");
const btnDownloadAll = document.getElementById("btnDownloadAll");

let selectedFile = null;
let generatedUrls = [];

// ===== UPLOAD =====

uploadZone.addEventListener("click", () => photoInput.click());

photoInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("drag-over");
});

uploadZone.addEventListener("dragleave", () => {
  uploadZone.classList.remove("drag-over");
});

uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) handleFile(file);
});

function handleFile(file) {
  if (file.size > 10 * 1024 * 1024) {
    showError("Imagem muito grande. Máximo 10MB.");
    return;
  }
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    photoPreview.src = e.target.result;
    photoPreview.classList.remove("hidden");
    uploadContent.classList.add("hidden");
  };
  reader.readAsDataURL(file);
  hideError();
}

// ===== GERAR =====

btnGenerate.addEventListener("click", async () => {
  if (!selectedFile) {
    showError("Por favor, envie uma foto primeiro.");
    return;
  }

  setLoading(true);
  hideError();
  clearResults();

  try {
    // Converte imagem para base64 (sem prefixo)
    const base64 = await fileToBase64(selectedFile);

    const payload = {
      imageBase64: base64,
      style: styleSelect.value,
      referenceText: referenceText.value.trim(),
    };

    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Erro desconhecido no servidor.");
    }

    generatedUrls = data.imageUrls;
    renderResults(data.imageUrls, data.prompts);

  } catch (err) {
    showError("Erro ao gerar imagens: " + err.message);
  } finally {
    setLoading(false);
  }
});

// ===== RENDER RESULTS =====

function renderResults(urls, prompts) {
  resultsSection.classList.remove("hidden");
  imagesGrid.innerHTML = "";

  urls.forEach((url, i) => {
    const card = document.createElement("div");
    card.className = "image-card";

    card.innerHTML = `
      <div class="card-image-wrap" id="wrap-${i}">
        <div class="shimmer"></div>
        <div class="card-loading-label">Gerando<span class="loading-dots"></span></div>
      </div>
      <div class="card-footer">
        <span class="card-number">Versão ${i + 1}</span>
        <a class="btn-download" id="dl-${i}" href="#" download="zytrix-${i+1}.jpg">⬇ Baixar</a>
      </div>
    `;

    imagesGrid.appendChild(card);

    // Carrega imagem
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const wrap = document.getElementById(`wrap-${i}`);
      if (!wrap) return;
      wrap.innerHTML = "";
      wrap.appendChild(img);

      // Atualiza link de download
      const dlBtn = document.getElementById(`dl-${i}`);
      if (dlBtn) {
        dlBtn.href = url;
        dlBtn.target = "_blank";
        dlBtn.rel = "noopener";
      }
    };
    img.onerror = () => {
      const wrap = document.getElementById(`wrap-${i}`);
      if (wrap) {
        wrap.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#E05454;font-size:13px;padding:16px;text-align:center;">Falha ao carregar imagem.<br/>Tente novamente.</div>`;
      }
    };
    img.src = url;
  });

  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ===== DOWNLOAD ALL =====

btnDownloadAll.addEventListener("click", () => {
  if (!generatedUrls.length) return;
  generatedUrls.forEach((url, i) => {
    setTimeout(() => {
      const a = document.createElement("a");
      a.href = url;
      a.download = `zytrix-${i + 1}.jpg`;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, i * 600);
  });
});

// ===== HELPERS =====

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove prefixo "data:image/xxx;base64,"
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setLoading(loading) {
  btnGenerate.disabled = loading;
  if (loading) {
    btnText.innerHTML = 'Gerando com IA<span class="loading-dots"></span>';
    btnGenerate.querySelector(".btn-icon").textContent = "⏳";
  } else {
    btnText.textContent = "GERAR IMAGENS COM IA";
    btnGenerate.querySelector(".btn-icon").textContent = "⚡";
  }
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorBox.classList.remove("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
}

function clearResults() {
  generatedUrls = [];
  imagesGrid.innerHTML = "";
  resultsSection.classList.add("hidden");
}
