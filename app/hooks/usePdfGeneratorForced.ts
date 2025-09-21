import { saveAs } from 'file-saver';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { cmToPoints, calculateOptimalFontSize } from '../../utils/pdfDimensions';

export const usePdfGeneratorForced = () => {
  
  const generatePDFs = async (
    importedMapping: any,
    excelRows: any[],
    bgWidth: number,
    bgHeight: number,
    options?: { drawBackground?: boolean; forceCmDimensions?: boolean; currentBackgroundDataUrl?: string | null },
    liveZones?: any[]
  ) => {
    if (!importedMapping || (!liveZones && !importedMapping.zones) || excelRows.length === 0) {
      alert('Image de fond ou données Excel manquants');
      return;
    }

    const zonesSource: any[] = Array.isArray(liveZones) && liveZones.length > 0 ? liveZones : importedMapping.zones;

    // 🔑 SOLUTION SIMPLE: Utiliser les dimensions forcées en cm
    const widthCm = bgWidth / 28.3464567; // Convertir points vers cm
    const heightCm = bgHeight / 28.3464567;
    
    console.log(`Dimensions PDF: ${widthCm.toFixed(2)} x ${heightCm.toFixed(2)} cm`);

    // Dimensions PDF en points
    const pdfWidth = cmToPoints(widthCm);
    const pdfHeight = cmToPoints(heightCm);

    for (let i = 0; i < excelRows.length; i++) {
      const row = excelRows[i];
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([pdfWidth, pdfHeight]);

      // Forcer les dimensions exactes
      page.setMediaBox(0, 0, pdfWidth, pdfHeight);
      page.setCropBox(0, 0, pdfWidth, pdfHeight);
      page.setBleedBox(0, 0, pdfWidth, pdfHeight);
      page.setTrimBox(0, 0, pdfWidth, pdfHeight);
      page.setArtBox(0, 0, pdfWidth, pdfHeight);

      // Métadonnées pour forcer l'impression
      pdfDoc.setTitle(`Document ${i + 1} - ${widthCm.toFixed(1)}x${heightCm.toFixed(1)}cm`);
      pdfDoc.setSubject(`Dimensions exactes: ${widthCm.toFixed(2)}cm x ${heightCm.toFixed(2)}cm`);
      pdfDoc.setKeywords(['dimensions-exactes', 'impression-taille-reelle']);

      // Fond si demandé
      const backgroundDataUrl = options?.currentBackgroundDataUrl || importedMapping.background;
      if (options?.drawBackground !== false && backgroundDataUrl) {
        const imgBytes = await dataUrlToArrayBuffer(backgroundDataUrl);
        if (backgroundDataUrl.startsWith('data:image/png')) {
          const img = await pdfDoc.embedPng(imgBytes);
          page.drawImage(img, { 
            x: 0, 
            y: 0, 
            width: pdfWidth, 
            height: pdfHeight 
          });
        } else if (backgroundDataUrl.startsWith('data:image/jpeg') || backgroundDataUrl.startsWith('data:image/jpg')) {
          const img = await pdfDoc.embedJpg(imgBytes);
          page.drawImage(img, { 
            x: 0, 
            y: 0, 
            width: pdfWidth, 
            height: pdfHeight 
          });
        }
      }

      // 🔑 SOLUTION SIMPLE: Conversion directe des zones
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      zonesSource.forEach((zone: any) => {
        let value = '';
        if (zone.optionValue) value = zone.optionValue;
        else if (row && zone.field && row[zone.field] != null) value = row[zone.field];
        else if (Array.isArray(zone.options) && zone.options.length > 0) value = zone.options[0];

        // Convertir les zones directement du canvas vers le PDF
        const zoneX = (zone.x / bgWidth) * pdfWidth;
        const zoneY = (zone.y / bgHeight) * pdfHeight;
        const zoneWidth = (zone.width / bgWidth) * pdfWidth;
        const zoneHeight = (zone.height / bgHeight) * pdfHeight;

        const fontSize = calculateOptimalFontSize(zoneWidth, zoneHeight);
        const textHeight = fontSize * 0.75;
        
        // Position du texte (Y inversé pour PDF)
        const drawX = zoneX + 2;
        const drawY = pdfHeight - zoneY - zoneHeight + (zoneHeight - textHeight) / 2;

        page.drawText(String(value), {
          x: drawX,
          y: drawY,
          size: fontSize,
          color: rgb(0, 0, 0),
          maxWidth: zoneWidth - 4,
          font,
        });
      });

      // Sauvegarder PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `pdfrempli${i + 1}.pdf`);
    }
    
    alert(`✅ ${excelRows.length} PDF générés avec dimensions exactes!\n\n📋 INSTRUCTIONS D'IMPRESSION:\n1. Ouvrir le PDF\n2. Imprimer en "Taille réelle" ou "100%"\n3. Choisir n'importe quel format papier (A4, A5...)\n4. Les zones resteront exactement aux mêmes positions!`);
  };

  return { generatePDFs };
};

// Fonction utilitaire pour convertir data URL en ArrayBuffer
async function dataUrlToArrayBuffer(dataUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(dataUrl);
  return response.arrayBuffer();
}