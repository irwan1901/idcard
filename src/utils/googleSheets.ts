import { SheetRow } from '../types/card';

/**
 * Extracts Google Spreadsheet ID and GID from common Google Sheets URLs:
 * e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?gid=0#gid=0
 * or published to web CSV / HTML URLs
 */
export function parseGoogleSheetUrl(url: string): { 
  sheetId: string | null; 
  gid: string; 
  csvUrl: string | null;
  gvizJsonUrl: string | null;
} {
  try {
    let trimmed = url.trim();
    if (!trimmed) {
      return { sheetId: null, gid: '0', csvUrl: null, gvizJsonUrl: null };
    }

    // Convert /pubhtml to /pub?output=csv
    if (trimmed.includes('docs.google.com/spreadsheets/d/e/') && trimmed.includes('/pubhtml')) {
      trimmed = trimmed.replace('/pubhtml', '/pub?output=csv');
      return { sheetId: 'published', gid: '0', csvUrl: trimmed, gvizJsonUrl: null };
    }

    // Direct published CSV url
    if (trimmed.includes('docs.google.com/spreadsheets/d/e/') && trimmed.includes('/pub') && trimmed.includes('output=csv')) {
      return { sheetId: 'published', gid: '0', csvUrl: trimmed, gvizJsonUrl: null };
    }

    // Direct published without output=csv
    if (trimmed.includes('docs.google.com/spreadsheets/d/e/') && trimmed.includes('/pub')) {
      const glue = trimmed.includes('?') ? '&' : '?';
      return { sheetId: 'published', gid: '0', csvUrl: `${trimmed}${glue}output=csv`, gvizJsonUrl: null };
    }

    // Standard edit or view URL
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const sheetId = match[1];
      let gid = '0';
      const gidMatch = trimmed.match(/[?&#]gid=([0-9]+)/);
      if (gidMatch && gidMatch[1]) {
        gid = gidMatch[1];
      }
      return { 
        sheetId, 
        gid, 
        csvUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
        gvizJsonUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`
      };
    }

    // Just an ID
    if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
      return {
        sheetId: trimmed,
        gid: '0',
        csvUrl: `https://docs.google.com/spreadsheets/d/${trimmed}/export?format=csv&gid=0`,
        gvizJsonUrl: `https://docs.google.com/spreadsheets/d/${trimmed}/gviz/tq?tqx=out:json&gid=0`
      };
    }

    return { sheetId: null, gid: '0', csvUrl: null, gvizJsonUrl: null };
  } catch {
    return { sheetId: null, gid: '0', csvUrl: null, gvizJsonUrl: null };
  }
}

/**
 * Robust CSV parser that auto-detects delimiter (comma, semicolon, tab) and handles quotes
 */
export function parseCSV(csvText: string): { headers: string[]; rows: SheetRow[] } {
  const trimmedText = csvText.trim();
  if (!trimmedText) {
    return { headers: [], rows: [] };
  }

  // Check if response is actually HTML (Google Login or permission denial)
  if (trimmedText.startsWith('<!DOCTYPE html>') || trimmedText.includes('<html') || trimmedText.includes('google-site-verification')) {
    if (trimmedText.includes('accounts.google.com') || trimmedText.includes('ServiceLogin') || trimmedText.includes('Sign in')) {
      throw new Error(
        'Spreadsheet ini bersifat pribadi (membutuhkan login). Buka Google Sheet Anda > klik tombol "Bagikan" (Share) di pojok kanan atas > ubah akses menjadi: "Siapa saja yang memiliki link dapat melihat" (Anyone with the link can view).'
      );
    }
    throw new Error(
      'Respons yang diterima berupa halaman HTML Google, bukan data spreadsheet. Pastikan izin berbagi diset ke "Siapa saja yang memiliki link dapat melihat" atau gunakan opsi File > Bagikan > Publikasikan ke Web (CSV).'
    );
  }

  // Detect delimiter based on the first line
  const firstLine = trimmedText.split(/\r\n|\r|\n/)[0] || '';
  let delimiter = ',';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (semicolonCount > commaCount && semicolonCount >= tabCount) {
    delimiter = ';';
  } else if (tabCount > commaCount && tabCount >= semicolonCount) {
    delimiter = '\t';
  }

  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < trimmedText.length; i++) {
    const char = trimmedText[i];
    const nextChar = trimmedText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some(col => col.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Push remainder
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(col => col.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = lines[0];
  const headers = rawHeaders
    .map((h, idx) => h.replace(/^["']|["']$/g, '').trim() || `Kolom_${idx + 1}`)
    .filter(h => h.length > 0);

  const rows: SheetRow[] = [];
  for (let r = 1; r < lines.length; r++) {
    const rowValues = lines[r];
    // Skip empty lines
    if (!rowValues.some(val => val && val.trim().length > 0)) {
      continue;
    }
    const rowObj: SheetRow = { id: `row-${r}` };
    headers.forEach((header, colIdx) => {
      rowObj[header] = rowValues[colIdx] ? rowValues[colIdx].replace(/^["']|["']$/g, '').trim() : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Parses Google Visualization API JSON format: google.visualization.Query.setResponse(...)
 */
export function parseGvizJson(rawText: string): { headers: string[]; rows: SheetRow[] } {
  const match = rawText.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/);
  if (!match || !match[1]) {
    throw new Error('Format GViz tidak dikenali.');
  }

  const data = JSON.parse(match[1]);
  if (!data.table) {
    throw new Error('Data tabel GViz kosong.');
  }

  const table = data.table;
  const headers: string[] = (table.cols || []).map((col: any, idx: number) => {
    return (col.label || col.id || `Kolom_${idx + 1}`).trim();
  });

  const rows: SheetRow[] = [];
  (table.rows || []).forEach((r: any, rIdx: number) => {
    const rowObj: SheetRow = { id: `gviz-row-${rIdx + 1}` };
    let hasData = false;
    (r.c || []).forEach((cell: any, cIdx: number) => {
      const h = headers[cIdx] || `Kolom_${cIdx + 1}`;
      const val = cell && cell.v !== null && cell.v !== undefined ? String(cell.v).trim() : '';
      if (val) hasData = true;
      rowObj[h] = val;
    });
    if (hasData) {
      rows.push(rowObj);
    }
  });

  return { headers, rows };
}

/**
 * Fetches and parses data from a Google Apps Script (GAS) Web App endpoint
 */
export async function fetchGasApiData(gasUrl: string): Promise<{ headers: string[]; rows: SheetRow[] }> {
  const trimmed = gasUrl.trim();
  if (!trimmed) {
    throw new Error('URL Google Apps Script tidak boleh kosong.');
  }

  let rawText = '';
  try {
    const response = await fetch(trimmed, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*'
      }
    });

    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    rawText = await response.text();
  } catch (err: any) {
    // Try CORS proxy fallback if direct fetch fails
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(trimmed)}`;
      const proxyRes = await fetch(proxyUrl);
      if (proxyRes.ok) {
        rawText = await proxyRes.text();
      } else {
        throw new Error();
      }
    } catch {
      throw new Error(
        'Tidak dapat menghubungi Web App Google Apps Script. Pastikan Web App diset ke "Who has access: Anyone" dan URL berakhiran /exec.'
      );
    }
  }

  // Check if response is Google Login HTML
  if (rawText.includes('<!DOCTYPE html>') || rawText.includes('<html') || rawText.includes('accounts.google.com')) {
    throw new Error(
      'Google Apps Script mengembalikan halaman login Google. Pastikan saat Deploy Web App Anda memilih: "Who has access: Anyone" (Siapa saja), bukan "Only myself".'
    );
  }

  let json: any;
  try {
    json = JSON.parse(rawText);
  } catch {
    // If not JSON, try parsing as CSV
    const csvResult = parseCSV(rawText);
    if (csvResult.rows.length > 0) {
      return csvResult;
    }
    throw new Error('Format respons Google Apps Script bukan JSON yang valid.');
  }

  let headers: string[] = [];
  let rows: SheetRow[] = [];

  // Case 1: 2D Array [ ["Header1", "Header2"], ["Val1", "Val2"] ]
  if (Array.isArray(json) && json.length > 0 && Array.isArray(json[0])) {
    const rawHeaders = json[0].map((h: any, idx: number) => String(h || `Kolom_${idx + 1}`).trim());
    headers = rawHeaders.filter((h: string) => h.length > 0);

    for (let r = 1; r < json.length; r++) {
      const rowArr = json[r];
      if (!Array.isArray(rowArr) || !rowArr.some((v: any) => v !== '' && v !== null && v !== undefined)) {
        continue;
      }
      const rowObj: SheetRow = { id: `gas-row-${r}` };
      headers.forEach((h, colIdx) => {
        rowObj[h] = rowArr[colIdx] !== undefined && rowArr[colIdx] !== null ? String(rowArr[colIdx]).trim() : '';
      });
      rows.push(rowObj);
    }
    return { headers, rows };
  }

  // Case 2: Object with values / data as 2D array
  const array2D = json.values || (Array.isArray(json.data) && Array.isArray(json.data[0]) ? json.data : null);
  if (array2D && Array.isArray(array2D) && array2D.length > 0 && Array.isArray(array2D[0])) {
    const rawHeaders = array2D[0].map((h: any, idx: number) => String(h || `Kolom_${idx + 1}`).trim());
    headers = rawHeaders.filter((h: string) => h.length > 0);

    for (let r = 1; r < array2D.length; r++) {
      const rowArr = array2D[r];
      if (!Array.isArray(rowArr) || !rowArr.some((v: any) => v !== '' && v !== null && v !== undefined)) {
        continue;
      }
      const rowObj: SheetRow = { id: `gas-row-${r}` };
      headers.forEach((h, colIdx) => {
        rowObj[h] = rowArr[colIdx] !== undefined && rowArr[colIdx] !== null ? String(rowArr[colIdx]).trim() : '';
      });
      rows.push(rowObj);
    }
    return { headers, rows };
  }

  // Case 3: Array of objects or object with array in .data, .rows, .records, .result
  let objectList: any[] = [];
  if (Array.isArray(json)) {
    objectList = json;
  } else if (json && typeof json === 'object') {
    if (Array.isArray(json.data)) objectList = json.data;
    else if (Array.isArray(json.rows)) objectList = json.rows;
    else if (Array.isArray(json.records)) objectList = json.records;
    else if (Array.isArray(json.result)) objectList = json.result;
    else if (Array.isArray(json.items)) objectList = json.items;

    if (Array.isArray(json.headers) && json.headers.length > 0) {
      headers = json.headers.map((h: any) => String(h).trim());
    }
  }

  if (objectList.length > 0) {
    if (headers.length === 0) {
      const keySet = new Set<string>();
      objectList.forEach(obj => {
        if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(k => {
            if (k !== 'id') keySet.add(k);
          });
        }
      });
      headers = Array.from(keySet);
    }

    rows = objectList
      .filter(item => item && typeof item === 'object')
      .map((item, idx) => {
        const rowObj: SheetRow = { id: item.id || `gas-row-${idx + 1}` };
        headers.forEach(header => {
          rowObj[header] = item[header] !== undefined && item[header] !== null ? String(item[header]).trim() : '';
        });
        return rowObj;
      })
      .filter(r => Object.keys(r).some(k => k !== 'id' && (r[k] || '').length > 0));

    return { headers, rows };
  }

  return { headers, rows };
}

/**
 * Push updated rows back to Google Sheet via Google Apps Script Web App
 */
export async function syncToGasApi(gasUrl: string, headers: string[], rows: SheetRow[]): Promise<boolean> {
  const trimmed = gasUrl.trim();
  if (!trimmed) return false;

  const response = await fetch(trimmed, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8' // avoids CORS preflight OPTIONS in GAS
    },
    body: JSON.stringify({
      action: 'sync_all',
      headers,
      rows
    })
  });

  const resJson = await response.json();
  return !!resJson.success;
}

/**
 * Fetch and parse data from Google Sheet using its URL or Google Apps Script API URL
 */
export async function fetchGoogleSheetData(sheetUrl?: string): Promise<{ headers: string[]; rows: SheetRow[] }> {
  const envGasUrl = (import.meta as any).env?.VITE_GAS_API_URL;
  const targetUrl = (sheetUrl || envGasUrl || '').trim();

  if (!targetUrl) {
    throw new Error('URL Google Spreadsheet atau Google Apps Script (VITE_GAS_API_URL) belum diatur.');
  }

  // 1. Check if it's a Google Apps Script Web App URL
  if (targetUrl.includes('script.google.com') || targetUrl.includes('/exec') || targetUrl.includes('macros/s/')) {
    return await fetchGasApiData(targetUrl);
  }

  // 2. Standard Google Spreadsheet URL
  const info = parseGoogleSheetUrl(targetUrl);
  if (!info.csvUrl) {
    throw new Error('URL Google Spreadsheet tidak valid. Harap periksa format link yang dimasukkan.');
  }

  // Attempt strategy 1: Direct fetch of CSV
  try {
    const response = await fetch(info.csvUrl);
    if (response.ok) {
      const csvText = await response.text();
      const parsed = parseCSV(csvText);
      if (parsed.rows.length > 0) {
        return parsed;
      }
    }
  } catch (err: any) {
    // If blocked by CORS or permissions, proceed to fallbacks
  }

  // Attempt strategy 2: GViz JSON API (Google Visualization)
  if (info.gvizJsonUrl) {
    try {
      const gvizRes = await fetch(info.gvizJsonUrl);
      if (gvizRes.ok) {
        const gvizText = await gvizRes.text();
        const parsed = parseGvizJson(gvizText);
        if (parsed.rows.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Proceed to proxy fallback
    }
  }

  // Attempt strategy 3: CORS Proxy with AllOrigins
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(info.csvUrl)}`;
    const proxyRes = await fetch(proxyUrl);
    if (proxyRes.ok) {
      const text = await proxyRes.text();
      const parsed = parseCSV(text);
      if (parsed.rows.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Continue
  }

  // Attempt strategy 4: GViz JSON via proxy
  if (info.gvizJsonUrl) {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(info.gvizJsonUrl)}`;
      const proxyRes = await fetch(proxyUrl);
      if (proxyRes.ok) {
        const text = await proxyRes.text();
        const parsed = parseGvizJson(text);
        if (parsed.rows.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Continue
    }
  }

  throw new Error(
    'Data spreadsheet kosong atau format tidak terbaca. Pastikan hak akses spreadsheet diatur ke "Siapa saja yang memiliki link dapat melihat" (Anyone with the link can view) dan memiliki baris data di bawah judul.'
  );
}

/**
 * Predefined realistic demo datasets
 */
export const SAMPLE_DATASETS: Record<string, { headers: string[]; rows: SheetRow[] }> = {
  koperasi: {
    headers: ['Nomor_Anggota', 'Nama_Lengkap', 'Jenis_Keanggotaan', 'Tanggal_Gabung', 'Cabang', 'Status', 'Foto_URL', 'QR_Verifikasi'],
    rows: [
      {
        id: 'kop-1',
        Nomor_Anggota: 'KOP-2024-0012',
        Nama_Lengkap: 'Bambang Supriyanto',
        Jenis_Keanggotaan: 'Anggota Utama',
        Tanggal_Gabung: '12 Jan 2021',
        Cabang: 'Jakarta Selatan',
        Status: 'AKTIF',
        Foto_URL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        QR_Verifikasi: 'https://koperasi.id/verify/KOP-2024-0012'
      },
      {
        id: 'kop-2',
        Nomor_Anggota: 'KOP-2024-0045',
        Nama_Lengkap: 'Siti Nurhaliza Dewi',
        Jenis_Keanggotaan: 'Anggota Madya',
        Tanggal_Gabung: '05 Mar 2022',
        Cabang: 'Bandung Kota',
        Status: 'AKTIF',
        Foto_URL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        QR_Verifikasi: 'https://koperasi.id/verify/KOP-2024-0045'
      },
      {
        id: 'kop-3',
        Nomor_Anggota: 'KOP-2024-0089',
        Nama_Lengkap: 'Hendra Gunawan SE',
        Jenis_Keanggotaan: 'Anggota Pendiri',
        Tanggal_Gabung: '18 Agu 2020',
        Cabang: 'Surabaya Pusat',
        Status: 'PREMIUM',
        Foto_URL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        QR_Verifikasi: 'https://koperasi.id/verify/KOP-2024-0089'
      },
      {
        id: 'kop-4',
        Nomor_Anggota: 'KOP-2024-0104',
        Nama_Lengkap: 'Dewi Lestari Putri',
        Jenis_Keanggotaan: 'Anggota Reguler',
        Tanggal_Gabung: '20 Okt 2023',
        Cabang: 'Yogyakarta',
        Status: 'AKTIF',
        Foto_URL: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
        QR_Verifikasi: 'https://koperasi.id/verify/KOP-2024-0104'
      },
      {
        id: 'kop-5',
        Nomor_Anggota: 'KOP-2024-0125',
        Nama_Lengkap: 'Agus Santoso',
        Jenis_Keanggotaan: 'Anggota Madya',
        Tanggal_Gabung: '14 Feb 2023',
        Cabang: 'Semarang',
        Status: 'AKTIF',
        Foto_URL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        QR_Verifikasi: 'https://koperasi.id/verify/KOP-2024-0125'
      },
      {
        id: 'kop-6',
        Nomor_Anggota: 'KOP-2024-0142',
        Nama_Lengkap: 'Rina Kusuma Wardhani',
        Jenis_Keanggotaan: 'Anggota Utama',
        Tanggal_Gabung: '09 Mei 2021',
        Cabang: 'Malang',
        Status: 'AKTIF',
        Foto_URL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        QR_Verifikasi: 'https://koperasi.id/verify/KOP-2024-0142'
      },
      {
        id: 'kop-7',
        Nomor_Anggota: 'KOP-2024-0168',
        Nama_Lengkap: 'Budi Hartono MM',
        Jenis_Keanggotaan: 'Anggota Utama',
        Tanggal_Gabung: '11 Nov 2021',
        Cabang: 'Medan Barat',
        Status: 'PREMIUM',
        Foto_URL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
        QR_Verifikasi: 'https://koperasi.id/verify/KOP-2024-0168'
      },
      {
        id: 'kop-8',
        Nomor_Anggota: 'KOP-2024-0190',
        Nama_Lengkap: 'Nur Aini Solihah',
        Jenis_Keanggotaan: 'Anggota Reguler',
        Tanggal_Gabung: '03 Jan 2024',
        Cabang: 'Makassar',
        Status: 'AKTIF',
        Foto_URL: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80',
        QR_Verifikasi: 'https://koperasi.id/verify/KOP-2024-0190'
      },
      {
        id: 'kop-9',
        Nomor_Anggota: 'KOP-2024-0211',
        Nama_Lengkap: 'Fajar Nugroho',
        Jenis_Keanggotaan: 'Anggota Madya',
        Tanggal_Gabung: '19 Jun 2022',
        Cabang: 'Denpasar',
        Status: 'AKTIF',
        Foto_URL: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
        QR_Verifikasi: 'https://koperasi.id/verify/KOP-2024-0211'
      },
      {
        id: 'kop-10',
        Nomor_Anggota: 'KOP-2024-0235',
        Nama_Lengkap: 'Ratna Sari Dewi',
        Jenis_Keanggotaan: 'Anggota Utama',
        Tanggal_Gabung: '27 Sep 2021',
        Cabang: 'Palembang',
        Status: 'PREMIUM',
        Foto_URL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        QR_Verifikasi: 'https://koperasi.id/verify/KOP-2024-0235'
      }
    ]
  },
  pelajar: {
    headers: ['NISN', 'Nama_Siswa', 'Kelas_Jurusan', 'Tahun_Ajaran', 'Golongan_Darah', 'Tanggal_Lahir', 'Foto_Siswa', 'Barcode_ID'],
    rows: [
      {
        id: 'pel-1',
        NISN: '0068492011',
        Nama_Siswa: 'Ahmad Faiz Fadlillah',
        Kelas_Jurusan: 'XII RPL 1',
        Tahun_Ajaran: '2025/2026',
        Golongan_Darah: 'O',
        Tanggal_Lahir: '14 Mei 2008',
        Foto_Siswa: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
        Barcode_ID: '0068492011'
      },
      {
        id: 'pel-2',
        NISN: '0071239845',
        Nama_Siswa: 'Annisa Rahmawati',
        Kelas_Jurusan: 'XII TKJ 2',
        Tahun_Ajaran: '2025/2026',
        Golongan_Darah: 'A',
        Tanggal_Lahir: '22 Des 2008',
        Foto_Siswa: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        Barcode_ID: '0071239845'
      },
      {
        id: 'pel-3',
        NISN: '0069921478',
        Nama_Siswa: 'Rizky Pratama Wijaya',
        Kelas_Jurusan: 'XI DKV 1',
        Tahun_Ajaran: '2025/2026',
        Golongan_Darah: 'B',
        Tanggal_Lahir: '09 Sep 2009',
        Foto_Siswa: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        Barcode_ID: '0069921478'
      },
      {
        id: 'pel-4',
        NISN: '0072345612',
        Nama_Siswa: 'Zahra Amelia Putri',
        Kelas_Jurusan: 'XII RPL 2',
        Tahun_Ajaran: '2025/2026',
        Golongan_Darah: 'AB',
        Tanggal_Lahir: '18 Jul 2008',
        Foto_Siswa: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        Barcode_ID: '0072345612'
      },
      {
        id: 'pel-5',
        NISN: '0067812903',
        Nama_Siswa: 'Muhammad Ilham',
        Kelas_Jurusan: 'XI TKJ 1',
        Tahun_Ajaran: '2025/2026',
        Golongan_Darah: 'O',
        Tanggal_Lahir: '03 Feb 2009',
        Foto_Siswa: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        Barcode_ID: '0067812903'
      },
      {
        id: 'pel-6',
        NISN: '0078912345',
        Nama_Siswa: 'Nadia Salsabila',
        Kelas_Jurusan: 'XII Multimedia',
        Tahun_Ajaran: '2025/2026',
        Golongan_Darah: 'A',
        Tanggal_Lahir: '30 Agu 2008',
        Foto_Siswa: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
        Barcode_ID: '0078912345'
      },
      {
        id: 'pel-7',
        NISN: '0065432198',
        Nama_Siswa: 'Daffa Arya Putra',
        Kelas_Jurusan: 'XI RPL 2',
        Tahun_Ajaran: '2025/2026',
        Golongan_Darah: 'B',
        Tanggal_Lahir: '11 Okt 2009',
        Foto_Siswa: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        Barcode_ID: '0065432198'
      },
      {
        id: 'pel-8',
        NISN: '0076543210',
        Nama_Siswa: 'Tiara Rahmadhani',
        Kelas_Jurusan: 'XII AKL 1',
        Tahun_Ajaran: '2025/2026',
        Golongan_Darah: 'O',
        Tanggal_Lahir: '25 Nov 2008',
        Foto_Siswa: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        Barcode_ID: '0076543210'
      },
      {
        id: 'pel-9',
        NISN: '0063214567',
        Nama_Siswa: 'Bagas Wahyu Pratama',
        Kelas_Jurusan: 'X RPL 1',
        Tahun_Ajaran: '2025/2026',
        Golongan_Darah: 'A',
        Tanggal_Lahir: '17 Jan 2010',
        Foto_Siswa: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
        Barcode_ID: '0063214567'
      },
      {
        id: 'pel-10',
        NISN: '0079876543',
        Nama_Siswa: 'Clara Bella Anggraini',
        Kelas_Jurusan: 'XI DKV 2',
        Tahun_Ajaran: '2025/2026',
        Golongan_Darah: 'AB',
        Tanggal_Lahir: '06 Apr 2009',
        Foto_Siswa: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        Barcode_ID: '0079876543'
      }
    ]
  },
  pegawai: {
    headers: ['NIP', 'Nama_Pegawai', 'Jabatan', 'Divisi', 'Email_Kantor', 'Akses_Level', 'Masa_Berlaku', 'Foto_Pegawai', 'QR_Pass'],
    rows: [
      {
        id: 'peg-1',
        NIP: 'EMP-9028-ID',
        Nama_Pegawai: 'Raden Arya Wibowo',
        Jabatan: 'Lead Cloud Architect',
        Divisi: 'DevOps & Reliability',
        Email_Kantor: 'arya.wibowo@nusantaratraining.id',
        Akses_Level: 'LEVEL 4 - RESTRICTED',
        Masa_Berlaku: 'DESEMBER 2028',
        Foto_Pegawai: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
        QR_Pass: 'GATE-ID-EMP9028-SECURE-LVL4'
      },
      {
        id: 'peg-2',
        NIP: 'EMP-9034-ID',
        Nama_Pegawai: 'Jessica Clarissa Tania',
        Jabatan: 'Principal Designer',
        Divisi: 'Product & UX',
        Email_Kantor: 'jessica.clarissa@nusantaratraining.id',
        Akses_Level: 'LEVEL 3 - ADVANCED',
        Masa_Berlaku: 'DESEMBER 2028',
        Foto_Pegawai: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        QR_Pass: 'GATE-ID-EMP9034-SECURE-LVL3'
      },
      {
        id: 'peg-3',
        NIP: 'EMP-9041-ID',
        Nama_Pegawai: 'Muhammad Dimas Saputra',
        Jabatan: 'Staff Fullstack Engineer',
        Divisi: 'Engineering Core',
        Email_Kantor: 'dimas.saputra@nusantaratraining.id',
        Akses_Level: 'LEVEL 3 - ADVANCED',
        Masa_Berlaku: 'DESEMBER 2028',
        Foto_Pegawai: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
        QR_Pass: 'GATE-ID-EMP9041-SECURE-LVL3'
      },
      {
        id: 'peg-4',
        NIP: 'EMP-9055-ID',
        Nama_Pegawai: 'Siti Aminah Putri',
        Jabatan: 'Head of Human Capital',
        Divisi: 'People & Operations',
        Email_Kantor: 'aminah.putri@nusantaratraining.id',
        Akses_Level: 'LEVEL 4 - RESTRICTED',
        Masa_Berlaku: 'DESEMBER 2028',
        Foto_Pegawai: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        QR_Pass: 'GATE-ID-EMP9055-SECURE-LVL4'
      },
      {
        id: 'peg-5',
        NIP: 'EMP-9062-ID',
        Nama_Pegawai: 'Bayu Wicaksono',
        Jabatan: 'Senior Backend Engineer',
        Divisi: 'Platform API',
        Email_Kantor: 'bayu.w@nusantaratraining.id',
        Akses_Level: 'LEVEL 3 - ADVANCED',
        Masa_Berlaku: 'DESEMBER 2028',
        Foto_Pegawai: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        QR_Pass: 'GATE-ID-EMP9062-SECURE-LVL3'
      },
      {
        id: 'peg-6',
        NIP: 'EMP-9078-ID',
        Nama_Pegawai: 'Maya Safira',
        Jabatan: 'Finance Director',
        Divisi: 'Finance & Accounting',
        Email_Kantor: 'maya.safira@nusantaratraining.id',
        Akses_Level: 'LEVEL 4 - RESTRICTED',
        Masa_Berlaku: 'DESEMBER 2028',
        Foto_Pegawai: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
        QR_Pass: 'GATE-ID-EMP9078-SECURE-LVL4'
      },
      {
        id: 'peg-7',
        NIP: 'EMP-9083-ID',
        Nama_Pegawai: 'Ferry Darmawan',
        Jabatan: 'Security Operations Lead',
        Divisi: 'Cybersecurity',
        Email_Kantor: 'ferry.d@nusantaratraining.id',
        Akses_Level: 'LEVEL 5 - TOP SECRET',
        Masa_Berlaku: 'DESEMBER 2028',
        Foto_Pegawai: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
        QR_Pass: 'GATE-ID-EMP9083-SECURE-LVL5'
      },
      {
        id: 'peg-8',
        NIP: 'EMP-9095-ID',
        Nama_Pegawai: 'Linda Permatasari',
        Jabatan: 'Product Marketing Manager',
        Divisi: 'Growth & Marketing',
        Email_Kantor: 'linda.p@nusantaratraining.id',
        Akses_Level: 'LEVEL 2 - STANDARD',
        Masa_Berlaku: 'DESEMBER 2028',
        Foto_Pegawai: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        QR_Pass: 'GATE-ID-EMP9095-SECURE-LVL2'
      },
      {
        id: 'peg-9',
        NIP: 'EMP-9102-ID',
        Nama_Pegawai: 'Eko Prasetyo',
        Jabatan: 'Database Administrator',
        Divisi: 'Data Platform',
        Email_Kantor: 'eko.prasetyo@nusantaratraining.id',
        Akses_Level: 'LEVEL 4 - RESTRICTED',
        Masa_Berlaku: 'DESEMBER 2028',
        Foto_Pegawai: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        QR_Pass: 'GATE-ID-EMP9102-SECURE-LVL4'
      },
      {
        id: 'peg-10',
        NIP: 'EMP-9114-ID',
        Nama_Pegawai: 'Dian Anggraini',
        Jabatan: 'Quality Assurance Lead',
        Divisi: 'Engineering Core',
        Email_Kantor: 'dian.a@nusantaratraining.id',
        Akses_Level: 'LEVEL 3 - ADVANCED',
        Masa_Berlaku: 'DESEMBER 2028',
        Foto_Pegawai: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80',
        QR_Pass: 'GATE-ID-EMP9114-SECURE-LVL3'
      }
    ]
  },
  developer: {
    headers: ['Dev_Handle', 'Full_Name', 'Primary_Role', 'Tech_Stack', 'PGP_Key_Fingerprint', 'Status', 'Avatar_URL', 'Web_URL'],
    rows: [
      {
        id: 'dev-1',
        Dev_Handle: '@alexander_code',
        Full_Name: 'Alexander Kevin',
        Primary_Role: 'Fullstack Platform Engineer',
        Tech_Stack: 'React / Next.js / Go / Kubernetes',
        PGP_Key_Fingerprint: '4F8A 9E21 C390 BA44 11FE',
        Status: 'CORE CONTRIBUTOR',
        Avatar_URL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        Web_URL: 'https://github.com/alexander_code'
      },
      {
        id: 'dev-2',
        Dev_Handle: '@sarah_dev',
        Full_Name: 'Sarah Amanda',
        Primary_Role: 'AI & Systems Researcher',
        Tech_Stack: 'Python / PyTorch / Rust / WASM',
        PGP_Key_Fingerprint: '98B2 110A 76DC 3381 FF02',
        Status: 'SYSTEM ARCHITECT',
        Avatar_URL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        Web_URL: 'https://github.com/sarah_dev'
      }
    ]
  }
};
