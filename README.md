AutoRemise - Documentation
Vue d'ensemble
AutoRemise est une application web Next.js pour générer des PDFs de chèques et effets bancaires tunisiens.  
Elle permet de :

- Positionner des zones de texte sur des images de fond (éditeur visuel)
- Importer des données Excel
- Générer des PDFs parfaitement alignés
  Structure du projet
  autoremise/
  ├── app/ # Pages, composants et hooks
  ├── public/ # Templates JSON, images, PWA assets
  ├── styles/ # CSS / Tailwind
  ├── types/ # Types TypeScript
  ├── utils/ # Utilitaires PDF, Excel, validation
  ├── scripts/ # Scripts de build
  └── README.md
  Fonctionnement

1. Page d'accueil: sélectionner banque/type, upload Excel
2. Éditeur: import mapping JSON, saisir dimensions, positionner zones
3. Génération PDF: conversion zones → PDF, alignement exact, export  
   Fonctionnalités clés

- Génération PDF précise (dimensions exactes, alignement parfait)
- Éditeur visuel intuitif (zones draggables/resizables, import/export)
- Support multi-banques (6+ banques tunisiennes, chèques et effets)
- PWA installable (mode hors-ligne, performance optimisée)  
  Technologies
- Next.js, React, TypeScript, Tailwind CSS
- pdf-lib, xlsx, react-rnd, react-dropzone
- PWA avec next-pwa
