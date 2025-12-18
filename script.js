const chooseBtn = document.getElementById("chooseBtn");
const fileInput = document.getElementById("fileInput");
const fileNameText = document.getElementById("fileName");
const convertBtn = document.getElementById("convertBtn");
const uploadBox = document.querySelector(".upload-box");
const preview = document.getElementById("preview");

let selectedFile = null;

// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// ===== Choose file =====
chooseBtn.addEventListener("click", () => {
  fileInput.click();
});

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

  selectedFile = file;
  fileNameText.textContent = file.name;
  convertBtn.disabled = false;
  convertBtn.style.opacity = "1";
  convertBtn.style.cursor = "pointer";

  renderPreview(file);
}

// ===== Preview page 1 =====
async function renderPreview(file) {
  preview.innerHTML = "";

  const fileURL = URL.createObjectURL(file);
  const pdf = await pdfjsLib.getDocument(fileURL).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 1.2 });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.marginTop = "30px";
  canvas.style.borderRadius = "12px";
  canvas.style.boxShadow = "0 10px 30px rgba(0,0,0,0.15)";

  preview.appendChild(canvas);

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;
}

// ===== Convert to JPG =====
convertBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  const fileURL = URL.createObjectURL(selectedFile);
  const pdf = await pdfjsLib.getDocument(fileURL).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 2 }); // ความคม
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  // Convert canvas → JPG
  const imageData = canvas.toDataURL("image/jpeg", 0.95);

  // Download
  const link = document.createElement("a");
  link.href = imageData;
  link.download = "pdfgo-page-1.jpg";
  link.click();
});
