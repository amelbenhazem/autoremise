#!/usr/bin/env node

/**
 * Script pour générer toutes les icônes PWA nécessaires
 * 
 * Prérequis :
 * - Node.js installé
 * - ImageMagick installé (https://imagemagick.org/)
 * 
 * Usage :
 * 1. Placez votre logo principal (PNG, 1024x1024 recommandé) dans public/logo-source.png
 * 2. Exécutez : node scripts/generate-icons.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Tailles d'icônes requises pour PWA
const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'logo-192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'logo-512.png' }
];

// Screenshots (optionnels)
const screenshots = [
  { size: '390x844', name: 'screenshot-mobile.png' },
  { size: '1280x720', name: 'screenshot-desktop.png' }
];

function checkImageMagick() {
  try {
    execSync('magick -version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error('❌ ImageMagick n\'est pas installé !');
    console.log('📥 Installez ImageMagick depuis : https://imagemagick.org/');
    return false;
  }
}

function generateIcons() {
  const sourcePath = path.join(__dirname, '../public/logo-source.png');
  const publicPath = path.join(__dirname, '../public');
  
  // Vérifier si le fichier source existe
  if (!fs.existsSync(sourcePath)) {
    console.error('❌ Fichier source non trouvé : public/logo-source.png');
    console.log('📝 Placez votre logo principal (PNG, 1024x1024 recommandé) dans public/logo-source.png');
    return;
  }
  
  console.log('🎨 Génération des icônes PWA...');
  
  // Générer chaque icône
  iconSizes.forEach(({ size, name }) => {
    const outputPath = path.join(publicPath, name);
    
    try {
      execSync(`magick "${sourcePath}" -resize ${size}x${size} "${outputPath}"`, { stdio: 'pipe' });
      console.log(`✅ Généré : ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Erreur lors de la génération de ${name}:`, error.message);
    }
  });
  
  console.log('🎉 Génération des icônes terminée !');
}

function createPlaceholderScreenshots() {
  const publicPath = path.join(__dirname, '../public');
  
  console.log('📱 Création des screenshots placeholder...');
  
  screenshots.forEach(({ size, name }) => {
    const outputPath = path.join(publicPath, name);
    
    try {
      // Créer un screenshot placeholder avec ImageMagick
      execSync(`magick -size ${size} xc:"#89ccff" -pointsize 24 -fill white -gravity center -annotate +0+0 "AutoRemise\\nScreenshot" "${outputPath}"`, { stdio: 'pipe' });
      console.log(`✅ Généré : ${name} (${size})`);
    } catch (error) {
      console.error(`❌ Erreur lors de la génération de ${name}:`, error.message);
    }
  });
  
  console.log('📝 Remplacez ces screenshots par de vrais captures d\'écran de votre app !');
}

function main() {
  console.log('🚀 Générateur d\'icônes PWA pour AutoRemise');
  console.log('==========================================\n');
  
  if (!checkImageMagick()) {
    process.exit(1);
  }
  
  generateIcons();
  createPlaceholderScreenshots();
  
  console.log('\n📋 Prochaines étapes :');
  console.log('1. Vérifiez que toutes les icônes ont été générées dans public/');
  console.log('2. Remplacez les screenshots placeholder par de vrais captures');
  console.log('3. Testez votre PWA avec : npm run build && npm start');
  console.log('4. Ouvrez Chrome DevTools > Application > Manifest pour vérifier');
}

if (require.main === module) {
  main();
}

module.exports = { generateIcons, createPlaceholderScreenshots };

