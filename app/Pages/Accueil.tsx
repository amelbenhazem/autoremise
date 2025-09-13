"use client";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import styles from '@/styles/HomePage.module.css';
import { usePdfGenerator } from '../hooks';
import { useHomePage } from '../hooks';
import { UploadZone, FileList, PWAInstallPrompt, PWAStatus } from '../components';
import { useRouter } from 'next/navigation';

export default function Accueil() {
	// Utiliser le hook personnalisé pour tout l'état
	const {
		step,
		bank,
		type,
		files,
		excelData,
		uploadProgress,
		loading,
		mapping,
		fileInputRef,
		handleBankChange,
		handleTypeChange,
		handleExcelUpload,
		handleDrop,
		handleDragOver,
		handleFileInput,
	} = useHomePage();

	const router = useRouter();

	// Utiliser le hook existant pour la génération PDF
	const { generatePDFs: generatePDFsFromHook } = usePdfGenerator();

	// Wrapper pour la génération de PDFs
	const handleGeneratePDFs = async () => {
		console.log('🔍 Vérification des données pour génération PDF:');
		console.log('- mapping:', !!mapping);
		console.log('- mapping.background:', !!mapping?.background);
		console.log('- mapping.zones:', mapping?.zones?.length || 0);
		console.log('- excelData.length:', excelData.length);
		
		if (!bank || !type) {
			alert('Veuillez sélectionner une banque et un type.');
			return;
		}

		if (!mapping || !mapping.background || !Array.isArray(mapping.zones) || mapping.zones.length === 0) {
			alert('Mapping manquant ou incomplet pour la banque/type sélectionné.');
			return;
		}

		if (!excelData || excelData.length === 0) {
			alert('Aucune donnée Excel détectée.');
			return;
		}

		// Normaliser les données Excel: si c'est un tableau de tableaux (header:1),
		// convertir en objets { Header: value } pour compatibilité avec le mapping
		let normalizedRows: any[] = [];
		let headers: string[] = [];
		if (Array.isArray(excelData[0])) {
			headers = (excelData[0] as any[]).map(h => String(h ?? '').trim());
			const dataRows = (excelData as any[]).slice(1);
			normalizedRows = dataRows
				.filter(r => Array.isArray(r))
				.map((rowArr: any[]) => {
					const obj: Record<string, any> = {};
					headers.forEach((h, i) => {
						if (h) obj[h] = rowArr[i];
					});
					return obj;
				})
				.filter(obj => Object.keys(obj).length > 0);
		} else if (typeof excelData[0] === 'object' && excelData[0] !== null) {
			normalizedRows = excelData as any[];
			headers = Object.keys(normalizedRows[0] as Record<string, any>);
		} else {
			alert('Format de données Excel non reconnu.');
			return;
		}

		if (normalizedRows.length === 0) {
			alert('Le fichier Excel ne contient pas de lignes exploitables.');
			return;
		}

		// Vérifier que le fichier Excel correspond bien au mapping (banque/type)
		// Prendre seulement les champs dynamiques (sans optionValue fixée)
		const requiredFields: string[] = (mapping.zones || [])
			.filter((z: any) => typeof z?.field === 'string' && z.field.trim().length > 0 && (z.optionValue === undefined || z.optionValue === null || z.optionValue === ''))
			.map((z: any) => z.field.trim());
		const uniqueRequired: string[] = Array.from(new Set<string>(requiredFields));
		const matched = uniqueRequired.filter(f => headers.includes(f));
		// Exiger une correspondance forte: au moins 60% des champs requis ou au moins 3, selon le plus grand,
		// mais si le mapping spécifie <=2 champs, exiger tous.
		const totalRequired = uniqueRequired.length;
		const threshold = totalRequired <= 2 ? totalRequired : Math.max(3, Math.ceil(totalRequired * 0.6));
		if (matched.length < threshold) {
			alert(
				"Le fichier Excel ne correspond pas au format attendu pour la sélection: "
				+ bank + " - " + type
				+ "\nChamps reconnus: " + matched.length + "/" + totalRequired
				+ "\nVeuillez importer un fichier provenant de la même banque/type, ou changez votre sélection."
			);
			return;
		}
		
		const editorWidth = mapping.bgWidth || 800;
		const editorHeight = mapping.bgHeight || 600;
		
		// Les données sont normalisées avec les en-têtes comme clés
		await generatePDFsFromHook(mapping, normalizedRows, editorWidth, editorHeight, { drawBackground: false });
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-[#89ccff] px-2 sm:px-4 relative">
			{/* Composants PWA */}
			<PWAStatus />
			<PWAInstallPrompt />
			{/* Bouton Éditer template en haut à droite */}
			<motion.button
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
				className="absolute top-4 right-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-lg transition-colors duration-200 z-10"
				onClick={() => router.push('/template-editor')}
			>
				Éditer template
			</motion.button>
			
			<motion.div
				className="w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-auto p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl bg-white/90"
				initial={{ scale: 0.95, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 0.5 }}
			>
				<div className="flex flex-col items-center mb-6 sm:mb-8">
					<Image 
						src="/logo-shamashit.png" 
						alt="Shamash Information Technology" 
						width={140} 
						height={60} 
						className="w-32 sm:w-44 h-auto" 
						style={{ width: 'auto', height: 'auto' }}
						priority
					/>
				</div>
				{/* Step 1: Choix banque */}
				<AnimatePresence>
					{step === 0 && (
						<motion.div
							key="bank"
							initial={{ x: -40, opacity: 0 }}
							animate={{ x: 0, opacity: 1 }}
							exit={{ x: 40, opacity: 0 }}
							transition={{ duration: 0.4 }}
							className="mb-4 sm:mb-6"
						>
							<select
								required
								value={bank}
								onChange={handleBankChange}
								className="w-full p-2 sm:p-3 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-400 text-blue-900 text-base sm:text-lg"
							>
								<option value="" disabled hidden>Choisir une banque</option>
						
						
								
								<option value="AMEN">AMEN</option>
								<option value="ALBARAKA">ALBARAKA</option>
								<option value="ZITOUNA">ZITOUNA</option>
								<option value="BNA">BNA</option>
								<option value="BANQUE DE TUNISIE">BANQUE DE TUNISIE</option>
							</select>
						</motion.div>
					)}
				</AnimatePresence>
				{/* Step 2: Choix type */}
				<AnimatePresence>
					{step === 1 && (
						<motion.div
							key="type"
							initial={{ x: -40, opacity: 0 }}
							animate={{ x: 0, opacity: 1 }}
							exit={{ x: 40, opacity: 0 }}
							transition={{ duration: 0.4 }}
							className="mb-4 sm:mb-6"
						>
							<select
								required
								value={type}
								onChange={handleTypeChange}
								className="w-full p-2 sm:p-3 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-400 text-blue-900 text-base sm:text-lg"
							>
								<option value="" disabled hidden>Choisir un type</option>
								<option value="cheque">Chèque</option>
								<option value="effet">Effet</option>
							</select>
						</motion.div>
					)}
				</AnimatePresence>
				{/* Step 3: Zone d'upload animée */}
				<AnimatePresence>
					{step === 2 && (
						<>
							<UploadZone
								onDrop={handleDrop}
								onDragOver={handleDragOver}
								onClick={() => fileInputRef.current?.click()}
								onChange={handleFileInput}
								fileInputRef={fileInputRef}
							/>
							
						</>
					)}
				</AnimatePresence>
				
				{/* Liste des fichiers uploadés */}
				<FileList files={files} uploadProgress={uploadProgress} />

				{/* Bouton Imprimer la remise */}
				{step === 3 && files.length > 0 && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="flex justify-center"
					>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.97 }}
							className="px-6 sm:px-8 py-2 sm:py-3 rounded-full bg-blue-500 text-white font-bold shadow-lg transition text-base sm:text-lg"
							onClick={handleGeneratePDFs}
						>
							Imprimer la remise
						</motion.button>
					</motion.div>
				)}
			</motion.div>
		</div>
	);
}


