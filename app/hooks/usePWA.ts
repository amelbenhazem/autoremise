import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isStandalone: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
}

export const usePWA = () => {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: true, // Valeur par défaut pour éviter l'erreur d'hydratation
    isStandalone: false,
    installPrompt: null,
  });

  useEffect(() => {
    // Initialiser l'état réel côté client
    setPwaState(prev => ({
      ...prev,
      isOnline: navigator.onLine,
    }));

    // Détecter si l'app est installée (mode standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');

    // Détecter si l'app est installable
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: e as BeforeInstallPromptEvent,
      }));
    };

    // Détecter si l'app a été installée
    const handleAppInstalled = () => {
      setPwaState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null,
      }));
    };

    // Gérer les changements de connexion
    const handleOnline = () => setPwaState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setPwaState(prev => ({ ...prev, isOnline: false }));

    // Écouter les événements PWA
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Mettre à jour l'état initial
    setPwaState(prev => ({
      ...prev,
      isStandalone,
      isInstalled: isStandalone,
    }));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fonction pour installer l'app
  const installApp = async (): Promise<boolean> => {
    if (!pwaState.installPrompt) {
      return false;
    }

    try {
      await pwaState.installPrompt.prompt();
      const choiceResult = await pwaState.installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
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

  // Fonction pour partager (si supporté)
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

  return {
    ...pwaState,
    installApp,
    shareApp,
  };
};
