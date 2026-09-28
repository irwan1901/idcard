import { SheetRow } from '../types/card';

export const TARGET_SPREADSHEET_ID = '1pUG_Tn9MBJaZp_gFRoeG52zKaXSn1I5dIrOcUvshh_w';
export const TARGET_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit`;

const TOKEN_STORAGE_KEY = 'google_oauth_token';
const CLIENT_ID_STORAGE_KEY = 'google_oauth_client_id';

export interface OAuthSyncState {
  isAuthenticated: boolean;
  accessToken: string | null;
  expiresAt: number | null;
  isAutoSyncEnabled: boolean;
  lastSyncedTime: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage: string | null;
}

/**
 * Get stored access token from localStorage
 */
export function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }
    return parsed.token || null;
  } catch {
    return null;
  }
}

/**
 * Save access token to localStorage with expiration
 */
export function saveToken(token: string, expiresInSeconds: number = 3599) {
  try {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ token, expiresAt }));
  } catch (e) {
    console.warn('Failed to save token to localStorage:', e);
  }
}

/**
 * Remove stored access token
 */
export function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Get Google OAuth Client ID from env or localStorage
 */
export function getGoogleClientId(): string {
  const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
  if (envClientId) return envClientId.trim();
  return localStorage.getItem(CLIENT_ID_STORAGE_KEY) || '';
}

export function saveGoogleClientId(clientId: string) {
  localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId.trim());
}

/**
 * Request access token from Google Identity Services (GIS)
 */
export function requestGoogleAccessToken(
  onSuccess: (token: string) => void,
  onError: (err: any) => void,
  customClientId?: string
) {
  const clientId = customClientId || getGoogleClientId();

  if (!clientId) {
    onError(new Error('Google Client ID belum diatur. Silakan masukkan Google Client ID dari Google Cloud Console.'));
    return;
  }

  if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
    onError(new Error('Google Identity Services script belum selesai dimuat. Harap periksa koneksi internet Anda.'));
    return;
  }

  try {
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      prompt: 'consent',
      callback: (response: any) => {
        if (response.error) {
          onError(new Error(`Otentikasi Google gagal: ${response.error_description || response.error}`));
          return;
        }
        if (response.access_token) {
          saveToken(response.access_token, response.expires_in ? Number(response.expires_in) : 3599);
          onSuccess(response.access_token);
        } else {
          onError(new Error('Tidak ada access token yang diterima dari Google.'));
        }
      }
    });

    tokenClient.requestAccessToken();
  } catch (err: any) {
    onError(err);
  }
}

/**
 * Synchronize full dataset (headers + rows) to target Google Spreadsheet
 * using Google Sheets REST API v4
 */
export async function syncFullDatasetToGoogleSheet(
  spreadsheetId: string,
  headers: string[],
  rows: SheetRow[],
  accessToken: string
): Promise<{ updatedRows: number; updatedColumns: number }> {
  if (!spreadsheetId) {
    throw new Error('Spreadsheet ID target tidak boleh kosong.');
  }
  if (!accessToken) {
    throw new Error('Access token Google diperlukan untuk memperbarui spreadsheet.');
  }

  // Build 2D value array: row 0 is headers, row 1..N are member records
  const values: string[][] = [];
  values.push(headers);

  rows.forEach(r => {
    const rowValues = headers.map(h => (r[h] !== undefined && r[h] !== null ? String(r[h]) : ''));
    values.push(rowValues);
  });

  // Target range: e.g. Sheet1!A1:Z
  // First clear existing content so deleted rows are properly wiped
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:ZZ5000:clear`;
  try {
    await fetch(clearUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    console.warn('Could not clear range before writing:', e);
  }

  // Now write fresh updated values
  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1?valueInputOption=USER_ENTERED`;
  const response = await fetch(writeUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: 'A1',
      majorDimension: 'ROWS',
      values
    })
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      throw new Error('Sesi otentikasi Google telah kedaluwarsa. Silakan login ulang.');
    }
    if (response.status === 403) {
      throw new Error('Akses ditolak. Pastikan akun Google Anda memiliki hak edit pada spreadsheet target.');
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gagal menyimpan ke Google Sheets (Status ${response.status})`);
  }

  const result = await response.json();
  return {
    updatedRows: result.updatedRows || values.length,
    updatedColumns: result.updatedColumns || headers.length
  };
}

/**
 * Append a single member row to target Google Spreadsheet
 */
export async function appendRowToGoogleSheet(
  spreadsheetId: string,
  headers: string[],
  row: SheetRow,
  accessToken: string
): Promise<boolean> {
  const rowValues = headers.map(h => (row[h] !== undefined && row[h] !== null ? String(row[h]) : ''));
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      majorDimension: 'ROWS',
      values: [rowValues]
    })
  });

  if (!response.ok) {
    throw new Error(`Gagal menambahkan baris baru ke Google Sheets (Status ${response.status})`);
  }

  return true;
}

/**
 * Fetch data directly from target Google Spreadsheet using Google Sheets API v4
 */
export async function readFromGoogleSheetApi(
  spreadsheetId: string,
  accessToken: string
): Promise<{ headers: string[]; rows: SheetRow[] }> {
  const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:ZZ5000`;

  const response = await fetch(readUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Gagal membaca data dari spreadsheet (Status ${response.status})`);
  }

  const data = await response.json();
  const values: string[][] = data.values || [];

  if (values.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = values[0].map(String);
  const rows: SheetRow[] = [];

  for (let r = 1; r < values.length; r++) {
    const rowValues = values[r];
    if (!rowValues || rowValues.every(val => !val || String(val).trim() === '')) {
      continue;
    }
    const rowObj: SheetRow = { id: `gsheet-row-${r}` };
    headers.forEach((h, cIdx) => {
      rowObj[h] = rowValues[cIdx] !== undefined ? String(rowValues[cIdx]) : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}
