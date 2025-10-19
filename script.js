/* state & helpers */
const $ = (s)=>document.querySelector(s);
const LS_KEY = 'pdfgo.mode';
let currentMode = localStorage.getItem(LS_KEY) || 'pdf2jpg'; // 'pdf2jpg' | 'jpg2pdf'

/* elements */
const btnModePdfToJpg = $('#btnModePdfToJpg');
const btnModeJpgToPdf = $('#btnModeJpgToPdf');
const cardTitle = $('#cardTitle');
const cardSub = $('#cardSub');

const panePdfToJpg = $('#panePdfToJpg');
const paneJpgToPdf = $('#paneJpgToPdf');

const pdfInput = $('#pdfInput');
const btnPickPdf = $('#btnPickPdf');
const btnConvertPdfToJpg = $('#btnConvertPdfToJpg');
const pdfList = $('#pdfList');

const imgInput = $('#imgInput');
const btnPickImages = $('#btnPickImages');
const btnMakePdf = $('#btnMakePdf');
const imgList = $('#imgList');

/* toggle */
function applyMode() {
  const pdfMode = currentMode === 'pdf2jpg';
  btnModePdfToJpg.classList.toggle('active', pdfMode);
  btnModeJpgToPdf.classList.toggle('active', !pdfMode);
  panePdfToJpg.hidden = !pdfMode;
  paneJpgToPdf.hidden = pdfMode;
  cardTitle.textContent = pdfMode ? 'แปลง PDF → JPG' : 'แปลง JPG → PDF';
  cardSub.textContent = pdfMode 
    ? 'เราจะแตกหน้า PDF เป็นรูป JPG — สามารถดาวน์โหลดเป็น ZIP'
    : 'เลือกรูปหลายไฟล์รวมเป็น PDF เดียว — ประมวลผลบนอุปกรณ์ของคุณ';
  localStorage.setItem(LS_KEY, currentMode);
}

/* event: toggle */
btnModePdfToJpg.addEventListener('click', ()=>{currentMode='pdf2jpg';applyMode();});
btnModeJpgToPdf.addEventListener('click', ()=>{currentMode='jpg2pdf';applyMode();});

/* PDF -> JPG */
btnPickPdf.addEventListener('click', ()=> pdfInput.click());
pdfInput.addEventListener('change', ()=>{
  pdfList.innerHTML = '';
  btnConvertPdfToJpg.disabled = !pdfInput.files?.length;
  if (pdfInput.files?.length) {
    const li = document.createElement('li');
    li.textContent = pdfInput.files[0].name;
    pdfList.appendChild(li);
  }
});

btnConvertPdfToJpg.addEventListener('click', async ()=>{
  const file = pdfInput.files?.[0];
  if (!file) return;
  btnConvertPdfToJpg.disabled = true;
  btnConvertPdfToJpg.textContent = 'กำลังแปลง...';
  try {
    // read pdf
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
    const pdf = await loadingTask.promise;

    const zip = new JSZip();
    for (let i=1; i<=pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({scale:2});
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({canvasContext: ctx, viewport}).promise;
      const blob = await new Promise(res=>canvas.toBlob(res,'image/jpeg',0.92));
      const buf = await blob.arrayBuffer();
      const fname = `page-${String(i).padStart(3,'0')}.jpg`;
      zip.file(fname, buf);
    }
    const zipBlob = await zip.generateAsync({type:'blob'});
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (file.name.replace(/\.pdf$/i,'') || 'pdf') + '-images.zip';
    a.click();
    URL.revokeObjectURL(url);
  } catch(e) {
    alert('แปลงไม่สำเร็จ: ' + e.message);
  } finally {
    btnConvertPdfToJpg.textContent = 'แปลงและดาวน์โหลด JPG (ZIP)';
    btnConvertPdfToJpg.disabled = false;
  }
});

/* JPG -> PDF */
btnPickImages.addEventListener('click', ()=> imgInput.click());
imgInput.addEventListener('change', ()=>{
  imgList.innerHTML='';
  btnMakePdf.disabled = !(imgInput.files && imgInput.files.length);
  if (imgInput.files?.length) {
    [...imgInput.files].forEach(f=>{
      const li = document.createElement('li');
      li.textContent = f.name;
      imgList.appendChild(li);
    });
  }
});

btnMakePdf.addEventListener('click', async ()=>{
  const files = imgInput.files;
  if (!files?.length) return;
  btnMakePdf.disabled = true;
  btnMakePdf.textContent = 'กำลังแปลง...';
  try {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.create();
    for (const f of files) {
      const bytes = new Uint8Array(await f.arrayBuffer());
      let img, dims;
      if (/\.png$/i.test(f.name)) {
        img = await doc.embedPng(bytes);
      } else {
        img = await doc.embedJpg(bytes);
      }
      dims = img.scale(1);
      const page = doc.addPage([dims.width, dims.height]);
      page.drawImage(img, { x:0, y:0, width:dims.width, height:dims.height });
    }
    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes], {type:'application/pdf'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'images.pdf';
    a.click();
    URL.revokeObjectURL(url);
  } catch(e) {
    alert('แปลงไม่สำเร็จ: ' + e.message);
  } finally {
    btnMakePdf.textContent = 'แปลงเป็น PDF และดาวน์โหลด';
    btnMakePdf.disabled = false;
  }
});

/* init */
applyMode();
