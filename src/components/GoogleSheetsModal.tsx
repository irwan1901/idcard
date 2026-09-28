import React, { useState, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, RefreshCw, CheckCircle, AlertCircle, ExternalLink, 
  Plus, Trash2, Search, ArrowRight, Code, Database, KeyRound, Sparkles, X, Camera, Upload, Copy, Check, Send, LogOut, CheckSquare, Square
} from 'lucide-react';
import { SheetRow, GoogleSheetConfig } from '../types/card';
import { fetchGoogleSheetData, SAMPLE_DATASETS, syncToGasApi } from '../utils/googleSheets';
import { readFileAsDataUrl } from '../utils/imageUpload';
import { 
  TARGET_SPREADSHEET_ID, 
  TARGET_SPREADSHEET_URL, 
  getStoredToken, 
  saveToken, 
  clearToken, 
  requestGoogleAccessToken, 
  syncFullDatasetToGoogleSheet, 
  readFromGoogleSheetApi,
  getGoogleClientId,
  saveGoogleClientId
} from '../utils/googleSheetsSync';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetConfig;
  onUpdateConfig: (newConfig: GoogleSheetConfig) => void;
  activeRowIndex: number;
  onSelectRowIndex: (index: number) => void;
  category: string;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  activeRowIndex,
  onSelectRowIndex,
  category
}) => {
  const envGasUrl = ((import.meta as any).env?.VITE_GAS_API_URL || '').trim();
  const [activeTab, setActiveTab] = useState<'table' | 'target' | 'connect' | 'samples' | 'script'>('table');
  const [inputUrl, setInputUrl] = useState(config.sheetUrl || TARGET_SPREADSHEET_URL);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingToGas, setIsSavingToGas] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Target Google Sheets Sync State
  const [authToken, setAuthToken] = useState<string | null>(getStoredToken());
  const [isSyncingTarget, setIsSyncingTarget] = useState(false);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);
  const [customClientId, setCustomClientId] = useState(getGoogleClientId());
  const [showClientIdConfig, setShowClientIdConfig] = useState(false);
  const [targetSyncStatus, setTargetSyncStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({
    type: 'idle',
    message: ''
  });

  const [syncStatus, setSyncStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Debounced auto-sync timer
  const autoSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-sync function when rows or headers change
  const triggerAutoSync = (updatedRows: SheetRow[], updatedHeaders: string[]) => {
    if (!isAutoSyncEnabled) return;
    const token = authToken || getStoredToken();
    if (!token) return;

    if (autoSyncTimerRef.current) {
      clearTimeout(autoSyncTimerRef.current);
    }

    autoSyncTimerRef.current = setTimeout(async () => {
      try {
        setIsSyncingTarget(true);
        setTargetSyncStatus({
          type: 'idle',
          message: 'Menyimpan perubahan ke Google Sheets...'
        });
        await syncFullDatasetToGoogleSheet(
          TARGET_SPREADSHEET_ID,
          updatedHeaders,
          updatedRows,
          token
        );
        const timeStr = new Date().toLocaleTimeString('id-ID');
        setTargetSyncStatus({
          type: 'success',
          message: `Tersinkronkan otomatis ke spreadsheet ${TARGET_SPREADSHEET_ID} (${timeStr})`
        });
      } catch (err: any) {
        console.warn('Auto-sync error:', err);
        setTargetSyncStatus({
          type: 'error',
          message: `Gagal auto-sync: ${err.message}`
        });
      } finally {
        setIsSyncingTarget(false);
      }
    }, 1200);
  };

  if (!isOpen) return null;

  // Handle Google OAuth Connect
  const handleConnectGoogleOAuth = () => {
    setTargetSyncStatus({ type: 'idle', message: 'Membuka otorisasi Google...' });
    requestGoogleAccessToken(
      (token) => {
        setAuthToken(token);
        setTargetSyncStatus({
          type: 'success',
          message: 'Otorisasi Google Sheets berhasil! Mengunggah data saat ini ke spreadsheet target...'
        });
        handlePushToTargetSheet(token);
      },
      (err) => {
        setTargetSyncStatus({
          type: 'error',
          message: err.message || 'Gagal otorisasi dengan akun Google.'
        });
      },
      customClientId
    );
  };

  // Logout Google OAuth
  const handleLogoutGoogleOAuth = () => {
    clearToken();
    setAuthToken(null);
    setTargetSyncStatus({
      type: 'idle',
      message: 'Sesi Google telah terputus.'
    });
  };

  // Push full dataset to target spreadsheet (1pUG_Tn9MBJaZp_gFRoeG52zKaXSn1I5dIrOcUvshh_w)
  const handlePushToTargetSheet = async (tokenOverride?: string) => {
    const token = tokenOverride || authToken || getStoredToken();
    if (!token) {
      handleConnectGoogleOAuth();
      return;
    }

    setIsSyncingTarget(true);
    setTargetSyncStatus({
      type: 'idle',
      message: 'Menulis data ke Google Sheets (1pUG_Tn9MBJaZp_gFRoeG52zKaXSn1I5dIrOcUvshh_w)...'
    });

    try {
      const res = await syncFullDatasetToGoogleSheet(
        TARGET_SPREADSHEET_ID,
        config.headers,
        config.rows,
        token
      );

      const timeStr = new Date().toLocaleTimeString('id-ID');
      onUpdateConfig({
        ...config,
        sheetUrl: TARGET_SPREADSHEET_URL,
        sheetId: TARGET_SPREADSHEET_ID,
        sheetName: `Spreadsheet (${TARGET_SPREADSHEET_ID})`,
        lastSynced: timeStr,
        isConnected: true
      });

      setTargetSyncStatus({
        type: 'success',
        message: `Berhasil! ${res.updatedRows} baris data berhasil disinkronkan ke Google Sheets.`
      });
    } catch (err: any) {
      setTargetSyncStatus({
        type: 'error',
        message: err.message || 'Gagal menyimpan ke Google Sheets target.'
      });
    } finally {
      setIsSyncingTarget(false);
    }
  };

  // Pull latest data from target spreadsheet
  const handlePullFromTargetSheet = async () => {
    const token = authToken || getStoredToken();
    if (!token) {
      handleConnectGoogleOAuth();
      return;
    }

    setIsSyncingTarget(true);
    setTargetSyncStatus({
      type: 'idle',
      message: 'Membaca data terbaru dari Google Sheets...'
    });

    try {
      const { headers, rows } = await readFromGoogleSheetApi(TARGET_SPREADSHEET_ID, token);
      if (rows.length === 0) {
        throw new Error('Spreadsheet target belum memiliki baris data. Anda dapat mengirim data dari website dengan tombol "Kirim ke Spreadsheet".');
      }

      const timeStr = new Date().toLocaleTimeString('id-ID');
      onUpdateConfig({
        ...config,
        sheetUrl: TARGET_SPREADSHEET_URL,
        sheetId: TARGET_SPREADSHEET_ID,
        headers,
        rows,
        lastSynced: timeStr,
        isConnected: true
      });

      setTargetSyncStatus({
        type: 'success',
        message: `Berhasil menarik ${rows.length} anggota dan ${headers.length} kolom dari Google Sheets!`
      });
    } catch (err: any) {
      setTargetSyncStatus({
        type: 'error',
        message: err.message || 'Gagal membaca data dari Google Sheets target.'
      });
    } finally {
      setIsSyncingTarget(false);
    }
  };

  // Handle Syncing from manual Google Sheet URL or GAS API
  const handleSyncSheet = async (customUrl?: string) => {
    const targetUrl = (customUrl || inputUrl || envGasUrl).trim();
    if (!targetUrl) {
      setSyncStatus({ type: 'error', message: 'Silakan masukkan URL Google Spreadsheet atau Google Apps Script (VITE_GAS_API_URL).' });
      return;
    }

    setIsLoading(true);
    setSyncStatus({ type: 'idle', message: '' });

    try {
      const { headers, rows } = await fetchGoogleSheetData(targetUrl);

      if (rows.length === 0) {
        if (headers.length > 0) {
          throw new Error(
            `Spreadsheet terhubung dengan ${headers.length} kolom (${headers.slice(0, 3).join(', ')}...), tetapi baris data di bawah judul masih kosong. Harap isi minimal 1 baris data anggota di spreadsheet Anda.`
          );
        }
        throw new Error(
          'Data spreadsheet kosong atau format tidak terbaca. Pastikan baris pertama spreadsheet berisi nama kolom dan hak akses diset "Siapa saja yang memiliki link dapat melihat".'
        );
      }

      const isGas = targetUrl.includes('script.google.com');

      onUpdateConfig({
        ...config,
        sheetUrl: targetUrl,
        sheetName: isGas ? 'Google Apps Script (Live Sync)' : config.sheetName,
        isConnected: true,
        lastSynced: new Date().toLocaleTimeString('id-ID'),
        headers,
        rows
      });

      setSyncStatus({
        type: 'success',
        message: `Berhasil sinkronisasi ${isGas ? 'via GAS API' : 'via Google Sheet'}! Memuat ${rows.length} baris data dan ${headers.length} kolom.`
      });
      setActiveTab('table');
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: err.message || 'Gagal memuat data spreadsheet.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Push back changes via Google Apps Script POST if configured
  const handleSaveToGas = async () => {
    const isGas = config.sheetUrl && config.sheetUrl.includes('script.google.com');
    if (!isGas) {
      alert('Untuk menyimpan balik via GAS, pastikan URL menggunakan endpoint Google Apps Script Web App (VITE_GAS_API_URL).');
      return;
    }

    try {
      setIsSavingToGas(true);
      const success = await syncToGasApi(config.sheetUrl, config.headers, config.rows);
      if (success) {
        alert('Data berhasil disimpan dan disinkronkan langsung ke Google Sheets Anda!');
      } else {
        alert('Gagal menyimpan ke Google Sheets via GAS.');
      }
    } catch (err: any) {
      alert(`Error saat menyimpan ke GAS: ${err.message}`);
    } finally {
      setIsSavingToGas(false);
    }
  };

  // Load sample dataset
  const handleLoadSample = (sampleKey: string) => {
    const sample = SAMPLE_DATASETS[sampleKey];
    if (sample) {
      const newRows = JSON.parse(JSON.stringify(sample.rows));
      onUpdateConfig({
        ...config,
        isConnected: true,
        sheetName: `Sample Dataset (${sampleKey.toUpperCase()})`,
        lastSynced: new Date().toLocaleTimeString('id-ID'),
        headers: [...sample.headers],
        rows: newRows
      });
      onSelectRowIndex(0);
      setActiveTab('table');
      setSyncStatus({
        type: 'success',
        message: `Memuat sample dataset ${sampleKey.toUpperCase()} berhasil!`
      });
      triggerAutoSync(newRows, sample.headers);
    }
  };

  // Add new empty row
  const handleAddRow = () => {
    const newId = `manual-row-${Date.now()}`;
    const newRow: SheetRow = { id: newId };
    config.headers.forEach(h => {
      newRow[h] = '';
    });
    const updatedRows = [newRow, ...config.rows];
    onUpdateConfig({
      ...config,
      rows: updatedRows
    });
    onSelectRowIndex(0);
    triggerAutoSync(updatedRows, config.headers);
  };

  // Delete row
  const handleDeleteRow = (index: number) => {
    const updated = config.rows.filter((_, idx) => idx !== index);
    onUpdateConfig({
      ...config,
      rows: updated
    });
    if (activeRowIndex >= updated.length) {
      onSelectRowIndex(Math.max(0, updated.length - 1));
    }
    triggerAutoSync(updated, config.headers);
  };

  // Update cell value
  const handleCellChange = (rowIndex: number, header: string, value: string) => {
    const updatedRows = [...config.rows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [header]: value
    };
    onUpdateConfig({
      ...config,
      rows: updatedRows
    });
    triggerAutoSync(updatedRows, config.headers);
  };

  // Filtered rows for search
  const filteredRows = config.rows.filter(row => {
    if (!searchQuery.trim()) return true;
    return Object.values(row).some(val =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white font-outfit">
                  Database Google Sheets
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Target: 1pUG_Tn9MB...
                </span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                  {config.rows.length} Data Anggota
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Data otomatis tersinkronisasi dua arah ke spreadsheet target saat Anda mengubah data di website
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={TARGET_SPREADSHEET_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg transition"
            >
              <span>Buka di Google Sheets</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/80 px-4 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('table')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'table'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Tabel Data ({config.rows.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('target')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'target'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingTarget ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Sinkronisasi Target (1pUG_Tn9MB...)</span>
            {isAutoSyncEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('connect')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'connect'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>URL Spreadsheet Lain</span>
          </button>

          <button
            onClick={() => setActiveTab('samples')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'samples'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Preset Data</span>
          </button>

          <button
            onClick={() => setActiveTab('script')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'script'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Google Apps Script</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden p-4 bg-slate-950/40">
          
          {/* TAB 1: DATA TABLE */}
          {activeTab === 'table' && (
            <div className="h-full flex flex-col gap-3">
              {/* TARGET SPREADSHEET SYNC BANNER */}
              <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/50 border border-emerald-600/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 shrink-0 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-white">Target Sinkronisasi:</span>
                      <span className="font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[11px]">
                        1pUG_Tn9MBJaZp_gFRoeG52zKaXSn1I5dIrOcUvshh_w
                      </span>
                      {isAutoSyncEnabled && (
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Auto-Sync Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {targetSyncStatus.message || 'Setiap penambahan atau perubahan data kartu di website otomatis dikirim ke spreadsheet ini.'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!authToken ? (
                    <button
                      onClick={handleConnectGoogleOAuth}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Hubungkan Akun Google (1-Klik)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePushToTargetSheet()}
                      disabled={isSyncingTarget}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow cursor-pointer"
                      title="Kirim seluruh data kartu sekarang ke spreadsheet target"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTarget ? 'animate-spin' : ''}`} />
                      <span>{isSyncingTarget ? 'Menyimpan...' : 'Kirim ke Spreadsheet'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('target')}
                    className="p-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
                    title="Pengaturan Sinkronisasi Otomatis"
                  >
                    Pengaturan
                  </button>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari anggota / siswa / pegawai..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {config.sheetUrl?.includes('script.google.com') && (
                    <button
                      onClick={handleSaveToGas}
                      disabled={isSavingToGas}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-sm"
                      title="Kirim dan simpan perubahan data tabel ini kembali ke Google Sheets via Google Apps Script (POST)"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSavingToGas ? 'Menyimpan ke GAS...' : 'Simpan Balik ke Sheets'}</span>
                    </button>
                  )}
                  <button
                    onClick={handleAddRow}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Baris Baru</span>
                  </button>
                </div>
              </div>

              {/* Data Table Scrollable Container */}
              <div className="flex-1 overflow-auto border border-slate-800 rounded-xl bg-slate-900/60 shadow-inner">
                {config.headers.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                    <FileSpreadsheet className="w-12 h-12 text-slate-600 mb-2" />
                    <p className="font-semibold text-white">Belum Ada Data Spreadsheet</p>
                    <p className="text-xs text-slate-500 max-w-md mt-1">
                      Sambungkan URL Google Sheet Anda atau pilih salah satu Sample Dataset untuk memulai seketika.
                    </p>
                    <button
                      onClick={() => setActiveTab('samples')}
                      className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Pilih Sample Dataset
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950 sticky top-0 z-10 border-b border-slate-800 text-slate-400 font-semibold">
                      <tr>
                        <th className="p-2.5 w-14 text-center">Pilih</th>
                        <th className="p-2.5 w-10 text-center">#</th>
                        {config.headers.map(header => (
                          <th key={header} className="p-2.5 whitespace-nowrap font-mono text-[11px] text-emerald-400">
                            {header}
                          </th>
                        ))}
                        <th className="p-2.5 w-12 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {filteredRows.map((row, index) => {
                        const isSelected = index === activeRowIndex;
                        return (
                          <tr
                            key={row.id || index}
                            className={`hover:bg-slate-800/40 transition group ${
                              isSelected ? 'bg-emerald-950/20' : ''
                            }`}
                          >
                            <td className="p-2 text-center">
                              <button
                                onClick={() => {
                                  onSelectRowIndex(index);
                                }}
                                className={`w-5 h-5 rounded-full flex items-center justify-center mx-auto transition ${
                                  isSelected
                                    ? 'bg-emerald-500 text-white font-bold'
                                    : 'border border-slate-700 text-transparent hover:border-slate-500'
                                }`}
                              >
                                ✓
                              </button>
                            </td>
                            <td className="p-2 font-mono text-[11px] text-slate-500 text-center">
                              {index + 1}
                            </td>
                            {config.headers.map(header => {
                              const val = row[header] || '';
                              const isPhoto = /foto|photo|avatar|image|gambar/i.test(header);

                              return (
                                <td key={header} className="p-1.5 min-w-36 max-w-xs">
                                  {isPhoto ? (
                                    <div className="flex items-center gap-2">
                                      {val ? (
                                        <img
                                          src={val}
                                          alt="Preview"
                                          className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
                                        />
                                      ) : (
                                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 shrink-0">
                                          N/A
                                        </div>
                                      )}
                                      <input
                                        type="text"
                                        value={val}
                                        onChange={e => handleCellChange(index, header, e.target.value)}
                                        placeholder="URL Foto..."
                                        className="w-full bg-transparent px-1.5 py-1 text-slate-200 outline-none border border-transparent hover:border-slate-700 focus:border-emerald-500 rounded text-xs truncate"
                                      />
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      value={val}
                                      onChange={e => handleCellChange(index, header, e.target.value)}
                                      className="w-full bg-transparent px-1.5 py-1 text-slate-200 outline-none border border-transparent hover:border-slate-700 focus:border-emerald-500 rounded text-xs"
                                    />
                                  )}
                                </td>
                              );
                            })}
                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleDeleteRow(index)}
                                title="Hapus Baris Ini"
                                className="p-1 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 rounded transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TARGET SPREADSHEET DIRECT CONFIGURATION */}
          {activeTab === 'target' && (
            <div className="max-w-2xl mx-auto space-y-5 pt-2">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2 font-outfit">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    <span>Integrasi Spreadsheet Target Otomatis</span>
                  </h3>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                    ID: 1pUG_Tn9MB...
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Spreadsheet Target:</span>
                    <a
                      href={TARGET_SPREADSHEET_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <span>1pUG_Tn9MBJaZp_gFRoeG52zKaXSn1I5dIrOcUvshh_w</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-[11.5px] text-slate-400 leading-relaxed">
                    Sistem ini telah dikonfigurasi agar seluruh data anggota, penambahan baris, dan pembaruan foto kartu secara otomatis disinkronkan ke spreadsheet target di atas.
                  </p>
                </div>

                {/* Auto-Sync Toggle */}
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white text-xs block">
                      Otomatis Kirim Data Saat Ada Perubahan di Website
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Setiap kali Anda mengedit kartu, mengubah foto, atau menambah anggota baru, data langsung di-push ke spreadsheet.
                    </span>
                  </div>
                  <button
                    onClick={() => setIsAutoSyncEnabled(!isAutoSyncEnabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      isAutoSyncEnabled
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{isAutoSyncEnabled ? 'AUTO-SYNC ON' : 'AUTO-SYNC OFF'}</span>
                  </button>
                </div>

                {/* Google OAuth Status & Action Buttons */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white text-xs block">
                        Status Otentikasi Google Account:
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {authToken ? '🟢 Terhubung dan memiliki izin menulis (OAuth spreadsheets).' : '🔴 Belum login. Login 1-klik untuk memberikan izin menulis ke spreadsheet Anda.'}
                      </span>
                    </div>

                    {!authToken ? (
                      <button
                        onClick={handleConnectGoogleOAuth}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Login Akun Google</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleLogoutGoogleOAuth}
                        className="text-slate-400 hover:text-rose-400 text-xs px-2 py-1 rounded transition flex items-center gap-1"
                        title="Putuskan sambungan"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                      </button>
                    )}
                  </div>

                  {/* Manual Push & Pull Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850">
                    <button
                      onClick={() => handlePushToTargetSheet()}
                      disabled={isSyncingTarget}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs px-3 py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTarget ? 'animate-spin' : ''}`} />
                      <span>{isSyncingTarget ? 'Menyimpan...' : 'Kirim Data Sekarang (Push)'}</span>
                    </button>

                    <button
                      onClick={handlePullFromTargetSheet}
                      disabled={isSyncingTarget}
                      className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 font-semibold text-xs px-3 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTarget ? 'animate-spin' : ''}`} />
                      <span>Tarik Data Terbaru (Pull)</span>
                    </button>
                  </div>
                </div>

                {targetSyncStatus.message && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      targetSyncStatus.type === 'success'
                        ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                        : targetSyncStatus.type === 'error'
                        ? 'bg-rose-950/60 border border-rose-800/60 text-rose-300'
                        : 'bg-indigo-950/60 border border-indigo-800/60 text-indigo-300'
                    }`}
                  >
                    {targetSyncStatus.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : targetSyncStatus.type === 'error' ? (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    ) : (
                      <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-indigo-400" />
                    )}
                    <span>{targetSyncStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CONNECT CUSTOM URL */}
          {activeTab === 'connect' && (
            <div className="max-w-2xl mx-auto space-y-5 pt-2">
              {envGasUrl && (
                <div className="p-3.5 bg-gradient-to-r from-indigo-950/70 to-slate-900 border border-indigo-700/50 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <Code className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                        <span>VITE_GAS_API_URL Terdeteksi</span>
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 rounded font-mono">Aktif</span>
                      </div>
                      <div className="text-[11px] font-mono text-indigo-300 truncate max-w-xs sm:max-w-md">
                        {envGasUrl}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setInputUrl(envGasUrl);
                      handleSyncSheet(envGasUrl);
                    }}
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1.5 shadow"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Sinkronkan VITE_GAS</span>
                  </button>
                </div>
              )}

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Masukkan URL Spreadsheet atau Google Apps Script Web App</span>
                </h3>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Link Spreadsheet (Share / CSV / Google Apps Script Web App URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://script.google.com/macros/s/.../exec atau https://docs.google.com/spreadsheets/..."
                      value={inputUrl}
                      onChange={e => setInputUrl(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => handleSyncSheet()}
                      disabled={isLoading}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>{isLoading ? 'Menghubungkan...' : 'Sinkronkan'}</span>
                    </button>
                  </div>
                </div>

                {syncStatus.message && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      syncStatus.type === 'success'
                        ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                        : 'bg-rose-950/60 border border-rose-800/60 text-rose-300'
                    }`}
                  >
                    {syncStatus.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{syncStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SAMPLE DATASETS */}
          {activeTab === 'samples' && (
            <div className="max-w-3xl mx-auto space-y-4 pt-2">
              <p className="text-xs text-slate-400">
                Gunakan data contoh yang telah dikonfigurasi siap pakai untuk berbagai kebutuhan identitas:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between hover:border-emerald-500/50 transition">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-sm text-white">Kartu Anggota Koperasi</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Data anggota simpan pinjam, nomor anggota, tanggal gabung, cabang, & status keanggotaan.
                    </p>
                  </div>
                  <button
                    onClick={() => handleLoadSample('koperasi')}
                    className="mt-4 w-full py-2 bg-slate-800 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Muat Data Koperasi
                  </button>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between hover:border-blue-500/50 transition">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-sm text-white">Kartu Pelajar / Siswa</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      NISN, kelas, jurusan RPL/TKJ, tahun ajaran, foto siswa, barcode perpustakaan & gol darah.
                    </p>
                  </div>
                  <button
                    onClick={() => handleLoadSample('pelajar')}
                    className="mt-4 w-full py-2 bg-slate-800 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Muat Data Pelajar
                  </button>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between hover:border-indigo-500/50 transition">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-sm text-white">Kartu Pegawai / BUMN</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      NIP pegawai, divisi jabatan, email kantor, level akses gerbang, & masa berlaku.
                    </p>
                  </div>
                  <button
                    onClick={() => handleLoadSample('pegawai')}
                    className="mt-4 w-full py-2 bg-slate-800 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Muat Data Pegawai
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: APPS SCRIPT WEBHOOK */}
          {activeTab === 'script' && (
            <div className="max-w-3xl mx-auto space-y-4 pt-2 text-xs">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Code className="w-4 h-4 text-indigo-400" />
                    <span>Google Apps Script Endpoint (VITE_GAS_API_URL)</span>
                  </h4>
                  <button
                    onClick={() => {
                      const codeText = `function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) {
    return ContentService.createTextOutput(JSON.stringify({ success: true, headers: [], data: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const headers = data[0].map(String);
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const rowObj = {};
    headers.forEach((header, index) => {
      rowObj[header] = data[i][index] !== undefined ? String(data[i][index]) : '';
    });
    rows.push(rowObj);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    headers: headers,
    data: rows
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (postData.action === 'sync_all' && Array.isArray(postData.rows) && Array.isArray(postData.headers)) {
      sheet.clearContents();
      sheet.appendRow(postData.headers);
      postData.rows.forEach(r => {
        const rowVals = postData.headers.map(h => r[h] !== undefined ? r[h] : '');
        sheet.appendRow(rowVals);
      });
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Data berhasil disimpan' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
                      navigator.clipboard.writeText(codeText);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Tersalin!' : 'Salin Kode Script'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-slate-300 leading-relaxed">
                  <span className="font-semibold text-white">Panduan Pengaturan Google Apps Script:</span>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-400 text-[11.5px]">
                    <li>Buka spreadsheet Anda di Google Drive.</li>
                    <li>Pilih menu <strong>Extensions &gt; Apps Script</strong>.</li>
                    <li>Ganti seluruh isi kode dengan kode di bawah ini, lalu klik icon disket (Save).</li>
                    <li>Klik tombol biru <strong>Deploy &gt; New deployment</strong> &gt; pilih tipe <strong>Web app</strong>.</li>
                    <li>Penting: Pada kolom <strong>"Who has access"</strong>, pilih <strong>"Anyone"</strong> (Siapa saja).</li>
                    <li>Salin URL Web App yang berakhiran <code>/exec</code>, lalu tempelkan ke aplikasi ini atau simpan ke <code>VITE_GAS_API_URL</code> di <code>.env</code>!</li>
                  </ol>
                </div>

                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[10.5px] text-emerald-300 overflow-x-auto max-h-56">
{`function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) {
    return ContentService.createTextOutput(JSON.stringify({ success: true, headers: [], data: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const headers = data[0].map(String);
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const rowObj = {};
    headers.forEach((header, index) => {
      rowObj[header] = data[i][index] !== undefined ? String(data[i][index]) : '';
    });
    rows.push(rowObj);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    headers: headers,
    data: rows
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (postData.action === 'sync_all' && Array.isArray(postData.rows) && Array.isArray(postData.headers)) {
      sheet.clearContents();
      sheet.appendRow(postData.headers);
      postData.rows.forEach(r => {
        const rowVals = postData.headers.map(h => r[h] !== undefined ? r[h] : '');
        sheet.appendRow(rowVals);
      });
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Data berhasil disimpan' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
