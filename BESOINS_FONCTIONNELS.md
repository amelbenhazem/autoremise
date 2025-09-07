# 📋 Besoins Fonctionnels - AutoRemise

## 🎯 Vue d'ensemble

Ce document détaille les besoins fonctionnels de l'application AutoRemise, organisés par modules et par priorité. Chaque besoin est décrit avec ses critères d'acceptation et ses tests de validation.

## 🏗️ Architecture Fonctionnelle

### Modules Principaux
1. **Gestion des Banques et Types**
2. **Upload et Traitement des Fichiers**
3. **Système de Mapping**
4. **Génération de PDFs**
5. **Validation des Données**
6. **Éditeur de Templates**
7. **Interface Utilisateur**

---

## 1. 🏦 Gestion des Banques et Types de Documents

### 1.1 Sélection de la Banque
**Priorité** : Critique  
**Description** : L'utilisateur doit pouvoir sélectionner la banque pour laquelle il génère les documents.

#### Critères d'Acceptation
- [ ] Liste déroulante avec toutes les banques supportées
- [ ] Validation obligatoire avant passage à l'étape suivante
- [ ] Sauvegarde du choix pour la session
- [ ] Interface responsive (mobile/desktop)

#### Banques Supportées
- ATB
- AMEN Bank
- ALBARAKA Bank
- ZITOUNA Bank
- BNA (Banque Nationale Agricole)
- BANQUE DE TUNISIE

#### Tests de Validation
```typescript
// Test de sélection de banque
describe('Sélection de banque', () => {
  it('doit afficher toutes les banques supportées', () => {
    // Vérifier que toutes les banques sont présentes
  });
  
  it('doit valider la sélection avant de continuer', () => {
    // Tenter de continuer sans sélection
    // Vérifier que l'erreur est affichée
  });
});
```

### 1.2 Sélection du Type de Document
**Priorité** : Critique  
**Description** : L'utilisateur doit pouvoir choisir entre "Chèque" et "Effet".

#### Critères d'Acceptation
- [ ] Options : "Chèque" et "Effet"
- [ ] Validation obligatoire
- [ ] Chargement automatique du mapping correspondant
- [ ] Interface cohérente avec la sélection de banque

#### Tests de Validation
```typescript
describe('Sélection du type', () => {
  it('doit charger le bon mapping selon banque + type', () => {
    // Sélectionner AMEN + Chèque
    // Vérifier que amen_cheque.json est chargé
  });
});
```

---

## 2. 📁 Upload et Traitement des Fichiers

### 2.1 Upload par Drag & Drop
**Priorité** : Haute  
**Description** : Interface moderne permettant de glisser-déposer les fichiers Excel.

#### Critères d'Acceptation
- [ ] Zone de drop visible et intuitive
- [ ] Feedback visuel lors du survol
- [ ] Validation du type de fichier (Excel uniquement)
- [ ] Gestion des erreurs (fichier non supporté)
- [ ] Support multi-fichiers

#### Tests de Validation
```typescript
describe('Drag & Drop', () => {
  it('doit accepter les fichiers Excel', () => {
    // Tester .xlsx et .xls
  });
  
  it('doit rejeter les autres formats', () => {
    // Tester .pdf, .doc, .txt
  });
});
```

### 2.2 Upload par Sélection
**Priorité** : Haute  
**Description** : Bouton de sélection de fichiers pour les utilisateurs préférant cette méthode.

#### Critères d'Acceptation
- [ ] Bouton "Sélectionner un fichier" visible
- [ ] Ouverture du sélecteur de fichiers
- [ ] Filtre sur les types Excel
- [ ] Même validation que le drag & drop

### 2.3 Parsing des Fichiers Excel
**Priorité** : Critique  
**Description** : Extraction et traitement des données Excel.

#### Critères d'Acceptation
- [ ] Lecture des en-têtes (première ligne)
- [ ] Extraction des données (lignes suivantes)
- [ ] Gestion des cellules vides
- [ ] Support des formats de date
- [ ] Détection automatique des types de données

