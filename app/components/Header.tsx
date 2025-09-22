"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Hook Next.js pour naviguer
import { hasPermission, User } from "../hooks/roles"; // Gestion des rôles et permissions
import { motion } from "framer-motion"; //  Pour les animations des boutons

export default function Header() {
  const router = useRouter();

  // Stocke l'utilisateur courant (ou null si non connecté)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  /**
   * Récupère l'utilisateur courant depuis le localStorage lors du montage.
   * Si un utilisateur est trouvé, on le sauvegarde dans l'état.
   */
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
  }, []);

  /**
   * Fonction de déconnexion :
   * - Supprime l'utilisateur du localStorage.
   * - Redirige vers la page de login.
   */
  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.push("/signin");
  };

  /**
   * Redirige vers l'éditeur de template (si l'utilisateur a la permission).
   */
  const goToTemplateEditor = () => {
    router.push("/template-editor");
  };

  return (
    <header className="w-full flex justify-between items-center p-4 bg-white shadow-md">
      {/* Affiche le nom de l'utilisateur si connecté */}
      <div className="text-lg font-semibold text-gray-700">
        {currentUser ? `Bienvenue, ${currentUser.nom}` : ""}
      </div>

      {/* 🔹 Section de droite avec les boutons */}
      <div className="flex items-center space-x-4">
        {/* Bouton Éditer template : visible seulement si l'utilisateur a la permission */}
        {currentUser && hasPermission("gererTemplates", currentUser) && (
          <motion.button
            whileHover={{ scale: 1.05 }} // animation au survol
            whileTap={{ scale: 0.95 }}   // animation au clic
            onClick={goToTemplateEditor}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
          >
            Éditer template
          </motion.button>
        )}

        {/*  Bouton Logout : visible uniquement si un utilisateur est connecté */}
        {currentUser && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
          >
            Déconnexion
          </motion.button>
        )}
      </div>
    </header>
  );
}
