'use client';
import React from 'react';

interface RecalculatePopupProps {
  visible: boolean;
  onClose: () => void;
}

const RecalculatePopup: React.FC<RecalculatePopupProps> = ({ visible, onClose }) => {
  if (!visible) return null;
  return (
    <div className="relative bg-white rounded-xl p-4 shadow-lg text-center mx-auto mt-4 max-w-md">
      <h3 className="text-yellow-600 font-bold text-lg mb-2"> Recalcul effectué !</h3>
      <p>La zone a été recalculée selon les dimensions données.</p>
      <button className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg" onClick={onClose}>
        Fermer
      </button>
    </div>
  );
};

export default RecalculatePopup;


