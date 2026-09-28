export type CardOrientation = 'landscape' | 'portrait';

export type ElementType = 
  | 'text' 
  | 'photo' 
  | 'qr' 
  | 'barcode' 
  | 'chip' 
  | 'hologram' 
  | 'badge' 
  | 'logo' 
  | 'signature' 
  | 'stamp' 
  | 'shape' 
  | 'slot';

export interface CardElement {
  id: string;
  type: ElementType;
  name: string;
  x: number; // percentage (0-100) or px in canvas coordinate
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex: number;
  
  // Text specific
  text?: string;
  dynamicField?: string; // e.g. "nama", "nik", "jabatan" from Google Sheet
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'capitalize' | 'lowercase';
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  prefix?: string;
  suffix?: string;
  
  // Photo specific
  photoUrl?: string;
  photoShape?: 'circle' | 'rounded' | 'square';
  borderColor?: string;
  borderWidth?: number;
  boxShadow?: string;
  
  // QR & Barcode specific
  codeData?: string;
  qrErrorCorrection?: 'L' | 'M' | 'Q' | 'H';
  barcodeFormat?: 'CODE128' | 'EAN13' | 'UPC';
  includeBarcodeText?: boolean;
  
  // Badge specific
  badgeText?: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
  
  // Shape / Divider
  shapeType?: 'rectangle' | 'circle' | 'line';
  fillColor?: string;
  opacity?: number;
  
  // Signature / Stamp
  signerName?: string;
  signerTitle?: string;
  stampText?: string;
  stampColor?: string;
  
  // Custom uploaded image or logo
  imageUrl?: string;

  // Locked
  locked?: boolean;
}

export interface CardBackground {
  type: 'color' | 'gradient' | 'pattern' | 'image';
  color?: string;
  gradient?: {
    from: string;
    to: string;
    direction: string; // e.g. 'to-r', 'to-br'
  };
  pattern?: 'dots' | 'grid' | 'waves' | 'security' | 'none';
  patternOpacity?: number;
  imageUrl?: string;
  imageFit?: 'cover' | 'contain' | 'fill';
  imageOpacity?: number;
  overlayColor?: string;
  overlayOpacity?: number;
}

export interface CardSideDesign {
  background: CardBackground;
  elements: CardElement[];
  hasLanyardSlot?: boolean;
}

export interface CardTemplate {
  id: string;
  name: string;
  category: 'koperasi' | 'pelajar' | 'pegawai' | 'developer' | 'custom';
  description: string;
  orientation: CardOrientation;
  dimensions: {
    width: number; // standard CR80 in px (e.g. 640 x 400 for landscape)
    height: number;
  };
  front: CardSideDesign;
  back: CardSideDesign;
  fieldMappings: Record<string, string>; // Maps variable name (e.g. 'nama') to Google Sheet column
}

export interface SheetRow {
  id: string;
  [key: string]: string | undefined;
}

export interface GoogleSheetConfig {
  sheetUrl: string;
  sheetId: string;
  sheetName: string;
  lastSynced?: string;
  isConnected: boolean;
  headers: string[];
  rows: SheetRow[];
}
