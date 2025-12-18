const chooseBtn = document.getElementById("chooseBtn");
const fileInput = document.getElementById("fileInput");
const fileNameText = document.getElementById("fileName");
const convertBtn = document.getElementById("convertBtn");
const uploadBox = document.querySelector(".upload-box");
const preview = document.getElementById("preview");

const fromInput = document.getElementById("fromPage");
const toInput = document.getElementById("toPage");

const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

let selectedFile = null;
let totalPages = 0;

// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// ===== Choose file =====
chooseBtn.addEventListener("click", () => fileInput.click());

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
async function handleFile(file) {
  if (!file) return;

  if (file.type !== "application/pdf") {
    alert("กรุณาเลือกไฟล์ PDF เท่านั้น");
    return;
  }

  selectedFile = file;
  fileNameText.textContent = file.name;

  const pdf = await pdfjsLib
    .getDocument(URL.createObjectURL(file))
    .promise;

  totalPages = pdf.numPages;

  fromInput.value = 1;
  toInput.value = totalPages;

  progressBar.value = 0;
  progressText.textContent = "";

  convertBtn.disabled = false;
  convertBtn.style.opacity = "1";

  renderPreview(pdf);
}

// ===== Preview =====
async function renderPreview(pdf) {
  preview.innerHTML = "";

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

  await page.render({ canvasContext: ctx, viewport }).promise;
}

// ===== Convert with progress =====
convertBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  let from = parseInt(fromInput.value, 10);
  let to = parseInt(toInput.value, 10);

  if (isNaN(from) || isNaN(to) || from < 1 || to > totalPages || from > to) {
    alert("ช่วงหน้าที่เลือกไม่ถูกต้อง");
    return;
  }

  convertBtn.disabled = true;
  convertBtn.textContent = "Converting...";

  const zip = new JSZip();
  const pdf = await pdfjsLib
    .getDocument(URL.createObjectURL(selectedFile))
    .promise;

  const total = to - from + 1;
  let current = 0;

  for (let i = from; i <= to; i++) {
    current++;

    progressText.textContent = `Converting page ${i} / ${to}`;
    progressBar.value = Math.round((current / total) * 100);

    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const imageData = canvas
      .toDataURL("image/jpeg", 0.95)
      .split(",")[1];

    zip.file(`page-${i}.jpg`, imageData, { base64: true });
  }

  progressText.textContent = "Creating ZIP...";
  progressBar.value = 100;

  const zipBlob = await zip.generateAsync({ type: "blob" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(zipBlob);
  link.download = "pdfgo-images.zip";
  link.click();

  convertBtn.textContent = "Convert to JPG (ZIP)";
  convertBtn.disabled = false;
});
