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

  // Charger le mapping JSON après choix banque/type
  useEffect(() => {
    if (bank && type) {
      const mappingPath = `/mappings/${bank}-${type}.json`;
      console.log('Chargement du mapping depuis:', mappingPath);
      fetch(mappingPath)
        .then(res => {
          console.log('Réponse fetch:', res.status, res.statusText);
          if (!res.ok) throw new Error('Mapping non trouvé');
          return res.json();
        })
        .then(json => {
          console.log('Mapping chargé avec succès:', json);
          setMapping(json);
        })
        .catch((error) => {
          console.error('Erreur lors du chargement du mapping:', error);
          setMapping(null);
        });
    } else {
      console.log('bank ou type manquant, mapping mis à null');
      setMapping(null);
    }
  }, [bank, type]);

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
      handleExcelUpload(file);
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
