'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Zone } from '../../types/editor';
import Toolbar from '../components/Toolbar';
import RecalculatePopup from '../components/RecalculatePopup';
import DimensionsPanel from '../components/DimensionsPanel';
import EditorCanvas from '../components/EditorCanvas';
import { saveAs } from 'file-saver';
import { parseExcel } from '../../utils/parseExcel';
import loadImage from 'blueimp-load-image';
import { hasPermission } from '../hooks/roles';
import { useRouter } from 'next/navigation';
import { usePdfGeneratorForced } from '../hooks/usePdfGeneratorForced';


export default function TemplateEditor() {
	const [bgSrc, setBgSrc] = useState<string | null>(null);
	const [zones, setZones] = useState<Zone[]>([]);
	const [selectedZone, setSelectedZone] = useState<string | null>(null);
	const [pdfPageImage, setPdfPageImage] = useState<string | null>(null);
	const [excelColumns, setExcelColumns] = useState<string[]>([]);
	const [excelFileName, setExcelFileName] = useState<string | null>(null);
	const [excelRows, setExcelRows] = useState<any[]>([]);
	const [preview, setPreview] = useState(false);
	const [dropdowns, setDropdowns] = useState<Record<string, string[]>>({});
	const mappingInputRef = useRef<HTMLInputElement>(null);
	const [importedMapping, setImportedMapping] = useState<any | null>(null);
	const [bgWidth, setBgWidth] = useState<number>(1200);
	const [bgHeight, setBgHeight] = useState<number>(600);
	const [showRecalculatePopup, setShowRecalculatePopup] = useState(false);
	const [forceCmDimensions, setForceCmDimensions] = useState(false);
	const [drawBackground, setDrawBackground] = useState(true);
	const router = useRouter();
	const { generatePDFs: generatePDFsForced } = usePdfGeneratorForced();

	useEffect(() => {
		const storedUser = localStorage.getItem('currentUser');
		const user = storedUser ? JSON.parse(storedUser) : null;
		if (!hasPermission('gererTemplates', user)) {
			router.push('/');
		}
	}, [router]);

	// Initialiser le worker de PDF.js au montage (client-side)
	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				// ts-expect-error: import dynamique sans types dédiés
				let pdfjsLib: any;
				try {
					pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
				} catch {
					pdfjsLib = await import('pdfjs-dist/build/pdf');
				}
				if (!cancelled && pdfjsLib?.GlobalWorkerOptions) {
					const version = pdfjsLib?.version || 'latest';
					// Essayer d'abord la version ESM (.mjs) (non minifiée pour compatibilité unpkg)
					pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.mjs`;
				}
			} catch {
				// ignore
			}
		})();
		return () => { cancelled = true; };
	}, []);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.type === 'application/pdf') {
			const reader = new FileReader();
			reader.onload = async (ev) => {
				const typedarray = new Uint8Array(ev.target?.result as ArrayBuffer);
				// ts-expect-error: pdfjs-dist n'a pas de types pour l'import dynamique
				let pdfjsLib: any;
				try {
					pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
				} catch {
					pdfjsLib = await import('pdfjs-dist/build/pdf');
				}
				// Définir le worker de PDF.js si non configuré pour éviter l'erreur GlobalWorkerOptions.workerSrc
				try {
					if (pdfjsLib?.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
						const version = pdfjsLib?.version || 'latest';
						pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.mjs`;
					}
				} catch { }
				const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
				const page = await pdf.getPage(1);
				const viewport = page.getViewport({ scale: 1.0 }); // Scale 1.0 pour correspondre exactement au PDF
				const canvas = document.createElement('canvas');
				canvas.width = viewport.width;
				canvas.height = viewport.height;
				const ctx = canvas.getContext('2d');
				await page.render({ canvasContext: ctx!, viewport }).promise;
				setPdfPageImage(canvas.toDataURL());
				// Utiliser les dimensions exactes du PDF
				setBgWidth(canvas.width);
				setBgHeight(canvas.height);
				setBgSrc(null);
			};
			reader.readAsArrayBuffer(file);
		} else if (file.type.startsWith('image/')) {
			// Utiliser blueimp-load-image pour corriger l'orientation EXIF
			loadImage(
				file,
				(img: HTMLCanvasElement | HTMLImageElement | Event) => {
					if (img instanceof window.HTMLCanvasElement) {
						const dataUrl = img.toDataURL();
						setBgSrc(dataUrl);
						setPdfPageImage(null);
						// Utiliser les dimensions exactes de l'image
						// Forcer l'image à prendre exactement les dimensions du cadre
						setBgWidth(prev => prev); // garde la largeur actuelle du cadre
						setBgHeight(prev => prev); // garde la hauteur actuelle du cadre

					} else if (img instanceof window.HTMLImageElement) {
						// fallback (rare)
						setBgSrc(img.src);
						setPdfPageImage(null);
						setBgWidth(img.naturalWidth || bgWidth);
						setBgHeight(img.naturalHeight || bgHeight);
					} else {
						alert('Erreur lors du chargement de l\'image.');
					}
				},
				{ orientation: true, canvas: true }
			);
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
			}//Shamash Information Technology
		});
	};

	const handleMappingChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const text = await file.text();
		try {
			const json = JSON.parse(text);
			setImportedMapping(json);
			// Charger les zones et le fond dans la scène d'édition
			if (Array.isArray(json.zones)) {
				setZones(json.zones);
				
				//  Restaurer les dropdowns depuis les zones importées
				const importedDropdowns: Record<string, string[]> = {};
				json.zones.forEach((zone: any) => {
					if (zone.field && zone.options !== undefined) {
						importedDropdowns[zone.field] = zone.options;
					}
				});
				setDropdowns(importedDropdowns);
			}
			if (json.background && typeof json.background === 'string') {
				setBgSrc(json.background);
				setPdfPageImage(null);
			}
			// Toujours utiliser les dimensions du mapping importé, avec des valeurs par défaut si manquantes
			setBgWidth(json.bgWidth || 800);
			setBgHeight(json.bgHeight || 600);
			alert('Mapping importé avec succès');
		} catch {
			alert('Erreur lors de l\'importation du mapping');
		}
	};

	const handleForceCmDimensions = (_width: number, _height: number) => {
		setForceCmDimensions(true);
	};

	// Fonction de génération PDF - toujours le nouveau générateur
	const handleGeneratePDFs = async () => {
		await generatePDFsForced(
			importedMapping,
			excelRows,
			bgWidth,
			bgHeight,
			{ drawBackground, forceCmDimensions, currentBackgroundDataUrl: (bgSrc || pdfPageImage) ?? null },
			zones
		);
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
				// Inclure les listes déroulantes même si elles sont vides
				if (dropdowns[zone.field] !== undefined) {
					options = dropdowns[zone.field];
				} else if (excelRows.length > 0 && zone.field) {
					options = Array.from(new Set(excelRows.map(row => row[zone.field]).filter(v => v !== undefined && v !== null && v !== '')));
				}
				const zoneExport = options !== undefined
					? { ...zone, options }
					: { ...zone };
				if (zone.optionValue) {
					zoneExport.optionValue = zone.optionValue;
				}
				return zoneExport;
			}),
			...(importedMapping && importedMapping.table ? { table: importedMapping.table } : {}),
			// Toujours inclure les dimensions actuelles de l'éditeur
			bgWidth: bgWidth,
			bgHeight: bgHeight,
		};
		const blobToSave = new Blob([JSON.stringify(mapping, null, 2)], { type: 'application/json' });
		saveAs(blobToSave, 'template.json');
	};

	const addZonesForDropdown = (col: string) => {
		if (dropdowns[col] && dropdowns[col].length > 0) {
		  setZones((zones) => {
			const existing = new Set(zones.map(z => `${z.field}__${z.optionValue}`));
			const newZones = dropdowns[col]
			  .filter(opt => !existing.has(`${col}__${opt}`))
			  .map((opt, idx) => ({
				id: `${col}-${opt}-${Date.now()}-${Math.random()}`,
				x: 50,
				y: 50 + idx * (40 + 8),
				width: 120,
				height: 40,
				field: col,
				optionValue: opt,
			  }));
			return [...zones, ...newZones];
		  });
		}
	  };
	  

	return (
		<div className="min-h-screen flex items-center justify-center bg-[#89ccff] px-2 sm:px-4 relative">
			<div className="w-full max-w-7xl mx-auto p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl bg-white/90">
				<div className="flex items-center justify-start my-4">
  <button
    onClick={() => router.back()}
    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-sm transition"
  >
    {/* Icône flèche gauche */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
    Retour
  </button>
</div>

				<DimensionsPanel
					bgWidth={bgWidth}
					bgHeight={bgHeight}
					setBgWidth={setBgWidth}
					setBgHeight={setBgHeight}
					onRecalculate={() => {
						// Verrouiller le mode dimensions forcées à partir des valeurs saisies en cm
						setForceCmDimensions(true);
						setShowRecalculatePopup(true);
					}}
					onForceCmDimensions={handleForceCmDimensions}
				/>

				{/* Option pour le fond */}
				<div className="flex justify-center mb-4">
					<label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
						<input
							type="checkbox"
							checked={drawBackground}
							onChange={(e) => setDrawBackground(e.target.checked)}
							className="w-4 h-4"
						/>
						<span className="text-sm font-medium">Inclure le fond dans le PDF</span>
					</label>
				</div>

			{/* Input caché pour importer un mapping JSON */}
			<input
				type="file"
				accept="application/json,.json"
				ref={mappingInputRef}
				style={{ display: 'none' }}
				onChange={handleMappingChange}
			/>

					<Toolbar
						excelFileName={excelFileName}
						excelColumns={excelColumns}
						dropdowns={dropdowns}
						onAddZonesForDropdown={addZonesForDropdown}
						onSelectImageOrPdf={handleFileChange}
						onSelectExcel={handleExcelChange}
						onAddZone={addZone}
						addZoneDisabled={!bgSrc && !pdfPageImage}
						onExportMapping={exportMapping}
						exportDisabled={zones.length === 0}
						onImportMappingClick={() => mappingInputRef.current?.click()}
						onGeneratePDFs={handleGeneratePDFs}
						generateDisabled={!importedMapping || excelRows.length === 0}
						preview={preview}
						togglePreview={() => setPreview(p => !p)}
						previewDisabled={excelRows.length === 0 || zones.length === 0 || (!bgSrc && !pdfPageImage)}
					/>

					{/* Zone d'édition */}
					<EditorCanvas
						bgSrc={bgSrc}
						pdfPageImage={pdfPageImage}
						bgWidth={bgWidth}
						bgHeight={bgHeight}
						zones={zones}
						selectedZone={selectedZone}
						preview={preview}
						firstRowByField={Object.fromEntries(Object.keys(dropdowns).map(f => [f, excelRows[0]?.[f]]))}
						onUpdateZone={updateZone}
						onSelectZone={setSelectedZone}
					/>

					<RecalculatePopup
						visible={showRecalculatePopup}
						onClose={() => setShowRecalculatePopup(false)}
					/>
				</div>
			</div>
			);

}

