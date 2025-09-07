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
		
		if (!mapping || !mapping.background || !mapping.zones || excelData.length < 1) {
			alert('Mapping ou données Excel manquants');
			return;
		}
		
		const editorWidth = mapping.bgWidth || 800;
		const editorHeight = mapping.bgHeight || 600;
		
		// Les données sont déjà formatées avec les en-têtes comme clés
		await generatePDFsFromHook(mapping, excelData, editorWidth, editorHeight);
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
						
								<option value="ATB">ATB</option>
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


