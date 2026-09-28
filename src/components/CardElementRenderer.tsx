import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { CardElement, SheetRow } from '../types/card';
import { ShieldCheck, Award, Building2, School, Cpu, Sparkles } from 'lucide-react';

interface CardElementRendererProps {
  element: CardElement;
  activeRow?: Record<string, any>;
  isSelected?: boolean;
}

export const CardElementRenderer: React.FC<CardElementRendererProps> = ({
  element,
  activeRow = {},
  isSelected = false
}) => {
  // Resolve dynamic value if dynamicField is set
  const resolveValue = (rawText?: string, fieldName?: string): string => {
    const row = activeRow || {};
    if (fieldName && row[fieldName] !== undefined && row[fieldName] !== null) {
      return String(row[fieldName]);
    }
    if (rawText) {
      // Also support {{var}} syntax inside raw text
      return rawText.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
        const trimmed = key.trim();
        return row[trimmed] !== undefined && row[trimmed] !== null ? String(row[trimmed]) : `{{${trimmed}}}`;
      });
    }
    return '';
  };

  switch (element.type) {
    case 'text': {
      const displayValue = resolveValue(element.text, element.dynamicField);
      return (
        <div
          className="w-full h-full flex flex-col justify-center leading-tight select-none overflow-hidden"
          style={{
            fontFamily: element.fontFamily || 'Plus Jakarta Sans',
            fontSize: `${element.fontSize || 12}px`,
            fontWeight: element.fontWeight || '400',
            color: element.color || '#ffffff',
            textAlign: element.textAlign || 'left',
            letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
            textTransform: element.textTransform || 'none',
            backgroundColor: element.backgroundColor || 'transparent',
            borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
            padding: element.padding ? `${element.padding}px` : undefined,
            whiteSpace: 'pre-line'
          }}
        >
          {displayValue}
        </div>
      );
    }

    case 'photo': {
      const photoSrc = resolveValue(element.photoUrl, element.dynamicField) || 
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
      
      const shapeClass = element.photoShape === 'circle' 
        ? 'rounded-full' 
        : element.photoShape === 'square' 
        ? 'rounded-none' 
        : 'rounded-xl';

      return (
        <div 
          className={`w-full h-full relative overflow-hidden bg-slate-800 ${shapeClass}`}
          style={{
            borderWidth: `${element.borderWidth ?? 2}px`,
            borderStyle: 'solid',
            borderColor: element.borderColor || '#6366f1',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          <img
            src={photoSrc}
            alt="Card Avatar"
            crossOrigin="anonymous"
            className="w-full h-full object-cover object-center pointer-events-none"
            onError={(e) => {
              // Fallback to avatar placeholder
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
            }}
          />
        </div>
      );
    }

    case 'qr': {
      const qrValue = resolveValue(element.codeData, element.dynamicField) || 'https://kartuid.app';
      return <QrCodeComponent value={qrValue} />;
    }

    case 'barcode': {
      const barcodeValue = resolveValue(element.codeData, element.dynamicField) || '1234567890';
      return <BarcodeComponent value={barcodeValue} format={element.barcodeFormat} includeText={element.includeBarcodeText} />;
    }

    case 'chip': {
      return (
        <div className="w-full h-full rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1.5px] shadow-sm select-none">
          <div className="w-full h-full rounded-[4px] bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 relative flex items-center justify-center overflow-hidden border border-amber-600/40">
            {/* Chip contact traces */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 gap-[1.5px] p-[2px] opacity-70">
              <div className="border-r border-b border-amber-700/60"></div>
              <div className="border-b border-amber-700/60"></div>
              <div className="border-r border-b border-amber-700/60"></div>
              <div className="border-b border-amber-700/60"></div>
              <div className="border-r border-amber-700/60"></div>
              <div></div>
            </div>
            {/* Center contact pad */}
            <div className="w-2.5 h-3 border border-amber-800/70 rounded-sm bg-amber-400/80 z-10"></div>
          </div>
        </div>
      );
    }

    case 'hologram': {
      return (
        <div className="w-full h-full rounded-lg relative overflow-hidden shadow-sm select-none border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-yellow-400 via-cyan-400 to-emerald-400 opacity-80 mix-blend-screen animate-pulse"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/40 via-transparent to-black/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white/90 drop-shadow" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[6.5px] font-bold text-white/80 tracking-widest uppercase font-mono-code">
              GENUINE
            </span>
          </div>
        </div>
      );
    }

    case 'badge': {
      const badgeText = resolveValue(element.badgeText, element.dynamicField) || 'STATUS';
      return (
        <div
          className="w-full h-full flex items-center justify-center rounded-full text-center px-2 select-none shadow-xs font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: element.badgeBgColor || '#4f46e5',
            color: element.badgeTextColor || '#ffffff',
            fontSize: '9px',
            fontFamily: 'Plus Jakarta Sans'
          }}
        >
          {badgeText}
        </div>
      );
    }

    case 'logo': {
      if (element.imageUrl) {
        return (
          <div className="w-full h-full flex items-center justify-center select-none overflow-hidden">
            <img
              src={element.imageUrl}
              alt={element.name || 'Uploaded Logo'}
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
        );
      }
      // Default emblem or logo vector
      return (
        <div className="w-full h-full flex items-center justify-center select-none text-emerald-400">
          <div className="w-full h-full rounded-full bg-emerald-500/10 border border-emerald-400/40 p-1 flex items-center justify-center">
            <Building2 className="w-full h-full text-emerald-300 drop-shadow" />
          </div>
        </div>
      );
    }

    case 'stamp': {
      const stampText = element.stampText || 'OFFICIAL STAMP';
      const color = element.stampColor || '#dc2626';
      return (
        <div 
          className="w-full h-full rounded-full border-2 border-dashed flex flex-col items-center justify-center p-1 select-none transform -rotate-12 opacity-85"
          style={{ borderColor: color, color: color }}
        >
          <div className="w-full h-full rounded-full border border-solid flex flex-col items-center justify-center p-1 text-center" style={{ borderColor: color }}>
            <Award className="w-3.5 h-3.5 mb-0.5" />
            <span className="text-[6.5px] font-black uppercase tracking-tighter leading-none">
              {stampText}
            </span>
            <span className="text-[5.5px] font-semibold mt-0.5 tracking-widest">
              VALIDATED
            </span>
          </div>
        </div>
      );
    }

    case 'signature': {
      return (
        <div className="w-full h-full flex flex-col justify-end items-center text-center select-none">
          {/* Simulated realistic signature cursive SVG */}
          <svg viewBox="0 0 160 50" className="w-28 h-8 text-sky-200 stroke-current fill-none opacity-90">
            <path
              d="M 10 35 Q 30 5, 50 25 T 90 20 T 120 30 Q 140 10, 155 35 M 40 30 L 130 32"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="w-full border-b border-slate-400/50 my-0.5"></div>
          {element.signerName && (
            <div className="text-[8px] font-bold text-slate-200 leading-none">
              {element.signerName}
            </div>
          )}
          {element.signerTitle && (
            <div className="text-[7px] text-slate-400 leading-none mt-0.5">
              {element.signerTitle}
            </div>
          )}
        </div>
      );
    }

    case 'shape': {
      if (element.shapeType === 'line') {
        return (
          <div 
            className="w-full h-full select-none"
            style={{ backgroundColor: element.fillColor || '#ffffff', opacity: element.opacity ?? 1 }}
          />
        );
      }
      return (
        <div 
          className={`w-full h-full select-none ${element.shapeType === 'circle' ? 'rounded-full' : 'rounded-sm'}`}
          style={{ backgroundColor: element.fillColor || '#ffffff', opacity: element.opacity ?? 1 }}
        />
      );
    }

    case 'slot': {
      return (
        <div className="w-full h-full rounded-full bg-slate-950/80 border border-slate-700/60 shadow-inner flex items-center justify-center select-none">
          <div className="w-2/3 h-1/2 rounded-full bg-slate-900/90 shadow-inner"></div>
        </div>
      );
    }

    default:
      return null;
  }
};

