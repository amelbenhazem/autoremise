'use client'; 
import React from 'react';

// Définition de l'interface (types des props attendues par le composant)
interface DimensionsPanelProps {
  bgWidth: number;  // Largeur actuelle du document en POINTS (unité PDF)
  bgHeight: number; // Hauteur actuelle du document en POINTS (unité PDF)
  setBgWidth: (v: number) => void; // Fonction pour mettre à jour la largeur
  setBgHeight: (v: number) => void; // Fonction pour mettre à jour la hauteur
  onRecalculate: () => void; // Fonction déclenchée quand l'utilisateur clique sur "Recalculer la zone"
  onForceCmDimensions?: (width: number, height: number) => void; 
  // permet de forcer des dimensions en cm dans un parent
  // (utile pour recalculer ou synchroniser avec d'autres composants)
}

// Définition du composant DimensionsPanel
const DimensionsPanel: React.FC<DimensionsPanelProps> = ({
  bgWidth,
  bgHeight,
  setBgWidth,
  setBgHeight,
  onRecalculate,
  onForceCmDimensions
}) => {
  return (
    <div 
      style={{ marginBottom: '2%', backgroundColor: '#f3faff' }}
      className="bg-white border border-gray-200 p-6 rounded-2xl shadow-md w-full"
    >
      {/* Titre du panneau */}
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 text-center">
        Dimensions Réelles du Document
      </h2>

      {/* Bloc contenant les deux champs de saisie (Largeur + Hauteur) */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        
        {/* Champ Largeur (cm) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-gray-700 font-medium w-24 text-right">
            Largeur (cm)
          </label>

          <input
            type="number"
            min={1}
            // Conversion points → cm : 1 cm ≈ 28.3464567 points (standard PDF)
            value={(bgWidth / 28.3464567).toFixed(2)}
            onChange={(e) => {
              // Conversion de la saisie de l'utilisateur en cm → points
              const cmValue = parseFloat(e.target.value);
              const newWidth = cmValue * 28.3464567;

              // Mise à jour de l'état avec la nouvelle largeur en points
              setBgWidth(newWidth);

              // Si la fonction de callback existe, informer le parent
              if (onForceCmDimensions) {
                onForceCmDimensions(cmValue, bgHeight / 28.3464567);
              }
            }}
            className="border px-2 py-1 rounded w-full sm:w-24 text-center bg-white"
            style={{ color: 'black' }}
          />
        </div>

        {/* Champ Hauteur (cm) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-gray-700 font-medium w-24 text-right">
            Hauteur (cm)
          </label>

          <input
            type="number"
            min={1}
            value={(bgHeight / 28.3464567).toFixed(2)}
            onChange={(e) => {
              const cmValue = parseFloat(e.target.value);
              const newHeight = cmValue * 28.3464567;

              setBgHeight(newHeight);

              if (onForceCmDimensions) {
                onForceCmDimensions(bgWidth / 28.3464567, cmValue);
              }
            }}
            className="border px-2 py-1 rounded w-full sm:w-24 text-center bg-white"
            style={{ color: 'black', borderColor: 'black' }}
          />
        </div>
      </div>

      {/* Bouton pour recalculer la zone (par exemple, repositionner les éléments) */}
      <div className="flex justify-center mt-[2%]">
        <button
          onClick={onRecalculate}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow"
        >
          Recalculer la zone
        </button>
      </div>
    </div>
  );
};

export default DimensionsPanel;