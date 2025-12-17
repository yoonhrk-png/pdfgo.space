const dropZone = document.getElementById("drop-zone");
const pdfInput = document.getElementById("pdfInput");
const chooseBtn = document.getElementById("chooseBtn");
const convertBtn = document.getElementById("convertBtn");
const progress = document.getElementById("progress");
const progressText = document.getElementById("progressText");

let selectedFile = null;

// Click to choose
chooseBtn.addEventListener("click", () => pdfInput.click());
dropZone.addEventListener("click", () => pdfInput.click());

// Drag & drop
dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  if (e.dataTransfer.files.length) {
    handleFile(e.dataTransfer.files[0]);
  }
});

// File select
pdfInput.addEventListener("change", () => {
  if (pdfInput.files.length) {
    handleFile(pdfInput.files[0]);
  }
});

function handleFile(file) {
  if (file.type !== "application/pdf") {
    alert("Please select a PDF file");
    return;
  }
  selectedFile = file;
  convertBtn.disabled = false;
  progress.value = 0;
  progressText.textContent = "";
}

// Convert
convertBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  convertBtn.disabled = true;
  progress.value = 0;
  progressText.textContent = "Loading PDF...";

  const startPage = Math.max(1, parseInt(document.getElementById("startPage").value || "1", 10));
  const endPageInput = parseInt(document.getElementById("endPage").value || "0", 10);

  const buffer = await selectedFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const endPage = endPageInput > 0
    ? Math.min(endPageInput, pdf.numPages)
    : pdf.numPages;

  if (startPage > endPage) {
    alert("Start page must be less than or equal to end page");
    convertBtn.disabled = false;
    return;
  }

  const zip = new JSZip();
  const total = endPage - startPage + 1;

  for (let i = startPage; i <= endPage; i++) {
    progressText.textContent = `Converting page ${i} / ${endPage}`;

    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise(resolve =>
      canvas.toBlob(resolve, "image/jpeg", 0.95)
    );

    zip.file(`page-${i}.jpg`, blob);

    progress.value = Math.round(((i - startPage + 1) / total) * 100);
  }

  progressText.textContent = "Creating ZIP...";
  const zipBlob = await zip.generateAsync({ type: "blob" });

  download(zipBlob, "pdf-images.zip");
  progressText.textContent = "Done ✅";
  convertBtn.disabled = false;
});

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
