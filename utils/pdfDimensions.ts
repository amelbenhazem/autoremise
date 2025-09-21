/**
 * Utilitaires pour la gestion des dimensions PDF
 * Conversion entre cm et points PDF pour assurer la cohérence
 */

// Facteurs de conversion
export const CM_TO_POINTS = 28.3464567; // 1 cm = 28.3464567 points PDF
export const PIXELS_TO_CM = 0.0264583333; // 1 pixel = 0.0264583333 cm (à 96 DPI)

/**
 * Détecte si les dimensions sont en pixels ou en cm
 * @param width - Largeur
 * @param height - Hauteur
 * @returns 'pixels' ou 'cm'
 */
export const detectDimensionUnit = (width: number, height: number): 'pixels' | 'cm' => {
  // Si les dimensions sont très grandes (> 1000), c'est probablement en pixels
  // Si les dimensions sont petites (< 100), c'est probablement en cm
  const maxDimension = Math.max(width, height);
  
  if (maxDimension > 1000) {
    return 'pixels';
  } else if (maxDimension < 100) {
    return 'cm';
  }
  
  // Pour les valeurs intermédiaires, on utilise une heuristique
  // Les formats papier standards en cm : A4 (21x29.7), A5 (14.8x21), etc.
  const commonPaperRatios = [
    { w: 21, h: 29.7 }, // A4
    { w: 14.8, h: 21 }, // A5
    { w: 21.59, h: 27.94 }, // Letter
  ];
  
  for (const ratio of commonPaperRatios) {
    const widthRatio = width / ratio.w;
    const heightRatio = height / ratio.h;
    
    // Si les ratios sont proches (tolérance de 20%), c'est probablement en cm
    if (Math.abs(widthRatio - heightRatio) < 0.2 && widthRatio > 0.5 && widthRatio < 2) {
      return 'cm';
    }
  }
  
  // Par défaut, on considère que c'est en pixels
  return 'pixels';
};

/**
 * Convertit des pixels en centimètres
 * @param pixels - Valeur en pixels
 * @returns Valeur en centimètres
 */
export const pixelsToCm = (pixels: number): number => pixels * PIXELS_TO_CM;

/**
 * Normalise les dimensions en centimètres
 * Détecte automatiquement l'unité et convertit vers cm
 * @param width - Largeur (pixels ou cm)
 * @param height - Hauteur (pixels ou cm)
 * @returns Dimensions normalisées en cm
 */
export const normalizeDimensionsToCm = (width: number, height: number): { width: number; height: number; unit: 'pixels' | 'cm' } => {
  const unit = detectDimensionUnit(width, height);
  
  if (unit === 'pixels') {
    return {
      width: pixelsToCm(width),
      height: pixelsToCm(height),
      unit: 'pixels'
    };
  } else {
    return {
      width,
      height,
      unit: 'cm'
    };
  }
};

/**
 * Normalise les zones d'un mapping
 * Convertit automatiquement les coordonnées et dimensions des zones
 * @param zones - Array des zones
 * @param bgWidth - Largeur du background
 * @param bgHeight - Hauteur du background
 * @returns Zones normalisées en cm
 */
export const normalizeZonesToCm = (zones: any[], bgWidth: number, bgHeight: number): any[] => {
  const { unit } = normalizeDimensionsToCm(bgWidth, bgHeight);
  
  if (unit === 'pixels') {
    // Convertir toutes les zones de pixels vers cm
    return zones.map(zone => ({
      ...zone,
      x: pixelsToCm(zone.x),
      y: pixelsToCm(zone.y),
      width: pixelsToCm(zone.width),
      height: pixelsToCm(zone.height)
    }));
  } else {
    // Les zones sont déjà en cm
    return zones;
  }
};

/**
 * Convertit des centimètres en points PDF
 * @param cm - Valeur en centimètres
 * @returns Valeur en points PDF
 */
export const cmToPoints = (cm: number): number => cm * CM_TO_POINTS;

/**
 * Convertit des points PDF en centimètres
 * @param points - Valeur en points PDF
 * @returns Valeur en centimètres
 */
export const pointsToCm = (points: number): number => points / CM_TO_POINTS;

/**
 * Calcule la taille de police optimale pour une zone
 * @param zoneWidth - Largeur de la zone en points
 * @param zoneHeight - Hauteur de la zone en points
 * @param minSize - Taille minimale (défaut: 8)
 * @param maxSize - Taille maximale (défaut: 72)
 * @returns Taille de police en points
 */
export const calculateOptimalFontSize = (
  zoneWidth: number,
  zoneHeight: number,
  minSize: number = 8,
  maxSize: number = 72
): number => {
  const baseSize = Math.min(zoneHeight, zoneWidth) / 3;
  return Math.max(minSize, Math.min(maxSize, baseSize));
};

/**
 * Calcule la position centrée pour un texte dans une zone
 * @param zoneX - Position X de la zone en points
 * @param zoneY - Position Y de la zone en points
 * @param zoneWidth - Largeur de la zone en points
 * @param zoneHeight - Hauteur de la zone en points
 * @param textWidth - Largeur du texte en points
 * @param textHeight - Hauteur du texte en points
 * @param pageHeight - Hauteur totale de la page en points
 * @returns Position {x, y} centrée en points
 */
export const calculateCenteredTextPosition = (
  zoneX: number,
  zoneY: number,
  zoneWidth: number,
  zoneHeight: number,
  textWidth: number,
  textHeight: number,
  pageHeight: number
): { x: number; y: number } => {
  // Position X : centré horizontalement dans la zone
  const x = zoneX + (zoneWidth - textWidth) / 2;
  
  // Position Y : centré verticalement dans la zone (PDF utilise le bas comme origine)
  const y = pageHeight - zoneY - zoneHeight + (zoneHeight - textHeight) / 2;
  
  return { x, y };
};

/**
 * Formats de papier standards (en points)
 */
export const PAPER_FORMATS = {
  A4: { width: cmToPoints(21), height: cmToPoints(29.7) },
  A5: { width: cmToPoints(14.8), height: cmToPoints(21) },
  LETTER: { width: cmToPoints(21.59), height: cmToPoints(27.94) },
  LEGAL: { width: cmToPoints(21.59), height: cmToPoints(35.56) },
} as const;

/**
 * Vérifie si les dimensions du template sont compatibles avec un format de papier
 * @param templateWidth - Largeur du template en points
 * @param templateHeight - Hauteur du template en points
 * @param paperFormat - Format de papier à vérifier
 * @returns true si compatible, false sinon
 */
export const isCompatibleWithPaperFormat = (
  templateWidth: number,
  templateHeight: number,
  paperFormat: keyof typeof PAPER_FORMATS
): boolean => {
  const paper = PAPER_FORMATS[paperFormat];
  return templateWidth <= paper.width && templateHeight <= paper.height;
};
