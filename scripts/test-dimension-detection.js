/**
 * Script de test pour vérifier la détection des dimensions
 * Teste avec les fichiers Amen Bank existants
 */

const fs = require('fs');
const path = require('path');

// Facteurs de conversion (copiés de pdfDimensions.ts)
const CM_TO_POINTS = 28.3464567;
const PIXELS_TO_CM = 0.0264583333;

function detectDimensionUnit(width, height) {
  const maxDimension = Math.max(width, height);
  
  if (maxDimension > 1000) {
    return 'pixels';
  } else if (maxDimension < 100) {
    return 'cm';
  }
  
  // Heuristique pour les formats papier standards
  const commonPaperRatios = [
    { w: 21, h: 29.7 }, // A4
    { w: 14.8, h: 21 }, // A5
    { w: 21.59, h: 27.94 }, // Letter
  ];
  
  for (const ratio of commonPaperRatios) {
    const widthRatio = width / ratio.w;
    const heightRatio = height / ratio.h;
    
    if (Math.abs(widthRatio - heightRatio) < 0.2 && widthRatio > 0.5 && widthRatio < 2) {
      return 'cm';
    }
  }
  
  return 'pixels';
}

function pixelsToCm(pixels) {
  return pixels * PIXELS_TO_CM;
}

function normalizeDimensionsToCm(width, height) {
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
}

// Tester avec les fichiers Amen Bank
const amenFiles = [
  'amen_cheque.json',
  'effet_amen_bank.json'
];

console.log('🧪 Test de détection des dimensions pour Amen Bank\n');

amenFiles.forEach(filename => {
  const filePath = path.join(__dirname, '..', 'public', 'mappings', filename);
  
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const mapping = JSON.parse(content);
      
      const bgWidth = mapping.bgWidth;
      const bgHeight = mapping.bgHeight;
      const zonesCount = mapping.zones ? mapping.zones.length : 0;
      
      console.log(`📄 ${filename}:`);
      console.log(`   Dimensions originales: ${bgWidth} x ${bgHeight}`);
      
      const normalized = normalizeDimensionsToCm(bgWidth, bgHeight);
      console.log(`   Unité détectée: ${normalized.unit}`);
      console.log(`   Dimensions normalisées: ${normalized.width.toFixed(2)} cm x ${normalized.height.toFixed(2)} cm`);
      console.log(`   Nombre de zones: ${zonesCount}`);
      
      // Calculer les dimensions en points PDF
      const pdfWidth = normalized.width * CM_TO_POINTS;
      const pdfHeight = normalized.height * CM_TO_POINTS;
      console.log(`   Dimensions PDF: ${pdfWidth.toFixed(2)} x ${pdfHeight.toFixed(2)} points`);
      
      console.log('');
      
    } catch (error) {
      console.log(`❌ Erreur lors de la lecture de ${filename}:`, error.message);
    }
  } else {
    console.log(`❌ Fichier non trouvé: ${filename}`);
  }
});

console.log('✅ Test terminé !');

