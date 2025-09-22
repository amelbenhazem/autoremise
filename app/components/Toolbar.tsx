'use client';

import React, { useRef } from 'react';

interface ToolbarProps {
  excelFileName: string | null; // Nom du fichier Excel importé (null si aucun)
  excelColumns: string[]; // Liste des colonnes détectées dans le fichier Excel
  dropdowns: Record<string, string[]>; // Map : colonne -> valeurs de liste déroulante associées

  onAddZonesForDropdown: (col: string) => void; // Ajoute des zones pour une colonne donnée

  onSelectImageOrPdf: (e: React.ChangeEvent<HTMLInputElement>) => void; // Callback : sélection d'image ou PDF
  onSelectExcel: (e: React.ChangeEvent<HTMLInputElement>) => void; // Callback : sélection fichier Excel

  onAddZone: () => void; // Ajout d'une zone
  addZoneDisabled: boolean; // Désactive bouton si aucune zone possible

  onExportMapping: () => void; // Export du mapping JSON
  exportDisabled: boolean; // Désactive le bouton d'export

  onImportMappingClick: () => void; // Ouverture du selecteur pour importer un mapping JSON

  onGeneratePDFs: () => void; // Génération des PDF remplis
  generateDisabled: boolean; // Désactive bouton si génération impossible

  preview: boolean; // Indique si le mode preview est actif
  togglePreview: () => void; // Active/désactive preview
  previewDisabled: boolean; // Désactive le bouton si pas possible
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
  // 🔹 Références pour déclencher manuellement les <input type="file">
  const imagePdfInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* Input caché pour image/PDF */}
      <input
        type="file"
        accept="image/*,application/pdf"
        ref={imagePdfInputRef}
        style={{ display: 'none' }}
        onChange={onSelectImageOrPdf}
      />
      <button
        onClick={() => imagePdfInputRef.current?.click()}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow"
      >
        Importer une image ou un PDF
      </button>

      {/* Input caché pour fichier Excel */}
      <input
        type="file"
        accept=".xlsx,.xls"
        ref={excelInputRef}
        style={{ display: 'none' }}
        onChange={onSelectExcel}
      />
      <button
        onClick={() => excelInputRef.current?.click()}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow"
      >
        Importer un fichier Excel
      </button>

      {/* Affichage des colonnes détectées */}
      {excelFileName && (
        <span className="text-blue-600">
          Colonnes détectées dans {excelFileName} :{' '}
          {excelColumns.map((col, idx) => (
            <span key={col}>
              {col}
              {/* Si cette colonne a une liste déroulante associée */}
              {dropdowns[col] !== undefined && (
                <>
                  {dropdowns[col].length > 0 ? (
                    <>
                      {/* Affiche les valeurs existantes en rouge */}
                      (<span className="text-red-600">{dropdowns[col].join(', ')}</span>)
                      <button
                        className="ml-1 px-2 py-1 text-[10px] text-red-600 border border-gray-400 rounded bg-white"
                        onClick={() => onAddZonesForDropdown(col)}
                      >
                        + zones
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Indique que la liste est vide */}
                      (<span className="text-gray-500">liste déroulante vide</span>)
                      <button
                        className="ml-1 px-2 py-1 text-[10px] text-blue-600 border border-gray-400 rounded bg-white"
                        onClick={() => onAddZonesForDropdown(col)}
                      >
                        + zones
                      </button>
                    </>
                  )}
                </>
              )}
              {/* Ajoute une virgule sauf pour la dernière colonne */}
              {idx < excelColumns.length - 1 ? ', ' : ''}
            </span>
          ))}
        </span>
      )}

      {/* Boutons d'action */}
      <button
        onClick={onAddZone}
        disabled={addZoneDisabled}
        className="px-4 py-2 bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow"
      >
        Ajouter une zone
      </button>

      <button
        onClick={onExportMapping}
        disabled={exportDisabled}
        className="px-4 py-2 bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow"
      >
        Exporter le mapping JSON
      </button>

      <button
        onClick={onImportMappingClick}
        className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow"
      >
        Importer un mapping JSON
      </button>

      <button
        onClick={onGeneratePDFs}
        disabled={generateDisabled}
        className="px-4 py-2 bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow"
      >
        Générer les PDF remplis
      </button>

      <button
        onClick={togglePreview}
        disabled={previewDisabled}
        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg shadow"
      >
        {/* Change le texte selon l'état */}
        {preview ? 'Masquer la prévisualisation' : 'Prévisualiser'}
      </button>
    </div>
  );
};

export default Toolbar;
