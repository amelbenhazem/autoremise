// Fonction pour calculer la taille maximale de police permettant à un texte
// de tenir dans une zone définie par sa largeur et sa hauteur
export const calculateFontSizeFull = (text: string, width: number, height: number): number => {

  // Définition d'une petite marge/padding autour du texte pour ne pas toucher les bords
  const padding = 0.01; // 1% de marge sur chaque côté

  // Calcul de la largeur et hauteur maximum utilisable après application du padding
  const maxWidth = width * (1 - 2 * padding); // largeur effective
  const maxHeight = height * (1 - 2 * padding); // hauteur effective

  // Initialiser la taille de la police à la hauteur maximale possible
  let fontSize = maxHeight;

  // Créer un canvas temporaire pour mesurer la largeur du texte
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d'); // récupérer le contexte 2D pour mesurer le texte

  // Si le contexte 2D n'est pas disponible (cas très rare), retourner une taille par défaut
  if (!ctx) return 12;

  // Boucle pour réduire progressivement la taille de la police
  while (fontSize > 1) {
    ctx.font = `${fontSize}px Arial`; // définir la taille et la police
    const textWidth = ctx.measureText(text).width; // mesurer la largeur du texte

    // Si le texte tient à la fois dans la largeur et la hauteur disponibles, on sort de la boucle
    if (textWidth <= maxWidth && fontSize <= maxHeight) break;

    // Sinon, réduire la taille de la police de 1px et réessayer
    fontSize -= 1;
  }

  // Retourner la taille de police calculée qui fera tenir le texte dans la zone
  return fontSize;
};
