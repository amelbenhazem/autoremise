'use client';
import React from 'react';
import ZoneBox from './ZoneBox';
import type { Zone } from '../../types/editor';

interface EditorCanvasProps {
  bgSrc: string | null;
  pdfPageImage: string | null;
  bgWidth: number;
  bgHeight: number;
  zones: Zone[];
  selectedZone: string | null;
  preview: boolean;
  firstRowByField: Record<string, string | undefined>;
  onUpdateZone: (id: string, data: Partial<Zone>) => void;
  onSelectZone: (id: string) => void;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({ bgSrc, pdfPageImage, bgWidth, bgHeight, zones, selectedZone, preview, firstRowByField, onUpdateZone, onSelectZone }) => {
  return (
    <div className="flex justify-center items-center mt-6">
      <div className="relative overflow-hidden border border-gray-200 shadow-lg" style={{ width: `${bgWidth}px`, height: `${bgHeight}px` }}>
        {(bgSrc || pdfPageImage) && (
          <img
            src={bgSrc || pdfPageImage || ''}
            alt="template background"
            style={{
              width: `${bgWidth}px`,
              height: `${bgHeight}px`,
              objectFit: 'fill', // 🔑 SIMPLE: fill pour correspondre exactement au PDF
              position: 'absolute',
              left: 0,
              top: 0,
              zIndex: 1,
            }}
          />
        )}
        {zones.map((zone) => (
          <ZoneBox
            key={zone.id}
            zone={zone}
            selected={selectedZone === zone.id}
            preview={preview}
            firstRowValue={firstRowByField[zone.field]}
            onUpdate={onUpdateZone}
            onSelect={onSelectZone}
          />
        ))}
      </div>
    </div>
  );
};

export default EditorCanvas;


