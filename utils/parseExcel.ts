// @ts-expect-error: no types for xlsx-populate
// Import de la librairie XlsxPopulate pour manipuler les fichiers Excel côté navigateur
import XlsxPopulate from 'xlsx-populate/browser/xlsx-populate';

// Fonction principale pour parser un fichier Excel
// Elle retourne un tableau d'objets représentant les lignes et un objet des dropdowns
export async function parseExcel(file: File): Promise<{ rows: any[], dropdowns: Record<string, string[]> }> {

  // Lire le fichier Excel en ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Créer un workbook XlsxPopulate à partir des données
  const workbook = await XlsxPopulate.fromDataAsync(arrayBuffer);

  // Sélectionner la première feuille du workbook
  const sheet = workbook.sheet(0);

  // Récupérer la plage utilisée (tout ce qui contient des valeurs)
  const usedRange = sheet.usedRange();

  // Extraire les valeurs de toutes les cellules dans la plage
  const values = usedRange.value();

  // Fonction utilitaire pour parser les en-têtes avec options
  // Exemple : "Type (A;B;C)" => base: "Type", options: ["A","B","C"]
  const parseHeader = (raw: any): { base: string; options: string[] } => {
    let text = (raw == null ? '' : String(raw)).trim(); // nettoyer et convertir en string
    if (!text) return { base: '', options: [] }; // si vide, retourner vide

    // Retirer suffixe "+ zones" éventuel
    text = text.replace(/\+\s*zones?\s*$/i, '').trim();

    // Extraction du texte entre la dernière paire de parenthèses
    let base = text;
    let options: string[] = [];
    const lastOpen = text.lastIndexOf('(');
    const lastClose = text.lastIndexOf(')');
    if (lastOpen !== -1 && lastClose !== -1 && lastClose > lastOpen) {
      const inside = text.slice(lastOpen + 1, lastClose).trim();
      base = (text.slice(0, lastOpen) + text.slice(lastClose + 1)).trim();
      if (inside) {
        // Séparer les options par ; , ou |
        options = inside
          .split(/[;,|]/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
      }
    }
    return { base, options };
  };

  // Extraction des en-têtes et de leurs options
  const headerMeta: { index: number; base: string; options: string[] }[] = (values[0] as any[])
    .map((h: any, i: number) => ({ index: i, ...parseHeader(h) }))
    .filter(({ base }: { base: string }) => base !== ''); // ignorer les colonnes sans nom

  // Détection automatique de la banque et du type de remise
  const requiredFieldsMap: { [bank: string]: { [type: string]: string[] } } = {
    ZITOUNA: {
      cheque: [
        "Code banque", "Code agence", "N° de compte", "Clé de contrôle", "Total Remise",
        "Titulaire du compte", "Date de remise", "Montant", "N° Chèque", 
        "Agence", "Tireur", "Tiré"
      ],
      effet: [
        "Code banque", "Code agence", "N° de compte", "Clé de contrôle", "Total Remise",
        "Titulaire du compte", "Date de remise", "nbre de cheques", "N° Effet", 
        "Agence", "Tireur", "Tiré", "Montant"
      ]
    }
  };

  // Récupérer les champs présents dans le fichier
  const existingFields = headerMeta.map(h => h.base);
  let detectedBank = '';
  let detectedType = '';

  // Détection de la banque ZITOUNA
  if (existingFields.includes('Code banque') && existingFields.includes('Code agence')) {
    detectedBank = 'ZITOUNA';
    if (existingFields.includes('N° Chèque')) {
      detectedType = 'cheque';
    } else if (existingFields.includes('N° Effet')) {
      detectedType = 'effet';
    }
  }

  // Ajouter les champs manquants pour la banque/type détectés
  if (detectedBank && detectedType && requiredFieldsMap[detectedBank]?.[detectedType]) {
    const expectedFields = requiredFieldsMap[detectedBank][detectedType];
    console.log(` Banque détectée: ${detectedBank}, Type: ${detectedType}`);
    console.log(` Champs attendus:`, expectedFields);
    console.log(` Champs présents:`, existingFields);
    
    expectedFields.forEach(field => {
      if (!existingFields.includes(field)) {
        const maxIndex = Math.max(...headerMeta.map(h => h.index), values[0]?.length || 0);
        headerMeta.push({
          index: maxIndex,
          base: field,
          options: []
        });
        console.log(` Champ ajouté: ${field}`);
      }
    });
  }

  const headers = headerMeta.map(h => (h.base || `__EMPTY_${h.index}`));

  // Extraction des lignes de données
  const rows = values.slice(1).map((row: any[]) => {
    const obj: any = {};
    headerMeta.forEach(({ base }, i) => {
      let value = row[headerMeta[i].index] ?? '';

      // Conversion automatique des dates si détectées
      if ((base.toLowerCase().includes('date') || base === 'DATE') && value) {
        try {
          if (typeof value === 'number') {
            const excelDate = new Date(Math.round((value - 25569) * 86400 * 1000));
            value = excelDate.toISOString().split('T')[0];
          } else if (typeof value === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
            const [day, month, year] = value.split('/');
            value = new Date(+year, +month - 1, +day).toISOString().split('T')[0];
          }
        } catch (e) {
          console.warn('Erreur conversion date:', value, e);
        }
      }

      obj[base] = value;
    });
    return obj;
  });

  // Génération des listes déroulantes (dropdowns)
  const dropdowns: Record<string, string[]> = {};
  
  // 1) Utiliser les options déclarées dans le titre
  headerMeta.forEach(({ base, options }: { base: string; options: string[] }) => {
    if (options && options.length > 0) dropdowns[base] = options.slice();
  });
  
  // 2) Si aucune option déclarée, extraire valeurs uniques depuis les données
  headerMeta.forEach(({ base }: { base: string }) => {
    if (!dropdowns[base]) {
      const nonEmptyValues = (rows as any[])
        .map((row: any) => row[base])
        .filter((v: any) => v !== undefined && v !== null && v !== '');

      // Cas spécial : une seule cellule contient une liste séparée par ; , ou |
      if (nonEmptyValues.length === 1 && typeof nonEmptyValues[0] === 'string' && /[;,|]/.test(nonEmptyValues[0])) {
        const raw = String(nonEmptyValues[0]);
        const tokens = raw
          .split(/[;,|]/)
          .map(s => s.trim().replace(/:+$/g, ''))
          .filter(s => s.length > 0);
        if (tokens.length > 0) {
          dropdowns[base] = tokens;
          return;
        }
      }

      // Sinon : valeurs uniques simples
      const unique = Array.from(new Set(nonEmptyValues.map(String))) as string[];
      if (unique.length > 0) dropdowns[base] = unique;
    }
  });

  // 3) Créer des listes déroulantes vides pour certains champs typiques
  const typicalDropdownFields = ['Tireur', 'Tiré', 'Agence', 'Banque', 'Localité', 'Ville'];
  typicalDropdownFields.forEach(field => {
    if (headerMeta.some(h => h.base === field) && !dropdowns[field]) {
      dropdowns[field] = []; // permettre saisie manuelle
      console.log(` Liste déroulante vide créée pour: ${field}`);
    }
  });

  console.log(' Tous les champs détectés :', JSON.stringify(dropdowns, null, 2));

  // Retourner les lignes et les dropdowns
  return { rows, dropdowns };
}
