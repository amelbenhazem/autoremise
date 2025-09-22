'use client';
import React, { useState } from 'react';
import { User } from "../hooks/roles";
import { useRouter } from 'next/navigation';

const mockUsers: User[] = [
  { id: 1, nom: 'Amal', email: 'employe@banque.com', role: 'EmployeBanque', password: 'employe123' },
  { id: 2, nom: 'Admin', email: 'admin@system.com', role: 'Administrateur', password: 'admin123' },
];

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (!user) {
      setError('Utilisateur introuvable ou mot de passe incorrect');
      return;
    }

    localStorage.setItem('currentUser', JSON.stringify(user));
    router.push('/');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-blue-light)' }}
    >
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-gray-200">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-800">Connexion</h1>

        {error && (
          <div className="text-red-600 bg-red-100 p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700">Email</label>
          <input
            type="email"
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            placeholder="exemple@domaine.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-8">
          <label className="block mb-2 font-medium text-gray-700">Mot de passe</label>
          <input
            type="password"
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            placeholder="Votre mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl shadow-md transition transform hover:scale-105"
        >
          Se connecter
        </button>
      </div>
    </div>
  );
}
