import { saveAs } from 'file-saver';
import { PDFDocument, rgb } from 'pdf-lib';

export const usePdfGenerator = () => {
  const generatePDFs = async (
    importedMapping: any,
    excelRows: any[],
    bgWidth: number,
    bgHeight: number
  ) => {
    if (!importedMapping || !importedMapping.background || !importedMapping.zones || excelRows.length === 0) {
      alert('Image de fond ou données Excel manquants');
      return;
    }

    for (let i = 0; i < excelRows.length; i++) {
      const row = excelRows[i];
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([bgWidth, bgHeight]);

      // Ajouter l'image de fond
      if (importedMapping.background && importedMapping.background.startsWith('data:image/')) {
        const imgBytes = await dataUrlToArrayBuffer(importedMapping.background);
        
        if (importedMapping.background.startsWith('data:image/png')) {
          const img = await pdfDoc.embedPng(imgBytes);
          page.drawImage(img, { x: 0, y: 0, width: bgWidth, height: bgHeight });
        } else if (
          importedMapping.background.startsWith('data:image/jpeg') ||
          importedMapping.background.startsWith('data:image/jpg')
        ) {
          const img = await pdfDoc.embedJpg(imgBytes);
          page.drawImage(img, { x: 0, y: 0, width: bgWidth, height: bgHeight });
        } else {
          alert('Format d\'image non supporté pour le fond (seulement PNG ou JPEG)');
          return;
        }
      }

      // Ajouter le texte
      const font = await pdfDoc.embedFont('Helvetica');
      importedMapping.zones.forEach((zone: any) => {
        let value = '';
        if (zone.optionValue) {
          value = zone.optionValue;
        } else {
          value = row[zone.field] || '';
        }
        
        const fontSize = Math.max(10, Math.min(zone.height, zone.width) / 2);
        const textWidth = font.widthOfTextAtSize(String(value), fontSize);
        const x = zone.x + (zone.width - textWidth) / 2;
        const y = bgHeight - zone.y - (zone.height - fontSize) / 2 - fontSize / 4;
        
        page.drawText(String(value), {
          x,
          y,
          size: fontSize,
          color: rgb(0, 0, 0),
          maxWidth: zone.width,
          font,
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `pdfrempli${i + 1}.pdf`);
    }
  };

  const dataUrlToArrayBuffer = async (dataUrl: string): Promise<ArrayBuffer> => {
    try {
      return await fetch(dataUrl).then(r => r.arrayBuffer());
    } catch (e) {
      const base64 = dataUrl.split(',')[1];
      if (!base64 || base64.length % 4 !== 0) {
        alert('Le data URL de l\'image de fond est mal formé ou corrompu. Merci de réexporter le mapping depuis l\'éditeur sans modification manuelle.');
        throw new Error('Le data URL est mal formé ou corrompu.');
      }
      try {
        const binary = atob(base64.replace(/\s/g, ''));
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
      } catch (err) {
        alert('Erreur lors du décodage base64 de l\'image de fond. Merci de réexporter le mapping.');
        throw err;
      }
    }
  };

  return {
    generatePDFs,
  };
};


