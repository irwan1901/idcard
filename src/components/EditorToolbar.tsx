import React from 'react';
import { 
  Type, Image as ImageIcon, QrCode, Barcode, Cpu, Sparkles, Award, 
  FileSpreadsheet, Download, Code2, Grid, RotateCw, ZoomIn, ZoomOut, 
  Layers, Plus, Check, ShieldCheck, PenTool, Minus, Upload, Printer 
} from 'lucide-react';
import { CardTemplate, CardOrientation, ElementType } from '../types/card';

interface EditorToolbarProps {
  activeSide: 'front' | 'back';
  onChangeSide: (side: 'front' | 'back') => void;
  orientation: CardOrientation;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  onAddElement: (type: ElementType) => void;
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  presets: CardTemplate[];
  rowCount: number;
  syncTargetStatus?: string | null;
  isSyncingTarget?: boolean;
  onOpenGoogleSheets: () => void;
  onOpenDeveloperModal: () => void;
  onOpenExportModal: () => void;
  onOpenUploadModal: () => void;
  onOpenPrintPreviewModal: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  activeSide,
  onChangeSide,
  orientation,
  zoom,
  onZoomChange,
  snapToGrid,
  onToggleSnap,
  onAddElement,
  selectedTemplateId,
  onSelectTemplate,
  presets,
  rowCount,
  syncTargetStatus,
  isSyncingTarget,
  onOpenGoogleSheets,
  onOpenDeveloperModal,
  onOpenExportModal,
  onOpenUploadModal,
  onOpenPrintPreviewModal
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40">
      {/* Brand & Preset Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5 font-outfit">
              KartuID <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1 py-0.2 rounded font-mono">STUDIO</span>
            </div>
            <div className="text-[10px] text-slate-400">Digital ID Card Generator</div>
          </div>
        </div>

        {/* Template Presets Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Template:</span>
          <select
            value={selectedTemplateId}
            onChange={e => onSelectTemplate(e.target.value)}
            className="bg-slate-800 hover:bg-slate-750 text-slate-100 text-xs font-medium rounded-lg border border-slate-700/80 px-3 py-1.5 outline-none focus:border-indigo-500 transition cursor-pointer"
          >
            {presets.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Middle: Side Switcher & Canvas Controls */}
      <div className="flex items-center gap-2">
        {/* Front / Back Toggle */}
        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center shadow-inner">
          <button
            onClick={() => onChangeSide('front')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSide === 'front'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Tampak Depan</span>
          </button>
          <button
            onClick={() => onChangeSide('back')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSide === 'back'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Tampak Belakang</span>
          </button>
        </div>

        {/* Zoom & Snap */}
        <div className="hidden md:flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 rounded-lg p-0.5 text-xs text-slate-300">
          <button
            onClick={() => onZoomChange(Math.max(0.6, Number((zoom - 0.1).toFixed(1))))}
            title="Perkecil Zoom"
            className="p-1 hover:text-white rounded"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-9 text-center font-mono text-[11px]">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => onZoomChange(Math.min(1.5, Number((zoom + 0.1).toFixed(1))))}
            title="Perbesar Zoom"
            className="p-1 hover:text-white rounded"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={onToggleSnap}
          title={snapToGrid ? 'Grid Snap Aktif' : 'Grid Snap Nonaktif'}
          className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1 ${
            snapToGrid
              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
              : 'bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px]">Snap</span>
        </button>
      </div>

      {/* Right Actions: Upload Desain, Google Sheets, Dev, Export */}
      <div className="flex items-center gap-2">
        {/* Upload Desain Kartu */}
        <button
          onClick={onOpenUploadModal}
          className="flex items-center gap-1.5 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-700/60 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
        >
          <Upload className="w-4 h-4 text-purple-400" />
          <span>Upload Desain</span>
        </button>

        {/* Google Sheets Trigger */}
        <button
          onClick={onOpenGoogleSheets}
          className="flex items-center gap-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
          title="Sinkronisasi ke Google Sheets ID: 1pUG_Tn9MBJaZp_gFRoeG52zKaXSn1I5dIrOcUvshh_w"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Google Sheet</span>
          {isSyncingTarget ? (
            <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 rounded animate-pulse font-mono">
              Syncing...
            </span>
          ) : (
            <span className="bg-emerald-600/40 text-emerald-200 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
              {rowCount}
            </span>
          )}
        </button>

        {/* Developer & Vercel Tools */}
        <button
          onClick={onOpenDeveloperModal}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition"
        >
          <Code2 className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Developer & Vercel</span>
        </button>

        {/* Preview Cetak Banyak (Print Preview) */}
        <button
          onClick={onOpenPrintPreviewModal}
          className="flex items-center gap-1.5 bg-teal-950/40 hover:bg-teal-900/50 text-teal-300 border border-teal-700/60 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs"
          title="Pratinjau susunan cetak massal A4"
        >
          <Printer className="w-4 h-4 text-teal-400" />
          <span>Preview Cetak</span>
        </button>

        {/* Export / Download High-Res */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs transition shadow-md shadow-indigo-500/20 active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Unduh Kartu</span>
        </button>
      </div>
    </header>
  );
};
