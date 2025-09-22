"use client"; 
import { motion } from 'framer-motion'; 
import { usePWA } from '../hooks/usePWA'; 
import { useClientOnly } from '../hooks/useClientOnly'; 

export const PWAStatus: React.FC = () => {
  // --- Récupération des états PWA ---
  const { isOnline, isInstalled, isStandalone } = usePWA();
  const isClient = useClientOnly();

  // Si l'app est en standalone (déjà ouverte comme PWA)
  // ou qu'on n'est pas encore côté client, on n'affiche rien
  if (isStandalone || !isClient) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-40">
      <motion.div
        initial={{ opacity: 0, x: 20 }}  
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col space-y-2"
      >
        {/* Indicateur hors ligne - Affiché uniquement si isOnline = false */}
        {!isOnline && (
          <motion.div
            className="px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 bg-red-50 text-red-600"
            initial={{ opacity: 0, scale: 0.8 }}  // Petit zoom d'apparition
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {}
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-xs">Hors ligne</span>
          </motion.div>
        )}

        {/* Badge "App installée" - affiché si la PWA est installée */}
        {isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} // Animation d'apparition depuis le haut
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center space-x-2"
          >
            {/* Icône check (confirmation visuelle) */}
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>App installée</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
