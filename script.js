// ===== Helpers =====
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const show = (el)=> el.classList.remove('hidden');
const hide = (el)=> el.classList.add('hidden');
const setText = (el, t)=> el && (el.textContent = t);

// ===== Mode switch =====
const tabPdf2Jpg = $('#btnModePdf2Jpg');
const tabJpg2Pdf = $('#btnModeJpg2Pdf');
const cardPdf2Jpg = $('#cardPdf2Jpg');
const cardJpg2Pdf = $('#cardJpg2Pdf');
const panelProgressPdf = $('#panelProgressPdf');
const panelResultPdf   = $('#panelResultPdf');
const panelProgressImg = $('#panelProgressImg');
const panelResultImg   = $('#panelResultImg');

function showPdf2Jpg(){
  tabPdf2Jpg.classList.add('active');
  tabJpg2Pdf.classList.remove('active');
  show(cardPdf2Jpg); hide(cardJpg2Pdf);
  hide(panelProgressPdf); hide(panelResultPdf);
  hide(panelProgressImg); hide(panelResultImg);
}
function showJpg2Pdf(){
  tabJpg2Pdf.classList.add('active');
  tabPdf2Jpg.classList.remove('active');
  show(cardJpg2Pdf); hide(cardPdf2Jpg);
  hide(panelProgressPdf); hide(panelResultPdf);
  hide(panelProgressImg); hide(panelResultImg);
}
tabPdf2Jpg.addEventListener('click', showPdf2Jpg);
tabJpg2Pdf.addEventListener('click', showJpg2Pdf);

// ===== PDF → JPG =====
const pdfInput   = $('#pdfInput');
const btnPdf2Jpg = $('#btnPdf2Jpg');
const statusPdf  = $('#pdf2jpgStatus');
const barPdf     = $('#barPdf');
const progressDescPdf = $('#progressDescPdf');
const thumbList  = $('#thumbList');
const btnZipAll  = $('#btnDownloadZip');
const btnStartOver = $('#btnStartOver');

let pdfFile = null;
let zipPdf2Jpg = null;

pdfInput?.addEventListener('change', ()=>{
  pdfFile = pdfInput.files?.[0] || null;
  btnPdf2Jpg.disabled = !pdfFile;
  setText(statusPdf, pdfFile ? `เลือกไฟล์แล้ว: ${pdfFile.name}` : '');
});

btnPdf2Jpg?.addEventListener('click', async ()=>{
  if (!pdfFile) return;
  hide(cardPdf2Jpg);
  show(panelProgressPdf);
  setText(progressDescPdf, 'กำลังโหลดไฟล์…');
  barPdf.style.width = '5%';

  try {
    const buf = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const total = pdf.numPages;

    zipPdf2Jpg = new JSZip();
    const folder = zipPdf2Jpg.folder('images');
    thumbList.innerHTML = '';
    btnZipAll.disabled = true;

    for (let i=1;i<=total;i++){
      setText(progressDescPdf, `กำลังแปลงหน้า ${i} / ${total}`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;

      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
      folder.file(`page-${i}.jpg`, blob);

      const url = URL.createObjectURL(blob);
      const card = document.createElement('div');
      card.className = 'thumb';
      card.innerHTML = `
        <img src="${url}" alt="หน้าที่ ${i}" loading="lazy" />
        <div class="meta">
          <small>หน้า ${i}</small>
          <button class="btn" data-url="${url}" download="page-${i}.jpg">ดาวน์โหลด</button>
        </div>`;
      thumbList.appendChild(card);

      barPdf.style.width = Math.round((i/total)*100) + '%';
    }

    hide(panelProgressPdf);
    show(panelResultPdf);
    btnZipAll.disabled = false;
  } catch(err){
    console.error(err);
    alert('แปลงไฟล์ไม่สำเร็จ: ' + err.message);
    hide(panelProgressPdf);
    show(cardPdf2Jpg);
  }
});

thumbList?.addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-url]');
  if(!btn) return;
  const url = btn.getAttribute('data-url');
  saveAs(url, btn.getAttribute('download') || 'page.jpg');
});

btnZipAll?.addEventListener('click', async ()=>{
  if(!zipPdf2Jpg) return;
  const blob = await zipPdf2Jpg.generateAsync({ type:'blob' });
  const base = (pdfFile?.name || 'pdf').replace(/\.[^.]+$/,'');
  saveAs(blob, base + '-images.zip');
});

btnStartOver?.addEventListener('click', ()=>{
  pdfInput.value=''; pdfFile=null; zipPdf2Jpg=null;
  thumbList.innerHTML=''; btnPdf2Jpg.disabled=true; setText(statusPdf,'');
  hide(panelResultPdf); show(cardPdf2Jpg);
});

// ===== JPG → PDF =====
const imgInput     = $('#imgInput');
const btnJpg2Pdf   = $('#btnJpg2Pdf');
const statusImg    = $('#jpg2pdfStatus');
const barImg       = $('#barImg');
const progressDescImg = $('#progressDescImg');
const btnPdfOut    = $('#btnDownloadPdf');
const btnStartOverImg = $('#btnStartOverImg');
const pdfResultNote = $('#jpg2pdfResultNote');

let imgFiles = [];

imgInput?.addEventListener('change', ()=>{
  imgFiles = imgInput.files ? Array.from(imgInput.files) : [];
  btnJpg2Pdf.disabled = imgFiles.length === 0;
  setText(statusImg, imgFiles.length ? `เลือกรูป ${imgFiles.length} ไฟล์` : '');
});

btnJpg2Pdf?.addEventListener('click', async ()=>{
  if (!imgFiles.length) return;
  hide(cardJpg2Pdf);
  show(panelProgressImg);
  setText(progressDescImg, 'กำลังเตรียมรูป…');
  barImg.style.width = '5%';

  try {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.create();

    for (let i=0; i<imgFiles.length; i++){
      const f = imgFiles[i];
      setText(progressDescImg, `กำลังเพิ่มรูป ${i+1} / ${imgFiles.length}`);
      const bytes = await f.arrayBuffer();

      let img, w, h;
      if (f.type === 'image/png'){
        img = await doc.embedPng(bytes);
      } else {
        img = await doc.embedJpg(bytes);
      }
      w = img.width; h = img.height;

      const page = doc.addPage([w, h]);
      page.drawImage(img, { x:0, y:0, width:w, height:h });

      barImg.style.width = Math.round(((i+1)/imgFiles.length)*100) + '%';
    }

    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes], { type:'application/pdf' });
    const url = URL.createObjectURL(blob);

    hide(panelProgressImg);
    show(panelResultImg);
    btnPdfOut.href = url;
    const outName = 'images-to.pdf';
    btnPdfOut.download = outName;
    setText(pdfResultNote, `ได้ไฟล์ ${outName} ขนาด ~${(blob.size/1024/1024).toFixed(2)} MB`);
  } catch(err){
    console.error(err);
    alert('รวมรูปเป็น PDF ไม่สำเร็จ: ' + err.message);
    hide(panelProgressImg);
    show(cardJpg2Pdf);
  }
});

btnStartOverImg?.addEventListener('click', ()=>{
  imgInput.value=''; imgFiles=[]; btnJpg2Pdf.disabled=true; setText(statusImg,'');
  hide(panelResultImg); show(cardJpg2Pdf);
});
