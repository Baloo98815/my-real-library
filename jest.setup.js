// Configuration Jest pour React Native Testing Library
// Ce fichier est exécuté une fois avant chaque suite de tests

// Supprime les avertissements connus non pertinents dans les tests
jest.spyOn(console, 'warn').mockImplementation((msg) => {
  const ignored = [
    'Animated:',
    'VirtualizedList',
    'Each child in a list',
  ];
  if (ignored.some((pattern) => msg?.includes?.(pattern))) return;
  console.warn(msg);
});

// Mock global de fetch (pour les tests API)
global.fetch = jest.fn();

// Mock de Linking (pour la wishlist → placedeslibraires.fr)
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL:    jest.fn().mockResolvedValue(undefined),
  canOpenURL: jest.fn().mockResolvedValue(true),
}));

// ─── Pré-configuration des noms de composants hôtes RNTL ─────────────────────
// React Native 0.84+ contient ViewConfigIgnore.js qui utilise la syntaxe Flow
// "const T" dans les paramètres génériques — syntaxe que certaines configs Babel
// ne savent pas parser.
// RNTL appelle detectHostComponentNames() au premier render() pour détecter
// automatiquement ces noms, ce qui déclenche le parsing du fichier problématique.
// En pré-configurant les noms manuellement, on saute complètement cette détection.
const { configure } = require('@testing-library/react-native');
configure({
  hostComponentNames: {
    text:       'Text',
    textInput:  'TextInput',
    image:      'Image',
    switch:     'Switch',
    scrollView: 'ScrollView',
    modal:      'Modal',
  },
});
