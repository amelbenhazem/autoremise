"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasPermission, User } from "../hooks/roles";
import { motion } from "framer-motion";

export default function Header() {  // ✅ doit être export default
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.push("/signin");
  };

  const goToTemplateEditor = () => {
    router.push("/template-editor");
  };

  return (
    <header className="w-full flex justify-between items-center p-4 bg-white shadow-md">
      <div className="text-lg font-semibold text-gray-700">
        {currentUser ? `Bienvenue, ${currentUser.nom}` : ""}
      </div>

      <div className="flex items-center space-x-4">
        {currentUser && hasPermission("gererTemplates", currentUser) && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToTemplateEditor}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
          >
            Éditer template
          </motion.button>
        )}

        {currentUser && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
          >
            Logout
          </motion.button>
        )}
      </div>
    </header>
  );
}
