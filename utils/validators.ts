// ✅ Mapping des colonnes attendues par banque et type de remise
const requiredFieldsMap: {
    [bank: string]: {
      [type: string]: string[];
    };
  } = {
    ALBARAKA: {
      chèque: [
        "Code banque", "Code agence", "N° de compte", "Clé de contrôle", "DIVISE",
        "Titulaire du compte", "Date de remise", "Nom du déposant", "CIN/PP/CSN",
        "N° Chèque", "Tireur", "Tiré", "Montant", "Réf. transaction", "Total Remise"
      ],
      effet: [
        "Code banque", "Code agence", "N° de compte", "Clé de contrôle", "DIVISE",
        "Titulaire du compte", "Date de remise", "Nom du déposant", "CIN/PP/CSN",
        "N° Effet", "Tireur", "Tiré", "Montant", "Réf. effet", "Total Remise"
      ]
    },
    BIAT: {
      chèque: [
        "Code banque", "Code agence", "N° de compte", "Clé de contrôle",
        "Titulaire du compte", "Date de remise", "Nom du déposant", "CIN/PP/CSN",
        "N° Chèque", "Tireur", "Tiré", "Montant", "Total Remise"
      ],
      effet: [
        "Code banque", "Code agence", "N° de compte", "Clé de contrôle",
        "Titulaire du compte", "Date de remise", "Nom du déposant", "CIN/PP/CSN",
        "N° Effet", "Tireur", "Tiré", "Montant", "Total Remise"
      ]
    },
    // Ajoute d'autres banques ici si besoin
  };
  
  // ✅ Validation des entêtes du fichier
  export function validateHeader(row: any, bank: string, type: string): string[] {
    const errors: string[] = [];
  
    const expectedFields = requiredFieldsMap[bank]?.[type];
    if (!expectedFields) {
      errors.push(`❌ Structure non définie pour banque "${bank}" et type "${type}"`);
      return errors;
    }
  
    const actualFields = Object.keys(row);
  
    // Champs manquants
    expectedFields.forEach((expectedField) => {
      if (!actualFields.includes(expectedField)) {
        errors.push(`❌ Colonne manquante : "${expectedField}"`);
      }
    });
  
    // Champs en trop
    actualFields.forEach((field) => {
      if (!expectedFields.includes(field)) {
        errors.push(`⚠️ Colonne non attendue : "${field}"`);
      }
    });
  
    return errors;
  }
  
  // ✅ Validation d'une ligne de données
  export function validateRow(row: any): string[] {
    const errors: string[] = [];
  
    // Nettoyage
    Object.keys(row).forEach(key => {
      row[key] = String(row[key]).trim();
    });
  
    const codeBanque = row["Code banque"]?.padStart(2, "0") || "";
    const codeAgence = row["Code agence"]?.padStart(2, "0") || "";
  
    if (!/^\d{2}$/.test(codeBanque)) errors.push("Code banque invalide");
    if (!/^\d{2}$/.test(codeAgence)) errors.push("Code agence invalide");
    if (!/^\d{13}$/.test(row["N° de compte"])) errors.push("N° de compte invalide");
    if (!/^\d{2}$/.test(row["Clé de contrôle"])) errors.push("Clé de contrôle invalide");
    if (row["DIVISE"] && row["DIVISE"] !== "TND") errors.push("Devise invalide");
    if (!row["Titulaire du compte"]) errors.push("Titulaire du compte manquant");
  
    // ✅ Transformation robuste de la date
    let date = row["Date de remise"];
    try {
      if (!isNaN(Number(date))) {
        const jsDate = new Date(Math.round((Number(date) - 25569) * 86400 * 1000));
        row["Date de remise"] = jsDate.toISOString().split("T")[0];
      } else {
        const tryDate = new Date(date);
        if (!isNaN(tryDate.getTime())) {
          row["Date de remise"] = tryDate.toISOString().split("T")[0];
        }
      }
    } catch {
      errors.push("Date invalide");
    }
  
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row["Date de remise"])) {
      errors.push("Date invalide");
    }
  
    if (!row["Nom du déposant"]) errors.push("Nom du déposant manquant");
    if (!/^\d{8}$/.test(row["CIN/PP/CSN"])) errors.push("CIN invalide");
  
    // Remise chèque
    if ("N° Chèque" in row && !row["N° Chèque"]) errors.push("N° Chèque manquant");
    // Remise effet
    if ("N° Effet" in row && !row["N° Effet"]) errors.push("N° Effet manquant");
  
    if (!row["Tireur"]) errors.push("Tireur manquant");
    if (!row["Tiré"]) errors.push("Tiré manquant");
  
    const montant = parseFloat(row["Montant"]);
    if (isNaN(montant) || montant <= 0) errors.push("Montant invalide");
  
    const total = parseFloat(row["Total Remise"]);
    if (isNaN(total) || total <= 0) errors.push("Total Remise invalide");
  
    // facultatif selon banque/type
    if ("Réf. transaction" in row && !row["Réf. transaction"]) {
      errors.push("Réf. transaction manquante");
    }
    if ("Réf. effet" in row && !row["Réf. effet"]) {
      errors.push("Réf. effet manquante");
    }
  
    return errors;
  }
  