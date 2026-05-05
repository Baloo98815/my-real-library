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

## Tester l'application sur téléphone

C'est la méthode la plus fidèle — tu vois l'app exactement comme elle sera en production, avec l'accès à la caméra, SQLite, etc.

### Étape 1 — Installe Expo Go sur ton téléphone

> ⚠️ **Ne pas passer par l'App Store ou le Google Play** — les versions disponibles sur les stores peuvent être en retard sur le SDK du projet et provoquer une erreur "incompatible version". Télécharge toujours depuis le site officiel :

**→ https://expo.dev/go**

Expo y propose les dernières versions directement en téléchargement pour iOS et Android.

Sur Android, tu devras autoriser l'installation depuis une source externe (une fenêtre te le demandera automatiquement à l'installation).

### Étape 2 — Lance le serveur de développement

```bash
npx expo start
```

Un QR code apparaît dans le terminal.

### Étape 3 — Connecte ton téléphone

**Sur iPhone :** ouvre l'app **Appareil photo** → pointe sur le QR code → appuie sur la notification qui apparaît en haut.

**Sur Android :** ouvre **Expo Go** → appuie sur "Scan QR code" → pointe sur le QR code.

> ⚠️ Ton téléphone et ton Mac doivent être sur le **même réseau Wi-Fi**.

### Si le Wi-Fi pose problème (réseau restrictif, hotspot, etc.)

Lance via le tunnel ngrok — ça crée une URL publique accessible depuis n'importe quel réseau :

```bash
npx expo start --tunnel
```

### Recharger l'app sans rescanner

Une fois l'app ouverte dans Expo Go :
- **Secoue ton téléphone** → menu développeur → "Reload"
- Ou appuie sur `r` dans le terminal du Mac

### Raccourcis utiles dans le terminal Expo

| Touche | Action |
|--------|--------|
| `r` | Recharger l'app |
| `m` | Ouvrir le menu développeur |
| `i` | Ouvrir sur simulateur iOS (si Xcode installé) |
| `a` | Ouvrir sur émulateur Android (si Android Studio installé) |
| `w` | Ouvrir dans le navigateur |
| `?` | Afficher l'aide |

---

## Tester sur navigateur web (desktop)

```bash
npm run web
```

> Note : la caméra et SQLite ne fonctionnent pas sur le web — c'est normal. C'est uniquement pour vérifier le rendu visuel.

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

> 124 tests passent sur 7 suites. À relancer après toute modification.

---

## Publier l'app sur téléphone (build de production)

Le projet utilise **EAS Build** (Expo Application Services), déjà configuré dans `eas.json` et `app.json`.

Il y a deux façons de distribuer l'app :

### Option A — Usage personnel (sans passer par les stores)

Idéal pour installer l'app uniquement sur tes propres appareils, sans compte développeur payant.

**1. Installe le CLI EAS :**

```bash
npm install -g eas-cli
eas login   # crée un compte gratuit sur expo.dev si besoin
```

**2. Build Android (.apk installable directement) :**

```bash
eas build --profile preview --platform android
```

Une fois le build terminé (5-10 min sur les serveurs Expo), tu reçois un lien pour télécharger le `.apk`. Tu l'installes sur Android en activant "Sources inconnues" dans les paramètres.

**3. Build iOS (.ipa) :**

Sur iOS, Apple interdit l'installation directe sans compte développeur payant. Les alternatives gratuites :
- Utiliser **TestFlight** (nécessite le compte Developer à 99€/an)
- Utiliser un simulateur iOS sur Mac (via Xcode, gratuit)
- Continuer à tester via Expo Go

---

### Option B — Publier sur les stores (App Store / Google Play)

Pour distribuer l'app publiquement ou à d'autres personnes.

**Prérequis :**
- **Apple Developer Program** : 99 €/an → https://developer.apple.com/programs/
- **Google Play Console** : 25 € une seule fois → https://play.google.com/console

**Étapes :**

```bash
# 1. Build de production
eas build --profile production --platform android   # ou ios, ou all
```

```bash
# 2. Soumission automatique aux stores
eas submit --platform android   # ou ios
```

EAS gère la signature des binaires automatiquement.

**Infos déjà configurées dans le projet :**
- Bundle ID iOS : `fr.andafter.myreallibrary`
- Package Android : `fr.andafter.myreallibrary`
- Projet EAS ID : `c4f809e8-6cd6-4e00-9f13-424798d87e8a`

---

## Structure du projet

```
my-real-library/
├── App.js                          ← Point d'entrée : init SQLite + navigation
├── app.json                        ← Config Expo (nom, icône, permissions, EAS)
├── eas.json                        ← Config builds EAS (dev / preview / production)
├── package.json                    ← Dépendances + scripts
├── .nvmrc                          ← Node version recommandée (20)
├── .npmrc                          ← legacy-peer-deps activé (nécessaire RN)
├── babel.config.js                 ← Config Babel
├── metro.config.js                 ← Config bundler Metro
├── jest.setup.js                   ← Setup mocks pour les tests
│
├── assets/                         ← Icônes et splash screen
│
├── __mocks__/                      ← Mocks Jest (SQLite, caméra, filesystem…)
├── __tests__/                      ← Tests unitaires (7 suites, 124 tests)
│
└── src/
    ├── database/database.js        ← Toutes les opérations SQLite
    ├── services/bookApi.js         ← OpenLibrary + Google Books
    ├── utils/logger.js             ← Logger persistant (écrit dans app.log)
    ├── theme/index.js              ← Couleurs, typo, genres, périodes
    ├── navigation/AppNavigator.js  ← Bottom tabs + stack
    ├── screens/
    │   ├── LibraryScreen.js        ← Bibliothèque + filtres + recherche
    │   ├── AddBookScreen.js        ← Ajout scan / code / titre
    │   ├── BookDetailScreen.js     ← Fiche livre + statut + prêt
    │   └── WishlistScreen.js       ← Wishlist + notes + déplacement
    └── components/
        ├── BookCard.js             ← Carte livre
        └── GenrePicker.js          ← Sélecteur de genre
```

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

## Dépôt Git

- Remote : `git@github.com:Baloo98815/my-real-library.git`
- Branche principale : `master`

---

## Prochaines évolutions possibles

- Export / import de la bibliothèque (CSV, JSON)
- Statistiques de lecture (livres lus par mois, genres préférés…)
- Notes et avis personnels sur les livres
- Synchronisation cloud (Supabase)
- Widgets iOS / Android
- Partage de bibliothèque
