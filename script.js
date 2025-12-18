const chooseBtn = document.getElementById("chooseBtn");
const fileInput = document.getElementById("fileInput");
const fileNameText = document.getElementById("fileName");
const convertBtn = document.getElementById("convertBtn");

// กดปุ่ม → เปิด file picker
chooseBtn.addEventListener("click", () => {
  fileInput.click();
});

// เมื่อเลือกไฟล์แล้ว
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];

  if (!file) return;

  fileNameText.textContent = file.name;
  convertBtn.disabled = false;
  convertBtn.style.cursor = "pointer";
  convertBtn.style.opacity = "1";
});
