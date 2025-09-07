import { useState, useEffect } from 'react';

/**
 * Hook pour éviter les erreurs d'hydratation
 * Retourne true seulement côté client après le montage
 */
export const useClientOnly = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
};

