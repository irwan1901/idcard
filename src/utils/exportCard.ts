import { toPng, toBlob } from 'html-to-image';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { CardOrientation, SheetRow, CardTemplate } from '../types/card';

/**
 * Capture an HTML DOM element to high-res PNG
 */
export async function captureElementToPng(
  element: HTMLElement,
  pixelRatio: number = 2.5
): Promise<string> {
  try {
    return await toPng(element, {
      pixelRatio,
      quality: 0.95,
      skipAutoScale: true,
      cacheBust: false,
      skipFonts: true,
      fontEmbedCSS: '',
      style: {
        transform: 'none',
        transformOrigin: 'top left'
      }
    });
  } catch (err) {
    console.warn('Initial toPng failed, retrying with fallback options:', err);
    return await toPng(element, {
      pixelRatio: 2,
      quality: 0.9,
      skipAutoScale: true,
      cacheBust: true,
      style: {
        transform: 'none',
        transformOrigin: 'top left'
      }
    });
  }
}

/**
 * Capture an HTML DOM element to Blob
 */
export async function captureElementToBlob(
  element: HTMLElement,
  pixelRatio: number = 3
): Promise<Blob> {
  const blob = await toBlob(element, {
    pixelRatio,
    quality: 1,
    skipAutoScale: true,
    cacheBust: true,
    skipFonts: true,
    fontEmbedCSS: '',
    style: {
      transform: 'none',
      transformOrigin: 'top left'
    }
  });
  if (!blob) throw new Error('Failed to generate image blob');
  return blob;
}

/**
 * Triggers browser download of data URI or blob
 */
