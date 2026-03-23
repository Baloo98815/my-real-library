# CLAUDE.md — Journal de bord du projet My Real Library

Ce fichier est destiné à être lu par Claude à chaque nouvelle session pour rétablir le contexte du projet.

---

## Contexte du projet

**My Real Library** est une application mobile React Native / Expo permettant de gérer une bibliothèque personnelle de livres. Elle est développée en français, pour un usage personnel.

### Stack technique
- React Native + Expo (SDK 55)
- SQLite local via `expo-sqlite`
- Navigation via `@react-navigation` (stack + bottom tabs)
- API externe : OpenLibrary (principal) + Google Books (fallback)
- Tests unitaires : Jest + jest-expo + @testing-library/react-native

### Fonctionnalités implémentées
- Scan de code-barres ISBN (caméra)
- Saisie manuelle avec recherche par titre (auto-complétion)
- Base de données SQLite locale (bibliothèque + wishlist)
- Statuts de lecture : non lu / en cours / lu
- Gestion des prêts (nom de l'emprunteur + date)
- Filtres : statut, genre, période, disponibilité
- Wishlist indépendante
- Tests unitaires sur les services et la base de données

---

## Historique des sessions

### Session 1 — Poste d'origine (date inconnue)
**Prompt initial (résumé reconstitué)** : Créer une application de bibliothèque personnelle en React Native / Expo avec scan de codes-barres, recherche de livres via API, base SQLite, filtres et wishlist.

**Ce qui a été bien fait :**
- L'architecture du projet est propre et bien structurée
- Les fonctionnalités principales sont opérationnelles
- Un fichier `DÉMARRAGE.md` a été créé pour la prise en main

**Ce qui aurait dû être précisé dans le prompt initial :**
1. **Tester tous les boutons et leurs retours** — vérifier chaque action utilisateur et s'assurer que les feedbacks (succès, erreur, état vide) sont tous couverts.
2. **Gestion d'environnement** — mettre en place un système dev/test/production avec des logs activés uniquement en mode test (ex: `__DEV__`, variables d'environnement Expo).
3. **Tests unitaires dès le départ** — demander explicitement la création de tests unitaires pour chaque composant et service, avec la consigne de les lancer et corriger à chaque modification du code.

---

## Instructions pour Claude en nouvelle session

1. Lire ce fichier en premier.
2. Lire `DÉMARRAGE.md` pour les instructions de lancement.
3. Avant toute modification, lancer les tests : `npm test`
4. Après toute modification, relancer les tests et corriger les régressions avant de livrer.
5. Respecter la structure existante : `src/screens`, `src/components`, `src/services`, `src/database`, `src/theme`.

---

## État du dépôt

- Remote : `git@github.com:Baloo98815/my-real-library.git`
- Branche principale : `master`
- Dernier commit connu : `da981ac8` — modif bouton delete pour modals native