#### Tests de Validation
```typescript
describe('Parsing Excel', () => {
  it('doit extraire correctement les en-têtes', () => {
    // Vérifier la première ligne
  });
  
  it('doit gérer les cellules vides', () => {
    // Tester avec des cellules vides
  });
});
```

---

## 3. 🗺️ Système de Mapping

### 3.1 Chargement des Templates
**Priorité** : Critique  
**Description** : Chargement automatique du template correspondant à la banque et au type sélectionnés.

#### Critères d'Acceptation
- [ ] Chargement automatique selon banque + type
- [ ] Gestion des cas particuliers (noms de fichiers spéciaux)
- [ ] Messages d'erreur si template non trouvé
- [ ] Cache des templates chargés

#### Templates Disponibles
```
ALBARAKA-cheque.json
amen_cheque.json
AMEN-effet.json
bnaeffet.json
chequetunisie.json
effet_amen_bank.json
effet_AMEN.json
effet_zitouna.json
effetbanktunisia.json
rcheque_bna.json
ZITOUNA-cheque.json
```

### 3.2 Structure des Templates
**Priorité** : Critique  
**Description** : Chaque template contient les informations nécessaires pour la génération.

#### Structure Requise
```json
{
  "background": "data:image/png;base64,...",
  "zones": [
    {
      "id": "zone1",
      "x": 100,
      "y": 200,
      "width": 150,
      "height": 30,
      "field": "Nom émetteur",
      "fontSize": 12,
      "color": "#000000"
    }
  ],
  "bgWidth": 842,
  "bgHeight": 595
}
```

#### Critères d'Acceptation
- [ ] Image de fond en base64
- [ ] Zones de texte positionnées
- [ ] Dimensions du document
- [ ] Propriétés de style (police, taille, couleur)

---

## 4. 📄 Génération de PDFs

### 4.1 Création des Documents
**Priorité** : Critique  
**Description** : Génération d'un PDF par ligne de données Excel.

#### Critères d'Acceptation
- [ ] Un PDF par ligne de données
- [ ] Image de fond intégrée
- [ ] Texte positionné selon les zones
- [ ] Qualité optimale pour impression
- [ ] Nommage automatique des fichiers

#### Tests de Validation
```typescript
describe('Génération PDF', () => {
  it('doit créer un PDF par ligne Excel', () => {
    // 10 lignes Excel = 10 PDFs générés
  });
  
  it('doit intégrer l\'image de fond', () => {
    // Vérifier la présence de l'image
  });
});
```

### 4.2 Fusion des Données
**Priorité** : Critique  
**Description** : Insertion des données Excel dans les zones définies.

#### Critères d'Acceptation
- [ ] Correspondance exacte entre colonnes Excel et zones
- [ ] Gestion des valeurs manquantes
- [ ] Formatage des dates et nombres
- [ ] Troncature si texte trop long
- [ ] Alignement du texte dans les zones

### 4.3 Téléchargement
**Priorité** : Haute  
**Description** : Récupération des PDFs générés.

#### Critères d'Acceptation
- [ ] Téléchargement automatique
- [ ] Nommage intelligent des fichiers
- [ ] Support du téléchargement groupé (ZIP)
- [ ] Indication de progression

---

## 5. ✅ Validation des Données

### 5.1 Validation des Colonnes
**Priorité** : Haute  
**Description** : Vérification que le fichier Excel contient les colonnes requises.

#### Critères d'Acceptation
- [ ] Vérification des en-têtes requis
- [ ] Détection des colonnes manquantes
- [ ] Détection des colonnes en trop
- [ ] Messages d'erreur explicites
- [ ] Suggestions de correction

#### Exemple de Validation
```typescript
// Pour AMEN Bank - Chèque
const requiredFields = [
  "Compte numéro", "Titulaire de compte", "Nom émetteur", 
  "Numéro chèque", "Banque", "Localité", "Montant", "Total", "Date"
];
```