export function triggerDownload(content: string | Blob, filename: string) {
  const link = document.createElement('a');
  if (typeof content === 'string') {
    link.href = content;
  } else {
    link.href = URL.createObjectURL(content);
  }
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (typeof content !== 'string') {
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
}

/**
 * Download single card in high-res PNG (Front, Back, or Both side-by-side)
 */
export async function downloadCardAsPng(
  frontElement: HTMLElement | null,
  backElement: HTMLElement | null,
  cardName: string,
  mode: 'front' | 'back' | 'both' = 'front',
  pixelRatio: number = 3
) {
  if (mode === 'front' && frontElement) {
    const dataUrl = await captureElementToPng(frontElement, pixelRatio);
    triggerDownload(dataUrl, `${cardName}_Depan.png`);
    return;
  }

  if (mode === 'back' && backElement) {
    const dataUrl = await captureElementToPng(backElement, pixelRatio);
    triggerDownload(dataUrl, `${cardName}_Belakang.png`);
    return;
  }

  if (mode === 'both' && frontElement && backElement) {
    const frontUrl = await captureElementToPng(frontElement, pixelRatio);
    triggerDownload(frontUrl, `${cardName}_Depan.png`);
    
    // Brief delay to allow download queue
    setTimeout(async () => {
      const backUrl = await captureElementToPng(backElement, pixelRatio);
      triggerDownload(backUrl, `${cardName}_Belakang.png`);
    }, 400);
  }
}

/**
 * Export card as professional ISO CR80 PDF (85.6mm x 53.98mm)
 */
export async function exportCardAsPDF(
  frontElement: HTMLElement | null,
  backElement: HTMLElement | null,
  orientation: CardOrientation,
  cardName: string,
  includeBack: boolean = true
) {
  // CR-80 dimensions in millimeters
  const cr80Width = 85.60;
  const cr80Height = 53.98;

  const pdfWidth = orientation === 'landscape' ? cr80Width : cr80Height;
  const pdfHeight = orientation === 'landscape' ? cr80Height : cr80Width;

  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: [pdfWidth, pdfHeight]
  });

  if (frontElement) {
    const frontDataUrl = await captureElementToPng(frontElement, 3);
    doc.addImage(frontDataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  }

  if (includeBack && backElement) {
    doc.addPage([pdfWidth, pdfHeight], orientation);
    const backDataUrl = await captureElementToPng(backElement, 3);
    doc.addImage(backDataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  }

  doc.save(`${cardName}_CR80.pdf`);
}

/**
 * Creates a jsPDF A4 document with high-res cards arranged in grid with cut marks
 */
export async function createA4SheetPDF(
  cardImageUrls: string[],
  orientation: CardOrientation,
  targetCardsPerPage: number = 10,
  layoutMode: '10-front' | '10-back' | 'side-by-side' = '10-front'
): Promise<jsPDF> {
  const isCardLandscape = orientation === 'landscape';
  const sheetOrientation = isCardLandscape ? 'portrait' : 'landscape';

  const doc = new jsPDF({
    orientation: sheetOrientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = isCardLandscape ? 210 : 297;
  const pageHeight = isCardLandscape ? 297 : 210;

  // CR-80 standard card dimensions in mm
  const cardW = isCardLandscape ? 85.60 : 53.98;
  const cardH = isCardLandscape ? 53.98 : 85.60;

  let cols = isCardLandscape ? 2 : 5;
  let rows = isCardLandscape ? 5 : 2;

  if (layoutMode === 'side-by-side') {
    cols = 2;
    rows = 3;
  } else if (targetCardsPerPage === 8) {
    cols = isCardLandscape ? 2 : 4;
    rows = isCardLandscape ? 4 : 2;
  }

  const cardsPerPage = cols * rows;
  const totalCardsWidth = cols * cardW;
  const totalCardsHeight = rows * cardH;

  const marginX = 10;
  const marginY = 8;
  const gapX = cols > 1 ? (pageWidth - totalCardsWidth - marginX * 2) / (cols - 1) : 0;
  const gapY = rows > 1 ? (pageHeight - totalCardsHeight - marginY * 2) / (rows - 1) : 0;

  for (let i = 0; i < cardImageUrls.length; i++) {
    const cardIndexInPage = i % cardsPerPage;

    if (i > 0 && cardIndexInPage === 0) {
      doc.addPage('a4', sheetOrientation);
    }

    const col = cardIndexInPage % cols;
    const row = Math.floor(cardIndexInPage / cols);

    const x = marginX + col * (cardW + gapX);
    const y = marginY + row * (cardH + gapY);

    // Draw dashed cutting / crop guideline
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.rect(x - 0.4, y - 0.4, cardW + 0.8, cardH + 0.8);

    // Reset dash pattern
    doc.setLineDashPattern([], 0);

    // Draw corner crop marks
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.3);
    const markLen = 2.5;
    // Top-left
    doc.line(x - markLen, y, x, y);
    doc.line(x, y - markLen, x, y);
    // Top-right
    doc.line(x + cardW, y, x + cardW + markLen, y);
    doc.line(x + cardW, y - markLen, x + cardW, y);
    // Bottom-left
    doc.line(x - markLen, y + cardH, x, y + cardH);
    doc.line(x, y + cardH, x, y + cardH + markLen);
    // Bottom-right
    doc.line(x + cardW, y + cardH, x + cardW + markLen, y + cardH);
    doc.line(x + cardW, y + cardH, x + cardW, y + cardH + markLen);

    // Add high-resolution card image
    doc.addImage(cardImageUrls[i], 'PNG', x, y, cardW, cardH, undefined, 'FAST');
  }

  return doc;
}

/**
 * Export multiple cards into a printable A4 PDF sheet (10 cards per page grid with cut marks)
 */
export async function exportCardsToA4SheetPDF(
  cardImageUrls: string[],
  orientation: CardOrientation,
  filename: string = 'Koleksi_10_Kartu_A4.pdf',
  targetCardsPerPage: number = 10,
  layoutMode: '10-front' | '10-back' | 'side-by-side' = '10-front'
) {
  const doc = await createA4SheetPDF(cardImageUrls, orientation, targetCardsPerPage, layoutMode);
  doc.save(filename);
}

/**
 * Batch render all rows from Google Sheets and package into a ZIP file
 */
export async function batchExportCardsToZip(
  renderCardFn: (row: SheetRow, side: 'front' | 'back') => Promise<string>,
  rows: SheetRow[],
  cardPrefix: string,
  onProgress: (current: number, total: number) => void
) {
  const zip = new JSZip();
  const folder = zip.folder(`${cardPrefix}_Cards`) || zip;

  const total = rows.length;

  for (let i = 0; i < total; i++) {
    const row = rows[i];
    onProgress(i + 1, total);

    // Name identification
    const identifier = row.Nomor_Anggota || row.NISN || row.NIP || row.id || `Card_${i + 1}`;
    const name = row.Nama_Lengkap || row.Nama_Siswa || row.Nama_Pegawai || row.Full_Name || `Member_${i + 1}`;
    const safeName = `${identifier}_${name}`.replace(/[^a-zA-Z0-9_-]/g, '_');

    // Render Front
    const frontDataUrl = await renderCardFn(row, 'front');
    const frontBase64 = frontDataUrl.replace(/^data:image\/png;base64,/, '');
    folder.file(`${safeName}_Depan.png`, frontBase64, { base64: true });

    // Render Back
    const backDataUrl = await renderCardFn(row, 'back');
    const backBase64 = backDataUrl.replace(/^data:image\/png;base64,/, '');
    folder.file(`${safeName}_Belakang.png`, backBase64, { base64: true });
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(zipBlob, `${cardPrefix}_Batch_Kartu_Identitas.zip`);
}
