import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Printer, Download, Eye, FileText, CheckSquare, Square, 
  ChevronLeft, ChevronRight, Sliders, X, Sparkles, Check, HelpCircle, AlertCircle, RotateCw, Loader2
} from 'lucide-react';
import { CardTemplate, SheetRow, CardOrientation } from '../types/card';
import { CardCanvas } from './CardCanvas';
import { 
  createA4SheetPDF, 
  exportCardsToA4SheetPDF, 
  captureElementToPng, 
  triggerDownload 
} from '../utils/exportCard';
import confetti from 'canvas-confetti';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: CardTemplate;
  rows: SheetRow[];
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  template,
  rows
}) => {
  // Selected row IDs for printing
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>(
    rows.map((r, i) => r.id || `row-${i}`)
  );

  // Layout mode: '10-front' (10 cards front), '10-back' (10 cards back), 'side-by-side' (front + back)
  const [layoutMode, setLayoutMode] = useState<'10-front' | '10-back' | 'side-by-side'>('10-front');
  const [cardsPerPageChoice, setCardsPerPageChoice] = useState<10 | 8>(10);
  const [cardGap, setCardGap] = useState<number>(6);
  const [sheetOrientationChoice, setSheetOrientationChoice] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [showCropMarks, setShowCropMarks] = useState<boolean>(true);
  const [showMemberLabels, setShowMemberLabels] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [previewZoom, setPreviewZoom] = useState<number>(0.85);
  const [printScope, setPrintScope] = useState<'all' | 'current'>('all');
  const [showPrintTips, setShowPrintTips] = useState<boolean>(false);
  const [autoFill10, setAutoFill10] = useState<boolean>(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingAction, setProcessingAction] = useState<'download' | 'print' | null>(null);
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [printReadyBlobUrl, setPrintReadyBlobUrl] = useState<string | null>(null);

  // Off-screen container ref for pristine 100% full-resolution rendering (zoom=1)
  const offscreenContainerRef = useRef<HTMLDivElement>(null);

  // Filter rows based on selection
  const selectedRows = useMemo(() => {
    return rows.filter((r, i) => selectedRowIds.includes(r.id || `row-${i}`));
  }, [rows, selectedRowIds]);

  // If autoFill10 is checked and selected count < 10, repeat items to fill all 10 slots on the page
  const activePrintRows = useMemo(() => {
    if (selectedRows.length === 0) return [];
    if (autoFill10 && selectedRows.length < 10) {
      const filled: SheetRow[] = [];
      let i = 0;
      while (filled.length < 10) {
        filled.push({
          ...selectedRows[i % selectedRows.length],
          id: `filled-slot-${filled.length + 1}`
        });
        i++;
      }
      return filled;
    }
    return selectedRows;
  }, [selectedRows, autoFill10]);

  // Orientation and dimension calculations
  const isCardLandscape = template.orientation === 'landscape';
  const baseCardW = isCardLandscape ? template.dimensions.width : template.dimensions.height;
  const baseCardH = isCardLandscape ? template.dimensions.height : template.dimensions.width;

  // Effective sheet orientation
  const effectiveSheetOrientation: 'portrait' | 'landscape' = useMemo(() => {
    if (sheetOrientationChoice === 'auto') {
      return isCardLandscape ? 'portrait' : 'landscape';
    }
    return sheetOrientationChoice;
  }, [sheetOrientationChoice, isCardLandscape]);

  // Standard A4 pixel sizes at 96 DPI: 794 x 1123
  const sheetPixelWidth = effectiveSheetOrientation === 'portrait' ? 794 : 1123;
  const sheetPixelHeight = effectiveSheetOrientation === 'portrait' ? 1123 : 794;

  // Grid configuration
  const gridConfig = useMemo(() => {
    if (layoutMode === 'side-by-side') {
      return { cols: 2, rows: 3, cardsPerPage: 6 };
    }

    if (effectiveSheetOrientation === 'landscape') {
      if (cardsPerPageChoice === 10) {
        return { cols: 5, rows: 2, cardsPerPage: 10 };
      } else {
        return { cols: 4, rows: 2, cardsPerPage: 8 };
      }
    } else {
      // Portrait sheet
      if (cardsPerPageChoice === 10) {
        return { cols: 2, rows: 5, cardsPerPage: 10 };
      } else {
        return { cols: 2, rows: 4, cardsPerPage: 8 };
      }
    }
  }, [layoutMode, effectiveSheetOrientation, cardsPerPageChoice]);

  const cardsPerPage = gridConfig.cardsPerPage;
  const totalPages = Math.max(1, Math.ceil(activePrintRows.length / (layoutMode === 'side-by-side' ? 3 : cardsPerPage)));

  // Helper to get items for any specific page
  const getPageItems = (pageNumber: number) => {
    const multiplier = layoutMode === 'side-by-side' ? 3 : cardsPerPage;
    const startIndex = (pageNumber - 1) * multiplier;
    return activePrintRows.slice(startIndex, startIndex + multiplier);
  };

  // Current page items for on-screen preview
  const currentPageItems = useMemo(() => {
    return getPageItems(currentPage);
  }, [activePrintRows, currentPage, cardsPerPage, layoutMode]);

  // Determine which pages to print
  const pagesToPrint = useMemo(() => {
    if (printScope === 'current') {
      return [currentPage];
    }
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [printScope, currentPage, totalPages]);

  // Card scaling calculation for on-screen preview
  const printableW = sheetPixelWidth - 60;
  const printableH = sheetPixelHeight - 120;

  const labelHeight = showMemberLabels ? 16 : 0;
  const maxAllowedW = (printableW - (gridConfig.cols - 1) * cardGap) / gridConfig.cols;
  const maxAllowedH = (printableH - (gridConfig.rows - 1) * (cardGap + labelHeight)) / gridConfig.rows - labelHeight;

  const scaleX = maxAllowedW / baseCardW;
  const scaleY = maxAllowedH / baseCardH;
  const cardZoom = Math.min(scaleX, scaleY, 0.44);

  const cardVisualWidth = Math.round(baseCardW * cardZoom);
  const cardVisualHeight = Math.round(baseCardH * cardZoom);

  if (!isOpen) return null;

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedRowIds.length === rows.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(rows.map((r, i) => r.id || `row-${i}`));
    }
  };

  const handleToggleRow = (id: string) => {
    if (selectedRowIds.includes(id)) {
      setSelectedRowIds(selectedRowIds.filter(item => item !== id));
    } else {
      setSelectedRowIds([...selectedRowIds, id]);
    }
  };

  // Capture all cards from the unscaled off-screen container at full 100% resolution
  const captureAllCards = async (): Promise<string[]> => {
    if (!offscreenContainerRef.current) {
      throw new Error('Renderer kartu belum siap. Silakan coba lagi.');
    }

    const cardUnits = offscreenContainerRef.current.querySelectorAll('.offscreen-card-unit');
    if (cardUnits.length === 0) {
      throw new Error('Tidak ada kartu untuk diproses.');
    }

    const images: string[] = [];
    for (let i = 0; i < cardUnits.length; i++) {
      const el = cardUnits[i] as HTMLElement;
      setProcessingMessage(`Merender kartu identitas ${i + 1} dari ${cardUnits.length} (300 DPI)...`);
      const dataUrl = await captureElementToPng(el, 2);
      images.push(dataUrl);
    }
    return images;
  };

  // Action: Unduh PDF A4
  const handleDownloadA4PDF = async () => {
    if (activePrintRows.length === 0) {
      alert('Pilih minimal satu anggota untuk dicetak.');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingAction('download');
      setProcessingMessage('Menyiapkan gambar kartu beresolusi tinggi...');

      // Small tick for DOM paint
      await new Promise(r => setTimeout(r, 80));
      const cardImages = await captureAllCards();

      setProcessingMessage('Menyusun kisi cetak A4 dan mengunduh PDF...');
      await new Promise(r => setTimeout(r, 80));

      const filename = `${template.id}_Lembar_Cetak_A4.pdf`;
      await exportCardsToA4SheetPDF(
        cardImages, 
        template.orientation, 
        filename,
        cardsPerPageChoice,
        layoutMode
      );

      confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 } });
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      alert(`Gagal membuat PDF: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
      setProcessingMessage('');
    }
  };

  // Action: Cetak Sekarang (Print)
  const handleTriggerPrint = async () => {
    if (activePrintRows.length === 0) {
      alert('Pilih minimal satu anggota untuk dicetak.');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingAction('print');
      setProcessingMessage('Menyiapkan dokumen A4 siap cetak...');

      // Small tick for DOM paint
      await new Promise(r => setTimeout(r, 80));
      const cardImages = await captureAllCards();

      setProcessingMessage('Memformat dokumen A4 ke printer...');
      await new Promise(r => setTimeout(r, 80));

      const doc = await createA4SheetPDF(
        cardImages,
        template.orientation,
        cardsPerPageChoice,
        layoutMode
      );

      doc.autoPrint();
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      setPrintReadyBlobUrl(blobUrl);

      // 1. Automatically download the print-ready PDF so the user has the file immediately
      const filename = `${template.id}_Lembar_SIAP_CETAK.pdf`;
      triggerDownload(pdfBlob, filename);

      // 2. Load blob into hidden iframe and invoke print
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      printFrame.style.opacity = '0';
      printFrame.style.pointerEvents = 'none';
      printFrame.src = blobUrl;
      document.body.appendChild(printFrame);
      printFrame.onload = () => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print intercepted:', e);
        }
      };

      // 3. Also try standard window.print()
      try {
        window.print();
      } catch (e) {
        // Silently handled for sandboxed environments
      }

      confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 } });
    } catch (err: any) {
      console.error('Error printing:', err);
      alert(`Gagal memproses cetak: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
      setProcessingMessage('');
    }
  };

  return (
    <>
      {/* On-Screen Modal UI */}
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 no-print">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-7xl h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
          
          {/* Active Processing / Loading Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full flex flex-col items-center text-center shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                  <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm font-outfit">
                    {processingAction === 'print' ? 'Menyiapkan Cetak A4' : 'Membuat Dokumen PDF A4'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 font-medium leading-relaxed">
                    {processingMessage || 'Sedang memproses kartu identitas...'}
                  </p>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full w-2/3 animate-pulse rounded-full" />
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base text-white font-outfit">
                    Pratinjau Cetak Massal (Print Preview A4)
                  </h2>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
                    {activePrintRows.length} Kartu Dipilih
                  </span>
                  <span className="text-[11px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
                    {gridConfig.cols} × {gridConfig.rows} ({cardsPerPage} Kartu / Lembar)
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Susunan rapi presisi ukuran CR-80 pada kertas A4 dengan garis potong
                </p>
              </div>
            </div>

            {/* Action buttons (Unduh PDF A4 & Cetak Sekarang) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPrintTips(!showPrintTips)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition flex items-center gap-1.5 text-xs"
                title="Petunjuk Pengaturan Cetak"
              >
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <span className="hidden md:inline">Panduan Cetak</span>
              </button>

              {/* Print Scope Selector */}
              <div className="hidden sm:flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPrintScope('all')}
                  className={`px-2.5 py-1 rounded-lg transition font-medium text-[11px] ${
                    printScope === 'all'
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Cetak seluruh halaman sekaligus"
                >
                  Semua ({totalPages} Lembar)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintScope('current')}
                  className={`px-2.5 py-1 rounded-lg transition font-medium text-[11px] ${
                    printScope === 'current'
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Hanya cetak lembar yang aktif sekarang"
                >
                  Hal. {currentPage} Saja
                </button>
              </div>

              {/* TOMBOL UNDUH PDF A4 */}
              <button
                onClick={handleDownloadA4PDF}
                disabled={isProcessing || activePrintRows.length === 0}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-50 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
                title="Unduh file dokumen PDF A4 beresolusi tinggi"
              >
                {isProcessing && processingAction === 'download' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                ) : (
                  <Download className="w-4 h-4 text-emerald-400" />
                )}
                <span>
                  {isProcessing && processingAction === 'download' ? 'Membuat PDF...' : 'Unduh PDF A4'}
                </span>
              </button>

              {/* TOMBOL CETAK SEKARANG (PRINT) */}
              <button
                onClick={handleTriggerPrint}
                disabled={isProcessing || activePrintRows.length === 0}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-emerald-500/20 cursor-pointer"
                title="Buka dialog cetak printer & unduh file siap cetak"
              >
                {isProcessing && processingAction === 'print' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                <span>
                  {isProcessing && processingAction === 'print' ? 'Mempersiapkan Cetak...' : 'Cetak Sekarang (Print)'}
                </span>
              </button>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Print Ready Notification Banner */}
          {printReadyBlobUrl && (
            <div className="bg-emerald-950/80 border-b border-emerald-600/50 p-2.5 px-4 flex items-center justify-between text-xs text-emerald-200 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Dokumen Siap Dicetak!</strong> Dialog cetak telah dibuka dan file PDF otomatis diunduh ke komputer Anda.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={printReadyBlobUrl}
                  download={`${template.id}_Lembar_SIAP_CETAK.pdf`}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded text-[11px] transition shadow"
                >
                  Unduh Ulang PDF
                </a>
                <button
                  onClick={() => setPrintReadyBlobUrl(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Print Tips Notice (collapsible) */}
          {showPrintTips && (
            <div className="p-3 bg-indigo-950/70 border-b border-indigo-800/60 px-5 text-xs text-indigo-200 flex items-start gap-2.5 animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold text-white">Tips Mencetak Kartu ID ke Kertas PVC / A4:</span>
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-slate-300">
                  <li>Pada dialog cetak browser, pastikan <strong>"Background graphics" (Grafik latar belakang)</strong> dicentang agar warna kartu muncul utuh.</li>
                  <li>Atur <strong>Scale (Skala)</strong> ke <strong>100%</strong> (bukan Fit to Page) agar dimensi kartu tetap presisi 85.6 × 54 mm.</li>
                  <li>Pilih <strong>Margins: None</strong> (Tanpa Margin) untuk posisi presisi.</li>
                  <li>Tombol <strong>"Unduh PDF A4"</strong> menghasilkan file PDF standar siap kirim ke percetakan.</li>
                </ul>
              </div>
              <button onClick={() => setShowPrintTips(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Modal Main Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel: Print Controls & Member Checklist */}
            <aside className="w-72 sm:w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Format & Sisi Cetak */}
              <div>
                <label className="block text-slate-400 font-semibold mb-2 uppercase tracking-wider text-[11px]">
                  Format & Tata Letak Cetak
                </label>

                {/* Jumlah Kartu per Halaman */}
                <div className="mb-2">
                  <span className="block text-[11px] text-slate-400 mb-1 font-medium">Jumlah Kartu per Lembar:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => { setCardsPerPageChoice(10); setCurrentPage(1); }}
                      className={`py-2 px-2 rounded-lg border text-center transition font-semibold text-xs flex items-center justify-center gap-1.5 ${
                        cardsPerPageChoice === 10
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                          : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <span>10 Kartu</span>
                      <span className="text-[9px] bg-emerald-500/30 text-emerald-300 px-1 rounded font-mono">Standar</span>
                    </button>
                    <button
                      onClick={() => { setCardsPerPageChoice(8); setCurrentPage(1); }}
                      className={`py-2 px-2 rounded-lg border text-center transition font-medium text-xs ${
                        cardsPerPageChoice === 8
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                          : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <span>8 Kartu</span>
                    </button>
                  </div>
                </div>

                {/* Orientasi Lembar Kertas A4 */}
                <div className="mb-2">
                  <span className="block text-[11px] text-slate-400 mb-1 font-medium">Orientasi Kertas A4:</span>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => setSheetOrientationChoice('auto')}
                      className={`py-1.5 px-1 rounded-lg border text-center transition font-medium text-[10.5px] ${
                        sheetOrientationChoice === 'auto'
                          ? 'border-sky-500 bg-sky-500/20 text-sky-200 font-semibold'
                          : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      Otomatis
                    </button>
                    <button
                      onClick={() => setSheetOrientationChoice('portrait')}
                      className={`py-1.5 px-1 rounded-lg border text-center transition font-medium text-[10.5px] ${
                        sheetOrientationChoice === 'portrait'
                          ? 'border-sky-500 bg-sky-500/20 text-sky-200 font-semibold'
                          : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      A4 Tegak
                    </button>
                    <button
                      onClick={() => setSheetOrientationChoice('landscape')}
                      className={`py-1.5 px-1 rounded-lg border text-center transition font-medium text-[10.5px] ${
                        sheetOrientationChoice === 'landscape'
                          ? 'border-sky-500 bg-sky-500/20 text-sky-200 font-semibold'
                          : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      A4 Mendatar
                    </button>
                  </div>
                </div>

                {/* Sisi Cetak */}
                <div>
                  <span className="block text-[11px] text-slate-400 mb-1 font-medium">Sisi Kartu:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => { setLayoutMode('10-front'); setCurrentPage(1); }}
                      className={`p-2 rounded-lg border text-center transition font-medium ${
                        layoutMode === '10-front'
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200 font-semibold'
                          : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      Tampak Depan
                    </button>
                    <button
                      onClick={() => { setLayoutMode('10-back'); setCurrentPage(1); }}
                      className={`p-2 rounded-lg border text-center transition font-medium ${
                        layoutMode === '10-back'
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200 font-semibold'
                          : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      Tampak Belakang
                    </button>
                    <button
                      onClick={() => { setLayoutMode('side-by-side'); setCurrentPage(1); }}
                      className={`col-span-2 p-2 rounded-lg border text-center transition font-medium ${
                        layoutMode === 'side-by-side'
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200 font-semibold'
                          : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      Berdampingan (Depan & Belakang Sekaligus)
                    </button>
                  </div>
                </div>

                {/* Option to autofill up to 10 cards */}
                {selectedRows.length < 10 && (
                  <div className="mt-2.5 p-2 bg-emerald-950/30 border border-emerald-800/40 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer text-emerald-300">
                      <input
                        type="checkbox"
                        checked={autoFill10}
                        onChange={e => setAutoFill10(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-[11px] font-medium leading-tight">
                        Isi Penuh 10 Slot Kartu (Duplikat contoh anggota untuk uji coba)
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Jarak Antar Kartu (Spacing & Gap) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    Jarak Antar Kartu (Gap)
                  </label>
                  <span className="font-mono text-emerald-400 text-[11px] font-bold">
                    {cardGap}px
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => setCardGap(3)}
                    className={`py-1 text-[10px] rounded-lg border text-center transition ${
                      cardGap === 3
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200 font-bold'
                        : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    Sangat Rapat (3px)
                  </button>
                  <button
                    onClick={() => setCardGap(6)}
                    className={`py-1 text-[10px] rounded-lg border text-center transition ${
                      cardGap === 6
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200 font-bold'
                        : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    Standar (6px)
                  </button>
                  <button
                    onClick={() => setCardGap(12)}
                    className={`py-1 text-[10px] rounded-lg border text-center transition ${
                      cardGap === 12
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200 font-bold'
                        : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    Renggang (12px)
                  </button>
                </div>
              </div>

              {/* Print Marks Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  Panduan Garis Potong
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showCropMarks}
                    onChange={e => setShowCropMarks(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Tampilkan Garis Potong Putus-Putus</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showMemberLabels}
                    onChange={e => setShowMemberLabels(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Tampilkan Label Nama / Slot ID</span>
                </label>
              </div>

              {/* Member Selection List */}
              <div className="flex-1 flex flex-col pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    Pilih Anggota ({selectedRowIds.length}/{rows.length})
                  </label>
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-emerald-400 hover:text-emerald-300 text-[11px] font-medium"
                  >
                    {selectedRowIds.length === rows.length ? 'Batal Semua' : 'Pilih Semua'}
                  </button>
                </div>

                <div className="flex-1 max-h-48 overflow-y-auto space-y-1 pr-1">
                  {rows.map((row, idx) => {
                    const id = row.id || `row-${idx}`;
                    const isChecked = selectedRowIds.includes(id);
                    const name = row.Nama_Lengkap || row.Nama_Siswa || row.Nama_Pegawai || row.Full_Name || `Anggota ${idx + 1}`;
                    const noId = row.Nomor_Anggota || row.NISN || row.NIP || row.Dev_Handle || `ID-${idx + 1}`;
                    const photo = row.Foto_URL || row.Foto_Siswa || row.Foto_Pegawai || row.Avatar_URL;

                    return (
                      <div
                        key={id}
                        onClick={() => handleToggleRow(id)}
                        className={`p-1.5 rounded-lg border cursor-pointer transition flex items-center gap-2.5 ${
                          isChecked
                            ? 'border-emerald-600/60 bg-emerald-950/20 text-white'
                            : 'border-slate-800/80 bg-slate-950/40 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded bg-slate-900 border-slate-700 text-emerald-500 pointer-events-none"
                        />
                        {photo ? (
                          <img
                            src={photo}
                            alt={name}
                            className="w-5 h-5 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[9px]">
                            {name[0]}
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <div className="font-semibold truncate text-[10.5px]">{name}</div>
                          <div className="text-[9.5px] text-slate-500 font-mono truncate">{noId}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Info summary */}
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[10.5px] text-slate-400 space-y-0.5">
                <div className="text-slate-300 font-semibold">Ringkasan Format:</div>
                <div>Ukuran Kertas: <strong>A4 ({effectiveSheetOrientation === 'portrait' ? '210 × 297 mm' : '297 × 210 mm'})</strong></div>
                <div>Susunan Kartu: <strong>{gridConfig.cols} Kolom × {gridConfig.rows} Baris</strong></div>
                <div>Total Lembar: <strong>{totalPages} Lembar</strong></div>
              </div>
            </aside>

            {/* Center: Interactive A4 Sheet Viewport (for screen viewing) */}
            <main className="flex-1 bg-slate-950/80 overflow-auto p-4 sm:p-6 flex flex-col items-center">
              {/* Sheet Page Navigation Bar */}
              <div className="mb-4 flex items-center justify-between w-full max-w-3xl">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-slate-300 transition"
                    title="Lembar Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-semibold text-slate-200">
                    Lembar A4 ke-{currentPage} dari {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-slate-300 transition"
                    title="Lembar Selanjutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Zoom slider */}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Zoom Layar:</span>
                  <input
                    type="range"
                    min={0.4}
                    max={1.1}
                    step={0.05}
                    value={previewZoom}
                    onChange={e => setPreviewZoom(Number(e.target.value))}
                    className="w-24 accent-emerald-500"
                  />
                  <span className="font-mono text-[11px] w-9">{Math.round(previewZoom * 100)}%</span>
                </div>
              </div>

              {/* A4 Sheet Container Mockup (Screen view) */}
              <div
                className="bg-white text-slate-900 shadow-2xl rounded-sm transition-transform duration-150 origin-top overflow-hidden relative flex flex-col justify-between"
                style={{
                  width: `${sheetPixelWidth}px`,
                  height: `${sheetPixelHeight}px`,
                  padding: '24px',
                  boxSizing: 'border-box',
                  transform: `scale(${previewZoom})`
                }}
              >
                {/* Header on A4 Sheet */}
                <div className="pb-2 border-b border-slate-300 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 tracking-wider uppercase font-outfit flex items-center gap-1.5">
                      <span>{template.name}</span>
                      <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded text-[10px] font-mono">
                        {cardsPerPage} ID CARD / HALAMAN ({gridConfig.cols}×{gridConfig.rows})
                      </span>
                    </span>
                    <span>•</span>
                    <span>CR-80 (85.6 × 54 mm)</span>
                  </div>
                  <div className="font-semibold text-slate-700">
                    Halaman {currentPage} dari {totalPages}
                  </div>
                </div>

                {/* Cards Grid: Mathematically bounded to stay strictly within sheet */}
                {currentPageItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <Printer className="w-12 h-12 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak Ada Kartu yang Dipilih</p>
                    <p className="text-xs">Centang anggota di panel kiri untuk mulai mencetak.</p>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center py-2">
                    <div
                      className="grid justify-center items-center"
                      style={{
                        gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, auto))`,
                        rowGap: `${cardGap}px`,
                        columnGap: `${cardGap * 1.5}px`
                      }}
                    >
                      {currentPageItems.map((row, idx) => {
                        const memberName = row.Nama_Lengkap || row.Nama_Siswa || row.Nama_Pegawai || row.Full_Name || `Member ${idx + 1}`;
                        const memberId = row.Nomor_Anggota || row.NISN || row.NIP || row.Dev_Handle || `ID-${idx + 1}`;
                        const slotNumber = (currentPage - 1) * cardsPerPage + idx + 1;

                        if (layoutMode === 'side-by-side') {
                          return (
                            <React.Fragment key={row.id || idx}>
                              {/* Front Side */}
                              <div className="flex flex-col items-center" style={{ width: `${cardVisualWidth}px` }}>
                                {showMemberLabels && (
                                  <div className="w-full text-[8.5px] font-mono text-slate-600 mb-0.5 truncate flex items-center justify-between px-0.5">
                                    <span className="truncate font-semibold">#{idx * 2 + 1}. {memberName}</span>
                                    <span className="text-[7.5px] bg-slate-200 px-1 rounded font-bold shrink-0">DEPAN</span>
                                  </div>
                                )}
                                <div
                                  className="relative bg-white rounded-xs overflow-hidden"
                                  style={{
                                    width: `${cardVisualWidth}px`,
                                    height: `${cardVisualHeight}px`
                                  }}
                                >
                                  {showCropMarks && (
                                    <div className="absolute inset-0 pointer-events-none border border-dashed border-slate-400 z-20 rounded-xs" />
                                  )}
                                  <CardCanvas
                                    sideDesign={template.front}
                                    orientation={template.orientation}
                                    dimensions={template.dimensions}
                                    activeRow={row}
                                    selectedElementId={null}
                                    onSelectElement={() => {}}
                                    onUpdateElementPosition={() => {}}
                                    readOnly={true}
                                    zoom={cardZoom}
                                  />
                                </div>
                              </div>

                              {/* Back Side */}
                              <div className="flex flex-col items-center" style={{ width: `${cardVisualWidth}px` }}>
                                {showMemberLabels && (
                                  <div className="w-full text-[8.5px] font-mono text-slate-600 mb-0.5 truncate flex items-center justify-between px-0.5">
                                    <span className="truncate font-semibold">#{idx * 2 + 2}. {memberName}</span>
                                    <span className="text-[7.5px] bg-slate-200 px-1 rounded font-bold shrink-0">BELAKANG</span>
                                  </div>
                                )}
                                <div
                                  className="relative bg-white rounded-xs overflow-hidden"
                                  style={{
                                    width: `${cardVisualWidth}px`,
                                    height: `${cardVisualHeight}px`
                                  }}
                                >
                                  {showCropMarks && (
                                    <div className="absolute inset-0 pointer-events-none border border-dashed border-slate-400 z-20 rounded-xs" />
                                  )}
                                  <CardCanvas
                                    sideDesign={template.back}
                                    orientation={template.orientation}
                                    dimensions={template.dimensions}
                                    activeRow={row}
                                    selectedElementId={null}
                                    onSelectElement={() => {}}
                                    onUpdateElementPosition={() => {}}
                                    readOnly={true}
                                    zoom={cardZoom}
                                  />
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        }

                        // Standard 10-front or 10-back
                        const sideDesign = layoutMode === '10-front' ? template.front : template.back;
                        return (
                          <div
                            key={row.id || idx}
                            className="flex flex-col items-center"
                            style={{ width: `${cardVisualWidth}px` }}
                          >
                            {showMemberLabels && (
                              <div className="w-full text-[8.5px] font-mono text-slate-600 mb-0.5 truncate flex items-center justify-between px-0.5">
                                <span className="truncate font-semibold text-slate-800">
                                  #{slotNumber}. {memberName}
                                </span>
                                <span className="text-[7.5px] bg-slate-100 border border-slate-300 px-1 rounded font-mono text-slate-500 shrink-0 ml-1">
                                  {memberId}
                                </span>
                              </div>
                            )}

                            <div
                              className="relative bg-white rounded-xs overflow-hidden shadow-xs"
                              style={{
                                width: `${cardVisualWidth}px`,
                                height: `${cardVisualHeight}px`
                              }}
                            >
                              {/* Cutting line */}
                              {showCropMarks && (
                                <div className="absolute inset-0 pointer-events-none border border-dashed border-slate-400 z-20 rounded-xs" />
                              )}

                              <CardCanvas
                                sideDesign={sideDesign}
                                orientation={template.orientation}
                                dimensions={template.dimensions}
                                activeRow={row}
                                selectedElementId={null}
                                onSelectElement={() => {}}
                                onUpdateElementPosition={() => {}}
                                readOnly={true}
                                zoom={cardZoom}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer on Sheet */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
                  <span>Dihasilkan otomatis oleh KartuID Studio • Standar CR-80 ISO 7810</span>
                  <span>Gunakan pisau potong / card cutter di sepanjang garis putus-putus</span>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* DEDICATED OFF-SCREEN CONTAINER FOR PRISTINE 100% UN-SCALED RENDERING (zoom=1) */}
      <div
        ref={offscreenContainerRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0',
          width: '1600px',
          pointerEvents: 'none',
          zIndex: -50
        }}
      >
        {activePrintRows.map((row, idx) => {
          if (layoutMode === 'side-by-side') {
            return (
              <div key={`offscreen-pair-${row.id || idx}`} style={{ display: 'flex' }}>
                <div className="offscreen-card-unit" style={{ display: 'inline-block' }}>
                  <CardCanvas
                    sideDesign={template.front}
                    orientation={template.orientation}
                    dimensions={template.dimensions}
                    activeRow={row}
                    selectedElementId={null}
                    onSelectElement={() => {}}
                    onUpdateElementPosition={() => {}}
                    readOnly={true}
                    zoom={1}
                  />
                </div>
                <div className="offscreen-card-unit" style={{ display: 'inline-block' }}>
                  <CardCanvas
                    sideDesign={template.back}
                    orientation={template.orientation}
                    dimensions={template.dimensions}
                    activeRow={row}
                    selectedElementId={null}
                    onSelectElement={() => {}}
                    onUpdateElementPosition={() => {}}
                    readOnly={true}
                    zoom={1}
                  />
                </div>
              </div>
            );
          }

          const sideDesign = layoutMode === '10-front' ? template.front : template.back;
          return (
            <div
              key={`offscreen-single-${row.id || idx}`}
              className="offscreen-card-unit"
              style={{ display: 'inline-block' }}
            >
              <CardCanvas
                sideDesign={sideDesign}
                orientation={template.orientation}
                dimensions={template.dimensions}
                activeRow={row}
                selectedElementId={null}
                onSelectElement={() => {}}
                onUpdateElementPosition={() => {}}
                readOnly={true}
                zoom={1}
              />
            </div>
          );
        })}
      </div>

      {/* DEDICATED PRINT DOCUMENT (Portaled directly to document.body, only rendered during browser printing) */}
      {typeof document !== 'undefined' && createPortal(
        <div id="printable-document">
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @page {
                  size: A4 ${effectiveSheetOrientation};
                  margin: 0;
                }
              `
            }}
          />
          {pagesToPrint.map((pageNumber) => {
            const pageItems = getPageItems(pageNumber);
            return (
              <div
                key={`print-sheet-page-${pageNumber}`}
                className="print-sheet-page bg-white text-slate-900 mx-auto flex flex-col justify-between overflow-hidden"
                style={{
                  width: `${sheetPixelWidth}px`,
                  height: `${sheetPixelHeight}px`,
                  padding: '24px',
                  boxSizing: 'border-box'
                }}
              >
                {/* Print Sheet Header */}
                <div className="pb-2 border-b border-slate-300 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 tracking-wider uppercase font-outfit flex items-center gap-1.5">
                      <span>{template.name}</span>
                      <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded text-[10px] font-mono">
                        {cardsPerPage} ID CARD / HALAMAN ({gridConfig.cols}×{gridConfig.rows})
                      </span>
                    </span>
                    <span>•</span>
                    <span>CR-80 (85.6 × 54 mm)</span>
                  </div>
                  <div className="font-semibold text-slate-700">
                    Halaman {pageNumber} dari {totalPages}
                  </div>
                </div>

                {/* Print Sheet Cards Grid */}
                <div className="flex-1 flex items-center justify-center py-2">
                  <div
                    className="grid justify-center items-center"
                    style={{
                      gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, auto))`,
                      rowGap: `${cardGap}px`,
                      columnGap: `${cardGap * 1.5}px`
                    }}
                  >
                    {pageItems.map((row, idx) => {
                      const memberName = row.Nama_Lengkap || row.Nama_Siswa || row.Nama_Pegawai || row.Full_Name || `Member ${idx + 1}`;
                      const memberId = row.Nomor_Anggota || row.NISN || row.NIP || row.Dev_Handle || `ID-${idx + 1}`;
                      const slotNumber = (pageNumber - 1) * cardsPerPage + idx + 1;

                      if (layoutMode === 'side-by-side') {
                        return (
                          <React.Fragment key={`portal-side-${row.id || idx}`}>
                            {/* Front */}
                            <div className="flex flex-col items-center" style={{ width: `${cardVisualWidth}px` }}>
                              {showMemberLabels && (
                                <div className="w-full text-[8.5px] font-mono text-slate-600 mb-0.5 truncate flex items-center justify-between px-0.5">
                                  <span className="truncate font-semibold">#{idx * 2 + 1}. {memberName}</span>
                                  <span className="text-[7.5px] bg-slate-200 px-1 rounded font-bold shrink-0">DEPAN</span>
                                </div>
                              )}
                              <div
                                className="relative bg-white rounded-xs overflow-hidden"
                                style={{
                                  width: `${cardVisualWidth}px`,
                                  height: `${cardVisualHeight}px`
                                }}
                              >
                                {showCropMarks && (
                                  <div className="absolute inset-0 pointer-events-none border border-dashed border-slate-400 z-20 rounded-xs" />
                                )}
                                <CardCanvas
                                  sideDesign={template.front}
                                  orientation={template.orientation}
                                  dimensions={template.dimensions}
                                  activeRow={row}
                                  selectedElementId={null}
                                  onSelectElement={() => {}}
                                  onUpdateElementPosition={() => {}}
                                  readOnly={true}
                                  zoom={cardZoom}
                                />
                              </div>
                            </div>

                            {/* Back */}
                            <div className="flex flex-col items-center" style={{ width: `${cardVisualWidth}px` }}>
                              {showMemberLabels && (
                                <div className="w-full text-[8.5px] font-mono text-slate-600 mb-0.5 truncate flex items-center justify-between px-0.5">
                                  <span className="truncate font-semibold">#{idx * 2 + 2}. {memberName}</span>
                                  <span className="text-[7.5px] bg-slate-200 px-1 rounded font-bold shrink-0">BELAKANG</span>
                                </div>
                              )}
                              <div
                                className="relative bg-white rounded-xs overflow-hidden"
                                style={{
                                  width: `${cardVisualWidth}px`,
                                  height: `${cardVisualHeight}px`
                                }}
                              >
                                {showCropMarks && (
                                  <div className="absolute inset-0 pointer-events-none border border-dashed border-slate-400 z-20 rounded-xs" />
                                )}
                                <CardCanvas
                                  sideDesign={template.back}
                                  orientation={template.orientation}
                                  dimensions={template.dimensions}
                                  activeRow={row}
                                  selectedElementId={null}
                                  onSelectElement={() => {}}
                                  onUpdateElementPosition={() => {}}
                                  readOnly={true}
                                  zoom={cardZoom}
                                />
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      }

                      // Standard single side
                      const sideDesign = layoutMode === '10-front' ? template.front : template.back;
                      return (
                        <div
                          key={`portal-single-${row.id || idx}`}
                          className="flex flex-col items-center"
                          style={{ width: `${cardVisualWidth}px` }}
                        >
                          {showMemberLabels && (
                            <div className="w-full text-[8.5px] font-mono text-slate-600 mb-0.5 truncate flex items-center justify-between px-0.5">
                              <span className="truncate font-semibold text-slate-800">
                                #{slotNumber}. {memberName}
                              </span>
                              <span className="text-[7.5px] bg-slate-100 border border-slate-300 px-1 rounded font-mono text-slate-500 shrink-0 ml-1">
                                {memberId}
                              </span>
                            </div>
                          )}

                          <div
                            className="relative bg-white rounded-xs overflow-hidden shadow-xs"
                            style={{
                              width: `${cardVisualWidth}px`,
                              height: `${cardVisualHeight}px`
                            }}
                          >
                            {showCropMarks && (
                              <div className="absolute inset-0 pointer-events-none border border-dashed border-slate-400 z-20 rounded-xs" />
                            )}
                            <CardCanvas
                              sideDesign={sideDesign}
                              orientation={template.orientation}
                              dimensions={template.dimensions}
                              activeRow={row}
                              selectedElementId={null}
                              onSelectElement={() => {}}
                              onUpdateElementPosition={() => {}}
                              readOnly={true}
                              zoom={cardZoom}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Print Sheet Footer */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
                  <span>Dihasilkan otomatis oleh KartuID Studio • Standar CR-80 ISO 7810</span>
                  <span>Gunakan pisau potong / card cutter di sepanjang garis putus-putus</span>
                </div>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
};
