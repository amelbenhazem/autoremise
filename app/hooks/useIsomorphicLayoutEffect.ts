import { useEffect, useLayoutEffect } from 'react';

// Hook pour éviter les erreurs d'hydratation
// Utilise useLayoutEffect côté client et useEffect côté serveur
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

