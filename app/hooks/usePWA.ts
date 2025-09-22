import { useState, useEffect } from 'react';

//  Définition d'un type pour l'événement BeforeInstallPrompt
//    Cet événement permet de détecter si l'application peut être installée
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]; // plateformes cibles (Android, Windows…)
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'; // résultat du choix de l'utilisateur
    platform: string;
  }>;
  prompt(): Promise<void>; // méthode pour déclencher la popup d'installation
}

// Interface représentant l'état de la PWA
interface PWAState {
  isInstallable: boolean;               // L'app peut être installée
  isInstalled: boolean;                 // L'app est déjà installée
  isOnline: boolean;                     // Connexion réseau active
  isStandalone: boolean;                 // L'app fonctionne en mode standalone (hors navigateur)
  installPrompt: BeforeInstallPromptEvent | null; // Événement d'installation capturé
}

// Hook personnalisé pour gérer l'état PWA
export const usePWA = () => {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: true, // Valeur par défaut pour éviter les erreurs SSR/hydratation
    isStandalone: false,
    installPrompt: null,
  });

  useEffect(() => {
    //  Initialisation de l'état en ligne
    setPwaState(prev => ({ ...prev, isOnline: navigator.onLine }));

    // Détecter si l'app est en mode standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone || // iOS
                        document.referrer.includes('android-app://'); // Android

    // Événement déclenché quand l'app peut être installée
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Empêche la popup automatique
      setPwaState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: e as BeforeInstallPromptEvent,
      }));
    };

    //  Événement déclenché après installation réussie
    const handleAppInstalled = () => {
      setPwaState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null,
      }));
    };

    // Gestion de l'état de connexion
    const handleOnline = () => setPwaState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setPwaState(prev => ({ ...prev, isOnline: false }));

    // Attacher les événements globaux
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    //  Mettre à jour l'état initial
    setPwaState(prev => ({
      ...prev,
      isStandalone,
      isInstalled: isStandalone,
    }));

    //  Nettoyage des listeners à la destruction du composant
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fonction pour déclencher l'installation de la PWA
  const installApp = async (): Promise<boolean> => {
    if (!pwaState.installPrompt) return false; // Pas d'événement disponible

    try {
      await pwaState.installPrompt.prompt(); // Affiche la popup
      const choiceResult = await pwaState.installPrompt.userChoice; // Attendre le choix de l'utilisateur
      
      if (choiceResult.outcome === 'accepted') {
        // Installation acceptée → mettre à jour l'état
        setPwaState(prev => ({
          ...prev,
          isInstallable: false,
          installPrompt: null,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error);
      return false;
    }
  };

  //  Fonction pour partager l'application
  const shareApp = async (): Promise<boolean> => {
    if (!navigator.share) {
      // Fallback : copier l'URL dans le presse-papiers
      try {
        await navigator.clipboard.writeText(window.location.href);
        return true;
      } catch (error) {
        console.error('Erreur lors de la copie:', error);
        return false;
      }
    }

    try {
      // Utiliser l'API Web Share si disponible
      await navigator.share({
        title: 'AutoRemise - Générateur de Remises Bancaires',
        text: 'Générateur automatique de documents PDF de remise bancaire',
        url: window.location.href,
      });
      return true;
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      return false;
    }
  };

  // Retourne l'état PWA + fonctions d'installation et partage
  return {
    ...pwaState,
    installApp,
    shareApp,
  };
};
