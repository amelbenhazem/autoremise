'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { saveAs } from 'file-saver';
import { parseExcel } from '../../utils/parseExcel';
import { PDFDocument, rgb } from 'pdf-lib';
import loadImage from 'blueimp-load-image';

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

	// Initialiser le worker de PDF.js au montage (client-side)
	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				// @ts-expect-error: import dynamique sans types dédiés
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
				// @ts-expect-error: pdfjs-dist n'a pas de types pour l'import dynamique
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
				} catch {}
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
						setBgWidth(img.width);
						setBgHeight(img.height);
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
			alert(`Erreur lors du chargement du mapping Banque Tunisie: ${error.message}`);
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

	const generatePDFs = async () => {
		if (!importedMapping || !importedMapping.background || !importedMapping.zones || excelRows.length === 0) {
			alert('image de fond ou donnes Excel manquants');
			return;
		}
		// Utiliser exactement les mêmes dimensions que l'éditeur
		let editorWidth = bgWidth;
		let editorHeight = bgHeight;
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
				// Centrer le texte horizontalement dans la zone
				const x = zone.x + (zone.width - textWidth) / 2;
				// Position Y précise : inverser et ajuster pour la baseline
				const y = editorHeight - zone.y - zone.height + fontSize;
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
			// Toujours inclure les dimensions actuelles de l'éditeur
			bgWidth: bgWidth,
			bgHeight: bgHeight,
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
		<div className="min-h-screen flex items-center justify-center bg-[#89ccff] px-2 sm:px-4 relative">
			<div className="w-full max-w-7xl mx-auto p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl bg-white/90">
				<input
					type="file"
					accept="image/*,application/pdf"
					ref={fileInputRef}
					style={{ display: 'none' }}
					onChange={handleFileChange}
				/>
				<div className="flex flex-wrap gap-2 mb-4">
					<button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow">
						Importer une image ou un PDF
					</button>
					<input
						type="file"
						accept=".xlsx,.xls"
						id="excel-input"
						style={{ display: 'none' }}
						onChange={handleExcelChange}
					/>
					<button onClick={() => document.getElementById('excel-input')?.click()} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow">
						Importer un fichier Excel
					</button>
					{excelFileName && (
						<span className="text-blue-600">
							Colonnes détectées dans {excelFileName} :{' '}
							{excelColumns.map((col, idx) => (
								<span key={col}>
									{col}
									{dropdowns[col] && dropdowns[col].length > 0 && (
										<>
											(<span className="text-red-600">{dropdowns[col].join(', ')}</span>)
											<button className="ml-1 px-2 py-1 text-[10px] text-red-600 border border-gray-400 rounded bg-white"
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
					<button onClick={addZone} disabled={!bgSrc && !pdfPageImage} className="px-4 py-2 bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow">
						Ajouter une zone
					</button>
					<button onClick={exportMapping} disabled={zones.length === 0} className="px-4 py-2 bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow">
						Exporter le mapping JSON
					</button>
					<input
						type="file"
						accept="application/json"
						ref={mappingInputRef}
						style={{ display: 'none' }}
						onChange={handleMappingChange}
					/>
					<button onClick={() => mappingInputRef.current?.click()} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow">
						Importer un mapping JSON
					</button>
					<button onClick={loadTunisiaMapping} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow">
						Charger Banque Tunisie
					</button>
					<input
						type="file"
						accept=".json"
						id="tunisia-mapping-input"
						style={{ display: 'none' }}
						onChange={handleTunisiaMappingFile}
					/>
					<button onClick={() => document.getElementById('tunisia-mapping-input')?.click()} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow">
						Charger Banque Tunisie (Fichier)
					</button>
					<button onClick={generatePDFs} disabled={!importedMapping || excelRows.length === 0} className="px-4 py-2 bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow">
						Générer les PDF remplis
					</button>
					<button onClick={() => setPreview(p => !p)} disabled={excelRows.length === 0 || zones.length === 0 || (!bgSrc && !pdfPageImage)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg shadow">
						{preview ? 'Masquer la prévisualisation' : 'Prévisualiser'}
					</button>
				</div>
				<div className="flex justify-center items-center mt-6">
					<div className="relative overflow-hidden border border-gray-200 shadow-lg" style={{ width: bgWidth, height: bgHeight }}>
					{(bgSrc || pdfPageImage) && (
						<img
							src={bgSrc || pdfPageImage || ''}
							alt="template background"
							style={{ 
								width: '100%', 
								height: '100%', 
								objectFit: 'fill',
								position: 'absolute', 
								left: 0, 
								top: 0,
								zIndex: 1
							}}
						/>
					)}
					{zones.map(zone => {
						return (
						<Rnd
							key={zone.id}
							size={{ width: zone.width, height: zone.height }}
							position={{ x: zone.x, y: zone.y }}
							onDragStop={(_, d) => updateZone(zone.id, { x: d.x, y: d.y })}
							onResizeStop={(_, __, ref, ___, pos) => updateZone(zone.id, { width: ref.offsetWidth, height: ref.offsetHeight, x: pos.x, y: pos.y })}
							bounds="parent"
							style={{
								border: selectedZone === zone.id ? '3px solid #0070f3' : '3px solid #ff0000',
								background: 'rgba(255,255,255,0.9)',
								zIndex: 2,
							}}
							onClick={() => setSelectedZone(zone.id)}
							disableDragging={preview}
							enableResizing={!preview}
						>
							{zone.optionValue ? (
								<div style={{ 
									fontWeight: 600, 
									fontSize: 13, 
									color: '#111', 
									marginBottom: 2,
									background: 'rgba(255,255,255,0.9)',
									padding: '2px 4px',
									borderRadius: '2px',
									textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
								}}>
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
						);
					})}
					</div>
				</div>
			</div>
		</div>
	);
}


