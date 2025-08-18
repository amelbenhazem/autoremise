import { motion } from "framer-motion";
import { RefObject } from "react";

interface UploadZoneProps {
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onClick: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
}

export const UploadZone = ({ onDrop, onDragOver, onClick, onChange, fileInputRef }: UploadZoneProps) => {
  // Handlers locaux avec débogage
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('🖱️ Drop event triggered');
    e.preventDefault();
    e.stopPropagation();
    onDrop(e);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('🖱️ DragOver event triggered');
    e.preventDefault();
    e.stopPropagation();
    onDragOver(e);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('🖱️ DragEnter event triggered');
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClick = () => {
    console.log('🖱️ Click event triggered');
    onClick();
  };

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -40, opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 sm:mb-8"
    >
      <div
        className="border-4 border-dashed border-blue-400 rounded-xl sm:rounded-2xl bg-white flex flex-col items-center justify-center py-10 sm:py-16 cursor-pointer transition-shadow hover:shadow-xl"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onClick={handleClick}
        style={{ userSelect: 'none' }}
      >
        <div className="text-4xl sm:text-5xl text-blue-400 mb-4">+</div>
        <p className="text-lg sm:text-xl text-gray-700">Glissez-déposez ici</p>
        <p className="text-xs sm:text-sm text-gray-400">Fichiers Excel uniquement</p>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept=".xlsx,.xls" 
          className="hidden" 
          onChange={onChange}
        />
      </div>
    </motion.div>
  );
};
