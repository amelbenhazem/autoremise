'use client';
import React from 'react';
import ZoneBox from './ZoneBox';
import type { Zone } from '../../types/editor';

/**
 * EditorCanvasProps
 * Composant qui affiche le canevas d'édition :
 * - Un fond (image importée ou rendu de page PDF)
 * - Un ensemble de zones (ZoneBox) positionnées au-dessus du fond
 */
interface EditorCanvasProps {
  bgSrc: string | null; // Chemin/URL de l'image de fond (ex: formulaire scanné)
  pdfPageImage: string | null; // Sinon rendu de la page PDF sous forme d'image
  bgWidth: number; // largeur du fond en pixels (ou unités utilisées par ton app)
  bgHeight: number; // hauteur du fond en pixels
  zones: Zone[]; // liste des zones à afficher (avec position, taille, champ, etc.)
  selectedZone: string | null; // id de la zone actuellement sélectionnée
  preview: boolean; // si true : mode aperçu (lecture seule)
  firstRowByField: Record<string, string | undefined>; // valeurs d'aperçu par champ
  onUpdateZone: (id: string, data: Partial<Zone>) => void; // callback pour modifier une zone
  onSelectZone: (id: string) => void; // callback quand une zone est sélectionnée
}

/**
 * EditorCanvas
 * -------------
 * Rend le canevas avec l'image de fond et les ZoneBox.
 * Chaque ZoneBox est positionnée absolument sur le conteneur.
 */
const EditorCanvas: React.FC<EditorCanvasProps> = ({
  bgSrc,
  pdfPageImage,
  bgWidth,
  bgHeight,
  zones,
  selectedZone,
  preview,
  firstRowByField,
  onUpdateZone,
  onSelectZone,
}) => {
  return (
    // Conteneur centré horizontalement et verticalement (espace autour)
    <div className="flex justify-center items-center mt-6">
      {}
      <div
        className="relative overflow-hidden border border-gray-200 shadow-lg"
        style={{ width: `${bgWidth}px`, height: `${bgHeight}px` }}
      >
        {}
        {(bgSrc || pdfPageImage) && (
          <img
            src={bgSrc || pdfPageImage || ''}
            alt="template background"
            style={{
              width: `${bgWidth}px`,
              height: `${bgHeight}px`,
              objectFit: 'fill', // Simple : 'fill' pour correspondre exactement au PDF
              position: 'absolute',
              left: 0,
              top: 0,
              zIndex: 1,
            }}
          />
        )}

        {
        }
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
