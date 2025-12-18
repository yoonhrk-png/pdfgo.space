const chooseBtn = document.getElementById("chooseBtn");
const fileInput = document.getElementById("fileInput");
const fileNameText = document.getElementById("fileName");
const convertBtn = document.getElementById("convertBtn");
const uploadBox = document.querySelector(".upload-box");

// กดปุ่ม → เปิด file picker
chooseBtn.addEventListener("click", () => {
  fileInput.click();
});

// เมื่อเลือกไฟล์จาก dialog
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

  const file = e.dataTransfer.files[0];
  handleFile(file);
});

// ===== Common handler =====
function handleFile(file) {
  if (!file) return;

  if (file.type !== "application/pdf") {
    alert("กรุณาเลือกไฟล์ PDF เท่านั้น");
    return;
  }

  fileNameText.textContent = file.name;
  convertBtn.disabled = false;
  convertBtn.style.cursor = "pointer";
  convertBtn.style.opacity = "1";
}
