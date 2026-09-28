import React, { useState, useRef, useEffect } from 'react';
import { CARD_PRESETS } from './data/presets';
import { CardTemplate, CardElement, CardSideDesign, CardOrientation, ElementType, GoogleSheetConfig, SheetRow } from './types/card';
import { SAMPLE_DATASETS } from './utils/googleSheets';
import { readFileAsDataUrl } from './utils/imageUpload';
import { 
  TARGET_SPREADSHEET_ID, 
  TARGET_SPREADSHEET_URL, 
  getStoredToken, 
  syncFullDatasetToGoogleSheet 
} from './utils/googleSheetsSync';
import { CardCanvas } from './components/CardCanvas';
import { EditorToolbar } from './components/EditorToolbar';
import { AddElementSidebar } from './components/AddElementSidebar';
import { ElementPropertyInspector } from './components/ElementPropertyInspector';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { DeveloperModal } from './components/DeveloperModal';
import { BatchExportModal } from './components/BatchExportModal';
import { UploadDesignModal } from './components/UploadDesignModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { 
  ChevronLeft, ChevronRight, RotateCw, Eye, Sparkles, 
  Layers, Users, Check, FileSpreadsheet, ShieldAlert, Camera, Upload 
} from 'lucide-react';

export default function App() {
  const [templates, setTemplates] = useState<CardTemplate[]>(CARD_PRESETS);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('preset-koperasi');
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [activeRowIndex, setActiveRowIndex] = useState<number>(0);
  const bottomPhotoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Modals
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState(false);
  const [isDeveloperOpen, setIsDeveloperOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // Google Sheet Data State (connected directly to target spreadsheet 1pUG_Tn9MBJaZp_gFRoeG52zKaXSn1I5dIrOcUvshh_w)
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig>({
    sheetUrl: TARGET_SPREADSHEET_URL,
    sheetId: TARGET_SPREADSHEET_ID,
    sheetName: `Spreadsheet Target (${TARGET_SPREADSHEET_ID})`,
    lastSynced: 'Otomatis',
    isConnected: true,
    headers: SAMPLE_DATASETS.koperasi.headers,
    rows: SAMPLE_DATASETS.koperasi.rows
  });

  const [isSyncingTarget, setIsSyncingTarget] = useState(false);
  const [syncTargetStatus, setSyncTargetStatus] = useState<string | null>(null);

  // Auto-sync whenever rows or headers change if user has authorized Google
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const token = getStoredToken();
    if (!token) return;

    const timer = setTimeout(async () => {
      try {
        setIsSyncingTarget(true);
        setSyncTargetStatus('Menyimpan ke Google Sheets...');
        await syncFullDatasetToGoogleSheet(
          TARGET_SPREADSHEET_ID,
          sheetConfig.headers,
          sheetConfig.rows,
          token
        );
        const time = new Date().toLocaleTimeString('id-ID');
        setSyncTargetStatus(`Tersimpan ke Sheets (${time})`);
      } catch (err: any) {
        console.warn('Auto-sync to Google Sheets failed:', err);
      } finally {
        setIsSyncingTarget(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [sheetConfig.rows, sheetConfig.headers]);

  // Current Active Template
  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];
  const activeSideDesign = activeSide === 'front' ? activeTemplate.front : activeTemplate.back;
  const activeRow: SheetRow = sheetConfig.rows[activeRowIndex] || sheetConfig.rows[0] || {};

  // Selected Element
  const selectedElement = activeSideDesign.elements.find(el => el.id === selectedElementId) || null;

  // Refs for capturing export
  const frontCanvasRef = useRef<HTMLDivElement>(null);
  const backCanvasRef = useRef<HTMLDivElement>(null);

  // When switching preset, also load corresponding dataset if appropriate
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setSelectedElementId(null);
    const template = templates.find(t => t.id === templateId);
    if (template && SAMPLE_DATASETS[template.category]) {
      const sample = SAMPLE_DATASETS[template.category];
      setSheetConfig(prev => ({
        ...prev,
        headers: [...sample.headers],
        rows: JSON.parse(JSON.stringify(sample.rows)),
        sheetName: `Dataset ${template.name}`
      }));
      setActiveRowIndex(0);
    }
  };

  // Update elements in active side
  const handleUpdateActiveSide = (newSideDesign: CardSideDesign) => {
    setTemplates(prev =>
      prev.map(tmpl => {
        if (tmpl.id !== activeTemplate.id) return tmpl;
        return {
          ...tmpl,
          [activeSide]: newSideDesign
        };
      })
    );
  };

  // Add new element to canvas
  const handleAddElement = (type: ElementType) => {
    const id = `elem-${Date.now()}`;
    let newElement: CardElement = {
      id,
      type,
      name: `Elemen ${type.toUpperCase()}`,
      x: 35,
      y: 40,
      width: 30,
      height: 10,
      zIndex: activeSideDesign.elements.length + 1
    };

    if (type === 'text') {
      newElement = {
        ...newElement,
        name: 'Teks Baru',
        text: 'Contoh Teks Kartu',
        fontSize: 13,
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '600',
        color: '#ffffff',
        width: 40,
        height: 8
      };
    } else if (type === 'photo') {
      newElement = {
        ...newElement,
        name: 'Foto Baru',
        width: 25,
        height: 40,
        photoShape: 'rounded',
        borderWidth: 2,
        borderColor: '#6366f1'
      };
    } else if (type === 'qr') {
      newElement = {
        ...newElement,
        name: 'QR Baru',
        width: 15,
        height: 24,
        codeData: 'https://kartuid.app'
      };
    } else if (type === 'barcode') {
      newElement = {
        ...newElement,
        name: 'Barcode Baru',
        width: 50,
        height: 14,
        codeData: '1234567890'
      };
    } else if (type === 'chip') {
      newElement = {
        ...newElement,
        name: 'EMV Chip',
        width: 10,
        height: 10
      };
    } else if (type === 'hologram') {
      newElement = {
        ...newElement,
        name: 'Hologram Keamanan',
        width: 12,
        height: 8
      };
    } else if (type === 'badge') {
      newElement = {
        ...newElement,
        name: 'Status Badge',
        badgeText: 'ANGGOTA AKTIF',
        badgeBgColor: '#059669',
        badgeTextColor: '#ffffff',
        width: 28,
        height: 6
      };
    } else if (type === 'signature') {
      newElement = {
        ...newElement,
        name: 'Tanda Tangan',
        signerName: 'Nama Penanda Tangan',
        signerTitle: 'Jabatan / Direktur',
        width: 40,
        height: 18
      };
    } else if (type === 'stamp') {
      newElement = {
        ...newElement,
        name: 'Cap Stempel',
        stampText: 'RESMI DISAHKAN',
        stampColor: '#dc2626',
        width: 18,
        height: 20
      };
    } else if (type === 'shape') {
      newElement = {
        ...newElement,
        name: 'Garis Pembatas',
        shapeType: 'line',
        fillColor: '#6366f1',
        width: 80,
        height: 0.6
      };
    }

    handleUpdateActiveSide({
      ...activeSideDesign,
      elements: [...activeSideDesign.elements, newElement]
    });
    setSelectedElementId(id);
  };

  // Update single element position
  const handleUpdateElementPosition = (id: string, x: number, y: number) => {
    handleUpdateActiveSide({
      ...activeSideDesign,
      elements: activeSideDesign.elements.map(el => (el.id === id ? { ...el, x, y } : el))
    });
  };

  // Update element properties
  const handleUpdateElementProps = (updated: Partial<CardElement>) => {
    if (!selectedElementId) return;
    handleUpdateActiveSide({
      ...activeSideDesign,
      elements: activeSideDesign.elements.map(el => (el.id === selectedElementId ? { ...el, ...updated } : el))
    });
  };

  // Delete element
  const handleDeleteElement = (id: string) => {
    handleUpdateActiveSide({
      ...activeSideDesign,
      elements: activeSideDesign.elements.filter(el => el.id !== id)
    });
    setSelectedElementId(null);
  };

  // Duplicate element
  const handleDuplicateElement = (element: CardElement) => {
    const clone: CardElement = {
      ...element,
      id: `elem-clone-${Date.now()}`,
      name: `${element.name} (Salinan)`,
      x: Math.min(100 - element.width, element.x + 3),
      y: Math.min(100 - element.height, element.y + 3),
      zIndex: activeSideDesign.elements.length + 1
    };
    handleUpdateActiveSide({
      ...activeSideDesign,
      elements: [...activeSideDesign.elements, clone]
    });
    setSelectedElementId(clone.id);
  };

  // Update card background
  const handleUpdateBackground = (updatedBg: Partial<CardSideDesign['background']>) => {
    handleUpdateActiveSide({
      ...activeSideDesign,
      background: {
        ...activeSideDesign.background,
        ...updatedBg
      }
    });
  };

  // Change Card Orientation
  const handleChangeOrientation = (orientation: CardOrientation) => {
    setTemplates(prev =>
      prev.map(tmpl => {
        if (tmpl.id !== activeTemplate.id) return tmpl;
        return {
          ...tmpl,
          orientation
        };
      })
    );
  };

  // Import custom template JSON
  const handleImportTemplate = (newTemplate: CardTemplate) => {
    setTemplates(prev => [newTemplate, ...prev.filter(t => t.id !== newTemplate.id)]);
    setSelectedTemplateId(newTemplate.id);
  };

  // Apply custom uploaded background
  const handleApplyUploadedBackground = (side: 'front' | 'back' | 'both', bg: CardSideDesign['background']) => {
    setTemplates(prev =>
      prev.map(tmpl => {
        if (tmpl.id !== activeTemplate.id) return tmpl;
        if (side === 'both') {
          return {
            ...tmpl,
            front: { ...tmpl.front, background: { ...tmpl.front.background, ...bg } },
            back: { ...tmpl.back, background: { ...tmpl.back.background, ...bg } }
          };
        }
        return {
          ...tmpl,
          [side]: { ...tmpl[side], background: { ...tmpl[side].background, ...bg } }
        };
      })
    );
  };

  // Add custom uploaded logo/image element
  const handleAddUploadedElement = (element: CardElement) => {
    handleUpdateActiveSide({
      ...activeSideDesign,
      elements: [...activeSideDesign.elements, element]
    });
    setSelectedElementId(element.id);
  };

  // Row navigation
  const handlePrevRow = () => {
    setActiveRowIndex(prev => (prev > 0 ? prev - 1 : sheetConfig.rows.length - 1));
  };

  const handleNextRow = () => {
    setActiveRowIndex(prev => (prev < sheetConfig.rows.length - 1 ? prev + 1 : 0));
  };

  // Update fields for current active row in sheetConfig
  const handleUpdateActiveRow = (updatedFields: Partial<SheetRow>) => {
    setSheetConfig(prev => {
      const newRows = [...prev.rows];
      if (newRows[activeRowIndex]) {
        newRows[activeRowIndex] = {
          ...newRows[activeRowIndex],
          ...updatedFields
        };
      }
      return {
        ...prev,
        rows: newRows
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Navbar & Editor Toolbar */}
      <EditorToolbar
        activeSide={activeSide}
        onChangeSide={setActiveSide}
        orientation={activeTemplate.orientation}
        zoom={zoom}
        onZoomChange={setZoom}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        onAddElement={handleAddElement}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={handleSelectTemplate}
        presets={templates}
        rowCount={sheetConfig.rows.length}
        syncTargetStatus={syncTargetStatus}
        isSyncingTarget={isSyncingTarget}
        onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
        onOpenDeveloperModal={() => setIsDeveloperOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenUploadModal={() => setIsUploadOpen(true)}
        onOpenPrintPreviewModal={() => setIsPrintPreviewOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Components Palette */}
        <AddElementSidebar 
          onAddElement={handleAddElement} 
          onOpenUploadModal={() => setIsUploadOpen(true)}
        />

        {/* Center: Canvas Viewport */}
        <main className="flex-1 flex flex-col bg-radial from-slate-900 to-slate-950 overflow-hidden relative">
          {/* Subtle Grid Canvas Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Top Status Bar: Category Badge & Flip quick button */}
          <div className="px-6 py-2.5 flex items-center justify-between text-xs z-10">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">
                {activeTemplate.name}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/60 font-mono">
                {activeTemplate.orientation.toUpperCase()} • CR-80 ISO 7810
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSide(activeSide === 'front' ? 'back' : 'front')}
                className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-indigo-300 text-xs px-3 py-1 rounded-lg flex items-center gap-1.5 transition shadow-xs"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Balik Kartu (Ke Sisi {activeSide === 'front' ? 'Belakang' : 'Depan'})</span>
              </button>
            </div>
          </div>

          {/* Main Card Canvas Viewport */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-6 z-10">
            <CardCanvas
              innerRef={activeSide === 'front' ? frontCanvasRef : backCanvasRef}
              sideDesign={activeSideDesign}
              orientation={activeTemplate.orientation}
              dimensions={activeTemplate.dimensions}
              activeRow={activeRow}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElementPosition={handleUpdateElementPosition}
              snapToGrid={snapToGrid}
              zoom={zoom}
            />
          </div>

          {/* Bottom Row Navigator: Interactive Member Switcher */}
          <div className="bg-slate-900/90 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Pratinjau Data Anggota:</span>
              </span>

              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                <button
                  onClick={handlePrevRow}
                  title="Anggota Sebelumnya"
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-2 text-xs font-mono font-medium text-emerald-300 min-w-16 text-center">
                  {sheetConfig.rows.length > 0 ? `${activeRowIndex + 1} / ${sheetConfig.rows.length}` : '0 / 0'}
                </div>

                <button
                  onClick={handleNextRow}
                  title="Anggota Berikutnya"
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Active member name tag & Photo Upload shortcut */}
              {activeRow && (
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-2 text-xs text-slate-200">
                    <span className="font-semibold text-white">
                      {activeRow.Nama_Lengkap || activeRow.Nama_Siswa || activeRow.Nama_Pegawai || activeRow.Full_Name || 'Sample Member'}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      ({activeRow.Nomor_Anggota || activeRow.NISN || activeRow.NIP || activeRow.Dev_Handle || 'No ID'})
                    </span>
                  </div>

                  {/* Hidden file input for quick photo upload */}
                  <input
                    ref={bottomPhotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setIsUploadingPhoto(true);
                        const dataUrl = await readFileAsDataUrl(file, 800);
                        const photoKey = 
                          sheetConfig.headers.find(h => /foto|avatar|photo|gambar/i.test(h)) || 
                          'Foto_URL';
                        handleUpdateActiveRow({ [photoKey]: dataUrl });
                      } catch (err: any) {
                        alert(err.message || 'Gagal mengupload foto.');
                      } finally {
                        setIsUploadingPhoto(false);
                        if (bottomPhotoInputRef.current) bottomPhotoInputRef.current.value = '';
                      }
                    }}
                  />

                  <button
                    onClick={() => bottomPhotoInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition"
                    title="Upload foto profil untuk anggota yang sedang aktif"
                  >
                    <Camera className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-medium">
                      {isUploadingPhoto ? 'Mengunggah...' : 'Upload Foto'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {syncTargetStatus && (
                <span className="text-[11px] text-emerald-300 font-mono hidden lg:inline bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                  ● {syncTargetStatus}
                </span>
              )}
              <button
                onClick={() => setIsGoogleSheetsOpen(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/50 px-2.5 py-1 rounded-lg transition"
                title="Buka panel sinkronisasi spreadsheet ID: 1pUG_Tn9MBJaZp_gFRoeG52zKaXSn1I5dIrOcUvshh_w"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Spreadsheet (1pUG_Tn9MB...)</span>
              </button>
            </div>
          </div>
        </main>

        {/* Right Sidebar: Element Property & Background Inspector */}
        <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 h-[calc(100vh-53px)] overflow-y-auto p-4">
          <ElementPropertyInspector
            selectedElement={selectedElement}
            sideDesign={activeSideDesign}
            sheetHeaders={sheetConfig.headers}
            orientation={activeTemplate.orientation}
            activeRow={activeRow}
            onUpdateActiveRow={handleUpdateActiveRow}
            onUpdateElement={handleUpdateElementProps}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={handleDuplicateElement}
            onUpdateBackground={handleUpdateBackground}
            onChangeOrientation={handleChangeOrientation}
            onOpenUploadModal={() => setIsUploadOpen(true)}
          />
        </aside>
      </div>

      {/* Hidden container for rendering opposite side during export capture */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          opacity: 0,
          pointerEvents: 'none'
        }}
      >
        <div ref={activeSide === 'front' ? backCanvasRef : frontCanvasRef}>
          <CardCanvas
            sideDesign={activeSide === 'front' ? activeTemplate.back : activeTemplate.front}
            orientation={activeTemplate.orientation}
            dimensions={activeTemplate.dimensions}
            activeRow={activeRow}
            selectedElementId={null}
            onSelectElement={() => {}}
            onUpdateElementPosition={() => {}}
            readOnly={true}
            zoom={1}
          />
        </div>
      </div>

      {/* Upload Custom Design & Assets Modal */}
      <UploadDesignModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        activeSide={activeSide}
        currentFrontDesign={activeTemplate.front}
        currentBackDesign={activeTemplate.back}
        onApplyBackground={handleApplyUploadedBackground}
        onAddUploadedElement={handleAddUploadedElement}
        onImportTemplateJSON={handleImportTemplate}
      />

      {/* Google Sheets Modal */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsOpen}
        onClose={() => setIsGoogleSheetsOpen(false)}
        config={sheetConfig}
        onUpdateConfig={setSheetConfig}
        activeRowIndex={activeRowIndex}
        onSelectRowIndex={setActiveRowIndex}
        category={activeTemplate.category}
      />

      {/* Developer & Vercel Modal */}
      <DeveloperModal
        isOpen={isDeveloperOpen}
        onClose={() => setIsDeveloperOpen(false)}
        currentTemplate={activeTemplate}
        onImportTemplate={handleImportTemplate}
      />

      {/* Batch Export High-Res Modal */}
      <BatchExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        template={activeTemplate}
        rows={sheetConfig.rows}
        activeRowIndex={activeRowIndex}
        frontCanvasElement={frontCanvasRef.current}
        backCanvasElement={backCanvasRef.current}
      />

      {/* Print Preview & Mass Printing Modal */}
      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        template={activeTemplate}
        rows={sheetConfig.rows}
      />
    </div>
  );
}
