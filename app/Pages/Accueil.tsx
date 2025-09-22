"use client";
import { motion, AnimatePresence } from "framer-motion"; // Pour les animations fluides
import Image from "next/image";                         // Optimisation des images
import { usePdfGeneratorForced } from "../hooks";       // Hook pour générer les PDFs
import { useHomePage } from "../hooks";                 // Hook pour gérer la logique de la page d'accueil
import { UploadZone, FileList, PWAInstallPrompt, PWAStatus } from "../components"; // Composants UI
import { useRouter } from "next/navigation";            // Navigation Next.js
import { useState, useEffect } from "react";           // Hooks React
import { hasPermission, User } from "../hooks/roles";  // Gestion des permissions utilisateur
import Header from "../components/Header";             // Header de la page
import { validateHeaders } from "../../utils/validators"; // Validation des en-têtes Excel

//  Composant principal de la page d'accueil
export default function Accueil() {
	const router = useRouter();
	const [successPopup, setSuccessPopup] = useState(false); // État pour afficher le popup de succès
	const [currentUser, setCurrentUser] = useState<User | null>(null); // Utilisateur courant

	//  Récupérer l'utilisateur courant depuis localStorage
	useEffect(() => {
		const storedUser = localStorage.getItem("currentUser");
		if (storedUser) {
			setCurrentUser(JSON.parse(storedUser));
		}
	}, []);

	// Hook personnalisé pour gérer l'état de la page
	const {
		step,           // Étape actuelle (0: banque, 1: type, 2: upload, 3: génération)
		bank,           // Banque sélectionnée
		type,           // Type de remise
		files,          // Fichiers uploadés
		excelData,      // Données Excel traitées
		uploadProgress, // Progression upload
		loading,        // Indicateur de chargement
		mapping,        // Mapping zones/fonds
		fileInputRef,   // Référence input fichier
		handleBankChange,
		handleTypeChange,
		handleExcelUpload,
		handleDrop,
		handleDragOver,
		handleFileInput,
		resetUpload,
	} = useHomePage();

	const { generatePDFs: generatePDFsFromHook } = usePdfGeneratorForced();

	//  Fonction pour générer les PDFs
	const handleGeneratePDFs = async () => {
		// Vérification banque/type sélectionnés
		if (!bank || !type) {
		  alert("Veuillez sélectionner une banque et un type.");
		  return;
		}
	  
		// Vérification du mapping
		if (!mapping || !mapping.background || !Array.isArray(mapping.zones) || mapping.zones.length === 0) {
		  alert("Mapping manquant ou incomplet pour la banque/type sélectionné.");
		  return;
		}
	  
		// Vérification des données Excel
		if (!excelData || excelData.length === 0) {
		  alert("Aucune donnée Excel détectée.");
		  return;
		}
	  
		// Normaliser les lignes Excel
		let normalizedRows: any[] = [];
		let headers: string[] = [];
	  
		if (Array.isArray(excelData[0])) {
		  // Cas où Excel est un tableau de tableaux
		  headers = (excelData[0] as any[]).map((h) => String(h ?? "").trim());
		  const dataRows = (excelData as any[]).slice(1);
		  normalizedRows = dataRows
			.filter((r) => Array.isArray(r))
			.map((rowArr: any[]) => {
			  const obj: Record<string, any> = {};
			  headers.forEach((h, i) => {
				if (h) obj[h] = rowArr[i];
			  });
			  return obj;
			})
			.filter((obj) => Object.keys(obj).length > 0);
		} else if (typeof excelData[0] === "object" && excelData[0] !== null) {
		  // Cas où Excel est un tableau d'objets
		  normalizedRows = excelData as any[];
		  headers = Object.keys(normalizedRows[0] as Record<string, any>);
		} else {
		  alert("Format de données Excel non reconnu.");
		  return;
		}
	  
		if (normalizedRows.length === 0) {
		  alert("Le fichier Excel ne contient pas de lignes exploitables.");
		  return;
		}
	  
		// Fonction pour normaliser les champs (minuscules + sans accents + sans espaces)
		function normalizeField(field: string): string {
		  return field
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/\s+/g, "");
		}
	  
		// Champs requis pour la génération
		const requiredFields: string[] = (mapping.zones || [])
		  .filter(
			(z: any) =>
			  typeof z?.field === "string" &&
			  z.field.trim().length > 0 &&
			  (z.optionValue === undefined || z.optionValue === null || z.optionValue === "")
		  )
		  .map((z: any) => z.field.trim());

		// Vérification stricte des en-têtes selon banque/type
		if (bank && type) {
		  const headerValidation = validateHeaders(headers, bank, type);
		  if (headerValidation.missing.length > 0) {
			alert(
			  `Le fichier Excel ne correspond pas au format requis pour ${bank} - ${type}.\nChamps manquants: ${headerValidation.missing.join(", ")}`
			);
			return;
		  }
		}

		const uniqueRequired: string[] = Array.from(new Set<string>(requiredFields));
	  
		// Vérification que suffisamment de champs correspondent
		const matched = uniqueRequired.filter((f) =>
		  headers.some((h) => normalizeField(h) === normalizeField(f))
		);
	  
		const totalRequired = uniqueRequired.length;
		const threshold = totalRequired <= 2 ? totalRequired : Math.max(3, Math.ceil(totalRequired * 0.6));
	  
		if (matched.length < threshold) {
		  alert(
			`Le fichier Excel ne correspond pas au format attendu pour la sélection: ${bank} - ${type}\nChamps reconnus: ${matched.length}/${totalRequired}\nVeuillez importer un fichier provenant de la même banque/type, ou changez votre sélection.`
		  );
		  return;
		}
	  
		const editorWidth = mapping.bgWidth || 800;
		const editorHeight = mapping.bgHeight || 600;
	  
		// Génération des PDFs via le hook
		await generatePDFsFromHook(mapping, normalizedRows, editorWidth, editorHeight, { drawBackground: false });
	  
		// Affichage du popup succès + réinitialisation upload
		setSuccessPopup(true);
		resetUpload();
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	// Rendu JSX
	return (
		<div className="min-h-screen bg-[#89ccff] flex flex-col">
			{/* Header full width */}
			<Header />

			{/* Container central */}
			<div className="min-h-screen flex items-center justify-center bg-[#89ccff] px-2 sm:px-4 relative">

				{/* Statut PWA */}
				<PWAStatus />
				<PWAInstallPrompt />

				{/* Card principale */}
				<motion.div
					className="w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-auto p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl bg-white/90"
					initial={{ scale: 0.95, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ duration: 0.5 }}
				>
					{/* Logo */}
					<div className="flex flex-col items-center mb-6 sm:mb-8">
						<Image
							src="/logo-shamashit.png"
							alt="Shamash Information Technology"
							width={140}
							height={60}
							className="w-32 sm:w-44 h-auto"
							style={{ width: "auto", height: "auto" }}
							priority
						/>
					</div>

					{/* Étapes dynamiques 0 à 2 */}
					<AnimatePresence>
						{/* Étape 0 : Sélection banque */}
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
									<option value="UBCI">UBCI</option>
									<option value="BANQUE DE TUNISIE">BANQUE DE TUNISIE</option>
								</select>
							</motion.div>
						)}
					</AnimatePresence>

					<AnimatePresence>
						{/* Étape 1 : Sélection type */}
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

					<AnimatePresence>
						{/* Étape 2 : Upload fichier Excel */}
						{step === 2 && (
							<UploadZone
								onDrop={handleDrop}
								onDragOver={handleDragOver}
								onClick={() => fileInputRef.current?.click()}
								onChange={handleFileInput}
								fileInputRef={fileInputRef}
							/>
						)}
					</AnimatePresence>

					{/* Liste des fichiers uploadés */}
					<FileList files={files} uploadProgress={uploadProgress} />

					{/* Étape 3 : Bouton générer PDF */}
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

					{/* Popup succès */}
					{successPopup && (
						<div className="relative bg-white rounded-xl p-4 shadow-lg text-center mx-auto mt-4 max-w-md">
							<h2 className="text-green-600 font-bold text-lg mb-2"> Succès !</h2>
							<p>La remise a été imprimée avec succès.</p>
							<button
								className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg"
								onClick={() => setSuccessPopup(false)}
							>
								Fermer
							</button>
						</div>
					)}
				</motion.div>
			</div>
		</div>
	);
}
