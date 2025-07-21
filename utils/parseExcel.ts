// @ts-expect-error: no types for xlsx-populate
import XlsxPopulate from 'xlsx-populate/browser/xlsx-populate';

export async function parseExcel(file: File): Promise<{ rows: any[], dropdowns: Record<string, string[]> }> {
  // Lire le fichier en ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  // Charger le classeur avec xlsx-populate
  const workbook = await XlsxPopulate.fromDataAsync(arrayBuffer);
  const sheet = workbook.sheet(0);
  // Extraire les données (première ligne = en-têtes)
  const usedRange = sheet.usedRange();
  const values = usedRange.value();
  const headers = values[0].map((h: any, i: number) => h || `__EMPTY_${i}`);
  const rows = values.slice(1).map((row: any[]) => {
    const obj: any = {};
    headers.forEach((h: string, i: number) => { obj[h] = row[i] ?? ''; });
    return obj;
  });
  // Détection des listes déroulantes (data validation)
  const dropdowns: Record<string, string[]> = {};
  headers.forEach((header: string, colIdx: number) => {
    console.log('--- Début traitement colonne', header, '---');
    let found = false;
    for (let rowIdx = 1; rowIdx < values.length; rowIdx++) { // Parcourt toutes les lignes
      console.log('Traitement cellule', header, 'ligne', rowIdx + 1);
      const cell = sheet.cell(rowIdx + 1, colIdx + 1); // xlsx-populate est 1-based
      const dv = cell.dataValidation();
      let dvType = '';
      if (dv) {
        if (typeof dv.type === 'function') {
          dvType = dv.type();
        } else if (typeof dv.type === 'string') {
          dvType = dv.type;
        }
      }
      if (dvType === 'list') {
        let opts: string[] = [];
        try {
          let formula = '';
          if (dv && typeof dv.formula1 === 'function') {
            formula = dv.formula1();
          } else if (dv && 'formula1' in dv && typeof dv.formula1 === 'string') {
            formula = dv.formula1;
          } else {
            formula = '';
          }
          console.log('Formule brute:', JSON.stringify(formula));
          if (formula) {
            // Enlève les guillemets s'ils sont présents autour de la chaîne
            let clean = formula;
            if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
              clean = clean.substring(1, clean.length - 1);
            }
            // Sépare par virgule ou point-virgule
            opts = clean.split(/[,;]/).map((s: string) => s.trim());
            console.log('Options extraites (liste directe):', opts);
          }
          console.log('Pour colonne', header, 'options trouvées:', opts);
          if (opts.length > 0) {
            dropdowns[header] = opts;
            console.log('Ajouté à dropdowns:', header, opts);
          } else {
            console.log('Aucune option ajoutée pour', header);
          }
        } catch (e) {
          console.error('Erreur lors de l\'extraction des options pour', header, e);
        }
        break;
      }
    }
  });
  console.log('Dropdowns détectés :', JSON.stringify(dropdowns, null, 2)); // Debug
  return { rows, dropdowns };
}
