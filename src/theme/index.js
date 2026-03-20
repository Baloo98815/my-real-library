// ─── Palette ──────────────────────────────────────────────────────────────────
export const Colors = {
  // Fond général - parchemin chaud
  background:       '#F8F4EE',
  backgroundDark:   '#EDE7DD',

  // Surface (cartes, modales)
  surface:          '#FFFFFF',
  surfaceSecondary: '#F2EDE5',

  // Brun primaire (style bois/bibliothèque)
  primary:          '#5C3D2E',
  primaryLight:     '#7A5244',
  primaryDark:      '#3A2319',

  // Doré accent
  accent:           '#C8943A',
  accentLight:      '#E8BA6A',

  // Vert forêt (secondaire)
  secondary:        '#3D7A5E',
  secondaryLight:   '#5A9E7F',

  // Texte
  textPrimary:      '#2C1A0E',
  textSecondary:    '#7A6055',
  textTertiary:     '#A08070',
  textInverse:      '#FFFFFF',

  // Statuts de lecture
  statusUnread:     '#8E9AAF',   // gris bleuté
  statusReading:    '#C8943A',   // doré
  statusRead:       '#3D7A5E',   // vert

  // Prêt
  lentColor:        '#C0392B',

  // Bordures
  border:           '#D4C4B0',
  borderLight:      '#E8DDD0',

  // Système
  error:            '#C0392B',
  success:          '#27AE60',
  warning:          '#E67E22',

  // Overlay
  overlay:          'rgba(44, 26, 14, 0.5)',
};

// ─── Typographie ──────────────────────────────────────────────────────────────
export const Typography = {
  fontFamily: {
    regular: 'System',
    medium:  'System',
    bold:    'System',
  },
  fontSize: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   17,
    xl:   20,
    xxl:  24,
    xxxl: 30,
  },
  fontWeight: {
    regular: '400',
    medium:  '500',
    semiBold:'600',
    bold:    '700',
    heavy:   '800',
  },
};

// ─── Espacement ───────────────────────────────────────────────────────────────
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  xxxl: 48,
};

// ─── Bordures ─────────────────────────────────────────────────────────────────
export const BorderRadius = {
  sm:   6,
  md:   10,
  lg:   16,
  xl:   24,
  full: 999,
};

// ─── Ombres ───────────────────────────────────────────────────────────────────
export const Shadow = {
  sm: {
    shadowColor:   '#2C1A0E',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius:  3,
    elevation:     2,
  },
  md: {
    shadowColor:   '#2C1A0E',
    shadowOffset:  { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius:  6,
    elevation:     4,
  },
  lg: {
    shadowColor:   '#2C1A0E',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius:  12,
    elevation:     8,
  },
};

// ─── Libellés lisibles ────────────────────────────────────────────────────────
export const READING_STATUS_LABELS = {
  unread:  'Non lu',
  reading: 'En cours',
  read:    'Lu',
};

export const READING_STATUS_COLORS = {
  unread:  Colors.statusUnread,
  reading: Colors.statusReading,
  read:    Colors.statusRead,
};

// ─── Genres ───────────────────────────────────────────────────────────────────
export const GENRES = [
  { key: 'roman',        label: 'Roman',                   icon: 'book-outline' },
  { key: 'policier',     label: 'Policier / Thriller',     icon: 'search-outline' },
  { key: 'scifi',        label: 'Science-Fiction',         icon: 'planet-outline' },
  { key: 'fantasy',      label: 'Fantasy / Fantastique',   icon: 'sparkles-outline' },
  { key: 'biographie',   label: 'Biographie',              icon: 'person-outline' },
  { key: 'histoire',     label: 'Histoire',                icon: 'time-outline' },
  { key: 'sciences',     label: 'Sciences & Nature',       icon: 'flask-outline' },
  { key: 'dev_perso',    label: 'Développement perso.',    icon: 'trending-up-outline' },
  { key: 'cuisine',      label: 'Cuisine',                 icon: 'restaurant-outline' },
  { key: 'voyage',       label: 'Voyage',                  icon: 'compass-outline' },
  { key: 'jeunesse',     label: 'Jeunesse',                icon: 'happy-outline' },
  { key: 'bd_manga',     label: 'BD / Manga',              icon: 'images-outline' },
  { key: 'art',          label: 'Art & Culture',           icon: 'color-palette-outline' },
  { key: 'economie',     label: 'Économie & Business',     icon: 'briefcase-outline' },
  { key: 'philo',        label: 'Philosophie',             icon: 'bulb-outline' },
  { key: 'religion',     label: 'Religion & Spiritualité', icon: 'leaf-outline' },
  { key: 'poesie',       label: 'Poésie',                  icon: 'musical-notes-outline' },
  { key: 'humour',       label: 'Humour',                  icon: 'happy-outline' },
  { key: 'droit',        label: 'Droit',                   icon: 'document-text-outline' },
  { key: 'sante',        label: 'Santé & Bien-être',       icon: 'heart-outline' },
  { key: 'informatique', label: 'Informatique',            icon: 'code-slash-outline' },
  { key: 'autre',        label: 'Autre',                   icon: 'ellipsis-horizontal-outline' },
];

// ─── Périodes de publication ──────────────────────────────────────────────────
export const DATE_PERIODS = [
  { key: 'avant1960',  label: 'Classiques (< 1960)',  from: null, to: 1959 },
  { key: 'annees60',   label: '1960 – 1979',          from: 1960, to: 1979 },
  { key: 'annees80',   label: '1980 – 1999',          from: 1980, to: 1999 },
  { key: 'annees2000', label: '2000 – 2009',          from: 2000, to: 2009 },
  { key: 'annees2010', label: '2010 – 2019',          from: 2010, to: 2019 },
  { key: 'recents',    label: 'Récents (2020+)',       from: 2020, to: null  },
];
