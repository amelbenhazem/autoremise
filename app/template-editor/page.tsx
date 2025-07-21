'use client';
import React, { useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { saveAs } from 'file-saver';
import { parseExcel } from '../../utils/parseExcel';
import { PDFDocument, rgb } from 'pdf-lib';

interface Zone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  field: string;
  optionValue?: string;
}

export default function TemplateEditor() {
  const [bgSrc, setBgSrc] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [pdfPageImage, setPdfPageImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [excelRows, setExcelRows] = useState<any[]>([]);
  const [preview, setPreview] = useState(false);
  const [dropdowns, setDropdowns] = useState<Record<string, string[]>>({});
  const mappingInputRef = useRef<HTMLInputElement>(null);
  const [importedMapping, setImportedMapping] = useState<any | null>(null);
  // Ajout du state pour la taille réelle de l'image de fond
  const [bgWidth, setBgWidth] = useState<number>(800);
  const [bgHeight, setBgHeight] = useState<number>(600);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const typedarray = new Uint8Array(ev.target?.result as ArrayBuffer);
        // @ts-expect-error: pdfjs-dist n'a pas de types pour l'import dynamique
        const pdfjsLib = await import('pdfjs-dist/build/pdf');
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx!, viewport }).promise;
        setPdfPageImage(canvas.toDataURL());
        setBgSrc(null);
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setBgSrc(url);
      setPdfPageImage(null);
      // Récupérer la taille réelle de l'image
      const img = new window.Image();
      img.onload = () => {
        setBgWidth(img.width);
        setBgHeight(img.height);
      };
      img.src = url;
    }
  };

  const handleExcelChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFileName(file.name);
    const excelData = await parseExcel(file);
    setExcelRows(excelData.rows);
    setDropdowns(excelData.dropdowns);
    if (excelData.rows.length > 0) {
      setExcelColumns(Object.keys(excelData.rows[0]));
    } else {
      setExcelColumns([]);
    }
    // Ajout automatique des zones pour chaque colonne avec liste déroulante
    Object.keys(excelData.dropdowns).forEach(col => {
      if (excelData.dropdowns[col] && excelData.dropdowns[col].length > 0) {
        addZonesForDropdown(col);
      }
    });
  };

  const handleMappingChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      setImportedMapping(json);
      if (json.bgWidth && json.bgHeight) {
        setBgWidth(json.bgWidth);
        setBgHeight(json.bgHeight);
      }
      alert('importé');
    } catch {
      alert('Erreur ');
    }
  };

  const generatePDFs = async () => {
    if (!importedMapping || !importedMapping.background || !importedMapping.zones || excelRows.length === 0) {
      alert('image de fond ou donnes Excel manquants');
      return;
    }
    // Récupérer la taille de l'image de fond
    let editorWidth = bgWidth;
    let editorHeight = bgHeight;
    if (importedMapping.background && importedMapping.background.startsWith('data:image/')) {
      // On peut essayer de lire la taille de l'image dynamiquement si besoin
      // mais ici on prend la taille du state (déjà récupérée à l'import)
    }
    for (let i = 0; i < excelRows.length; i++) {
      const row = excelRows[i];
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([editorWidth, editorHeight]);
      if (importedMapping.background && importedMapping.background.startsWith('data:image/')) {
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
        const imgBytes = await dataUrlToArrayBuffer(importedMapping.background);
        if (importedMapping.background.startsWith('data:image/png')) {
          const img = await pdfDoc.embedPng(imgBytes);
          page.drawImage(img, { x: 0, y: 0, width: editorWidth, height: editorHeight });
        } else if (
          importedMapping.background.startsWith('data:image/jpeg') ||
          importedMapping.background.startsWith('data:image/jpg')
        ) {
          const img = await pdfDoc.embedJpg(imgBytes);
          page.drawImage(img, { x: 0, y: 0, width: editorWidth, height: editorHeight });
        } else {
          alert('Format d\'image non supporté pour le fond (seulement PNG ou JPEG)');
          return;
        }
      }
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
        const y = editorHeight - zone.y - (zone.height - fontSize) / 2 - fontSize / 4;
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

  const addZone = () => {
    setZones([
      ...zones,
      {
        id: Date.now().toString(),
        x: 50,
        y: 50,
        width: 120,
        height: 40,
        field: ''
      },
    ]);
  };

  const updateZone = (id: string, data: Partial<Zone>) => {
    setZones(zones.map(z => z.id === id ? { ...z, ...data } : z));
  };

  const updateZoneField = (id: string, field: string) => {
    setZones(zones.map(z => z.id === id ? { ...z, field } : z));
  };

  const exportMapping = async () => {
    let background = bgSrc || pdfPageImage;
    if (background && background.startsWith('blob:')) {
      const response = await fetch(background);
      const blob = await response.blob();
      background = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }
    const mapping = {
      background,
      zones: zones.map(zone => {
        let options: string[] | undefined = undefined;
        if (dropdowns[zone.field] && dropdowns[zone.field].length > 0) {
          options = dropdowns[zone.field];
        } else if (excelRows.length > 0 && zone.field) {
          options = Array.from(new Set(excelRows.map(row => row[zone.field]).filter(v => v !== undefined && v !== null && v !== '')));
        }
        const zoneExport = options && options.length > 0
          ? { ...zone, options }
          : { ...zone };
        if (zone.optionValue) {
          zoneExport.optionValue = zone.optionValue;
        }
        return zoneExport;
      }),
      ...(importedMapping && importedMapping.table ? { table: importedMapping.table } : {}),
      bgWidth,
      bgHeight,
    };
    const blobToSave = new Blob([JSON.stringify(mapping, null, 2)], { type: 'application/json' });
    saveAs(blobToSave, 'template.json');
  };

  const addZonesForDropdown = (col: string) => {
    if (dropdowns[col] && dropdowns[col].length > 0) {
      setZones(zones => {
        const existing = new Set(zones.map(z => `${z.field}__${z.optionValue}`));
        const newZones = dropdowns[col]
          .filter(opt => !existing.has(`${col}__${opt}`))
          .map(opt => ({
            id: `${col}-${opt}-${Date.now()}-${Math.random()}`,
            x: 50,
            y: 50,
            width: 120,
            height: 40,
            field: col,
            optionValue: opt
          }));
        return [...zones, ...newZones];
      });
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <input
        type="file"
        accept="image/*,application/pdf"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button onClick={() => fileInputRef.current?.click()}>Importer une image ou un PDF</button>
      <input
        type="file"
        accept=".xlsx,.xls"
        id="excel-input"
        style={{ display: 'none' }}
        onChange={handleExcelChange}
      />
      <button onClick={() => document.getElementById('excel-input')?.click()} style={{ marginLeft: 8 }}>
        Importer un fichier Excel
      </button>
      {excelFileName && (
        <span style={{ marginLeft: 8, color: '#0070f3' }}>
          Colonnes détectées dans {excelFileName} :{' '}
          {excelColumns.map((col, idx) => (
            <span key={col}>
              {col}
              {dropdowns[col] && dropdowns[col].length > 0 && (
                <>
                  (<span style={{ color: 'red' }}>{dropdowns[col].join(', ')}</span>)
                  <button
                    style={{ marginLeft: 4, fontSize: 10, color: 'red', border: '1px solid #aaa', borderRadius: 4, background: '#fff', cursor: 'pointer' }}
                    onClick={() => addZonesForDropdown(col)}
                  >
                    + zones
                  </button>
                </>
              )}
              {idx < excelColumns.length - 1 ? ', ' : ''}
            </span>
          ))}
        </span>
      )}
      <button onClick={addZone} disabled={!bgSrc && !pdfPageImage} style={{ marginLeft: 8 }}>
        Ajouter une zone
      </button>
      <button onClick={exportMapping} disabled={zones.length === 0} style={{ marginLeft: 8 }}>
        Exporter le mapping JSON
      </button>
      <input
        type="file"
        accept="application/json"
        ref={mappingInputRef}
        style={{ display: 'none' }}
        onChange={handleMappingChange}
      />
      <button onClick={() => mappingInputRef.current?.click()} style={{ marginRight: 8 }}>
        Importer un mapping JSON
      </button>
      <button onClick={generatePDFs} disabled={!importedMapping || excelRows.length === 0} style={{ marginRight: 8 }}>
        Générer les PDF remplis
      </button>
      <button onClick={() => setPreview(p => !p)} disabled={excelRows.length === 0 || zones.length === 0 || (!bgSrc && !pdfPageImage)} style={{ marginLeft: 8}}>
        {preview ? 'Masquer la prévisualisation' : 'Prévisualiser'}
      </button>
      <div style={{ position: 'relative', marginTop: 24, border: '1px solid #ccc', width: bgWidth, height: bgHeight, background: '#f9f9f9' }}>
        {(bgSrc || pdfPageImage) && (
          <img
            src={bgSrc || pdfPageImage || ''}
            alt="template background"
            style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', left: 0, top: 0 }}
          />
        )}
        {zones.map(zone => (
          <Rnd
            key={zone.id}
            size={{ width: zone.width, height: zone.height }}
            position={{ x: zone.x, y: zone.y }}
            onDragStop={(_, d) => updateZone(zone.id, { x: d.x, y: d.y })}
            onResizeStop={(_, __, ref, ___, pos) => updateZone(zone.id, { width: ref.offsetWidth, height: ref.offsetHeight, x: pos.x, y: pos.y })}
            bounds="parent"
            style={{
              border: selectedZone === zone.id ? '2px solid #0070f3' : '2px dashed #333',
              background: 'rgba(255,255,255,0.3)',
              zIndex: 2,
            }}
            onClick={() => setSelectedZone(zone.id)}
            disableDragging={preview}
            enableResizing={!preview}
          >
            {zone.optionValue ? (
              <div style={{ fontWeight: 600, fontSize: 13, color: '#111', marginBottom: 2 }}>
                {zone.field}
                <span style={{ color: 'red', marginLeft: 6 }}>({zone.optionValue})</span>
              </div>
            ) : dropdowns[zone.field] && dropdowns[zone.field].length > 0 && !preview ? (
              <div style={{ width: '100%' }}>
                <div style={{ color: 'red', fontWeight: 600, fontSize: 13 }}>{zone.field}</div>
                <div style={{ color: 'red', fontSize: 12, marginTop: 2, wordBreak: 'break-all' }}>
                  {dropdowns[zone.field].join('; ')}
                </div>
                <select
                  value={zone.field}
                  onChange={e => updateZoneField(zone.id, e.target.value)}
                  style={{
                    width: '90%',
                    margin: 2,
                    border: '2px solid red',
                    color: 'red',
                  }}
                >
                  <option value="">-- Associer à une colonne --</option>
                  {excelColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            ) : excelColumns.length > 0 && !preview ? (
              <div>
                <select
                  value={zone.field}
                  onChange={e => updateZoneField(zone.id, e.target.value)}
                  style={{
                    width: '90%',
                    margin: 2,
                    border: '2px solid',
                    borderColor: dropdowns[zone.field] && dropdowns[zone.field].length > 0 ? 'red' : '#0070f3',
                    color: dropdowns[zone.field] && dropdowns[zone.field].length > 0 ? 'red' : '#0070f3'
                  }}
                >
                  <option value="">-- Associer à une colonne --</option>
                  {excelColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            ) : !preview ? (
              <input
                type="text"
                placeholder="Nom du champ Excel"
                value={zone.field}
                onChange={e => updateZoneField(zone.id, e.target.value)}
                style={{ width: '90%', margin: 2 }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: Math.max(10, Math.min(zone.height, zone.width) / 2),
                color: '#111',
                background: 'rgba(255,255,255,0.7)',
                borderRadius: 4,
                overflow: 'hidden',
                textAlign: 'center',
                padding: 2,
              }}>
                {excelRows[0]?.[zone.field] || <span style={{ color: '#aaa' }}>Aucune donnée</span>}
              </div>
            )}
          </Rnd>
        ))}
      </div>
    </div>
  );
} 