### 5.2 Validation des Types de Données
**Priorité** : Moyenne  
**Description** : Vérification du format des données dans chaque colonne.

#### Critères d'Acceptation
- [ ] Validation des montants (numériques)
- [ ] Validation des dates
- [ ] Validation des numéros de compte
- [ ] Détection des valeurs aberrantes
- [ ] Correction automatique si possible

### 5.3 Rapport de Validation
**Priorité** : Moyenne  
**Description** : Affichage d'un résumé des validations effectuées.

#### Critères d'Acceptation
- [ ] Nombre de lignes traitées
- [ ] Nombre d'erreurs détectées
- [ ] Liste des erreurs avec détails
- [ ] Suggestions de correction
- [ ] Possibilité de continuer malgré les erreurs

---

## 6. 🎨 Éditeur de Templates

### 6.1 Interface d'Édition
**Priorité** : Moyenne  
**Description** : Outil pour créer et modifier les templates de mapping.

#### Critères d'Acceptation
- [ ] Interface WYSIWYG
- [ ] Définition de zones par clic
- [ ] Modification des propriétés des zones
- [ ] Prévisualisation en temps réel
- [ ] Sauvegarde des modifications

### 6.2 Import/Export de Templates
**Priorité** : Faible  
**Description** : Possibilité d'importer et exporter des templates.

#### Critères d'Acceptation
- [ ] Import de fichiers JSON
- [ ] Export des templates modifiés
- [ ] Validation de la structure
- [ ] Sauvegarde locale

---

## 7. 🖥️ Interface Utilisateur

### 7.1 Navigation
**Priorité** : Haute  
**Description** : Parcours utilisateur en étapes claires.

#### Critères d'Acceptation
- [ ] 3 étapes maximum : Banque → Type → Upload
- [ ] Indicateur de progression
- [ ] Boutons de navigation (Précédent/Suivant)
- [ ] Validation avant passage à l'étape suivante

### 7.2 Feedback Utilisateur
**Priorité** : Haute  
**Description** : Retour visuel constant sur les actions de l'utilisateur.

#### Critères d'Acceptation
- [ ] Barres de progression
- [ ] Messages de statut
- [ ] Animations de chargement
- [ ] Notifications de succès/erreur

### 7.3 Responsive Design
**Priorité** : Haute  
**Description** : Interface adaptée à tous les écrans.

#### Critères d'Acceptation
- [ ] Compatible mobile (320px+)
- [ ] Compatible tablette (768px+)
- [ ] Compatible desktop (1024px+)
- [ ] Touch-friendly sur mobile

---

## 🧪 Tests et Validation

### Tests Unitaires
- [ ] Tests des hooks personnalisés
- [ ] Tests des utilitaires (parseExcel, validators)
- [ ] Tests des composants React
- [ ] Couverture de code > 80%

### Tests d'Intégration
- [ ] Test du flux complet
- [ ] Test avec différents fichiers Excel
- [ ] Test avec toutes les banques
- [ ] Test des cas d'erreur

### Tests Utilisateurs
- [ ] Test avec des utilisateurs réels
- [ ] Mesure du temps d'apprentissage
- [ ] Collecte des retours utilisateurs
- [ ] Optimisation basée sur les retours

---

## 📊 Métriques de Succès

### Performance
- [ ] Temps de parsing < 2 secondes
- [ ] Génération PDF < 5 secondes/document
- [ ] Taille des fichiers optimisée
- [ ] Utilisation mémoire < 100MB

### Qualité
- [ ] Taux d'erreur < 1%
- [ ] Satisfaction utilisateur > 90%
- [ ] Temps d'apprentissage < 30 minutes
- [ ] Taux d'adoption > 80%

### Fiabilité
- [ ] Disponibilité > 99%
- [ ] Temps de réponse < 2 secondes
- [ ] Gestion d'erreurs robuste
- [ ] Récupération automatique

---

*Besoins Fonctionnels - Version 1.0*  
*Date : Décembre 2024*  
*Statut : En cours de validation*

