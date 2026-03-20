# 📚 My Real Library — Guide de démarrage

## Prérequis

- **Node.js** (v18 ou supérieur) → https://nodejs.org
- **Expo Go** sur votre téléphone → App Store / Google Play

---

## Installation

Ouvrez un terminal dans ce dossier et lancez :

```bash
npm install
```

---

## Lancer l'application

```bash
npx expo start
```

Un QR code apparaîtra dans le terminal. **Scannez-le avec l'app Expo Go** sur votre téléphone.

Pour tester sur navigateur web (desktop) :
```bash
npx expo start --web
```

---

## Structure du projet

```
my-real-library/
├── App.js                          ← Point d'entrée
├── app.json                        ← Configuration Expo
├── package.json                    ← Dépendances
└── src/
    ├── database/
    │   └── database.js             ← Base de données SQLite locale
    ├── services/
    │   └── bookApi.js              ← API OpenLibrary + Google Books
    ├── theme/
    │   └── index.js                ← Couleurs, polices, espacements
    ├── navigation/
    │   └── AppNavigator.js         ← Navigation entre écrans
    ├── screens/
    │   ├── LibraryScreen.js        ← Vue bibliothèque (défaut)
    │   ├── AddBookScreen.js        ← Ajout d'un livre
    │   └── BookDetailScreen.js     ← Détail d'un livre
    └── components/
        └── BookCard.js             ← Carte livre dans la liste
```

---

## Fonctionnalités implémentées

### 📖 Vue Bibliothèque
- Liste de tous vos livres avec couverture
- Barre de recherche (titre, auteur, ISBN)
- Filtres : statut de lecture + disponibilité (prêté/disponible)
- Badge statut sur chaque livre (Non lu / En cours / Lu)
- Indicateur de prêt (à qui)

### ➕ Ajout d'un livre
**3 méthodes :**
1. **Scanner** un code-barres avec la caméra (ISBN, EAN, UPC…)
2. **Saisir un code** à la main (ISBN, EAN, ASIN, UPC, ISSN)
3. **Saisie manuelle** : recherche par titre avec suggestions, ou formulaire libre

Les informations (titre, auteur, éditeur, couverture…) sont récupérées automatiquement via :
- OpenLibrary API (principale)
- Google Books API (fallback)

Seul le **titre est obligatoire** en saisie manuelle.

### 📋 Fiche livre
- Couverture, titre, auteur, éditeur, date
- **Statut de lecture** : Non lu / En cours / Lu (modifiable en 1 tap)
- **Gestion du prêt** : saisir le nom de l'emprunteur, bouton "Marquer comme rendu"
- **Informations** : ISBN, EAN, ASIN, UPC, ISSN, pages, langue, catégories
- **Supprimer** le livre (bouton corbeille en haut à droite)

---

## APIs utilisées

| API | Usage | Gratuit |
|-----|-------|---------|
| [OpenLibrary](https://openlibrary.org/developers/api) | Recherche par ISBN, titre | ✅ Oui |
| [Google Books](https://developers.google.com/books) | Fallback + couvertures | ✅ Oui (sans clé) |

---

## Codes supportés

| Code | Format | Exemple |
|------|--------|---------|
| ISBN-13 | 13 chiffres | 9782070360024 |
| ISBN-10 | 10 chiffres | 2070360024 |
| EAN-13  | 13 chiffres | 3300040001017 |
| UPC-A   | 12 chiffres | 036000291452 |
| ASIN    | 10 car. alphanum. | B01N4G2GKL |
| ISSN    | 8 chiffres | 00280836 |

---

## Prochaines évolutions possibles

- Export / import de la bibliothèque (CSV, JSON)
- Statistiques de lecture
- Notes et avis personnels sur les livres
- Synchronisation cloud (Supabase)
- Widgets iOS/Android
- Partage de bibliothèque
