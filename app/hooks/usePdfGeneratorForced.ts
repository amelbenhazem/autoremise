import { saveAs } from 'file-saver';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { cmToPoints, calculateOptimalFontSize } from '../../utils/pdfDimensions';

// Hook personnalisé pour générer des PDF remplis automatiquement
export const usePdfGeneratorForced = () => {
  
  const generatePDFs = async (
    importedMapping: any,                 // Mapping des zones à remplir (JSON)
    excelRows: any[],                     // Données Excel à injecter dans les zones
    bgWidth: number,                      // Largeur du fond en points
    bgHeight: number,                     // Hauteur du fond en points
    options?: { 
      drawBackground?: boolean;           // Option pour dessiner le fond
      forceCmDimensions?: boolean;        // Option pour forcer les dimensions en cm
      currentBackgroundDataUrl?: string | null; // Data URL du fond actuel
    },
    liveZones?: any[]                     // Zones dynamiques en live si présentes
  ) => {
    // Vérification des prérequis
    if (!importedMapping || (!liveZones && !importedMapping.zones) || excelRows.length === 0) {
      alert('Image de fond ou données Excel manquants');
      return;
    }

    //  Source des zones : liveZones si présent, sinon mapping statique
    const zonesSource: any[] = Array.isArray(liveZones) && liveZones.length > 0 ? liveZones : importedMapping.zones;

    // SOLUTION SIMPLE: conversion des dimensions en cm
    const widthCm = bgWidth / 28.3464567;  // points → cm
    const heightCm = bgHeight / 28.3464567;
    console.log(`Dimensions PDF: ${widthCm.toFixed(2)} x ${heightCm.toFixed(2)} cm`);

    // Dimensions PDF en points
    const pdfWidth = cmToPoints(widthCm);
    const pdfHeight = cmToPoints(heightCm);

    // Boucle pour générer un PDF par ligne Excel
    for (let i = 0; i < excelRows.length; i++) {
      const row = excelRows[i];

      // Création d'un nouveau document PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([pdfWidth, pdfHeight]);

      // Forcer toutes les boîtes du PDF à la même taille (garantie impression exacte)
      page.setMediaBox(0, 0, pdfWidth, pdfHeight);
      page.setCropBox(0, 0, pdfWidth, pdfHeight);
      page.setBleedBox(0, 0, pdfWidth, pdfHeight);
      page.setTrimBox(0, 0, pdfWidth, pdfHeight);
      page.setArtBox(0, 0, pdfWidth, pdfHeight);

      // Métadonnées pour indiquer les dimensions exactes
      pdfDoc.setTitle(`Document ${i + 1} - ${widthCm.toFixed(1)}x${heightCm.toFixed(1)}cm`);
      pdfDoc.setSubject(`Dimensions exactes: ${widthCm.toFixed(2)}cm x ${heightCm.toFixed(2)}cm`);
      pdfDoc.setKeywords(['dimensions-exactes', 'impression-taille-reelle']);

      // Dessiner le fond si demandé
      const backgroundDataUrl = options?.currentBackgroundDataUrl || importedMapping.background;
      if (options?.drawBackground !== false && backgroundDataUrl) {
        const imgBytes = await dataUrlToArrayBuffer(backgroundDataUrl);
        if (backgroundDataUrl.startsWith('data:image/png')) {
          const img = await pdfDoc.embedPng(imgBytes);
          page.drawImage(img, { x: 0, y: 0, width: pdfWidth, height: pdfHeight });
        } else if (backgroundDataUrl.startsWith('data:image/jpeg') || backgroundDataUrl.startsWith('data:image/jpg')) {
          const img = await pdfDoc.embedJpg(imgBytes);
          page.drawImage(img, { x: 0, y: 0, width: pdfWidth, height: pdfHeight });
        }
      }

      // Embedding police Helvetica pour le texte
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Boucle sur toutes les zones à remplir
      zonesSource.forEach((zone: any) => {
        let value = '';
        if (zone.optionValue) value = zone.optionValue;
        else if (row && zone.field && row[zone.field] != null) value = row[zone.field];
        else if (Array.isArray(zone.options) && zone.options.length > 0) value = zone.options[0];

        // Conversion des coordonnées du canvas vers PDF
        const zoneX = (zone.x / bgWidth) * pdfWidth;
        const zoneY = (zone.y / bgHeight) * pdfHeight;
        const zoneWidth = (zone.width / bgWidth) * pdfWidth;
        const zoneHeight = (zone.height / bgHeight) * pdfHeight;

        const fontSize = calculateOptimalFontSize(zoneWidth, zoneHeight); // Ajuste taille police
        const textHeight = fontSize * 0.75;
        
        // Inversion Y pour PDF et centrage vertical
        const drawX = zoneX + 2;
        const drawY = pdfHeight - zoneY - zoneHeight + (zoneHeight - textHeight) / 2;

        //  Dessiner le texte dans la zone
        page.drawText(String(value), {
          x: drawX,
          y: drawY,
          size: fontSize,
          color: rgb(0, 0, 0),
          maxWidth: zoneWidth - 4,
          font,
        });
      });

      // Sauvegarde du PDF et téléchargement
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `pdfrempli${i + 1}.pdf`);
    }

    //  Message final à l'utilisateur
    alert(` ${excelRows.length} PDF générés avec dimensions exactes.`);
  };

  return { generatePDFs };
};

// Fonction utilitaire pour convertir un Data URL en ArrayBuffer
async function dataUrlToArrayBuffer(dataUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(dataUrl);
  return response.arrayBuffer();
}
