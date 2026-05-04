# 📚 My Real Library — Guide de démarrage

## Prérequis

Avant de commencer, assure-toi d'avoir installé :

- **Node.js v20 LTS** (recommandé — Node 22 est incompatible avec Metro 0.83) → https://nodejs.org
  - Avec nvm : `nvm install 20 && nvm use 20`
  - Un fichier `.nvmrc` est présent dans le projet, donc `nvm use` suffit dans ce dossier
- **Expo Go** sur ton téléphone → App Store (iOS) ou Google Play (Android)
- Un terminal (Terminal macOS, iTerm2, etc.)

---

## Installation (première fois uniquement)

**Ouvre d'abord un terminal dans le bon dossier** (c'est l'étape que l'on oublie souvent) :

```bash
cd ~/Documents/Sites/my-real-library
```

Puis installe les dépendances :

```bash
npm install
```

> ⚠️ Toutes les commandes ci-dessous doivent être lancées depuis ce dossier. Si tu vois une erreur `Could not read package.json`, c'est que tu n'es pas dans le bon répertoire.

---

## Lancer l'application

### Sur téléphone (recommandé)

```bash
npx expo start
```

Un QR code apparaît dans le terminal. **Scanne-le avec l'app Expo Go** sur ton téléphone.
- iOS : utilise l'app Appareil photo directement, ou ouvre Expo Go et scanne depuis là
- Android : ouvre Expo Go → "Scan QR code"

> ⚠️ Ton téléphone et ton Mac doivent être sur le **même réseau Wi-Fi**.

### Si le Wi-Fi pose problème (réseau restrictif, bureau, etc.)

Lance via le tunnel ngrok :

```bash
npx expo start --tunnel
```

Cela crée une URL publique accessible depuis n'importe quel réseau.

### Sur navigateur web (desktop)

```bash
npx expo start --web
# ou directement
npm run web
```

> Note : certaines fonctionnalités natives (caméra, SQLite) ne fonctionnent pas sur le web.

### Raccourcis utiles dans le terminal Expo

Une fois `npx expo start` lancé, tu peux appuyer sur :

| Touche | Action |
|--------|--------|
| `i` | Ouvrir sur simulateur iOS |
| `a` | Ouvrir sur émulateur Android |
| `w` | Ouvrir dans le navigateur |
| `r` | Recharger l'app |
| `m` | Ouvrir le menu développeur |
| `?` | Afficher l'aide |

---

## Lancer les tests

```bash
# Tous les tests (une seule fois)
npm test

# Mode watch (relance à chaque modification)
npm run test:watch

# Avec couverture de code
npm run test:coverage
```

> Les tests passent à **124 / 124** (7 suites). À relancer après toute modification.

---

## Structure du projet

```
my-real-library/
├── App.js                          ← Point d'entrée : init SQLite + navigation
├── app.json                        ← Config Expo (nom, icône, permissions)
├── package.json                    ← Dépendances + scripts
├── babel.config.js                 ← Config Babel (preset expo)
├── metro.config.js                 ← Config bundler Metro
├── jest.setup.js                   ← Setup des mocks pour les tests
│
├── assets/                         ← Icônes et splash screen
│
├── __mocks__/                      ← Mocks Jest (SQLite, caméra, filesystem…)
├── __tests__/                      ← Tests unitaires (7 suites, 124 tests)
│   ├── components/
│   ├── database/
│   ├── screens/
│   └── services/
│
└── src/
    ├── database/
    │   └── database.js             ← Toutes les opérations SQLite (livres + wishlist)
    ├── services/
    │   └── bookApi.js              ← Appels API OpenLibrary + Google Books
    ├── utils/
    │   └── logger.js               ← Logger avec écriture dans app.log (FileSystem)
    ├── theme/
    │   └── index.js                ← Couleurs, typo, espacements, genres, périodes
    ├── navigation/
    │   └── AppNavigator.js         ← Bottom tabs + stack navigation
    ├── screens/
    │   ├── LibraryScreen.js        ← Vue bibliothèque + filtres + recherche
    │   ├── AddBookScreen.js        ← Ajout par scan / code / titre manuel
    │   ├── BookDetailScreen.js     ← Fiche livre + statut + prêt + suppression
    │   └── WishlistScreen.js       ← Wishlist + notes + déplacement vers biblio
    └── components/
        ├── BookCard.js             ← Carte livre dans les listes
        └── GenrePicker.js          ← Sélecteur de genre (modal)
```

---

## Fonctionnalités

### 📖 Bibliothèque
- Liste de tous tes livres avec couverture
- Barre de recherche (titre, auteur, ISBN, genre)
- Filtres : statut de lecture, genre, période de publication, disponibilité (prêté/disponible)
- Badge statut sur chaque livre (Non lu / En cours / Lu)
- Indicateur de prêt (à qui)

### ➕ Ajout d'un livre (3 méthodes)
1. **Scanner** un code-barres avec la caméra
2. **Saisir un code** manuellement (ISBN, EAN, ASIN, UPC, ISSN)
3. **Saisie par titre** : auto-complétion via API, ou formulaire libre

Les infos (titre, auteur, éditeur, couverture…) sont récupérées automatiquement.

### 📋 Fiche livre
- Couverture, titre, auteur, éditeur, date, description
- Statut de lecture modifiable en 1 tap (Non lu → En cours → Lu)
- Gestion du prêt : saisir le nom de l'emprunteur, bouton "Marquer comme rendu"
- Infos détaillées : ISBN, EAN, ASIN, UPC, ISSN, pages, langue, catégories
- Sélecteur de genre
- Suppression du livre

### ❤️ Wishlist
- Liste de livres à acquérir
- Notes personnelles sur chaque livre
- Lien vers Place des Libraires pour acheter
- Déplacement vers la bibliothèque en un tap

---

## APIs utilisées

| API | Usage | Clé requise |
|-----|-------|-------------|
| [OpenLibrary](https://openlibrary.org/developers/api) | Recherche par ISBN / titre (principale) | ❌ Non |
| [Google Books](https://developers.google.com/books) | Fallback + couvertures | ❌ Non |

---

## Codes-barres supportés

| Type | Format | Exemple |
|------|--------|---------|
| ISBN-13 | 13 chiffres | 9782070360024 |
| ISBN-10 | 10 chiffres | 2070360024 |
| EAN-13 | 13 chiffres | 3300040001017 |
| UPC-A | 12 chiffres | 036000291452 |
| ASIN | 10 car. alphanum. | B01N4G2GKL |
| ISSN | 8 chiffres | 00280836 |

---

## Logs de débogage

L'app dispose d'un logger persistant. Les logs sont écrits dans `DocumentDirectory/app.log` sur l'appareil.

Le mode debug API (`DEBUG_API`) est **actif automatiquement en mode développement** (`__DEV__ = true`). Il affiche dans la console Metro les réponses brutes des APIs OpenLibrary et Google Books — utile pour diagnostiquer pourquoi un livre n'est pas trouvé.

---

## Dépôt Git

- Remote : `git@github.com:Baloo98815/my-real-library.git`
- Branche principale : `master`
- Dernier commit : `2acfaf32` — docs: ajout CLAUDE.md

---

## Prochaines évolutions possibles

- Export / import de la bibliothèque (CSV, JSON)
- Statistiques de lecture (livres lus par mois, genres préférés…)
- Notes et avis personnels sur les livres
- Synchronisation cloud (Supabase)
- Widgets iOS / Android
- Partage de bibliothèque
