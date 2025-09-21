'use client';
import React, { useEffect, useRef, useState } from 'react';
// import { Rnd } from 'react-rnd';
import { Zone } from '../../types/editor';
import ZoneBox from '../components/ZoneBox';
import Toolbar from '../components/Toolbar';
import RecalculatePopup from '../components/RecalculatePopup';
import DimensionsPanel from '../components/DimensionsPanel';
import EditorCanvas from '../components/EditorCanvas';
import { saveAs } from 'file-saver';
import { parseExcel } from '../../utils/parseExcel';
import { PDFDocument, rgb } from 'pdf-lib';
import loadImage from 'blueimp-load-image';
import { hasPermission } from '../hooks/roles';
import { useRouter } from 'next/navigation';
// Imports PDF supprimés - tout est maintenant dans usePdfGeneratorForced
import { usePdfGeneratorForced } from '../hooks/usePdfGeneratorForced';


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
	const [bgWidth, setBgWidth] = useState<number>(1200);
	const [bgHeight, setBgHeight] = useState<number>(600);
	const [showRecalculatePopup, setShowRecalculatePopup] = useState(false);
	const [forceCmDimensions, setForceCmDimensions] = useState(false);
	const [drawBackground, setDrawBackground] = useState(true); // 🔑 Option pour dessiner le fond
	// Les anciens toggles de générateur sont supprimés; on utilise toujours le nouveau générateur
	const router = useRouter();
  	const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
	
	// 🔑 Utiliser les générateurs PDF
	const { generatePDFs: generatePDFsForced } = usePdfGeneratorForced();

	useEffect(() => {
		if (!hasPermission('gererTemplates', currentUser)) {
		router.push('/'); // redirection si pas la permission
		}
	}, []);

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

	// State pour les dimensions réelles en cm
	const [realWidthCm, setRealWidthCm] = useState<number>(21);  // exemple A4 largeur
	const [realHeightCm, setRealHeightCm] = useState<number>(29.7); // exemple A4 hauteur

	// Fonction pour recalculer la zone en points
	const recalcZoneSize = () => {
		const pointsPerCm = 28.35; // 1 cm = 28.35 points
		setBgWidth(realWidthCm * pointsPerCm);
		setBgHeight(realHeightCm * pointsPerCm);
	};

	function calculateFontSize(text: string, width: number, height: number) {
		let fontSize = Math.min(height / 2, width / 6);

		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		if (ctx) {
			ctx.font = `${fontSize}px Arial`;
			let textWidth = ctx.measureText(text).width;

			while (textWidth > width - 8 && fontSize > 6) {
				fontSize -= 1;
				ctx.font = `${fontSize}px Arial`;
				textWidth = ctx.measureText(text).width;
			}
		}
		return fontSize;
	}
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
				
				// ✅ Restaurer les dropdowns depuis les zones importées
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

		const loadTunisiaMapping = async () => {
		try {
			const response = await fetch('/mappings/effetbanktunisia.json');
			if (!response.ok) {
				throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
			}
			const json = await response.json();
			setImportedMapping(json);
			// Charger les zones et le fond dans la scène d'édition
			if (Array.isArray(json.zones)) {
				setZones(json.zones);
				
				// ✅ Restaurer les dropdowns depuis les zones importées
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
			// Utiliser les dimensions du mapping
			setBgWidth(json.bgWidth || 800);
			setBgHeight(json.bgHeight || 600);
			alert(`Mapping Banque Tunisie chargé avec succès - ${json.zones?.length || 0} zones trouvées`);
		} catch (error) {
			const msg = (error instanceof Error) ? error.message : String(error);
			alert(`Erreur lors du chargement du mapping Banque Tunisie: ${msg}`);
			console.error('Erreur détaillée:', error);
		}
	};

	const handleTunisiaMappingFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Vérifier que c'est bien le fichier effetbanktunisia.json
		if (!file.name.includes('effetbanktunisia')) {
			alert('Veuillez sélectionner le fichier effetbanktunisia.json');
			return;
		}

		const text = await file.text();
		try {
			const json = JSON.parse(text);
			setImportedMapping(json);
			// Charger les zones et le fond dans la scène d'édition
			if (Array.isArray(json.zones)) {
				setZones(json.zones);
			}
			if (json.background && typeof json.background === 'string') {
				setBgSrc(json.background);
				setPdfPageImage(null);
			}
			// Utiliser les dimensions du mapping
			setBgWidth(json.bgWidth || 800);
			setBgHeight(json.bgHeight || 600);
			alert(`Mapping Banque Tunisie chargé depuis le fichier - ${json.zones?.length || 0} zones trouvées`);
		} catch (error) {
			alert('Erreur lors de l\'importation du fichier mapping Banque Tunisie');
			console.error('Erreur détaillée:', error);
		}
	};
	

const calculatePdfFontSize = (text: string, zoneWidth: number, zoneHeight: number, font: any) => {
	let fontSize = zoneHeight; // Commencer avec la hauteur max de la zone
	while (fontSize > 1) {
		const textWidth = font.widthOfTextAtSize(text, fontSize);
		const textHeight = fontSize; // approximation : la hauteur ≈ fontSize
		if (textWidth <= zoneWidth && textHeight <= zoneHeight) break;
		fontSize -= 0.5; // réduire progressivement
	}
	return fontSize;
};


// Code PDF supprimé - tout est maintenant dans usePdfGeneratorForced

	// 🔑 Fonction pour forcer les dimensions en cm
	const handleForceCmDimensions = (width: number, height: number) => {
		console.log(`🔑 Dimensions forcées en cm: ${width} x ${height}`);
		setForceCmDimensions(true);
		// Les dimensions sont déjà mises à jour par le DimensionsPanel
	};

	// 🔑 Fonction de génération PDF - toujours le nouveau générateur
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
				// ✅ Inclure les listes déroulantes même si elles sont vides
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

			{/* Les boutons de bascule de générateur ont été retirés */}

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

					{/* Popup recalcul */}
					{showRecalculatePopup && (
						<div className="relative bg-white rounded-xl p-4 shadow-lg text-center mx-auto mt-4 max-w-md">
							<h3 className="text-yellow-600 font-bold text-lg mb-2"> Recalcul effectué !</h3>
							<p>La zone a été recalculée selon les dimensions données.</p>
							<button
								className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg"
								onClick={() => setShowRecalculatePopup(false)}
							>
								Fermer
							</button>
						</div>
					)}
				</div>
			</div>
			);

}


