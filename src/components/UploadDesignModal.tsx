import React, { useState, useRef } from 'react';
import { 
  Upload, Image as ImageIcon, Sliders, Check, Trash2, Eye, 
  Sparkles, Layers, FileJson, ArrowRight, X, Palette, RefreshCw 
} from 'lucide-react';
import { CardSideDesign, CardTemplate, CardElement } from '../types/card';

interface UploadDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSide: 'front' | 'back';
  currentFrontDesign: CardSideDesign;
  currentBackDesign: CardSideDesign;
  onApplyBackground: (side: 'front' | 'back' | 'both', bg: CardSideDesign['background']) => void;
  onAddUploadedElement: (element: CardElement) => void;
  onImportTemplateJSON: (template: CardTemplate) => void;
}

export const UploadDesignModal: React.FC<UploadDesignModalProps> = ({
  isOpen,
  onClose,
  activeSide,
  currentFrontDesign,
  currentBackDesign,
  onApplyBackground,
  onAddUploadedElement,
  onImportTemplateJSON
}) => {
  const [activeTab, setActiveTab] = useState<'background' | 'asset' | 'json'>('background');
  
  // Background Upload State
  const [targetSide, setTargetSide] = useState<'front' | 'back' | 'both'>(activeSide);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>(
    activeSide === 'front' 
      ? currentFrontDesign.background.imageUrl || '' 
      : currentBackDesign.background.imageUrl || ''
  );
  const [imageFit, setImageFit] = useState<'cover' | 'contain' | 'fill'>(
    (activeSide === 'front' ? currentFrontDesign.background.imageFit : currentBackDesign.background.imageFit) || 'cover'
  );
  const [overlayOpacity, setOverlayOpacity] = useState<number>(
    (activeSide === 'front' ? currentFrontDesign.background.overlayOpacity : currentBackDesign.background.overlayOpacity) ?? 0.15
  );
  const [overlayColor, setOverlayColor] = useState<string>(
    (activeSide === 'front' ? currentFrontDesign.background.overlayColor : currentBackDesign.background.overlayColor) || '#000000'
  );
  
  // File inputs
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const assetFileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Asset upload state
  const [assetName, setAssetName] = useState('Logo / Stiker Kustom');
  const [assetPreview, setAssetPreview] = useState<string>('');

  if (!isOpen) return null;

  // Handle local background image upload
  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran file maksimal 10MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Asset / Logo upload
  const handleAssetFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAssetPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle JSON template upload
  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          if (!parsed.front || !parsed.orientation) {
            throw new Error('Format JSON tidak sesuai dengan schema KartuID.');
          }
          onImportTemplateJSON(parsed);
          onClose();
        } catch (err: any) {
          alert(`Gagal memuat template: ${err.message}`);
        }
      };
      reader.readAsText(file);
    }
  };

  // Apply Background to Card
  const handleApplyBackground = () => {
    if (!previewImageUrl) {
      alert('Silakan upload atau pilih gambar terlebih dahulu.');
      return;
    }

    const newBg: CardSideDesign['background'] = {
      type: 'image',
      imageUrl: previewImageUrl,
      imageFit,
      overlayColor,
      overlayOpacity
    };

    onApplyBackground(targetSide, newBg);
    onClose();
  };

  // Remove background image and reset to dark color
  const handleRemoveBackground = () => {
    const resetBg: CardSideDesign['background'] = {
      type: 'color',
      color: '#0f172a'
    };
    onApplyBackground(targetSide, resetBg);
    setPreviewImageUrl('');
    onClose();
  };

  // Add Asset as Element to Canvas
  const handleInsertAssetElement = () => {
    if (!assetPreview) {
      alert('Silakan pilih file logo atau gambar terlebih dahulu.');
      return;
    }

    const newElement: CardElement = {
      id: `asset-elem-${Date.now()}`,
      type: 'logo',
      name: assetName || 'Logo Terunggah',
      x: 35,
      y: 35,
      width: 25,
      height: 25,
      zIndex: 10,
      imageUrl: assetPreview
    };

    onAddUploadedElement(newElement);
    onClose();
  };

  // Pre-made blank background cards
  const PREMADE_BACKGROUNDS = [
    {
      name: 'Clean PVC Putih Minimalis',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      desc: 'Cocok untuk kartu perusahaan modern'
    },
    {
      name: 'Emas Metalik Gelap',
      url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
      desc: 'Cocok untuk kartu anggota VIP / Koperasi'
    },
    {
      name: 'Biru Navy Gradasi',
      url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80',
      desc: 'Ideal untuk kartu pelajar / mahasiswa'
    },
    {
      name: 'Dark Carbon Cyber',
      url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
      desc: 'ID card developer & IT security'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white font-outfit flex items-center gap-2">
                Upload Desain Kartu & Aset
              </h2>
              <p className="text-xs text-slate-400">
                Gunakan desain dari Canva, Figma, Corel, atau Photoshop sebagai dasar kartu identitas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/80 px-4 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('background')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'background'
                ? 'border-purple-500 text-purple-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Upload Background Kartu</span>
          </button>

          <button
            onClick={() => setActiveTab('asset')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'asset'
                ? 'border-purple-500 text-purple-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Upload Logo / Stempel / Aset</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'border-purple-500 text-purple-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>Impor File Template (.json)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-5 bg-slate-950/40 text-xs text-slate-300">
          {/* TAB 1: UPLOAD BACKGROUND */}
          {activeTab === 'background' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left: Upload and Controls */}
                <div className="space-y-4">
                  {/* Upload Box */}
                  <div>
                    <label className="block text-slate-400 mb-1.5 font-medium">
                      Pilih Berkas Gambar (PNG, JPG, SVG, WebP)
                    </label>
                    <input
                      ref={bgFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBgFileChange}
                      className="hidden"
                    />
                    <div
                      onClick={() => bgFileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-xl p-5 text-center cursor-pointer bg-slate-900/60 hover:bg-slate-850 transition group flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-white">Klik untuk Jelajahi Berkas</span>
                      <span className="text-[11px] text-slate-500">
                        Rekomendasi rasio CR-80 (85.6 × 54 mm / ~1012 × 638 px)
                      </span>
                    </div>
                  </div>

                  {/* Or Image URL */}
                  <div>
                    <label className="block text-slate-400 mb-1">Atau Tempel Link URL Gambar</label>
                    <input
                      type="text"
                      placeholder="https://example.com/kartu-background.png"
                      value={previewImageUrl.startsWith('data:') ? '(Gambar Terunggah dari Komputer)' : previewImageUrl}
                      onChange={e => setPreviewImageUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Target Side Selector */}
                  <div>
                    <label className="block text-slate-400 mb-1.5 font-medium">Terapkan Ke Sisi:</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setTargetSide('front')}
                        className={`py-2 px-2 rounded-lg border text-center transition ${
                          targetSide === 'front'
                            ? 'border-purple-500 bg-purple-500/20 text-purple-200 font-semibold'
                            : 'border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        Tampak Depan
                      </button>
                      <button
                        onClick={() => setTargetSide('back')}
                        className={`py-2 px-2 rounded-lg border text-center transition ${
                          targetSide === 'back'
                            ? 'border-purple-500 bg-purple-500/20 text-purple-200 font-semibold'
                            : 'border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        Tampak Belakang
                      </button>
                      <button
                        onClick={() => setTargetSide('both')}
                        className={`py-2 px-2 rounded-lg border text-center transition ${
                          targetSide === 'both'
                            ? 'border-purple-500 bg-purple-500/20 text-purple-200 font-semibold'
                            : 'border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        Kedua Sisi
                      </button>
                    </div>
                  </div>

                  {/* Fit Mode */}
                  <div>
                    <label className="block text-slate-400 mb-1.5 font-medium">Mode Ukuran (Fit / Scaling):</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setImageFit('cover')}
                        className={`py-1.5 text-[11px] rounded-lg border text-center ${
                          imageFit === 'cover'
                            ? 'border-purple-500 bg-purple-500/20 text-purple-200 font-semibold'
                            : 'border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        Cover (Penuh Pas)
                      </button>
                      <button
                        onClick={() => setImageFit('fill')}
                        className={`py-1.5 text-[11px] rounded-lg border text-center ${
                          imageFit === 'fill'
                            ? 'border-purple-500 bg-purple-500/20 text-purple-200 font-semibold'
                            : 'border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        Fill (Regang Penuh)
                      </button>
                      <button
                        onClick={() => setImageFit('contain')}
                        className={`py-1.5 text-[11px] rounded-lg border text-center ${
                          imageFit === 'contain'
                            ? 'border-purple-500 bg-purple-500/20 text-purple-200 font-semibold'
                            : 'border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        Contain (Tengah)
                      </button>
                    </div>
                  </div>

                  {/* Darken Overlay Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400">Efek Gelapkan (Overlay Tint)</label>
                      <span className="font-mono text-purple-300">{Math.round(overlayOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={0.8}
                      step={0.05}
                      value={overlayOpacity}
                      onChange={e => setOverlayOpacity(Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Berguna agar teks nama, nomor, dan barcode tetap kontras dan mudah dibaca.
                    </p>
                  </div>
                </div>

                {/* Right: Live Preview Box */}
                <div className="space-y-3">
                  <label className="block text-slate-400 font-medium">Pratinjau Desain Dasar Kartu:</label>
                  <div className="w-full aspect-[1.586/1] bg-slate-900 border border-slate-700/80 rounded-2xl relative overflow-hidden shadow-xl flex items-center justify-center">
                    {previewImageUrl ? (
                      <>
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundImage: `url(${previewImageUrl})`,
                            backgroundSize: imageFit === 'contain' ? 'contain' : imageFit === 'fill' ? '100% 100%' : 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}
                        />
                        {overlayOpacity > 0 && (
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              backgroundColor: overlayColor,
                              opacity: overlayOpacity
                            }}
                          />
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                          {imageFit.toUpperCase()}
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4 text-slate-500">
                        <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <span>Belum ada gambar background dipilih</span>
                      </div>
                    )}
                  </div>

                  {/* Preset Background Options */}
                  <div className="pt-2">
                    <label className="block text-slate-400 mb-1.5 font-medium">
                      Atau Pilih Template Desain Kosong Siap Pakai:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PREMADE_BACKGROUNDS.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setPreviewImageUrl(item.url);
                            setImageFit('cover');
                          }}
                          className="p-2 bg-slate-900 border border-slate-800 hover:border-purple-400 rounded-xl text-left transition flex items-center gap-2 group"
                        >
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-10 h-8 rounded object-cover shrink-0"
                          />
                          <div className="overflow-hidden">
                            <div className="text-[11px] font-semibold text-white truncate group-hover:text-purple-300">
                              {item.name}
                            </div>
                            <div className="text-[9px] text-slate-500 truncate">{item.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={handleRemoveBackground}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 text-xs px-3 py-2 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Background Gambar</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-medium transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleApplyBackground}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition shadow-md shadow-purple-500/20 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Terapkan Desain ke Kartu</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD LOGO & ASSET */}
          {activeTab === 'asset' && (
            <div className="max-w-xl mx-auto space-y-5">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium">
                    Pilih File Logo / Stempel / Tanda Tangan (Format PNG Transparan disarankan)
                  </label>
                  <input
                    ref={assetFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAssetFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => assetFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-xl p-5 text-center cursor-pointer bg-slate-950/60 transition flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-white">Pilih File Logo / Lambang</span>
                    <span className="text-[11px] text-slate-500">Mendukung file PNG transparan, SVG, JPG</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Nama Elemen</label>
                  <input
                    type="text"
                    value={assetName}
                    onChange={e => setAssetName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>

                {assetPreview && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
                    <img
                      src={assetPreview}
                      alt="Preview Aset"
                      className="w-14 h-14 object-contain rounded bg-slate-900 p-1 border border-slate-800"
                    />
                    <div>
                      <div className="font-semibold text-white">{assetName}</div>
                      <div className="text-[11px] text-emerald-400">Siap disisipkan ke kanvas</div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleInsertAssetElement}
                  disabled={!assetPreview}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Sisipkan Logo ke Kanvas Kartu</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: IMPORT TEMPLATE JSON */}
          {activeTab === 'json' && (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <FileJson className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Impor Berkas Template Kartu (.json)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Muat desain kartu yang sebelumnya telah diekspor dari KartuID Studio.
                  </p>
                </div>

                <input
                  ref={jsonFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleJsonFileChange}
                  className="hidden"
                />

                <button
                  onClick={() => jsonFileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-md shadow-indigo-500/20 inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Pilih Berkas .JSON dari Komputer</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
