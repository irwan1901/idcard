import React from 'react';
import { 
  Type, Image as ImageIcon, QrCode, Barcode, Cpu, Sparkles, 
  Award, Building2, PenTool, Minus, Square, Tag, Layers, Upload 
} from 'lucide-react';
import { ElementType } from '../types/card';

interface AddElementSidebarProps {
  onAddElement: (type: ElementType) => void;
  onOpenUploadModal?: () => void;
}

export const AddElementSidebar: React.FC<AddElementSidebarProps> = ({ onAddElement, onOpenUploadModal }) => {
  const ELEMENT_TOOLS: {
    type: ElementType;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      type: 'text',
      label: 'Teks / Field',
      description: 'Nama, NIP/NISN, Gelar, Alamat',
      icon: <Type className="w-4 h-4" />,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30'
    },
    {
      type: 'photo',
      label: 'Foto Profil',
      description: 'Pas foto dinamis dari Google Sheet',
      icon: <ImageIcon className="w-4 h-4" />,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
    },
    {
      type: 'qr',
      label: 'QR Code 2D',
      description: 'Otentikasi & link verifikasi',
      icon: <QrCode className="w-4 h-4" />,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      type: 'barcode',
      label: 'Barcode 1D',
      description: 'Code128 perpustakaan/kartu',
      icon: <Barcode className="w-4 h-4" />,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },
    {
      type: 'chip',
      label: 'Smart Chip EMV',
      description: 'Simulasi kartu pintar RFID / emas',
      icon: <Cpu className="w-4 h-4" />,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    },
    {
      type: 'hologram',
      label: 'Stiker Hologram',
      description: 'Efek segel keaslian pelangi',
      icon: <Sparkles className="w-4 h-4" />,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    },
    {
      type: 'badge',
      label: 'Badge / Status',
      description: 'Pill anggota aktif, kelas, tier',
      icon: <Tag className="w-4 h-4" />,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    },
    {
      type: 'stamp',
      label: 'Cap Stempel',
      description: 'Stempel basah resmi organisasi',
      icon: <Award className="w-4 h-4" />,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    },
    {
      type: 'signature',
      label: 'Tanda Tangan',
      description: 'Garis tanda tangan & jabatan',
      icon: <PenTool className="w-4 h-4" />,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    },
    {
      type: 'logo',
      label: 'Logo / Lambang',
      description: 'Emblem koperasi, sekolah, instansi',
      icon: <Building2 className="w-4 h-4" />,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      type: 'shape',
      label: 'Garis & Pembatas',
      description: 'Aksen dekorasi, divider list',
      icon: <Minus className="w-4 h-4" />,
      color: 'text-slate-400 bg-slate-800 border-slate-700'
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 h-[calc(100vh-53px)] overflow-y-auto">
      <div className="p-3 border-b border-slate-800/80">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Komponen Kartu</span>
        </h2>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Klik untuk menyisipkan ke kanvas
        </p>
      </div>

      {onOpenUploadModal && (
        <div className="p-2 border-b border-slate-800/80 bg-purple-950/20">
          <button
            onClick={onOpenUploadModal}
            className="w-full p-2.5 rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-950/60 to-indigo-950/60 hover:from-purple-900/60 hover:to-indigo-900/60 text-purple-200 transition flex items-center gap-2.5 shadow-sm group"
          >
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
            <div className="text-left overflow-hidden">
              <div className="text-xs font-bold text-white group-hover:text-purple-200">
                Upload Desain Kartu
              </div>
              <div className="text-[10px] text-purple-300/80 truncate">
                Background / logo kustom
              </div>
            </div>
          </button>
        </div>
      )}

      <div className="p-2 space-y-1.5 flex-1">
        {ELEMENT_TOOLS.map(tool => (
          <button
            key={tool.type}
            onClick={() => onAddElement(tool.type)}
            className="w-full text-left p-2 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:bg-slate-800 hover:border-slate-700 transition flex items-center gap-2.5 group"
          >
            <div className={`p-2 rounded-lg border ${tool.color} group-hover:scale-105 transition-transform`}>
              {tool.icon}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                {tool.label}
              </div>
              <div className="text-[10px] text-slate-500 group-hover:text-slate-400 truncate">
                {tool.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 space-y-1">
        <div className="font-semibold text-slate-300">💡 Tip Developer:</div>
        <p>Gunakan panah keyboard (← ↑ → ↓) untuk menggeser posisi elemen dengan presisi piksel.</p>
      </div>
    </aside>
  );
};
