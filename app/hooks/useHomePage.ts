import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

// Hook personnalisé pour gérer la page d'accueil / workflow upload Excel
export const useHomePage = () => {
  const [step, setStep] = useState(0); // Étape actuelle du workflow (0 = sélection banque)
  const [bank, setBank] = useState(""); // Banque sélectionnée
  const [type, setType] = useState(""); // Type de document (ex: chèque, effet)
  const [files, setFiles] = useState<File[]>([]); // Fichiers uploadés
  const [excelData, setExcelData] = useState<any[]>([]); // Contenu du fichier Excel
  const [uploadProgress, setUploadProgress] = useState<number[]>([]); // Progression d'upload simulée
  const [loading, setLoading] = useState(false); // Indicateur de chargement
  const [mapping, setMapping] = useState<any | null>(null); // Mapping JSON correspondant à banque/type
  const fileInputRef = useRef<HTMLInputElement>(null); // Référence input fichier pour réinitialisation

  console.log("useHomePage hook loaded - version 2.3");

  //  Fonction pour réinitialiser complètement le workflow
  const resetUpload = () => {
    setStep(0);
    setBank("");
    setType("");
    setFiles([]);
    setExcelData([]);
    setUploadProgress([]);
    setLoading(false);
    setMapping(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Réinitialisation de l'input HTML
    }
    console.log("Upload reset ");
  };

  // Charger le mapping JSON correspondant à la banque et au type
  useEffect(() => {
    if (bank && type) {
      const currentMappingKey = `${bank}-${type}`;
      if (mapping && mapping._mappingKey === currentMappingKey) {
        console.log("Mapping déjà chargé pour", currentMappingKey);
        return;
      }

      // Liste des chemins possibles pour le mapping JSON
      const candidates = [
        `/mappings/${bank}-${type}.json`,
        `/mappings/${bank}-${type.toLowerCase()}.json`,
        `/mappings/${type}_${bank}.json`,
        `/mappings/${type.toLowerCase()}_${bank.toLowerCase()}.json`,
      ];

      // Cas spéciaux : mapping pré-définis selon banque/type
      if (bank.toUpperCase() === "ZITOUNA" && type.toLowerCase() === "effet") {
        candidates.unshift("/mappings/effet_zitouna.json");
      }
      if (bank.toUpperCase() === "UBCI" && type.toLowerCase() === "cheque") {
        candidates.unshift("/mappings/chequeubci.json");
      }
      if (bank.toUpperCase() === "BNA" && type.toLowerCase() === "cheque") {
        candidates.unshift("/mappings/rcheque_bna.json");
      }
      if (bank.toUpperCase() === "BNA" && type.toLowerCase() === "effet") {
        candidates.unshift("/mappings/bnaeffet.json");
      }
      if (bank.toUpperCase() === "AMEN" && type.toLowerCase() === "cheque") {
        candidates.unshift("/mappings/amen_cheque.json");
      }
      if (bank.toUpperCase() === "AMEN" && type.toLowerCase() === "effet") {
        candidates.unshift("/mappings/effet_amen_bank.json");
        console.log("AMEN effet détecté, ajout de effet_amen_bank.json en priorité");
      }
      if (bank.toUpperCase() === "BANQUE DE TUNISIE" && type.toLowerCase() === "cheque") {
        candidates.unshift("/mappings/chequetunisie.json");
      }
      if (bank.toUpperCase() === "BANQUE DE TUNISIE" && type.toLowerCase() === "effet") {
        candidates.unshift("/mappings/effetbanktunisia.json");
      }

      console.log("Tentatives de chargement mapping:", candidates);
      let cancelled = false;

      // Chargement asynchrone du mapping
      (async () => {
        for (const path of candidates) {
          if (cancelled) break;
          try {
            const res = await fetch(path);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (!cancelled) {
              console.log("Mapping chargé avec succès depuis:", path);
              setMapping({ ...json, _mappingKey: currentMappingKey });
              return;
            }
          } catch (e) {
            if (!cancelled) {
              console.warn("Échec chargement mapping:", path, e);
            }
          }
        }
        if (!cancelled) {
          console.error("Aucun mapping trouvé pour", bank, type);
          setMapping(null);
        }
      })();

      return () => {
        cancelled = true; // Annule la boucle si le composant se démonte
      };
    } else {
      console.log("bank ou type manquant, mapping mis à null");
      setMapping(null);
    }
  }, [bank, type, mapping?._mappingKey]);

  // 🔹 Simulation de progression d'upload
  useEffect(() => {
    if (loading) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5; // Incrément aléatoire
        if (progress >= 100) {
          progress = 100;
          setLoading(false);
          clearInterval(interval);
        }
        setUploadProgress([progress]);
      }, 120);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Handlers pour interactions utilisateur
  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBank(e.target.value);
    setType("");
    setFiles([]);
    setExcelData([]);
    setStep(1); // Étape suivante après sélection banque
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setType(e.target.value);
    setFiles([]);
    setExcelData([]);
    setStep(2); // Étape suivante après sélection type
  };

  const handleExcelUpload = (file: File) => {
    setLoading(true);
    setFiles([file]);
    setUploadProgress([0]);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Lire toutes les lignes
      setExcelData(rows);
      setTimeout(() => setStep(3), 500); // Avance vers étape 3 après lecture Excel
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
      handleExcelUpload(file);
    } else {
      alert("Veuillez déposer un fichier Excel (.xlsx ou .xls)");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Nécessaire pour autoriser le drop
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        handleExcelUpload(file);
      } else {
        alert("Veuillez sélectionner un fichier Excel (.xlsx ou .xls)");
        e.target.value = "";
      }
    }
  };

  //  Retour des états et fonctions pour le composant
  return {
    // États
    step,
    bank,
    type,
    files,
    excelData,
    uploadProgress,
    loading,
    mapping,
    fileInputRef,

    // Handlers
    handleBankChange,
    handleTypeChange,
    handleExcelUpload,
    handleDrop,
    handleDragOver,
    handleFileInput,

    // Réinitialisation complète
    resetUpload,
  };
};
