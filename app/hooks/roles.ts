// roles.ts
export type Role = 'EmployeBanque' | 'Administrateur';

export interface User {
  id: number;
  nom: string;
  email: string;
  role: Role;
  password: string; // mot de passe statique
}


// Permissions par rôle
export const permissions = {
  Utilisateur: [],
  EmployeBanque: [
    'selectionnerBanqueType',
    'chargerFichierExcel',
    'genererPDF',
    'validerRemise'
  ],
  Administrateur: [
    'gererTemplates',
    'ajouterBanqueType',
    'superviserUtilisateurs',
    'maintenanceSysteme'
  ]
};

export function hasPermission(action: string, user: User | null) {
  if (!user) return false;
  const rolePermissions: string[] =
    permissions[user.role as keyof typeof permissions] || [];
  return rolePermissions.includes(action);
}
