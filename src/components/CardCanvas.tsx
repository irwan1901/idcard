import React, { useRef, useState, useEffect } from 'react';
import { CardElement, CardSideDesign, CardOrientation, SheetRow } from '../types/card';
import { CardElementRenderer } from './CardElementRenderer';
import { Move, Lock, Eye, Trash2 } from 'lucide-react';

interface CardCanvasProps {
  sideDesign: CardSideDesign;
  orientation: CardOrientation;
  dimensions: { width: number; height: number };
  activeRow?: Partial<SheetRow> | Record<string, any>;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElementPosition: (id: string, x: number, y: number) => void;
  onUpdateElementSize?: (id: string, width: number, height: number) => void;
  snapToGrid?: boolean;
  zoom?: number;
  innerRef?: React.Ref<HTMLDivElement>;
  readOnly?: boolean;
}

export const CardCanvas: React.FC<CardCanvasProps> = ({
  sideDesign,
  orientation,
  dimensions,
  activeRow = {},
  selectedElementId,
  onSelectElement,
  onUpdateElementPosition,
  snapToGrid = false,
  zoom = 1,
  innerRef,
  readOnly = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ startX: number; startY: number; elemStartX: number; elemStartY: number } | null>(null);

  // Background style computation
  const getBackgroundStyle = (): React.CSSProperties => {
    const bg = sideDesign.background;
    if (bg.type === 'color') {
      return { backgroundColor: bg.color || '#0f172a' };
    }
    if (bg.type === 'gradient' && bg.gradient) {
      return {
        background: `linear-gradient(${bg.gradient.direction === 'to-b' ? '180deg' : bg.gradient.direction === 'to-br' ? '135deg' : '90deg'}, ${bg.gradient.from}, ${bg.gradient.to})`
      };
    }
    if (bg.type === 'image' && bg.imageUrl) {
      return {
        backgroundImage: `url(${bg.imageUrl})`,
        backgroundSize: bg.imageFit === 'contain' ? 'contain' : bg.imageFit === 'fill' ? '100% 100%' : 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: bg.color || '#0f172a'
      };
    }
    return { backgroundColor: '#0f172a' };
  };

  // Keyboard navigation for precision nudge
  useEffect(() => {
    if (readOnly || !selectedElementId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const elem = sideDesign.elements.find(el => el.id === selectedElementId);
      if (!elem || elem.locked) return;

      const step = e.shiftKey ? 2 : 0.5;
      let newX = elem.x;
      let newY = elem.y;

      if (e.key === 'ArrowLeft') {
        newX = Math.max(0, elem.x - step);
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        newX = Math.min(100 - elem.width, elem.x + step);
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        newY = Math.max(0, elem.y - step);
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        newY = Math.min(100 - elem.height, elem.y + step);
        e.preventDefault();
      }

      if (newX !== elem.x || newY !== elem.y) {
        onUpdateElementPosition(elem.id, newX, newY);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, sideDesign.elements, readOnly, onUpdateElementPosition]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent, element: CardElement) => {
    if (readOnly || element.locked) return;
    e.stopPropagation();
    onSelectElement(element.id);

    setIsDragging(true);
    setDragOffset({
      startX: e.clientX,
      startY: e.clientY,
      elemStartX: element.x,
      elemStartY: element.y
    });
  };

  useEffect(() => {
    if (!isDragging || !dragOffset || !selectedElementId) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      // Convert pixel delta to percentage
      const deltaXPercent = ((e.clientX - dragOffset.startX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - dragOffset.startY) / rect.height) * 100;

      let nextX = dragOffset.elemStartX + deltaXPercent;
      let nextY = dragOffset.elemStartY + deltaYPercent;

      if (snapToGrid) {
        nextX = Math.round(nextX / 2) * 2;
        nextY = Math.round(nextY / 2) * 2;
      }

      // Constrain inside card
      const elem = sideDesign.elements.find(el => el.id === selectedElementId);
      const elemWidth = elem?.width || 10;
      const elemHeight = elem?.height || 5;

      nextX = Math.max(0, Math.min(100 - elemWidth, Number(nextX.toFixed(2))));
      nextY = Math.max(0, Math.min(100 - elemHeight, Number(nextY.toFixed(2))));

      onUpdateElementPosition(selectedElementId, nextX, nextY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragOffset(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, selectedElementId, snapToGrid, sideDesign.elements, onUpdateElementPosition]);

  const width = orientation === 'landscape' ? dimensions.width : dimensions.height;
  const height = orientation === 'landscape' ? dimensions.height : dimensions.width;

  return (
    <div
      className="relative select-none shrink-0"
      style={{
        width: `${width * zoom}px`,
        height: `${height * zoom}px`
      }}
      onClick={() => onSelectElement(null)}
    >
      {/* Outer Card Wrapper scaled by zoom */}
      <div
        ref={innerRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${zoom})`,
          transformOrigin: '0 0'
        }}
        className="transition-transform duration-150 ease-out absolute top-0 left-0"
      >
        <div
          ref={containerRef}
          style={{
            ...getBackgroundStyle(),
            width: '100%',
            height: '100%',
            borderRadius: '16px'
          }}
          className="relative overflow-hidden shadow-2xl border border-white/10"
        >
          {/* Custom Uploaded Background Overlay / Tint */}
          {sideDesign.background.type === 'image' && (sideDesign.background.overlayOpacity ?? 0) > 0 && (
            <div
              className="absolute inset-0 pointer-events-none rounded-[16px]"
              style={{
                backgroundColor: sideDesign.background.overlayColor || '#000000',
                opacity: sideDesign.background.overlayOpacity || 0.3
              }}
            />
          )}

          {/* Subtle Security / Pattern Overlays */}
          {sideDesign.background.pattern === 'dots' && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
                opacity: sideDesign.background.patternOpacity ?? 0.15
              }}
            />
          )}

          {sideDesign.background.pattern === 'grid' && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                opacity: sideDesign.background.patternOpacity ?? 0.15
              }}
            />
          )}

          {sideDesign.background.pattern === 'security' && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 8px)',
                opacity: sideDesign.background.patternOpacity ?? 0.2
              }}
            />
          )}

          {/* Glossy Card Sheen Effect */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-white/10 rounded-[16px]" />

          {/* Render Elements */}
          {sideDesign.elements.map(element => {
            const isSelected = selectedElementId === element.id;

            return (
              <div
                key={element.id}
                onMouseDown={e => handleMouseDown(e, element)}
                style={{
                  position: 'absolute',
                  left: `${element.x}%`,
                  top: `${element.y}%`,
                  width: `${element.width}%`,
                  height: `${element.height}%`,
                  zIndex: element.zIndex || 1,
                  transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined
                }}
                className={`group cursor-pointer ${
                  !readOnly && isSelected
                    ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-transparent shadow-lg rounded'
                    : !readOnly
                    ? 'hover:ring-1 hover:ring-indigo-300/40 rounded'
                    : ''
                }`}
              >
                {/* Element Component */}
                <CardElementRenderer
                  element={element}
                  activeRow={activeRow}
                  isSelected={isSelected}
                />

                {/* Selected Controls Overlay */}
                {!readOnly && isSelected && !element.locked && (
                  <div className="absolute -top-6 left-0 bg-indigo-600 text-white text-[9px] font-medium px-1.5 py-0.5 rounded shadow flex items-center gap-1 pointer-events-none whitespace-nowrap z-50">
                    <Move className="w-2.5 h-2.5" />
                    <span>{element.name} ({Math.round(element.x)}%, {Math.round(element.y)}%)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
