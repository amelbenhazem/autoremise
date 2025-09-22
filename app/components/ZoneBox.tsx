'use client';
import React from 'react';
import { Rnd } from 'react-rnd'; // Librairie pour rendre les divs redimensionnables et déplaçables
import { calculateFontSizeFull } from '../../utils/editor'; //  Fonction pour adapter la taille du texte à la zone
import type { Zone } from '../../types/editor';

//  Définition des props attendues par ZoneBox
interface ZoneBoxProps {
  zone: Zone; // Objet contenant les coordonnées et dimensions de la zone
  selected: boolean; // Indique si la zone est sélectionnée
  preview: boolean; // Indique si l'on est en mode preview (pas de modification)
  firstRowValue: string | undefined; // Valeur par défaut provenant de la première ligne Excel
  onUpdate: (id: string, data: Partial<Zone>) => void; // Callback lors d'un déplacement ou redimensionnement
  onSelect: (id: string) => void; // Callback lorsqu'on sélectionne la zone
}

export const ZoneBox: React.FC<ZoneBoxProps> = ({ zone, selected, preview, firstRowValue, onUpdate, onSelect }) => {
  //  Valeur à afficher dans la zone : priorité à optionValue, sinon première ligne Excel, sinon message par défaut
  const displayValue = (zone.optionValue ?? firstRowValue) || 'Aucune donnée';

  return (
    <Rnd
      key={zone.id}
      size={{ width: zone.width, height: zone.height }} //Largeur et hauteur initiales
      position={{ x: zone.x, y: zone.y }} // Position initiale
      onDragStop={(_, d) => onUpdate(zone.id, { x: d.x, y: d.y })} //  Mise à jour des coordonnées après drag
      onResizeStop={(_, __, ref, ___, pos) =>
        onUpdate(zone.id, {
          width: ref.offsetWidth, //  Nouvelle largeur
          height: ref.offsetHeight, //  Nouvelle hauteur
          x: pos.x, //  Nouvelle position x
          y: pos.y, //  Nouvelle position y
        })
      }
      bounds="parent" // Limite la zone dans le parent
      style={{
        border: selected ? '3px solid #0070f3' : '3px solid #ff0000', //  Couleur selon sélection
        background: 'rgba(255,255,255,0.9)', //  Fond semi-transparent
        zIndex: 2, //  Assure que la zone reste au-dessus du background
      }}
      onClick={() => onSelect(zone.id)} //  Sélection de la zone au clic
      disableDragging={preview} //  Désactive le drag en mode preview
      enableResizing={!preview} //  Désactive le redimensionnement en mode preview
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: calculateFontSizeFull(String(displayValue), zone.width, zone.height), //  Taille dynamique du texte
          color: '#111',
          background: 'rgba(200,200,200,0.5)', //  Fond semi-transparent de la zone
          borderRadius: 4,
          textAlign: 'center',
          padding: 0,
          overflow: 'hidden', //  Évite que le texte dépasse de la zone
        }}
      >
        {displayValue || <span style={{ color: '#aaa' }}>Aucune donnée</span>} 
        {/* 🔹 Affiche le texte ou un placeholder si vide */}
      </div>
    </Rnd>
  );
};

export default ZoneBox;
