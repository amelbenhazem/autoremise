import { motion } from "framer-motion";
import { RefObject } from "react";

// Définition des props attendues par le composant
interface UploadZoneProps {
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void; // Callback lors du drop de fichiers
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void; // Callback pendant le drag over
  onClick: () => void; // Callback lorsqu'on clique sur la zone
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // Callback quand un fichier est sélectionné via input
  fileInputRef: RefObject<HTMLInputElement | null>; // Référence pour déclencher l'input caché
}

export const UploadZone = ({ onDrop, onDragOver, onClick, onChange, fileInputRef }: UploadZoneProps) => {
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop(e);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOver(e);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClick = () => {
    onClick();
  };

  return (
    <motion.div
      //  Animation Framer Motion pour l'apparition/disparition
      initial={{ y: 40, opacity: 0 }}  // Commence en bas et transparent
      animate={{ y: 0, opacity: 1 }}   // Monte à sa position et devient visible
      exit={{ y: -40, opacity: 0 }}    // Sort vers le haut et disparaît
      transition={{ duration: 0.5 }}
      className="mb-6 sm:mb-8"
    >
      <div
        // Zone de drop stylisée
        className="border-4 border-dashed border-blue-400 rounded-xl sm:rounded-2xl bg-white flex flex-col items-center justify-center py-10 sm:py-16 cursor-pointer transition-shadow hover:shadow-xl"
        onDrop={handleDrop}       // Gestion du drop
        onDragOver={handleDragOver} // Gestion du drag over
        onDragEnter={handleDragEnter} // Gestion du drag enter
        onClick={handleClick}        // Gestion du clic pour ouvrir l'input
        style={{ userSelect: 'none' }} // Empêche la sélection de texte
      >
        {/* Icône + pour indiquer la zone */}
        <div className="text-4xl sm:text-5xl text-blue-400 mb-4">+</div>

        {/* Instructions */}
        <p className="text-lg sm:text-xl text-gray-700">Glissez-déposez ici</p>
        <p className="text-xs sm:text-sm text-gray-400">Fichiers Excel uniquement</p>

        {/* Input caché pour sélectionner manuellement un fichier */}
        <input 
          ref={fileInputRef} 
          type="file" 
          accept=".xlsx,.xls"  // Limite aux fichiers Excel
          className="hidden"   // Caché, déclenché par le clic sur la zone
          onChange={onChange}  // Callback quand un fichier est choisi
        />
      </div>
    </motion.div>
  );
};
