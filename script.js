// Mode switch
const btnModePdf2Jpg = document.getElementById('btnModePdf2Jpg');
const btnModeJpg2Pdf = document.getElementById('btnModeJpg2Pdf');
const cardPdf2Jpg = document.getElementById('cardPdf2Jpg');
const cardJpg2Pdf = document.getElementById('cardJpg2Pdf');

btnModePdf2Jpg.addEventListener('click', () => {
  btnModePdf2Jpg.classList.add('active');
  btnModeJpg2Pdf.classList.remove('active');
  cardPdf2Jpg.classList.remove('hidden');
  cardJpg2Pdf.classList.add('hidden');
});

btnModeJpg2Pdf.addEventListener('click', () => {
  btnModeJpg2Pdf.classList.add('active');
  btnModePdf2Jpg.classList.remove('active');
  cardJpg2Pdf.classList.remove('hidden');
  cardPdf2Jpg.classList.add('hidden');
});

// PDF -> JPG
const pdfInput = document.getElementById('pdfInput');
const btnPdf2Jpg = document.getElementById('btnPdf2Jpg');
const pdf2jpgStatus = document.getElementById('pdf2jpgStatus');

pdfInput.addEventListener('change', () => {
  btnPdf2Jpg.disabled = !pdfInput.files?.length;
  pdf2jpgStatus.textContent = pdfInput.files?.length ? `เลือกไฟล์แล้ว: ${pdfInput.files[0].name}` : '';
});

btnPdf2Jpg.addEventListener('click', async () => {
  if (!pdfInput.files?.length) return;
  const file = pdfInput.files[0];
  try {
    pdf2jpgStatus.textContent = 'กำลังอ่านไฟล์ PDF และเรนเดอร์หน้าเป็นภาพ...';
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const zip = new JSZip();

    for (let i=1; i<=pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // คมชัด
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
      const buf = await blob.arrayBuffer();
      zip.file(`page-${String(i).padStart(3,'0')}.jpg`, buf);
      pdf2jpgStatus.textContent = `เรนเดอร์หน้า ${i}/${pdf.numPages} ...`;
    }

    const content = await zip.generateAsync({ type:'blob' });
    saveAs(content, file.name.replace(/\.pdf$/i,'') + '_jpg_pages.zip');
    pdf2jpgStatus.textContent = 'สำเร็จ! ดาวน์โหลดไฟล์ ZIP แล้ว';
  } catch (err) {
    console.error(err);
    pdf2jpgStatus.textContent = 'เกิดข้อผิดพลาดในการแปลงไฟล์ PDF → JPG';
  }
});

// JPG -> PDF
const imgInput = document.getElementById('imgInput');
const btnJpg2Pdf = document.getElementById('btnJpg2Pdf');
const jpg2pdfStatus = document.getElementById('jpg2pdfStatus');

imgInput.addEventListener('change', () => {
  btnJpg2Pdf.disabled = !imgInput.files?.length;
  jpg2pdfStatus.textContent = imgInput.files?.length ? `เลือกรูปแล้ว: ${imgInput.files.length} ไฟล์` : '';
});

btnJpg2Pdf.addEventListener('click', async () => {
  const files = Array.from(imgInput.files || []);
  if (!files.length) return;
  try {
    jpg2pdfStatus.textContent = 'กำลังรวมรูปเป็น PDF ...';
    const pdfDoc = await PDFLib.PDFDocument.create();

    // เรียงตามชื่อไฟล์
    files.sort((a,b)=> a.name.localeCompare(b.name, undefined, {numeric:true, sensitivity:'base'}));

    for (let i=0;i<files.length;i++) {
      const f = files[i];
      const bytes = new Uint8Array(await f.arrayBuffer());
      let img, dims;
      if (f.type === 'image/png') {
        img = await pdfDoc.embedPng(bytes);
      } else {
        img = await pdfDoc.embedJpg(bytes);
      }
      dims = img.scale(1);

      const page = pdfDoc.addPage([dims.width, dims.height]);
      page.drawImage(img, { x:0, y:0, width:dims.width, height:dims.height });
      jpg2pdfStatus.textContent = `เพิ่มรูป ${i+1}/${files.length} ...`;
    }

    const pdfBytes = await pdfDoc.save();
    saveAs(new Blob([pdfBytes], {type:'application/pdf'}), 'merged_images.pdf');
    jpg2pdfStatus.textContent = 'สำเร็จ! ดาวน์โหลด PDF แล้ว';
  } catch (err) {
    console.error(err);
    jpg2pdfStatus.textContent = 'เกิดข้อผิดพลาดในการแปลง JPG → PDF';
  }
});
