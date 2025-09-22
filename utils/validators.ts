// Mapping des colonnes attendues par banque et type de remise
const requiredFieldsMap: {
  [bank: string]: {
    [type: string]: string[];
  };
} = {  UBCI: {
  cheque: [
    "etablissementpayeur",
    "nom",
    "adresse",
    "rib2",
    "montant",
    "total",
    "rib6",
    "rib3",
    "rib4",
    "rib5"
  ],
  effet: [
    "lieudepaiement",
    "nom",
    "adresse",
    "rib2",
    "montant",
    "total",
    "echance",
    "rib3",
    "rib4",
    "rib5",
    "rib6"
  ]
},
AMEN: {
  cheque: [
    "Nom émetteur",
    "Numéro chèque",
    "Banque",
    "Localité",
    "Montant",
    "Total",
    "Compte numéro2",
    "Compte numéro3"
  ],
  effet: [
    "Compte numéro1",
    "Titulaire de compte",
    "Nom émetteur",
    "Numéro chèque",
    "Banque",
    "Localité",
    "Montant",
    "Total",
    "Compte numéro2",
    "Compte numéro3"
  ]
},
  BIAT: {
    cheque: [
      "etablissement payeur",
      "nom",
      "rib3",
      "rib1",
      "montant",
      "total",
      "numcheque",
      "rib2",
      "cle",
      "nom tireur",
      "refclient"
    ],
    effet: [
      "banque",
      "nom",
      "rib3",
      "rib1",
      "montant",
      "total",
      "numeffet",
      "rib2",
      "cle",
      "tire",
      "acc",
      "code ptt",
      "ville",
      "code agence",
      "echeance",
      "date creation"
    ]
  },
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
  },
  BNA: {
    cheque: [
      "Effectué Par",
      "S’élevant à",
      "Numéro Compte",
      "cle",
      "code",
      "total",
      "montant",
      "Tireur",
      "banque",
      "valeur"
    ],
    effet: [
      "lieudepaiement",
      "Tire",
      "Numéro Compte",
      "cle",
      "montant",
      "total",
      "echance"
    ]
  },
  ATTIJARI_BANK: {
    effet: [
      "Nom du tiré",
      "Banque",
      "Ville",
      "Échéance",
      "Montant",
      "RS",
      "NumeroCompte",
      "NomAgence", 
      "Total" 
      
    ]
  }
,  
  "BANK TUNISIE": {
    cheque: [
      "Comptea",
      "Compteb",
      "Comptec",
      "Remisefaveur",
      "effectueepar",
      "cin",
      "date",
      "ville",
      "numcheque",
      "banque",
      "montant",
      "tireur",
      "montanttotal"
    ],
    effet: [
      "RIBa",
      "RIBb",
      "RIBc",
      "RIBd",
      "RIBe",
      "Ouvert à (Agence)",
      "Nom Bénéficiaire",
      "Nom de la Partie Versante",
      "CIN",
      "Numéro Effet",
      "Banque",
      "Ville",
      "Tiré",
      "Échéance",
      "Montant",
      "Montant Total"
    ]
  },
  // Ajoute d'autres banques ici si besoin
};

// Validation dédiée des en-têtes (liste de colonnes)
export function validateHeaders(headers: string[], bank: string, type: string): { missing: string[]; unexpected: string[] } {
  const normalize = (s: string) =>
    String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // accents
      .replace(/\s+/g, '') // espaces
      .replace(/[^a-z0-9]/g, ''); // ponctuation

  const expected = requiredFieldsMap[bank]?.[type] || [];
  const normalizedHeaders = headers.map(normalize);

  const missing: string[] = [];
  const unexpected: string[] = [];

  // Champs manquants
  expected.forEach((exp) => {
    if (!normalizedHeaders.includes(normalize(exp))) {
      missing.push(exp);
    }
  });

  // Champs en trop (faible sévérité)
  headers.forEach((h) => {
    if (!expected.some((exp) => normalize(exp) === normalize(h))) {
      unexpected.push(h);
    }
  });

  return { missing, unexpected };
}

// Validation des entêtes du fichier
export function validateHeader(row: any, bank: string, type: string): string[] {
  const errors: string[] = [];

  const expectedFields = requiredFieldsMap[bank]?.[type];
  if (!expectedFields) {
    errors.push(` Structure non définie pour banque "${bank}" et type "${type}"`);
    return errors;
  }

  const actualFields = Object.keys(row);

  // Champs manquants
  expectedFields.forEach((expectedField) => {
    if (!actualFields.includes(expectedField)) {
      errors.push(` Colonne manquante : "${expectedField}"`);
    }
  });

  // Champs en trop
  actualFields.forEach((field) => {
    if (!expectedFields.includes(field)) {
      errors.push(`Colonne non attendue : "${field}"`);
    }
  });

  return errors;
}

// Validation d'une ligne de données
export function validateRow(row: any, bank?: string): string[] {
  const errors: string[] = [];

  // Nettoyage
  Object.keys(row).forEach(key => {
    row[key] = String(row[key]).trim();
  });

  // Si le montant est vide ou à zéro, ignorer la validation (ligne de template)
  if (!row["Montant"] || row["Montant"] === "0" || row["Montant"] === 0) {
    return [];
  }

  const codeBanque = row["Code banque"]?.padStart(2, "0") || "";
  const codeAgence = row["Code agence"]?.padStart(2, "0") || "";

  if (!/^\d{2}$/.test(codeBanque)) errors.push("Code banque invalide");
  if (!/^\d{2}$/.test(codeAgence)) errors.push("Code agence invalide");
  if (!/^\d{13}$/.test(row["N° de compte"])) errors.push("N° de compte invalide");
  if (!/^\d{2}$/.test(row["Clé de contrôle"])) errors.push("Clé de contrôle invalide");
  if (row["DIVISE"] && row["DIVISE"] !== "TND") errors.push("Devise invalide");
  if (!row["Titulaire du compte"]) errors.push("Titulaire du compte manquant");

  // Transformation robuste de la date
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

  // Validation spécifique selon la banque
  if (bank === "ZITOUNA") {
    // Pour ZITOUNA, certains champs sont optionnels ou ont des noms différents
    if (!row["nbre de cheques"]) errors.push("nbre de cheques manquant");
    if (!row["Agence"]) errors.push("Agence manquante");
  } else {
    // Validation standard pour les autres banques
    if (!row["Nom du déposant"]) errors.push("Nom du déposant manquant");
    if (!/^\d{8}$/.test(row["CIN/PP/CSN"])) errors.push("CIN invalide");
  }

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
