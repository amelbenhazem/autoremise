"use client";

import { motion } from "framer-motion"; // Pour les animations
import Image from "next/image";         // Optimisation des images Next.js

// Composant affiché lorsque l'utilisateur est hors ligne
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#89ccff] px-4">
      {/* Container principal centré */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} // Animation initiale
        animate={{ opacity: 1, y: 0 }}  // Animation finale
        transition={{ duration: 0.6 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
      >

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {/* Croix indiquant absence de connexion */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728"
              />
            </svg>
          </div>
        </motion.div>

        {/* Titre */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-800 mb-4"
        >
          Pas de Connexion Internet
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-6 leading-relaxed"
        >
          AutoRemise fonctionne hors ligne ! Vous pouvez toujours utiliser les fonctionnalités 
          de base même sans connexion internet.
        </motion.p>

        {/* Fonctionnalités disponibles hors ligne */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-50 rounded-lg p-4 mb-6"
        >
          <h3 className="font-semibold text-blue-800 mb-2"> Disponible hors ligne :</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>Génération de PDFs</li>
            <li>Traitement des fichiers Excel</li>
            <li>Templates de mapping</li>
            <li>Éditeur de templates</li>
          </ul>
        </motion.div>

        {/* Boutons d'action */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          {/* Bouton pour retourner à l'accueil */}
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Retour à l'Accueil
          </button>
          
          {/* Bouton pour réessayer la connexion */}
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Réessayer
          </button>
        </motion.div>

        {/* Logo en bas */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <Image
            src="/logo-shamashit.png"
            alt="AutoRemise"
            width={120}
            height={40}
            className="mx-auto opacity-60"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
