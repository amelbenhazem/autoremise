import { motion } from "framer-motion"; // Pour les animations d'apparition (fade + slide)

interface FileListProps {
  files: File[];              // Liste des fichiers sélectionnés ou uploadés
  uploadProgress: number[];   // Tableau contenant les pourcentages de progression (indexé sur les fichiers)
}

export const FileList = ({ files, uploadProgress }: FileListProps) => {
  // Si aucun fichier sélectionné, ne rien afficher
  if (files.length === 0) return null;

  return (
    <motion.div
      //  Animation d'apparition avec Framer Motion
      initial={{ opacity: 0, y: 20 }}  // commence invisible + légèrement décalé en bas
      animate={{ opacity: 1, y: 0 }}   // devient visible + remonte à sa position normale
      className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 mb-4 sm:mb-6"
    >
      {/* Titre de la section */}
      <h3 className="font-bold text-blue-900 mb-2 text-base sm:text-lg">
        Fichier uploadé
      </h3>

      {/*  Parcours de chaque fichier et affichage des infos */}
      {files.map((file, idx) => (
        <div 
          key={file.name} // React a besoin d'une clé unique
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2 sm:gap-0"
        >
          {/* Informations sur le fichier (nom + taille en Mo) */}
          <div>
            <span className="font-medium text-sm sm:text-base">{file.name}</span>
            <span className="text-xs text-gray-400 ml-2">
              ({(file.size / 1024 / 1024).toFixed(2)} Mo) {/* conversion octets → Mo */}
            </span>
          </div>

          {/* Barre de progression + pourcentage */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Barre externe (fond gris) */}
            <div className="w-full sm:w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              {/* Barre interne (remplissage bleu selon pourcentage) */}
              <div
                className="h-2 bg-blue-400 rounded-full transition-all"
                style={{ width: `${uploadProgress[idx] || 100}%` }}
              />
            </div>

            {/* Affichage du pourcentage si défini */}
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
