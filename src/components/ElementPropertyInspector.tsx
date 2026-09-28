import React, { useRef, useState } from 'react';
import { CardElement, CardSideDesign, CardOrientation, SheetRow } from '../types/card';
import { 
  Type, Image as ImageIcon, QrCode, Barcode, Cpu, Award, Sparkles, 
  Trash2, Copy, ArrowUp, ArrowDown, Lock, Unlock, Palette, Sliders, Layers, Upload, Check, Camera
} from 'lucide-react';
import { readFileAsDataUrl } from '../utils/imageUpload';

interface ElementPropertyInspectorProps {
  selectedElement: CardElement | null;
  sideDesign: CardSideDesign;
  sheetHeaders: string[];
  orientation: CardOrientation;
  activeRow?: SheetRow;
  onUpdateActiveRow?: (updatedFields: Partial<SheetRow>) => void;
  onUpdateElement: (updated: Partial<CardElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (element: CardElement) => void;
  onUpdateBackground: (updatedBg: Partial<CardSideDesign['background']>) => void;
  onChangeOrientation: (orientation: CardOrientation) => void;
  onOpenUploadModal?: () => void;
}

export const ElementPropertyInspector: React.FC<ElementPropertyInspectorProps> = ({
  selectedElement,
  sideDesign,
  sheetHeaders,
  orientation,
  activeRow,
  onUpdateActiveRow,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onUpdateBackground,
  onChangeOrientation,
  onOpenUploadModal
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadSuccess, setPhotoUploadSuccess] = useState(false);
  // If no element is selected, show Card & Background inspector
  if (!selectedElement) {
    const bg = sideDesign.background;

    const GRADIENT_PRESETS = [
      { name: 'Koperasi Emerald', from: '#064e3b', to: '#022c22', dir: 'to-br' },
      { name: 'Pelajar Royal Blue', from: '#1e3a8a', to: '#0f172a', dir: 'to-b' },
      { name: 'Pegawai Tech Slate', from: '#0f172a', to: '#1e1b4b', dir: 'to-b' },
      { name: 'Cyberpunk Neon', from: '#090d16', to: '#111827', dir: 'to-br' },
      { name: 'Luxury Gold Dark', from: '#1c1917', to: '#451a03', dir: 'to-br' },
      { name: 'Crimson Velvet', from: '#450a0a', to: '#1c1917', dir: 'to-b' },
    ];

    return (
      <div className="space-y-6 text-sm text-slate-300">
        <div>
          <div className="flex items-center gap-2 mb-3 text-indigo-400 font-semibold uppercase text-xs tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>Format Kartu CR-80</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => onChangeOrientation('landscape')}
              className={`p-2.5 rounded-lg border text-center transition flex flex-col items-center gap-1.5 ${
                orientation === 'landscape'
                  ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800'
              }`}
            >
              <div className="w-8 h-5 border-2 border-current rounded-sm"></div>
              <span className="text-xs font-medium">Landscape (85.6 × 54mm)</span>
            </button>

            <button
              onClick={() => onChangeOrientation('portrait')}
              className={`p-2.5 rounded-lg border text-center transition flex flex-col items-center gap-1.5 ${
                orientation === 'portrait'
                  ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800'
              }`}
            >
              <div className="w-5 h-8 border-2 border-current rounded-sm"></div>
              <span className="text-xs font-medium">Portrait (54 × 85.6mm)</span>
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3 text-indigo-400 font-semibold uppercase text-xs tracking-wider">
            <Palette className="w-4 h-4" />
            <span>Warna & Tema Background</span>
          </div>

          <div className="space-y-3">
            {/* Custom Uploaded Background Card Banner */}
            <div className="p-3 rounded-xl border border-purple-800/40 bg-purple-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Background Gambar Kustom</span>
                </span>
                {bg.type === 'image' && bg.imageUrl && (
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-mono">
                    AKTIF
                  </span>
                )}
              </div>

              {bg.type === 'image' && bg.imageUrl ? (
                <div className="space-y-2">
                  <div className="w-full h-20 rounded-lg border border-slate-700 overflow-hidden relative">
                    <img
                      src={bg.imageUrl}
                      alt="Current Background"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <span className="text-[10px] bg-black/70 text-white px-2 py-0.5 rounded-full font-mono">
                        {bg.imageFit || 'cover'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={onOpenUploadModal}
                      className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Ganti Gambar
                    </button>
                    <button
                      onClick={() =>
                        onUpdateBackground({
                          type: 'color',
                          color: '#0f172a',
                          imageUrl: undefined
                        })
                      }
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 rounded-lg text-xs transition"
                      title="Hapus background gambar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Gunakan kartu polos hasil desain Canva/Photoshop Anda sendiri.
                  </p>
                  <button
                    onClick={onOpenUploadModal}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Desain Background</span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Preset Warna Populer</label>
              <div className="grid grid-cols-3 gap-2">
                {GRADIENT_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      onUpdateBackground({
                        type: 'gradient',
                        gradient: { from: p.from, to: p.to, direction: p.dir }
                      })
                    }
                    className="p-1.5 rounded-lg border border-slate-700/60 hover:border-indigo-400 transition flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full h-6 rounded"
                      style={{
                        background: `linear-gradient(to right, ${p.from}, ${p.to})`
                      }}
                    />
                    <span className="text-[10px] text-slate-300 truncate w-full text-center">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Gradasi Mulai</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bg.gradient?.from || '#0f172a'}
                    onChange={e =>
                      onUpdateBackground({
                        type: 'gradient',
                        gradient: {
                          from: e.target.value,
                          to: bg.gradient?.to || '#1e1b4b',
                          direction: bg.gradient?.direction || 'to-b'
                        }
                      })
                    }
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={bg.gradient?.from || '#0f172a'}
                    onChange={e =>
                      onUpdateBackground({
                        type: 'gradient',
                        gradient: {
                          from: e.target.value,
                          to: bg.gradient?.to || '#1e1b4b',
                          direction: bg.gradient?.direction || 'to-b'
                        }
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Gradasi Akhir</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bg.gradient?.to || '#1e1b4b'}
                    onChange={e =>
                      onUpdateBackground({
                        type: 'gradient',
                        gradient: {
                          from: bg.gradient?.from || '#0f172a',
                          to: e.target.value,
                          direction: bg.gradient?.direction || 'to-b'
                        }
                      })
                    }
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={bg.gradient?.to || '#1e1b4b'}
                    onChange={e =>
                      onUpdateBackground({
                        type: 'gradient',
                        gradient: {
                          from: bg.gradient?.from || '#0f172a',
                          to: e.target.value,
                          direction: bg.gradient?.direction || 'to-b'
                        }
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Pola Keamanan (Guilloche / Grid)</label>
              <select
                value={bg.pattern || 'none'}
                onChange={e =>
                  onUpdateBackground({
                    pattern: e.target.value as any
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200"
              >
                <option value="none">Polos (Tanpa Pola)</option>
                <option value="security">Guilloche Garis Keamanan</option>
                <option value="dots">Pola Titik (Dot Grid)</option>
                <option value="grid">Pola Kotak Modern</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-2 text-xs text-slate-500 border-t border-slate-800/80">
          💡 Klik elemen apa saja di kartu untuk mengubah teks, font, foto, ukuran, atau menghubungkan dengan kolom Google Sheet.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-sm text-slate-300">
      {/* Element Header & Top Actions */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">{selectedElement.name}</span>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded uppercase font-mono">
            {selectedElement.type}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicateElement(selectedElement)}
            title="Duplikat Elemen"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onUpdateElement({ locked: !selectedElement.locked })}
            title={selectedElement.locked ? 'Buka Kunci' : 'Kunci Posisi'}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          >
            {selectedElement.locked ? (
              <Lock className="w-4 h-4 text-amber-400" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onDeleteElement(selectedElement.id)}
            title="Hapus Elemen"
            className="p-1.5 hover:bg-rose-900/30 rounded text-slate-400 hover:text-rose-400 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Data Binding with Google Sheets */}
      {['text', 'photo', 'qr', 'barcode', 'badge'].includes(selectedElement.type) && (
        <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-lg">
          <label className="block text-xs font-semibold text-indigo-300 mb-1 flex items-center justify-between">
            <span>🔗 Sambungkan ke Kolom Google Sheet</span>
            {selectedElement.dynamicField && (
              <button
                onClick={() => onUpdateElement({ dynamicField: undefined })}
                className="text-[10px] text-slate-400 hover:text-white underline"
              >
                Lepas Hubungan
              </button>
            )}
          </label>
          <select
            value={selectedElement.dynamicField || ''}
            onChange={e => onUpdateElement({ dynamicField: e.target.value || undefined })}
            className="w-full bg-slate-900 border border-indigo-700/60 rounded px-2.5 py-1.5 text-xs text-white"
          >
            <option value="">-- Teks Statis (Manual) --</option>
            {sheetHeaders.map(header => (
              <option key={header} value={header}>
                Kolom: {header}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            Data akan otomatis berganti sesuai baris anggota yang dipilih di Google Sheet.
          </p>
        </div>
      )}

      {/* Text Specific Settings */}
      {selectedElement.type === 'text' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Isi Teks / Template</label>
            <textarea
              rows={2}
              value={selectedElement.text || ''}
              onChange={e => onUpdateElement({ text: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100"
              placeholder="Ketik teks atau gunakan {{Kolom_Nama}}"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Font Family</label>
              <select
                value={selectedElement.fontFamily || 'Plus Jakarta Sans'}
                onChange={e => onUpdateElement({ fontFamily: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs"
              >
                <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                <option value="Outfit">Outfit (Display/Modern)</option>
                <option value="Fira Code">Fira Code (Monospace)</option>
                <option value="Syne">Syne (High Contrast)</option>
                <option value="sans-serif">System Sans</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Ukuran Font (px)</label>
              <input
                type="number"
                min={6}
                max={60}
                value={selectedElement.fontSize || 12}
                onChange={e => onUpdateElement({ fontSize: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Ketebalan (Weight)</label>
              <select
                value={selectedElement.fontWeight || '400'}
                onChange={e => onUpdateElement({ fontWeight: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs"
              >
                <option value="400">Normal (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">SemiBold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">ExtraBold (800)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Warna Teks</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={selectedElement.color || '#ffffff'}
                  onChange={e => onUpdateElement({ color: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={selectedElement.color || '#ffffff'}
                  onChange={e => onUpdateElement({ color: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Rata Teks</label>
              <select
                value={selectedElement.textAlign || 'left'}
                onChange={e => onUpdateElement({ textAlign: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs"
              >
                <option value="left">Rata Kiri</option>
                <option value="center">Rata Tengah</option>
                <option value="right">Rata Kanan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Transformasi</label>
              <select
                value={selectedElement.textTransform || 'none'}
                onChange={e => onUpdateElement({ textTransform: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs"
              >
                <option value="none">Asli</option>
                <option value="uppercase">HURUF BESAR</option>
                <option value="capitalize">Huruf Kapital Tiap Kata</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Photo Specific Settings */}
      {selectedElement.type === 'photo' && (
        <div className="space-y-4">
          {/* UPLOAD FOTO PROFIL SECTION */}
          <div className="p-3.5 bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-700/40 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span>Upload Foto Profil</span>
              </label>
              {photoUploadSuccess && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                  <Check className="w-3 h-3" /> Berhasil
                </span>
              )}
            </div>

            {/* Current photo preview thumbnail */}
            {(() => {
              const currentPhoto = 
                (activeRow && selectedElement.dynamicField && activeRow[selectedElement.dynamicField]) ||
                (activeRow && (activeRow.Foto_URL || activeRow.Foto_Siswa || activeRow.Foto_Pegawai || activeRow.Avatar_URL)) ||
                selectedElement.photoUrl;

              return (
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-16 bg-slate-950 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0 ${
                    selectedElement.photoShape === 'circle' ? 'rounded-full' : 'rounded-lg'
                  }`}>
                    {currentPhoto ? (
                      <img
                        src={currentPhoto}
                        alt="Foto Profil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        try {
                          setIsUploadingPhoto(true);
                          const dataUrl = await readFileAsDataUrl(file, 800);
                          
                          // 1. Update element default photoUrl
                          onUpdateElement({ photoUrl: dataUrl });

                          // 2. If activeRow exists, update active member's photo row
                          if (onUpdateActiveRow) {
                            const photoField = selectedElement.dynamicField || 
                              (sheetHeaders.find(h => /foto|avatar|photo|gambar/i.test(h)) || 'Foto_URL');
                            onUpdateActiveRow({ [photoField]: dataUrl });
                          }

                          setPhotoUploadSuccess(true);
                          setTimeout(() => setPhotoUploadSuccess(false), 3000);
                        } catch (err: any) {
                          alert(err.message || 'Gagal mengupload foto.');
                        } finally {
                          setIsUploadingPhoto(false);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }
                      }}
                    />

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingPhoto ? 'Memproses Foto...' : 'Pilih Foto dari Komputer'}</span>
                    </button>

                    {currentPhoto && (
                      <button
                        onClick={() => {
                          onUpdateElement({ photoUrl: '' });
                          if (onUpdateActiveRow && selectedElement.dynamicField) {
                            onUpdateActiveRow({ [selectedElement.dynamicField]: '' });
                          }
                        }}
                        className="w-full py-1 text-[11px] text-slate-400 hover:text-rose-300 transition text-center"
                      >
                        Hapus Foto Profil
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            <p className="text-[10.5px] text-slate-400 leading-tight">
              Mendukung file JPG, PNG, atau WebP. Foto akan otomatis dioptimalkan dan disematkan langsung ke kartu anggota saat ini.
            </p>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Bentuk Foto</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onUpdateElement({ photoShape: 'rounded' })}
                className={`py-1.5 text-xs rounded border text-center ${
                  selectedElement.photoShape === 'rounded' || !selectedElement.photoShape
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 font-semibold'
                    : 'border-slate-800 hover:bg-slate-800'
                }`}
              >
                Rounded
              </button>
              <button
                onClick={() => onUpdateElement({ photoShape: 'circle' })}
                className={`py-1.5 text-xs rounded border text-center ${
                  selectedElement.photoShape === 'circle'
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 font-semibold'
                    : 'border-slate-800 hover:bg-slate-800'
                }`}
              >
                Circle
              </button>
              <button
                onClick={() => onUpdateElement({ photoShape: 'square' })}
                className={`py-1.5 text-xs rounded border text-center ${
                  selectedElement.photoShape === 'square'
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 font-semibold'
                    : 'border-slate-800 hover:bg-slate-800'
                }`}
              >
                Square
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tebal Border (px)</label>
              <input
                type="number"
                min={0}
                max={10}
                value={selectedElement.borderWidth ?? 2}
                onChange={e => onUpdateElement({ borderWidth: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Warna Border</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={selectedElement.borderColor || '#6366f1'}
                  onChange={e => onUpdateElement({ borderColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={selectedElement.borderColor || '#6366f1'}
                  onChange={e => onUpdateElement({ borderColor: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Atau Gunakan URL Foto Web (Opsional)</label>
            <input
              type="text"
              value={selectedElement.photoUrl || ''}
              onChange={e => onUpdateElement({ photoUrl: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs"
              placeholder="https://images.unsplash.com/..."
            />
          </div>
        </div>
      )}

      {/* QR Code Settings */}
      {selectedElement.type === 'qr' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Data / URL QR Code</label>
            <input
              type="text"
              value={selectedElement.codeData || ''}
              onChange={e => onUpdateElement({ codeData: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono"
              placeholder="https://verifikasi.koperasi.id"
            />
          </div>
        </div>
      )}

      {/* Barcode Settings */}
      {selectedElement.type === 'barcode' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nilai Barcode</label>
            <input
              type="text"
              value={selectedElement.codeData || ''}
              onChange={e => onUpdateElement({ codeData: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeText"
              checked={selectedElement.includeBarcodeText !== false}
              onChange={e => onUpdateElement({ includeBarcodeText: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="includeText" className="text-xs text-slate-300">
              Tampilkan teks angka di bawah garis barcode
            </label>
          </div>
        </div>
      )}

      {/* Badge Settings */}
      {selectedElement.type === 'badge' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Teks Badge</label>
            <input
              type="text"
              value={selectedElement.badgeText || ''}
              onChange={e => onUpdateElement({ badgeText: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Warna Latar</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={selectedElement.badgeBgColor || '#4f46e5'}
                  onChange={e => onUpdateElement({ badgeBgColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={selectedElement.badgeBgColor || '#4f46e5'}
                  onChange={e => onUpdateElement({ badgeBgColor: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Warna Teks</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={selectedElement.badgeTextColor || '#ffffff'}
                  onChange={e => onUpdateElement({ badgeTextColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={selectedElement.badgeTextColor || '#ffffff'}
                  onChange={e => onUpdateElement({ badgeTextColor: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature & Stamp Settings */}
      {selectedElement.type === 'signature' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nama Penanda Tangan</label>
            <input
              type="text"
              value={selectedElement.signerName || ''}
              onChange={e => onUpdateElement({ signerName: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Jabatan / NIP</label>
            <input
              type="text"
              value={selectedElement.signerTitle || ''}
              onChange={e => onUpdateElement({ signerTitle: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs"
            />
          </div>
        </div>
      )}

      {selectedElement.type === 'stamp' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Teks Stempel</label>
            <input
              type="text"
              value={selectedElement.stampText || ''}
              onChange={e => onUpdateElement({ stampText: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs uppercase"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Warna Cap Stempel</label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={selectedElement.stampColor || '#dc2626'}
                onChange={e => onUpdateElement({ stampColor: e.target.value })}
                className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
              />
              <input
                type="text"
                value={selectedElement.stampColor || '#dc2626'}
                onChange={e => onUpdateElement({ stampColor: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Position & Size Adjustments */}
      <div className="pt-3 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5" />
          <span>Posisi & Ukuran (%)</span>
        </div>

        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Posisi X (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={selectedElement.x}
              onChange={e => onUpdateElement({ x: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Posisi Y (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={selectedElement.y}
              onChange={e => onUpdateElement({ y: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Lebar W (%)</label>
            <input
              type="number"
              min={1}
              max={100}
              step={0.5}
              value={selectedElement.width}
              onChange={e => onUpdateElement({ width: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Tinggi H (%)</label>
            <input
              type="number"
              min={1}
              max={100}
              step={0.5}
              value={selectedElement.height}
              onChange={e => onUpdateElement({ height: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5"
            />
          </div>
        </div>

        {/* Layer order */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onUpdateElement({ zIndex: (selectedElement.zIndex || 1) + 1 })}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded transition"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Naikkan Layer</span>
          </button>
          <button
            onClick={() =>
              onUpdateElement({ zIndex: Math.max(1, (selectedElement.zIndex || 1) - 1) })
            }
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded transition"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Turunkan Layer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
