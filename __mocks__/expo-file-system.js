// Mock d'expo-file-system pour les tests unitaires
// Le logger utilise expo-file-system ; dans les tests on ne veut pas écrire
// sur disque, donc on remplace toutes les fonctions par des no-ops.

export const documentDirectory = 'file:///mock-documents/';

export const getInfoAsync = jest.fn(async () => ({ exists: false }));

export const readAsStringAsync = jest.fn(async () => '');

export const writeAsStringAsync = jest.fn(async () => {});

export const deleteAsync = jest.fn(async () => {});

export const makeDirectoryAsync = jest.fn(async () => {});

export const copyAsync = jest.fn(async () => {});

export const moveAsync = jest.fn(async () => {});
