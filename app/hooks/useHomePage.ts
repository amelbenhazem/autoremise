import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

export const useHomePage = () => {
  const [step, setStep] = useState(0);
  const [bank, setBank] = useState("");
  const [type, setType] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapping, setMapping] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Force reload fix for AMEN mapping
  console.log('useHomePage hook loaded - version 2.1');

  // Charger le mapping JSON après choix banque/type
  useEffect(() => {
    if (bank && type) {
      // Éviter de recharger si le mapping actuel correspond déjà
      const currentMappingKey = `${bank}-${type}`;
      if (mapping && mapping._mappingKey === currentMappingKey) {
        console.log('Mapping déjà chargé pour', currentMappingKey);
        return;
      }
      
      // Essayer plusieurs conventions de nommage pour compatibilité
      const candidates = [
        `/mappings/${bank}-${type}.json`,
        `/mappings/${bank}-${type.toLowerCase()}.json`,
        `/mappings/${type}_${bank}.json`,
        `/mappings/${type.toLowerCase()}_${bank.toLowerCase()}.json`,
      ];
      // Cas particulier connu: effet ZITOUNA nommé "effet_zitouna.json"
      if (bank.toUpperCase() === 'ZITOUNA' && type.toLowerCase() === 'effet') {
        candidates.unshift('/mappings/effet_zitouna.json');
      }
      // Cas particulier connu: chèque BNA nommé "rcheque_bna.json"
      if (bank.toUpperCase() === 'BNA' && type.toLowerCase() === 'cheque') {
        candidates.unshift('/mappings/rcheque_bna.json');
      }
      // Cas particulier connu: effet BNA nommé "bnaeffet.json"
      if (bank.toUpperCase() === 'BNA' && type.toLowerCase() === 'effet') {
        candidates.unshift('/mappings/bnaeffet.json');
      }
      // Cas particulier connu: chèque AMEN nommé "amen_cheque.json"
      if (bank.toUpperCase() === 'AMEN' && type.toLowerCase() === 'cheque') {
        candidates.unshift('/mappings/amen_cheque.json');
      }
      // Cas particulier connu: effet AMEN nommé "effet_amen_bank.json"
      if (bank.toUpperCase() === 'AMEN' && type.toLowerCase() === 'effet') {
        candidates.unshift('/mappings/effet_amen_bank.json');
        console.log('AMEN effet détecté, ajout de effet_amen_bank.json en priorité - v3');
      }
      // Cas particulier connu: chèque BANQUE DE TUNISIE nommé "chequetunisie.json"
      if (bank.toUpperCase() === 'BANQUE DE TUNISIE' && type.toLowerCase() === 'cheque') {
        candidates.unshift('/mappings/chequetunisie.json');
      }
      // Cas particulier connu: effet BANQUE DE TUNISIE nommé "effetbanktunisia.json"
      if (bank.toUpperCase() === 'BANQUE DE TUNISIE' && type.toLowerCase() === 'effet') {
        candidates.unshift('/mappings/effetbanktunisia.json');
        console.log('BANQUE DE TUNISIE effet détecté, ajout de effetbanktunisia.json en priorité');
      }
      console.log('Tentatives de chargement mapping:', candidates);
      let cancelled = false;
      (async () => {
        for (const path of candidates) {
          if (cancelled) break;
          try {
            const res = await fetch(path);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (!cancelled) {
              console.log('Mapping chargé avec succès depuis:', path);
              setMapping({ ...json, _mappingKey: currentMappingKey });
              return;
            }
          } catch (e) {
            if (!cancelled) {
              console.warn('Échec chargement mapping:', path, e);
            }
          }
        }
        if (!cancelled) {
          console.error('Aucun mapping trouvé pour', bank, type);
          setMapping(null);
        }
      })();
      return () => { cancelled = true; };
    } else {
      console.log('bank ou type manquant, mapping mis à null');
      setMapping(null);
    }
  }, [bank, type, mapping?._mappingKey]);

  // Simule la progression d'upload
  useEffect(() => {
    if (loading) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5; // incrémente de 5 à 15
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

  // Handler banque
  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBank(e.target.value);
    setType("");
    setFiles([]);
    setExcelData([]);
    setStep(1);
  };

  // Handler type
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setType(e.target.value);
    setFiles([]);
    setExcelData([]);
    setStep(2);
  };

  // Handler upload Excel
  const handleExcelUpload = (file: File) => {
    setLoading(true);
    setFiles([file]);
    setUploadProgress([0]);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      setExcelData(rows);
      setTimeout(() => setStep(3), 500);
    };
    reader.readAsArrayBuffer(file);
  };

  // Drag & drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('🎯 Hook handleDrop called');
    console.log('🎯 Files dropped:', e.dataTransfer.files);
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      console.log('🎯 Valid Excel file detected:', file.name);
      handleExcelUpload(file);
    } else {
      console.log('🎯 Invalid file type:', file?.name, file?.type);
      alert('Veuillez déposer un fichier Excel (.xlsx ou .xls)');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('🎯 Hook handleDragOver called');
    e.preventDefault();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎯 Hook handleFileInput called');
    const file = e.target.files?.[0];
    if (file) {
      console.log('🎯 File selected via input:', file.name);
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        handleExcelUpload(file);
      } else {
        alert('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
        e.target.value = '';
      }
    }
  };

  return {
    // État
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
  };
};
