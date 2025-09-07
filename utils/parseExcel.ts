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
  const headers = values[0]
    .map((h: any, i: number) => ({ header: h || `__EMPTY_${i}`, index: i }))
    .filter(({ header, index }) => !header.startsWith('__EMPTY_') || values.slice(1).some(row => row[index] !== undefined && row[index] !== null && row[index] !== ''))
    .map(({ header }) => header);
  const rows = values.slice(1).map((row: any[]) => {
    const obj: any = {};
    headers.forEach((h: string, i: number) => { 
      let value = row[i] ?? '';
      
      // Conversion automatique des dates Excel (format DD/MM/YYYY vers YYYY-MM-DD)
      if ((h.toLowerCase().includes('date') || h === 'DATE') && value) {
        console.log(`Traitement date pour ${h}:`, value, 'type:', typeof value);
        try {
          let convertedDate = '';
          
          // Si c'est un nombre Excel (serial number)
          if (typeof value === 'number') {
            // Excel utilise des jours depuis le 1er janvier 1900
            const excelDate = new Date(Math.round((value - 25569) * 86400 * 1000));
            convertedDate = excelDate.toISOString().split('T')[0];
            console.log(`Date Excel (nombre) convertie: ${value} -> ${convertedDate}`);
          }
          // Si c'est une chaîne au format DD/MM/YYYY
          else if (typeof value === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
            const [day, month, year] = value.split('/');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            convertedDate = date.toISOString().split('T')[0];
            console.log(`Date chaîne convertie: ${value} -> ${convertedDate}`);
          }
          // Si c'est déjà au bon format YYYY-MM-DD
          else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            convertedDate = value;
            console.log(`Date déjà au bon format: ${value}`);
          }
          // Essayer de parser avec Date() natif
          else if (typeof value === 'string') {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              convertedDate = date.toISOString().split('T')[0];
              console.log(`Date parsée avec Date(): ${value} -> ${convertedDate}`);
            }
          }
          
          if (convertedDate) {
            value = convertedDate;
          }
        } catch (e) {
          console.warn('Erreur conversion date:', value, e);
        }
      }
      
      obj[h] = value;
    });
    return obj;
  });
  // Détection des listes déroulantes (data validation)
  const dropdowns: Record<string, string[]> = {};
  headers.forEach((header: string, colIdx: number) => {
    console.log('--- Début traitement colonne', header, '---');
    // Limiter le nombre de lignes scannées pour robustesse/perf
    const maxRowsToScan = Math.min(values.length, 500);
    for (let rowIdx = 1; rowIdx < maxRowsToScan; rowIdx++) { // Parcourt des lignes
      console.log('Traitement cellule', header, 'ligne', rowIdx + 1);
      let cell: any;
      try {
        cell = sheet.cell(rowIdx + 1, colIdx + 1); // xlsx-populate est 1-based
      } catch (e) {
        console.warn('Impossible d\'accéder à la cellule', rowIdx + 1, colIdx + 1, e);
        continue;
      }
      let dv: any = undefined;
      try {
        if (cell && typeof cell.dataValidation === 'function') {
          dv = cell.dataValidation();
        }
      } catch (e) {
        console.warn('dataValidation() a échoué pour', header, 'ligne', rowIdx + 1, e);
        dv = undefined;
      }
      let dvType = '';
      try {
        if (dv) {
          if (typeof dv.type === 'function') {
            dvType = dv.type();
          } else if (typeof dv.type === 'string') {
            dvType = dv.type;
          }
        }
      } catch (e) {
        dvType = '';
      }
      if (dvType === 'list') {
        let opts: string[] = [];
        try {
          let formula = '';
          if (dv && typeof dv.formula1 === 'function') {
            formula = dv.formula1();
          } else if (dv && 'formula1' in dv && typeof (dv as any).formula1 === 'string') {
            formula = (dv as any).formula1 as string;
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
  // Après la détection classique des dropdowns, forcer certains champs comme listes déroulantes
  // Ajout de variantes d'intitulés pour couvrir différentes banques et orthographes
  const forcedDropdownFields = [
    // Chèque / effet communs
    "N° Chèque", "N° cheque", "Numero Cheque", "Numéro de chèque",
    "Tireur", "Tiré", "Nom du tiré", "Nom du Tire",
    "Montant", "Montant total", "Total Remise",
    "Réf. transaction", "Réf. effet", "Reference", "Référence",
    "N° Effet", "No Effet", "Numero Effet", "Numéro de l'effet", "Numéro de l’effet",
    "Agence", "Agence bancaire",
    "Échéance", "Echeance",
    // Numéro de compte
    "Numéro de compte", "N° de compte", "N° compte", "Numero de compte", "No Compte",
    "Établissement payeur", "Etablissement payeur",
    // BNA chèque champs
    "Date", "Effectué par", "S'élevant par", "Clé", "Code", "Tireur", "Banque", "Total", "valeur",
    // BNA effet champs
    "Tiré", "lieu de payment", "Échéance",
    // Banque de Tunisie champs
    "Code banque", "remise faveur", "tireur", "Numéro chèque", "Banque", "CIN", "Montant", "Total", "effectuee par", "Code agence", "Numéro de compte", "DATE", "localite"
  ];
  if (workbook && sheet && ((headers.includes("N° Chèque") && headers.includes("Tireur")) || (headers.includes("Numéro chèque") && headers.includes("tireur")))) {
    forcedDropdownFields.forEach(field => {
      if (headers.includes(field) && !dropdowns[field]) {
        // Extraire toutes les valeurs distinctes non vides de la colonne
        const opts = Array.from(new Set(rows.map((row: any) => row[field]).filter((v: any) => v !== undefined && v !== null && v !== ''))) as string[];
        if (opts.length > 0) {
          dropdowns[field] = opts;
        }
      }
    });
  }
  
  // Cas spécial pour BNA effet: forcer tous les champs comme dropdowns
  if (workbook && sheet) {
    const hasBnaEffetFields = headers.some(h => 
      ['Date', 'Numéro de compte', 'Clé', 'Tiré', 'lieu de payment', 'Échéance', 'Total', 'Montant'].includes(h)
    );
    if (hasBnaEffetFields) {
      console.log('Détection BNA effet - ajout de tous les champs comme dropdowns');
      headers.forEach(header => {
        if (!dropdowns[header] && !header.startsWith('__EMPTY_')) {
          const opts = Array.from(new Set(rows.map((row: any) => row[header]).filter((v: any) => v !== undefined && v !== null && v !== ''))) as string[];
          if (opts.length > 0) {
            dropdowns[header] = opts;
            console.log('BNA effet dropdown ajouté:', header, opts);
          }
        }
      });
    }
  }
  console.log('Dropdowns détectés :', JSON.stringify(dropdowns, null, 2)); // Debug
  return { rows, dropdowns };
}
