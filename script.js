// ====== UI helpers ======
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const show = (el) => el.classList.remove('hidden');
const hide = (el) => el.classList.add('hidden');
const setText = (el, txt) => { el.textContent = txt; };

const inp = $('#pdfInput');
const btnZip = $('#btnPdf2Jpg');
const statusEl = $('#pdf2jpgStatus');

const progressPanel = $('#panelProgress');
const progressDesc = $('#progressDesc');
const bar = $('#bar');

const resultPanel = $('#panelResult');
const thumbList = $('#thumbList');
const downloadAllBtn = $('#btnDownloadZip');
const startOverBtn = $('#btnStartOver');

let lastPdf = null;
let lastImages = [];
let lastZip = null;

// mode switch (JPG→PDF ยังไม่เปิดใช้)
$('#btnModePdf2Jpg').addEventListener('click', () => {});

inp.addEventListener('change', () => {
  if (inp.files && inp.files[0]) {
    lastPdf = inp.files[0];
    setText(statusEl, `เลือกไฟล์แล้ว: ${lastPdf.name} (${Math.round(lastPdf.size/1024/1024*100)/100} MB)`);
    btnZip.disabled = false;
  } else {
    setText(statusEl, '');
    btnZip.disabled = true;
  }
});

btnZip.addEventListener('click', async () => {
  if (!lastPdf) return;
  // เตรียม UI
  hide($('#cardPdf2Jpg'));
  show(progressPanel);
  setText(progressDesc, 'กำลังโหลดไฟล์ PDF…');
  bar.style.width = '5%';

  try {
    const buf = await lastPdf.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const total = pdf.numPages;

    // ZIP เตรียมไว้
    lastZip = new JSZip();
    const folder = lastZip.folder('images');
    lastImages = [];
    thumbList.innerHTML = '';
    downloadAllBtn.disabled = true;

    for (let i = 1; i <= total; i++) {
      setText(progressDesc, `กำลังแปลงหน้า ${i} / ${total}`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // คุณภาพดี
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;

      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
      lastImages.push(blob);
      folder.file(`page-${i}.jpg`, blob);

      // แสดงรายการดาวน์โหลดรายหน้า
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

      const pct = Math.round((i/total)*100);
      bar.style.width = pct + '%';
    }

    setText(progressDesc, 'สร้าง ZIP สำหรับดาวน์โหลด…');
    bar.style.width = '100%';

    // พร้อมแสดงผลลัพธ์
    hide(progressPanel);
    show(resultPanel);
    downloadAllBtn.disabled = false;
  } catch (err) {
    console.error(err);
    alert('แปลงไฟล์ไม่สำเร็จ: ' + err.message);
    // กลับหน้าแรก
    hide(progressPanel);
    show($('#cardPdf2Jpg'));
  }
});

// ดาวน์โหลดรายหน้า
thumbList.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-url]');
  if (!btn) return;
  const url = btn.getAttribute('data-url');
  // ใช้ชื่อจาก data-url
  saveAs(url, btn.getAttribute('download') || 'page.jpg');
});

// ดาวน์โหลดทั้งหมด ZIP
downloadAllBtn.addEventListener('click', async () => {
  if (!lastZip) return;
  const blob = await lastZip.generateAsync({ type: 'blob' });
  saveAs(blob, (lastPdf?.name?.replace(/\.pdf$/i,'') || 'pdf') + '-images.zip');
});

// เริ่มใหม่
startOverBtn.addEventListener('click', () => {
  lastPdf = null; lastImages = []; lastZip = null;
  inp.value = '';
  thumbList.innerHTML = '';
  setText(statusEl, '');
  btnZip.disabled = true;
  hide(resultPanel);
  show($('#cardPdf2Jpg'));
});
