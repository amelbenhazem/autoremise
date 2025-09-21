'use client';
import React from 'react';
import { Rnd } from 'react-rnd';
import { calculateFontSizeFull } from '../../utils/editor';
import type { Zone } from '../../types/editor';

interface ZoneBoxProps {
  zone: Zone;
  selected: boolean;
  preview: boolean;
  firstRowValue: string | undefined;
  onUpdate: (id: string, data: Partial<Zone>) => void;
  onSelect: (id: string) => void;
}

export const ZoneBox: React.FC<ZoneBoxProps> = ({ zone, selected, preview, firstRowValue, onUpdate, onSelect }) => {
  const displayValue = (zone.optionValue ?? firstRowValue) || 'Aucune donnée';
  return (
    <Rnd
      key={zone.id}
      size={{ width: zone.width, height: zone.height }}
      position={{ x: zone.x, y: zone.y }}
      onDragStop={(_, d) => onUpdate(zone.id, { x: d.x, y: d.y })}
      onResizeStop={(_, __, ref, ___, pos) =>
        onUpdate(zone.id, {
          width: ref.offsetWidth,
          height: ref.offsetHeight,
          x: pos.x,
          y: pos.y,
        })
      }
      bounds="parent"
      style={{
        border: selected ? '3px solid #0070f3' : '3px solid #ff0000',
        background: 'rgba(255,255,255,0.9)',
        zIndex: 2,
      }}
      onClick={() => onSelect(zone.id)}
      disableDragging={preview}
      enableResizing={!preview}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: calculateFontSizeFull(String(displayValue), zone.width, zone.height),
          color: '#111',
          background: 'rgba(200,200,200,0.5)',
          borderRadius: 4,
          textAlign: 'center',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {displayValue || <span style={{ color: '#aaa' }}>Aucune donnée</span>}
      </div>
    </Rnd>
  );
};

export default ZoneBox;