/**
 * QR Code component using qrcode library
 */
const QrCodeComponent: React.FC<{ value: string }> = ({ value }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(value || 'https://kartuid.app', {
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M',
      width: 256
    })
      .then(url => {
        if (isMounted) setDataUrl(url);
      })
      .catch(err => console.error(err));

    return () => {
      isMounted = false;
    };
  }, [value]);

  return (
    <div className="w-full h-full p-1 bg-white rounded-md shadow-sm overflow-hidden flex items-center justify-center">
      {dataUrl ? (
        <img src={dataUrl} alt="QR Code" className="w-full h-full object-contain pointer-events-none" />
      ) : (
        <div className="w-full h-full bg-slate-200 animate-pulse rounded" />
      )}
    </div>
  );
};

/**
 * Barcode component using JsBarcode SVG rendering
 */
const BarcodeComponent: React.FC<{
  value: string;
  format?: string;
  includeText?: boolean;
}> = ({ value, format = 'CODE128', includeText = true }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: format as any,
          lineColor: '#000000',
          width: 1.5,
          height: 38,
          displayValue: includeText,
          fontSize: 10,
          margin: 4,
          background: '#ffffff',
          font: 'Fira Code'
        });
      } catch (e) {
        console.warn('Barcode generation fallback:', e);
      }
    }
  }, [value, format, includeText]);

  return (
    <div className="w-full h-full bg-white rounded-md p-1 flex items-center justify-center shadow-xs overflow-hidden">
      <svg ref={svgRef} className="w-full h-full object-contain pointer-events-none" />
    </div>
  );
};
