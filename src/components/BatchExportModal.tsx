import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Download, FileText, Image as ImageIcon, Archive, Printer, 
  CheckCircle, Loader2, Sparkles, X, Layers, Users 
} from 'lucide-react';
import { CardTemplate, SheetRow, CardOrientation } from '../types/card';
import { 
  downloadCardAsPng, exportCardAsPDF, exportCardsToA4SheetPDF, 
  batchExportCardsToZip, captureElementToPng 
} from '../utils/exportCard';
import { CardCanvas } from './CardCanvas';

interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: CardTemplate;
  rows: SheetRow[];
  activeRowIndex: number;
  frontCanvasElement: HTMLElement | null;
  backCanvasElement: HTMLElement | null;
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  onClose,
  template,
  rows,
  activeRowIndex,
  frontCanvasElement,
  backCanvasElement
}) => {
  const [exportMode, setExportMode] = useState<'single' | 'batch'>('single');
  const [singleSide, setSingleSide] = useState<'front' | 'back' | 'both'>('both');
  const [resolution, setResolution] = useState<number>(3); // 3x for 300+ DPI
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; message: string }>({
    current: 0,
    total: 0,
    message: ''
  });

  // Hidden container ref for off-screen batch rendering
  const hiddenRenderRef = React.useRef<HTMLDivElement>(null);
  const [renderTargetRow, setRenderTargetRow] = useState<SheetRow | null>(null);
  const [renderTargetSide, setRenderTargetSide] = useState<'front' | 'back'>('front');

  if (!isOpen) return null;

  const activeRow = rows[activeRowIndex] || rows[0] || {};
  const activeName = activeRow.Nama_Lengkap || activeRow.Nama_Siswa || activeRow.Nama_Pegawai || activeRow.Full_Name || 'Kartu';
  const activeId = activeRow.Nomor_Anggota || activeRow.NISN || activeRow.NIP || activeRow.Dev_Handle || 'ID';

  // Single PNG Export
  const handleExportSinglePNG = async () => {
    try {
      setIsExporting(true);
      await downloadCardAsPng(
        frontCanvasElement,
        backCanvasElement,
        `${template.id}_${activeId}_${activeName}`,
        singleSide,
        resolution
      );
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      onClose();
    } catch (err: any) {
      alert(`Gagal mengekspor PNG: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Single PDF Export (CR80)
  const handleExportSinglePDF = async () => {
    try {
      setIsExporting(true);
      await exportCardAsPDF(
        frontCanvasElement,
        backCanvasElement,
        template.orientation,
        `${template.id}_${activeId}_${activeName}`,
        singleSide !== 'front'
      );
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      onClose();
    } catch (err: any) {
      alert(`Gagal mengekspor PDF: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Batch Export all rows to ZIP
  const handleExportBatchZip = async () => {
    if (rows.length === 0) {
      alert('Tidak ada data anggota di Google Sheets untuk diekspor.');
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress({ current: 0, total: rows.length, message: 'Menyiapkan rendering batch...' });

      // Rendering helper function that mounts each row off-screen and snapshots it
      const renderFn = async (row: SheetRow, side: 'front' | 'back'): Promise<string> => {
        return new Promise((resolve, reject) => {
          setRenderTargetRow(row);
          setRenderTargetSide(side);

          // Allow DOM to settle and images to paint
          setTimeout(async () => {
            try {
              if (!hiddenRenderRef.current) {
                throw new Error('Elemen render tersembunyi tidak ditemukan.');
              }
              const cardDom = hiddenRenderRef.current.querySelector('.batch-card-target') as HTMLElement;
              if (!cardDom) {
                throw new Error('Target kartu tidak ditemukan.');
              }
              const dataUrl = await captureElementToPng(cardDom, resolution);
              resolve(dataUrl);
            } catch (err) {
              reject(err);
            }
          }, 120);
        });
      };

      await batchExportCardsToZip(
        renderFn,
        rows,
        template.name.replace(/\s+/g, '_'),
        (current, total) => {
          setExportProgress({
            current,
            total,
            message: `Merender kartu ${current} dari ${total}...`
          });
        }
      );

      confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 } });
      onClose();
    } catch (err: any) {
      alert(`Gagal ekspor batch: ${err.message}`);
    } finally {
      setIsExporting(false);
      setRenderTargetRow(null);
    }
  };

  // Batch Export to A4 Printable PDF Sheet
  const handleExportBatchA4 = async () => {
    if (rows.length === 0) {
      alert('Tidak ada data anggota di Google Sheets untuk diekspor.');
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress({ current: 0, total: rows.length, message: 'Menyiapkan lembar cetak A4...' });

      const cardImages: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        setExportProgress({
          current: i + 1,
          total: rows.length,
          message: `Menyusun kartu ${i + 1} dari ${rows.length} ke A4...`
        });

        // Render Front
        setRenderTargetRow(rows[i]);
        setRenderTargetSide('front');

        await new Promise(r => setTimeout(r, 120));
        if (hiddenRenderRef.current) {
          const cardDom = hiddenRenderRef.current.querySelector('.batch-card-target') as HTMLElement;
          if (cardDom) {
            const dataUrl = await captureElementToPng(cardDom, 2);
            cardImages.push(dataUrl);
          }
        }
      }

      await exportCardsToA4SheetPDF(cardImages, template.orientation, `${template.id}_Lembar_Cetak_A4.pdf`);
      confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 } });
      onClose();
    } catch (err: any) {
      alert(`Gagal ekspor A4 PDF: ${err.message}`);
    } finally {
      setIsExporting(false);
      setRenderTargetRow(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white font-outfit">
                Unduh Kartu Identitas Digital
              </h2>
              <p className="text-xs text-slate-400">
                Pilih format PDF standar ISO CR-80 atau gambar PNG resolusi ultra-tinggi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs text-slate-300">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setExportMode('single')}
              disabled={isExporting}
              className={`py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                exportMode === 'single'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Kartu Aktif Saat Ini</span>
            </button>
            <button
              onClick={() => setExportMode('batch')}
              disabled={isExporting}
              className={`py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                exportMode === 'batch'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Batch ({rows.length} Data Sheet)</span>
            </button>
          </div>

          {/* Export Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Sisi yang Diekspor</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSingleSide('front')}
                  disabled={isExporting}
                  className={`py-2 px-3 rounded-lg border text-center transition ${
                    singleSide === 'front'
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 font-semibold'
                      : 'border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Tampak Depan
                </button>
                <button
                  onClick={() => setSingleSide('back')}
                  disabled={isExporting}
                  className={`py-2 px-3 rounded-lg border text-center transition ${
                    singleSide === 'back'
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 font-semibold'
                      : 'border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Tampak Belakang
                </button>
                <button
                  onClick={() => setSingleSide('both')}
                  disabled={isExporting}
                  className={`py-2 px-3 rounded-lg border text-center transition ${
                    singleSide === 'both'
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 font-semibold'
                      : 'border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Depan & Belakang
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Kualitas Resolusi Cetak</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setResolution(2)}
                  disabled={isExporting}
                  className={`py-2 px-2 rounded-lg border text-center transition ${
                    resolution === 2
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 font-semibold'
                      : 'border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  HD (2x / 150 DPI)
                </button>
                <button
                  onClick={() => setResolution(3)}
                  disabled={isExporting}
                  className={`py-2 px-2 rounded-lg border text-center transition ${
                    resolution === 3
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 font-semibold'
                      : 'border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Ultra (3x / 300 DPI)
                </button>
                <button
                  onClick={() => setResolution(4)}
                  disabled={isExporting}
                  className={`py-2 px-2 rounded-lg border text-center transition ${
                    resolution === 4
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 font-semibold'
                      : 'border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Print Ready (4x)
                </button>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          {isExporting && (
            <div className="p-4 bg-indigo-950/60 border border-indigo-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-indigo-300 font-medium">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  {exportProgress.message || 'Sedang memproses...'}
                </span>
                {exportProgress.total > 0 && (
                  <span className="font-mono text-xs">
                    {exportProgress.current} / {exportProgress.total}
                  </span>
                )}
              </div>
              {exportProgress.total > 0 && (
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-200"
                    style={{
                      width: `${(exportProgress.current / exportProgress.total) * 100}%`
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {exportMode === 'single' ? (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleExportSinglePNG}
                disabled={isExporting}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                <ImageIcon className="w-4 h-4 text-sky-400" />
                <span>Unduh Gambar PNG</span>
              </button>
              <button
                onClick={handleExportSinglePDF}
                disabled={isExporting}
                className="py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20"
              >
                <FileText className="w-4 h-4" />
                <span>Unduh Dokumen PDF (CR-80)</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleExportBatchA4}
                disabled={isExporting || rows.length === 0}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Cetak Lembar A4 (PDF)</span>
              </button>
              <button
                onClick={handleExportBatchZip}
                disabled={isExporting || rows.length === 0}
                className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
              >
                <Archive className="w-4 h-4" />
                <span>Unduh Semua (.ZIP)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hidden container for batch rendering */}
      <div
        ref={hiddenRenderRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          opacity: 0,
          pointerEvents: 'none'
        }}
      >
        {renderTargetRow && (
          <div className="batch-card-target">
            <CardCanvas
              sideDesign={renderTargetSide === 'front' ? template.front : template.back}
              orientation={template.orientation}
              dimensions={template.dimensions}
              activeRow={renderTargetRow}
              selectedElementId={null}
              onSelectElement={() => {}}
              onUpdateElementPosition={() => {}}
              readOnly={true}
              zoom={1}
            />
          </div>
        )}
      </div>
    </div>
  );
};
