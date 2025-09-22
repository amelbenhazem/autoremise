"use client"; 
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { usePWA } from '../hooks/usePWA'; 
import { useClientOnly } from '../hooks/useClientOnly'; 
interface PWAInstallPromptProps {
  onDismiss?: () => void; 
  // Callback facultatif appelé lorsque l'utilisateur ferme le prompt
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onDismiss }) => {
  // --- Hooks & States ---
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);    // contrôle l'affichage du prompt
  const [isDismissed, setIsDismissed] = useState(false); // garde en mémoire si l'utilisateur a refusé
  const isClient = useClientOnly();                     // pour éviter l'exécution côté serveur

  // --- Effet pour afficher le prompt après un délai ---
  useEffect(() => {
    if (isClient && isInstallable && !isInstalled && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true); // rend le prompt visible après 3s
      }, 3000);
      return () => clearTimeout(timer); // nettoie le timer si le composant est démonté
    }
  }, [isClient, isInstallable, isInstalled, isDismissed]);

  // --- Gestion du clic sur "Installer" ---
  const handleInstall = async () => {
    const success = await installApp(); // lance la logique d’installation (PWA prompt natif)
    if (success) setIsVisible(false);   //  cache le prompt après installation
  };

  // --- Gestion du clic sur "Plus tard" ---
  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    onDismiss?.(); // exécute le callback optionnel si fourni

    // Sauvegarde la préférence pour ne plus afficher le prompt
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // --- Vérifie si l'utilisateur a déjà refusé dans le passé ---
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') setIsDismissed(true);
  }, []);

  //  Si on n'est pas côté client OU que le prompt est caché OU que l'app est déjà installée → ne rien afficher
  if (!isClient || !isVisible || isInstalled) return null;

  // --- Rendu du composant avec animation ---
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }} // animation d’entrée : fade-in + montée
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}   // animation de sortie : fade-out + descente
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto"
      >
        {/* Conteneur principal */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
          
          {/* Header avec icône et bouton fermer */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              {/* Icône d'app */}
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              {/* Texte d'accroche */}
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Installer AutoRemise</h3>
                <p className="text-xs text-gray-500">Accès rapide depuis votre écran d'accueil</p>
              </div>
            </div>
            
            {/* Bouton fermer */}
            <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Boutons d'action */}
          <div className="flex space-x-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Installer
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Plus tard
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
