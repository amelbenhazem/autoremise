import { useState } from "react";

export const DragDropTest = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    setDroppedFiles(files);
    
    console.log('🧪 Test: Files dropped:', files);
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-bold mb-4">🧪 Test Drag & Drop</h3>
      
      <div
        className={`border-2 border-dashed p-8 text-center transition-colors ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 bg-white'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="text-lg">
          {isDragOver ? '🖱️ Déposez ici !' : '🖱️ Glissez un fichier ici'}
        </p>
      </div>

      {droppedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Fichiers déposés :</h4>
          <ul className="space-y-1">
            {droppedFiles.map((file, index) => (
              <li key={index} className="text-sm">
                📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
