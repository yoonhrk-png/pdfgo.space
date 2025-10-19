// PDFGo.space client-side converters
// Tab switching
const jpgTabBtn = document.getElementById('tab-jpg2pdf');
const pdfTabBtn = document.getElementById('tab-pdf2jpg');
const jpgPanel = document.getElementById('jpg2pdf');
const pdfPanel = document.getElementById('pdf2jpg');

jpgTabBtn.addEventListener('click', () => switchTab('jpg'));
pdfTabBtn.addEventListener('click', () => switchTab('pdf'));

function switchTab(which){
  if(which === 'jpg'){
    jpgTabBtn.classList.add('active'); pdfTabBtn.classList.remove('active');
    jpgPanel.classList.add('active'); pdfPanel.classList.remove('active');
    location.hash = '#jpg2pdf';
  }else{
    pdfTabBtn.classList.add('active'); jpgTabBtn.classList.remove('active');
    pdfPanel.classList.add('active'); jpgPanel.classList.remove('active');
    location.hash = '#pdf2jpg';
  }
}

// JPG -> PDF
const jpgInput = document.getElementById('jpg-input');
const jpgList = document.getElementById('jpg-list');
const convertJpgBtn = document.getElementById('convert-jpg');
let jpgFiles = [];

jpgInput.addEventListener('change', (e) => {
  jpgFiles = Array.from(e.target.files || []);
  renderJpgList();
  convertJpgBtn.disabled = jpgFiles.length === 0;
});

function renderJpgList(){
  jpgList.innerHTML = '';
  jpgFiles.forEach(f => {
    const pill = document.createElement('span');
    pill.className = 'file-pill';
    pill.textContent = `${f.name} (${Math.round(f.size/1024)} KB)`;
    jpgList.appendChild(pill);
  });
}

convertJpgBtn.addEventListener('click', async () => {
  if(!jpgFiles.length) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' }); // A4 portrait
  for(let i=0; i<jpgFiles.length; i++){
    const imgUrl = URL.createObjectURL(jpgFiles[i]);
    const img = await loadImage(imgUrl);
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    // fit image into page while preserving aspect ratio
    const ratio = Math.min(pageW / img.width, pageH / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;
    if(i>0) doc.addPage();
    doc.addImage(img, 'JPEG', x, y, w, h);
    URL.revokeObjectURL(imgUrl);
  }
  doc.save('merged.pdf');
});

function loadImage(url){
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

// PDF -> JPG
const pdfInput = document.getElementById('pdf-input');
const convertPdfBtn = document.getElementById('convert-pdf');
const pdfPagesGrid = document.getElementById('pdf-pages');
let pdfFile = null;

pdfInput.addEventListener('change', (e) => {
  pdfFile = e.target.files?.[0] || null;
  pdfPagesGrid.innerHTML = '';
  convertPdfBtn.disabled = !pdfFile;
});

convertPdfBtn.addEventListener('click', async () => {
  if(!pdfFile) return;
  const arrayBuf = await pdfFile.arrayBuffer();

  // Import pdfjsLib from the global pdfjs worker (loaded via module script URL)
  // We'll dynamically import the same CDN again in classic mode for simplicity.
  const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.mjs');
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuf) }).promise;

  const zip = new JSZip();
  pdfPagesGrid.innerHTML = '';

  for(let p=1; p<=pdf.numPages; p++){
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 2.0 }); // good quality
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Show preview
    pdfPagesGrid.appendChild(canvas);

    // Convert to blob and add to zip
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
    zip.file(`page-${p}.jpg`, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(zipBlob);
  a.download = 'pdf-pages.zip';
  document.body.appendChild(a);
  a.click();
  a.remove();
});

// Drag & Drop
document.querySelectorAll('.dropzone').forEach(zone => {
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault(); zone.classList.remove('drag');
    const type = zone.getAttribute('data-type');
    if(type === 'images'){
      const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
      if(files.length){ jpgFiles = files; renderJpgList(); convertJpgBtn.disabled = false; }
    }else{
      const file = (e.dataTransfer.files || [])[0];
      if(file && file.type === 'application/pdf'){ pdfFile = file; pdfPagesGrid.innerHTML=''; convertPdfBtn.disabled = false; }
    }
  });
});
