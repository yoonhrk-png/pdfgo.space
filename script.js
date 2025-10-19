// Minimal interactions for toggles and file selections
const el = (id) => document.getElementById(id);

const btnPDF2JPG = el('btn-pdf2jpg');
const btnJPG2PDF = el('btn-jpg2pdf');
const cardPDF2JPG = el('card-pdf2jpg');
const cardJPG2PDF = el('card-jpg2pdf');

btnPDF2JPG.addEventListener('click', () => {
  btnPDF2JPG.classList.add('active');
  btnJPG2PDF.classList.remove('active');
  cardPDF2JPG.classList.remove('hidden');
  cardJPG2PDF.classList.add('hidden');
});

btnJPG2PDF.addEventListener('click', () => {
  btnJPG2PDF.classList.add('active');
  btnPDF2JPG.classList.remove('active');
  cardJPG2PDF.classList.remove('hidden');
  cardPDF2JPG.classList.add('hidden');
});

const pdfInput = el('file-pdf');
const hintPDF = el('hint-pdf');
const btnDlJPG = el('btn-dl-jpg');

pdfInput.addEventListener('change', () => {
  if (pdfInput.files.length) {
    hintPDF.textContent = `เลือกแล้ว: ${pdfInput.files[0].name}`;
    btnDlJPG.disabled = false;
  } else {
    hintPDF.textContent = 'ยังไม่มีไฟล์ที่เลือก';
    btnDlJPG.disabled = true;
  }
});

const imgInput = el('files-img');
const hintIMG = el('hint-img');
const btnDlPDF = el('btn-dl-pdf');

imgInput.addEventListener('change', () => {
  if (imgInput.files.length) {
    hintIMG.textContent = `เลือกรูปแล้ว ${imgInput.files.length} ไฟล์`;
    btnDlPDF.disabled = false;
  } else {
    hintIMG.textContent = 'ยังไม่มีรูปที่เลือก';
    btnDlPDF.disabled = true;
  }
});

btnDlJPG.addEventListener('click', () => alert('โหมดสาธิต: ขั้นตอนแปลงจะทำที่ฝั่งเซิร์ฟเวอร์ / Worker ในเวอร์ชันถัดไป'));
btnDlPDF.addEventListener('click', () => alert('โหมดสาธิต: ขั้นตอนแปลงจะทำที่ฝั่งเซิร์ฟเวอร์ / Worker ในเวอร์ชันถัดไป'));
