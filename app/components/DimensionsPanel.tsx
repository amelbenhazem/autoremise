'use client';
import React from 'react';

interface DimensionsPanelProps {
  bgWidth: number;
  bgHeight: number;
  setBgWidth: (v: number) => void;
  setBgHeight: (v: number) => void;
  onRecalculate: () => void;
  onForceCmDimensions?: (width: number, height: number) => void;
}

const DimensionsPanel: React.FC<DimensionsPanelProps> = ({ bgWidth, bgHeight, setBgWidth, setBgHeight, onRecalculate, onForceCmDimensions }) => {
  return (
    <div style={{ marginBottom: '2%', backgroundColor: '#f3faff' }} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-md w-full">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 text-center">Dimensions Réelles du Document</h2>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-gray-700 font-medium w-24 text-right">Largeur (cm)</label>
          <input
            type="number"
            min={1}
            value={(bgWidth / 28.3464567).toFixed(2)}
            onChange={(e) => {
              const cmValue = parseFloat(e.target.value);
              const newWidth = cmValue * 28.3464567;
              setBgWidth(newWidth);
              console.log('Largeur saisie en cm :', cmValue, '-> points :', newWidth);
              
              // 🔑 Forcer les dimensions en cm si la fonction est fournie
              if (onForceCmDimensions) {
                onForceCmDimensions(cmValue, bgHeight / 28.3464567);
              }
            }}
            className="border px-2 py-1 rounded w-full sm:w-24 text-center bg-white"
            style={{ color: 'black' }}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-gray-700 font-medium w-24 text-right">Hauteur (cm)</label>
          <input
            type="number"
            min={1}
            value={(bgHeight / 28.3464567).toFixed(2)}
            onChange={(e) => {
              const cmValue = parseFloat(e.target.value);
              const newHeight = cmValue * 28.3464567;
              setBgHeight(newHeight);
              console.log('Hauteur saisie en cm :', cmValue, '-> points :', newHeight);
              
              // 🔑 Forcer les dimensions en cm si la fonction est fournie
              if (onForceCmDimensions) {
                onForceCmDimensions(bgWidth / 28.3464567, cmValue);
              }
            }}
            className="border px-2 py-1 rounded w-full sm:w-24 text-center bg-white"
            style={{ color: 'black', borderColor: 'black' }}
          />
        </div>
      </div>

      <div className="flex justify-center mt-[2%]">
        <button onClick={onRecalculate} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow">
          Recalculer la zone
        </button>
      </div>
    </div>
  );
};

export default DimensionsPanel;


