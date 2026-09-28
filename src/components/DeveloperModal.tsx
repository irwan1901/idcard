import React, { useState } from 'react';
import { 
  Code2, Download, Upload, Copy, Check, Terminal, ExternalLink, 
  Server, Globe, FileJson, Sparkles, X 
} from 'lucide-react';
import { CardTemplate } from '../types/card';

interface DeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplate: CardTemplate;
  onImportTemplate: (template: CardTemplate) => void;
}

export const DeveloperModal: React.FC<DeveloperModalProps> = ({
  isOpen,
  onClose,
  currentTemplate,
  onImportTemplate
}) => {
  const [activeTab, setActiveTab] = useState<'vercel' | 'json' | 'code'>('vercel');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [importError, setImportError] = useState('');

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentTemplate, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentTemplate.id}_template.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = () => {
    try {
      setImportError('');
      const parsed = JSON.parse(jsonInput);
      if (!parsed.front || !parsed.orientation) {
        throw new Error('Format JSON tidak valid. Memerlukan struktur front dan orientation.');
      }
      onImportTemplate(parsed);
      onClose();
    } catch (err: any) {
      setImportError(err.message || 'Gagal mem-parsing file JSON.');
    }
  };

  const REACT_SNIPPET = `// Komponen React untuk merender Kartu Identitas
import React from 'react';
import { CardCanvas } from '@/components/CardCanvas';

export function MemberCard({ memberData, template }) {
  return (
    <CardCanvas
      sideDesign={template.front}
      orientation={template.orientation}
      dimensions={template.dimensions}
      activeRow={memberData}
      selectedElementId={null}
      onSelectElement={() => {}}
      onUpdateElementPosition={() => {}}
      readOnly={true}
    />
  );
}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2 font-outfit">
                Developer Hub & Vercel Deployment
              </h2>
              <p className="text-xs text-slate-400">
                Ekspor schema template, kode komponen, dan panduan deployment instan ke Vercel
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

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 bg-slate-900/80 px-4 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('vercel')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'vercel'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Deploy di Vercel</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>Schema JSON Template</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>React & API Snippet</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-5 bg-slate-950/40 text-xs">
          {/* TAB 1: VERCEL DEPLOYMENT */}
          {activeTab === 'vercel' && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white text-black rounded-lg flex items-center justify-center font-black">
                      ▲
                    </div>
                    <span className="font-bold text-white text-sm">Deploy Langsung ke Vercel</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-mono">
                    vercel.json Terkonfigurasi
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed">
                  Project ini dibangun dengan arsitektur Vite React SPA murni tanpa server state yang rumit, sehingga <strong>100% kompatibel dan siap di-deploy secara instan di Vercel</strong> dengan zero-configuration.
                </p>

                <div className="pt-2 space-y-3">
                  <div className="font-semibold text-slate-200">Langkah 1: Deploy via Vercel CLI</div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between font-mono text-indigo-300">
                    <code>npx vercel</code>
                    <button
                      onClick={() => handleCopy('npx vercel', 'vercel-cli')}
                      className="p-1 hover:text-white"
                    >
                      {copiedKey === 'vercel-cli' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="font-semibold text-slate-200 pt-2">Langkah 2: Atau Push ke GitHub & Import ke Vercel</div>
                  <ol className="list-decimal pl-5 space-y-1.5 text-slate-400">
                    <li>Push repositori ini ke akun GitHub / GitLab Anda.</li>
                    <li>Buka dashboard Vercel (<a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-indigo-400 underline">vercel.com/new</a>).</li>
                    <li>Pilih repositori Anda, Vercel otomatis mendeteksi framework Vite.</li>
                    <li>Klik <strong>Deploy</strong>. Selesai! Aplikasi langsung live dengan custom domain & SSL otomatis.</li>
                  </ol>
                </div>
              </div>

              {/* Vercel JSON Inspection */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-300 font-semibold">vercel.json yang Digunakan:</span>
                  <button
                    onClick={() =>
                      handleCopy(
                        JSON.stringify(
                          {
                            buildCommand: 'npm run build',
                            outputDirectory: 'dist',
                            framework: 'vite',
                            rewrites: [{ source: '/(.*)', destination: '/index.html' }]
                          },
                          null,
                          2
                        ),
                        'vercel-json'
                      )
                    }
                    className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    {copiedKey === 'vercel-json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin</span>
                  </button>
                </div>

                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
{`{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: JSON SCHEMA */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">Template Specification JSON</h3>
                  <p className="text-slate-400 text-xs">
                    Simpan dan bagikan template kartu dengan format JSON terstruktur.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(JSON.stringify(currentTemplate, null, 2), 'template-json')}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition"
                  >
                    {copiedKey === 'template-json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin JSON</span>
                  </button>
                  <button
                    onClick={handleDownloadJSON}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh .json</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono text-[11px]">
                    Current Template JSON (Live Schema)
                  </label>
                  <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-300 h-80 overflow-auto">
                    {JSON.stringify(currentTemplate, null, 2)}
                  </pre>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono text-[11px]">
                    Import Template JSON Baru
                  </label>
                  <textarea
                    rows={12}
                    value={jsonInput}
                    onChange={e => setJsonInput(e.target.value)}
                    placeholder="Tempelkan JSON template di sini untuk mengimpor..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] text-slate-200 h-64 outline-none focus:border-indigo-500"
                  />
                  {importError && (
                    <div className="text-rose-400 text-xs mt-1">{importError}</div>
                  )}
                  <button
                    onClick={handleImportJSON}
                    className="mt-2 w-full py-2 bg-slate-800 hover:bg-indigo-600 text-white font-semibold rounded-lg transition"
                  >
                    Terapkan & Impor Template
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CODE SNIPPET */}
          {activeTab === 'code' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div>
                <h3 className="font-bold text-white text-sm">Integrasi Kode React & Headless</h3>
                <p className="text-slate-400 text-xs">
                  Gunakan komponen ini di aplikasi React atau Next.js Anda untuk merender kartu:
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative">
                <button
                  onClick={() => handleCopy(REACT_SNIPPET, 'react-code')}
                  className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                >
                  {copiedKey === 'react-code' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre className="font-mono text-[11px] text-indigo-300 overflow-x-auto leading-relaxed">
                  {REACT_SNIPPET}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
