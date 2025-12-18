const chooseBtn = document.getElementById("chooseBtn");
const fileInput = document.getElementById("fileInput");
const fileNameText = document.getElementById("fileName");
const convertBtn = document.getElementById("convertBtn");
const uploadBox = document.querySelector(".upload-box");
const preview = document.getElementById("preview");

// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// ===== Button choose =====
chooseBtn.addEventListener("click", () => {
  fileInput.click();
});

// ===== File picker =====
fileInput.addEventListener("change", () => {
  handleFile(fileInput.files[0]);
});

// ===== Drag & Drop =====
uploadBox.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadBox.style.opacity = "0.85";
});

uploadBox.addEventListener("dragleave", () => {
  uploadBox.style.opacity = "1";
});

uploadBox.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadBox.style.opacity = "1";
  handleFile(e.dataTransfer.files[0]);
});

// ===== Handle file =====
function handleFile(file) {
  if (!file) return;

  if (file.type !== "application/pdf") {
    alert("กรุณาเลือกไฟล์ PDF เท่านั้น");
    return;
  }

  fileNameText.textContent = file.name;
  convertBtn.disabled = false;
  convertBtn.style.opacity = "1";
  convertBtn.style.cursor = "pointer";

  renderPreview(file);
}

// ===== Render PDF preview =====
async function renderPreview(file) {
  preview.innerHTML = ""; // clear

  const fileURL = URL.createObjectURL(file);
  const pdf = await pdfjsLib.getDocument(fileURL).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 1.2 });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.borderRadius = "12px";
  canvas.style.boxShadow = "0 10px 30px rgba(0,0,0,0.15)";
  canvas.style.marginTop = "20px";

  preview.appendChild(canvas);

  await page.render({
    canvasContext: ctx,
    viewport: viewport,
  }).promise;
}
