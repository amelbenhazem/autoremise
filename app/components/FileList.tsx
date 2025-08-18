import { motion } from "framer-motion";

interface FileListProps {
  files: File[];
  uploadProgress: number[];
}

export const FileList = ({ files, uploadProgress }: FileListProps) => {
  if (files.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 mb-4 sm:mb-6"
    >
      <h3 className="font-bold text-blue-900 mb-2 text-base sm:text-lg">
        Fichier uploadé
      </h3>
      {files.map((file, idx) => (
        <div 
          key={file.name} 
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2 sm:gap-0"
        >
          <div>
            <span className="font-medium text-sm sm:text-base">{file.name}</span>
            <span className="text-xs text-gray-400 ml-2">
              ({(file.size/1024/1024).toFixed(2)} Mo)
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-2 bg-blue-400 rounded-full transition-all"
                style={{ width: `${uploadProgress[idx] || 100}%` }}
              />
            </div>
            {typeof uploadProgress[idx] === "number" && (
              <span className="text-blue-900 text-xs sm:text-sm font-bold ml-2">
                {uploadProgress[idx]}%
              </span>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
};
