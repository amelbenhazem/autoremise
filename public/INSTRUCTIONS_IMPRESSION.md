# 📄 Instructions d'impression - Dimensions ABSOLUES

## 🎯 Objectif
Imprimer vos documents PDF avec leurs **dimensions absolues** qui ne changent JAMAIS, même si vous choisissez A4, A5, A3, ou n'importe quel format papier.

## ✅ Solution implémentée
- ✅ Les PDF sont créés avec des **dimensions absolues personnalisées**
- ✅ Les zones sont parfaitement positionnées
- ✅ **MÊME si vous choisissez A4, A5, A3, ou n'importe quel format, le document garde SES dimensions exactes**
- ✅ L'imprimante ne peut PLUS redimensionner automatiquement
- ✅ **Dimensions absolues** - Aucun redimensionnement possible

## 🖨️ Instructions d'impression

### **Option 1 : Adobe Acrobat Reader (Recommandé)**
1. Ouvrir le PDF avec **Adobe Acrobat Reader**
2. Aller dans **Fichier > Imprimer** (Ctrl+P)
3. Dans les options d'impression :
   - **Mise à l'échelle** : Sélectionner **"Taille réelle"** ou **"Aucune mise à l'échelle"**
   - **Format papier** : **N'IMPORTE LEQUEL** (A4, A5, A3...) - Le document garde SES dimensions !
   - **Orientation** : Portrait ou Paysage selon votre document
   - **⚠️ IMPORTANT** : Le document gardera SES dimensions exactes même si vous choisissez A4, A5, etc.
4. Cliquer sur **"Imprimer"**

### **Option 2 : Navigateur Web (Chrome/Edge)**
1. Ouvrir le PDF dans le navigateur
2. Cliquer sur **"Imprimer"** (Ctrl+P)
3. Dans les paramètres :
   - **Destination** : Votre imprimante
   - **Pages** : Toutes
   - **Mise à l'échelle** : **"Aucune mise à l'échelle"** ou **"Taille réelle"**
   - **Format papier** : Choisir le bon format
4. Cliquer sur **"Imprimer"**

### **Option 3 : Autres lecteurs PDF**
- **Foxit Reader** : Options > Mise à l'échelle > "Taille réelle"
- **PDF-XChange** : Fichier > Imprimer > Mise à l'échelle > "Aucune mise à l'échelle"
- **Sumatra PDF** : Fichier > Imprimer > Mise à l'échelle > "Taille réelle"

## 🔧 Paramètres importants

### **Mise à l'échelle**
- ❌ **Éviter** : "Ajuster à la page", "Réduire à la page", "Agrandir à la page"
- ✅ **Utiliser** : "Taille réelle", "Aucune mise à l'échelle", "100%"

### **Format papier**
- Choisir le format qui correspond aux dimensions de votre document
- Si votre document fait 21x29.7 cm → choisir A4
- Si votre document fait 14.8x21 cm → choisir A5

## 📏 Vérification des dimensions

### **Amen Bank - Chèque**
- **Dimensions** : 11.30 cm x 15.75 cm
- **Format recommandé** : A5 ou format personnalisé
- **Orientation** : Portrait

### **Amen Bank - Effet**
- **Dimensions** : 22.81 cm x 37.41 cm
- **Format recommandé** : A3 ou format personnalisé
- **Orientation** : Portrait

## 🚨 Problèmes courants

### **Le texte est décalé**
- Vérifier que la mise à l'échelle est sur "Taille réelle"
- Vérifier que le format papier correspond aux dimensions du document

### **Le document est coupé**
- Vérifier l'orientation (Portrait/Paysage)
- Vérifier que le format papier est assez grand

### **Le document est trop petit/grand**
- Forcer la mise à l'échelle sur "Taille réelle"
- Ne pas utiliser "Ajuster à la page"

## ✅ Résultat attendu
- **Les zones de texte sont parfaitement positionnées**
- **Le document a TOUJOURS la même taille exacte** définie dans le JSON
- **L'impression est identique même si vous choisissez A4, A5, A3, ou n'importe quel format**
- **Le document ne se redimensionne JAMAIS automatiquement**
- **Les dimensions sont ABSOLUES et ne changent JAMAIS**
- **Même en choisissant A4, le document garde SES dimensions exactes**

## 📞 Support
Si vous rencontrez encore des problèmes, vérifiez :
1. Les paramètres d'impression (mise à l'échelle)
2. Le format papier choisi
3. L'orientation du document
