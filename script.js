// Utilities
const $ = (q) => document.querySelector(q);
const on = (el, ev, fn) => el.addEventListener(ev, fn);

// Mode toggle with memory
const MODE_KEY = 'pdfgo.mode'; // 'j2p' or 'p2j'
const btnPdf2Jpg = $('#btnModePdf2Jpg');
const btnJpg2Pdf = $('#btnModeJpg2Pdf');
const cardJ2P = $('#cardJpg2Pdf');
const cardP2J = $('#cardPdf2Jpg');

function setMode(mode){
  localStorage.setItem(MODE_KEY, mode);
  const j2p = mode === 'j2p';
  btnJpg2Pdf.setAttribute('aria-selected', j2p);
  btnPdf2Jpg.setAttribute('aria-selected', !j2p);
  cardJ2P.hidden = !j2p;
  cardP2J.hidden = j2p;
}
on(btnJpg2Pdf,'click', ()=> setMode('j2p'));
on(btnPdf2Jpg,'click', ()=> setMode('p2j'));
setMode(localStorage.getItem(MODE_KEY) || 'j2p');

// JPG -> PDF
const inpJpg = $('#inpJpg');
const btnPickJpg = $('#btnPickJpg');
const btnMakePdf = $('#btnMakePdf');
const listJpg = $('#listJpg');

on(btnPickJpg,'click', ()=> inpJpg.click());
on(inpJpg,'change', () => {
  listJpg.innerHTML = '';
  [...inpJpg.files].forEach(f => {
    const li = document.createElement('li');
    li.textContent = `${f.name} (${Math.round(f.size/1024)} KB)`;
    listJpg.appendChild(li);
  });
  btnMakePdf.disabled = !inpJpg.files.length;
});

on(btnMakePdf,'click', async ()=>{
  if(!inpJpg.files.length) return;
  btnMakePdf.disabled = true; btnMakePdf.textContent = 'กำลังแปลง...';
  try{
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.create();

    for (const file of inpJpg.files){
      const bytes = await file.arrayBuffer();
      const isPng = file.type.includes('png');
      const img = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
      const page = pdfDoc.addPage([img.width, img.height]);
      page.drawImage(img, { x:0, y:0, width:img.width, height:img.height });
    }
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], {type:'application/pdf'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'images-to-pdf.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }catch(e){
    alert('เกิดข้อผิดพลาดในการแปลงเป็น PDF: ' + e.message);
  }finally{
    btnMakePdf.disabled = false; btnMakePdf.textContent = 'แปลงเป็น PDF';
  }
});

// PDF -> JPG (one zip)
const inpPdf = $('#inpPdf');
const btnPickPdf = $('#btnPickPdf');
const btnMakeZip = $('#btnMakeZip');
const listPdf = $('#listPdf');
on(btnPickPdf,'click', ()=> inpPdf.click());
on(inpPdf,'change', ()=>{
  listPdf.innerHTML = '';
  if(inpPdf.files[0]){
    const f = inpPdf.files[0];
    const li = document.createElement('li');
    li.textContent = `${f.name} (${Math.round(f.size/1024)} KB)`;
    listPdf.appendChild(li);
    btnMakeZip.disabled = false;
  }else{
    btnMakeZip.disabled = true;
  }
});

on(btnMakeZip,'click', async ()=>{
  const file = inpPdf.files[0];
  if(!file) return;
  btnMakeZip.disabled = true; btnMakeZip.textContent='กำลังแปลง...';

  try{
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const zip = new JSZip();

    for (let p=1; p<=pdf.numPages; p++){
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale:2 }); // 2x for quality
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvasContext:ctx, viewport }).promise;
      const blob = await new Promise(res=> canvas.toBlob(res, 'image/jpeg', 0.92));
      const buf = await blob.arrayBuffer();
      zip.file(`page-${String(p).padStart(2,'0')}.jpg`, buf);
    }
    const content = await zip.generateAsync({type:"blob"});
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url; a.download = 'pdf-to-jpg.zip'; a.click();
    URL.revokeObjectURL(url);
  }catch(e){
    alert('แปลง PDF เป็น JPG ไม่สำเร็จ: ' + e.message);
  }finally{
    btnMakeZip.disabled = false; btnMakeZip.textContent='แปลงและดาวน์โหลด JPG (ZIP)';
  }
});
