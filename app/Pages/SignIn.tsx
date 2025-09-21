// SignIn.tsx
'use client';
import React, { useState } from 'react';
import { User } from './roles';
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

  // Stocker l'utilisateur dans le localStorage
  localStorage.setItem('currentUser', JSON.stringify(user));

  // Redirection vers la page d'accueil
  router.push('/');
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Connexion</h1>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <label className="block mb-2 font-medium text-gray-700">Email</label>
        <input
          type="email"
          className="w-full p-2 mb-4 border rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <label className="block mb-2 font-medium text-gray-700">Mot de passe</label>
        <input
          type="password"
          className="w-full p-2 mb-6 border rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded font-semibold"
        >
          Se connecter
        </button>
      </div>
    </div>
  );
}
