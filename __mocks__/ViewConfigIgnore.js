// Mock de react-native/Libraries/NativeComponent/ViewConfigIgnore
//
// Ce fichier utilise la syntaxe Flow "const T" dans les paramètres génériques
// (ex : <const T: {+[name: string]: true}>), que certaines versions de
// @babel/plugin-transform-flow-strip-types ne savent pas parser.
// On remplace le fichier entier par une implémentation JS pure, sans Flow.

const ignoredViewConfigProps = new WeakSet();

export function DynamicallyInjectedByGestureHandler(object) {
  ignoredViewConfigProps.add(object);
  return object;
}

export function ConditionallyIgnoredEventHandlers(value) {
  // En prod iOS retourne value, sinon undefined.
  // Dans les tests on retourne toujours value (comportement neutre).
  return value;
}

export function isIgnored(value) {
  if (typeof value === 'object' && value != null) {
    return ignoredViewConfigProps.has(value);
  }
  return false;
}
