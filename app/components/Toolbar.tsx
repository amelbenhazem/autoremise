'use client';
import React, { useRef } from 'react';

interface ToolbarProps {
  excelFileName: string | null;
  excelColumns: string[];
  dropdowns: Record<string, string[]>;
  onAddZonesForDropdown: (col: string) => void;

  onSelectImageOrPdf: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;

  onAddZone: () => void;
  addZoneDisabled: boolean;

  onExportMapping: () => void;
  exportDisabled: boolean;

  onImportMappingClick: () => void;

  onGeneratePDFs: () => void;
  generateDisabled: boolean;

  preview: boolean;
  togglePreview: () => void;
  previewDisabled: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  excelFileName,
  excelColumns,
  dropdowns,
  onAddZonesForDropdown,
  onSelectImageOrPdf,
  onSelectExcel,
  onAddZone,
  addZoneDisabled,
  onExportMapping,
  exportDisabled,
  onImportMappingClick,
  onGeneratePDFs,
  generateDisabled,
  preview,
  togglePreview,
  previewDisabled,
}) => {
  const imagePdfInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <input type="file" accept="image/*,application/pdf" ref={imagePdfInputRef} style={{ display: 'none' }} onChange={onSelectImageOrPdf} />
      <button onClick={() => imagePdfInputRef.current?.click()} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow">
        Importer une image ou un PDF
      </button>

      <input type="file" accept=".xlsx,.xls" ref={excelInputRef} style={{ display: 'none' }} onChange={onSelectExcel} />
      <button onClick={() => excelInputRef.current?.click()} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow">
        Importer un fichier Excel
      </button>

      {excelFileName && (
        <span className="text-blue-600">
          Colonnes détectées dans {excelFileName} :{' '}
          {excelColumns.map((col, idx) => (
            <span key={col}>
              {col}
              {dropdowns[col] !== undefined && (
                <>
                  {dropdowns[col].length > 0 ? (
                    <>
                      (<span className="text-red-600">{dropdowns[col].join(', ')}</span>)
                      <button className="ml-1 px-2 py-1 text-[10px] text-red-600 border border-gray-400 rounded bg-white" onClick={() => onAddZonesForDropdown(col)}>
                        + zones
                      </button>
                    </>
                  ) : (
                    <>
                      (<span className="text-gray-500">liste déroulante vide</span>)
                      <button className="ml-1 px-2 py-1 text-[10px] text-blue-600 border border-gray-400 rounded bg-white" onClick={() => onAddZonesForDropdown(col)}>
                        + zones
                      </button>
                    </>
                  )}
                </>
              )}
              {idx < excelColumns.length - 1 ? ', ' : ''}
            </span>
          ))}
        </span>
      )}

      <button onClick={onAddZone} disabled={addZoneDisabled} className="px-4 py-2 bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow">
        Ajouter une zone
      </button>
      <button onClick={onExportMapping} disabled={exportDisabled} className="px-4 py-2 bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow">
        Exporter le mapping JSON
      </button>

      <button onClick={onImportMappingClick} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow">
        Importer un mapping JSON
      </button>

      <button onClick={onGeneratePDFs} disabled={generateDisabled} className="px-4 py-2 bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow">
        Générer les PDF remplis
      </button>
      <button onClick={togglePreview} disabled={previewDisabled} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg shadow">
        {preview ? 'Masquer la prévisualisation' : 'Prévisualiser'}
      </button>
    </div>
  );
};

export default Toolbar;

