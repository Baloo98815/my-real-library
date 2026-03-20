import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import BookCard from '../components/BookCard';
import { getAllBooks, searchBooks, filterBooks } from '../database/database';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadow,
  READING_STATUS_LABELS,
  READING_STATUS_COLORS,
  GENRES,
  DATE_PERIODS,
} from '../theme';

// ─── Filtres statut ───────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { key: null,      label: 'Tous' },
  { key: 'unread',  label: 'Non lus' },
  { key: 'reading', label: 'En cours' },
  { key: 'read',    label: 'Lus' },
];

const LENT_FILTERS = [
  { key: null,  label: 'Tous' },
  { key: true,  label: 'Prêtés' },
  { key: false, label: 'Disponibles' },
];

// ─── Pill générique ───────────────────────────────────────────────────────────
const Pill = ({ label, icon, active, color, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.pill, active && { backgroundColor: color || Colors.primary, borderColor: color || Colors.primary }]}
    activeOpacity={0.75}
  >
    {icon && (
      <Ionicons
        name={icon}
        size={13}
        color={active ? Colors.textInverse : Colors.textSecondary}
        style={{ marginRight: 4 }}
      />
    )}
    <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Compteur de filtres actifs ───────────────────────────────────────────────
const countActiveFilters = (statusFilter, lentFilter, genreFilter, datePeriodFilter) => {
  let n = 0;
  if (statusFilter !== null)     n++;
  if (lentFilter !== null)       n++;
  if (genreFilter !== null)      n++;
  if (datePeriodFilter !== null) n++;
  return n;
};

export default function LibraryScreen({ navigation }) {
  const [books,            setBooks]            = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [statusFilter,     setStatusFilter]     = useState(null);
  const [lentFilter,       setLentFilter]       = useState(null);
  const [genreFilter,      setGenreFilter]      = useState(null);
  const [datePeriodFilter, setDatePeriodFilter] = useState(null);
  const [showFilters,      setShowFilters]      = useState(false);

  // ─── Chargement ─────────────────────────────────────────────────────────────
  const buildFilters = useCallback(() => {
    const period = DATE_PERIODS.find((p) => p.key === datePeriodFilter);
    return {
      reading_status: statusFilter,
      lent:           lentFilter,
      genre:          genreFilter,
      date_from:      period?.from ?? null,
      date_to:        period?.to   ?? null,
    };
  }, [statusFilter, lentFilter, genreFilter, datePeriodFilter]);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const filters = buildFilters();
      const hasFilters = Object.values(filters).some((v) => v != null);
      let result;
      if (searchQuery.trim()) {
        result = await searchBooks(searchQuery, filters);
      } else if (hasFilters) {
        result = await filterBooks(filters);
      } else {
        result = await getAllBooks();
      }
      setBooks(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, buildFilters]);

  useFocusEffect(
    useCallback(() => {
      loadBooks();
    }, [loadBooks])
  );

  const resetAllFilters = () => {
    setStatusFilter(null);
    setLentFilter(null);
    setGenreFilter(null);
    setDatePeriodFilter(null);
  };

  const activeFilterCount = countActiveFilters(statusFilter, lentFilter, genreFilter, datePeriodFilter);
  const lentCount    = books.filter((b) => b.lent_to && b.lent_to.trim()).length;
  const readingCount = books.filter((b) => b.reading_status === 'reading').length;

  // ─── Rendu état vide ─────────────────────────────────────────────────────────
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="book-outline" size={64} color={Colors.border} />
      <Text style={styles.emptyTitle}>
        {searchQuery || activeFilterCount > 0 ? 'Aucun livre trouvé' : 'Votre bibliothèque est vide'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || activeFilterCount > 0
          ? 'Essayez d\'autres termes ou retirez des filtres'
          : 'Appuyez sur « Ajouter » pour scanner ou saisir votre premier livre'}
      </Text>
      {activeFilterCount > 0 && (
        <TouchableOpacity style={styles.resetFiltersBtn} onPress={resetAllFilters}>
          <Text style={styles.resetFiltersBtnText}>Effacer les filtres</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Ma Bibliothèque</Text>
          <Text style={styles.headerSubtitle}>
            {books.length} livre{books.length !== 1 ? 's' : ''}
            {lentCount > 0    ? ` · ${lentCount} prêté${lentCount > 1 ? 's' : ''}`    : ''}
            {readingCount > 0 ? ` · ${readingCount} en cours` : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
          onPress={() => setShowFilters((v) => !v)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={showFilters ? Colors.textInverse : Colors.primary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Titre, auteur, ISBN, genre…"
          placeholderTextColor={Colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Panneau de filtres */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <ScrollView showsVerticalScrollIndicator={false}>

            {/* ── Statut de lecture ── */}
            <Text style={styles.filterGroupLabel}>Statut de lecture</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {STATUS_FILTERS.map((f) => (
                <Pill
                  key={String(f.key)}
                  label={f.label}
                  active={statusFilter === f.key}
                  color={f.key ? READING_STATUS_COLORS[f.key] : Colors.primary}
                  onPress={() => setStatusFilter(statusFilter === f.key && f.key !== null ? null : f.key)}
                />
              ))}
            </ScrollView>

            {/* ── Disponibilité ── */}
            <Text style={styles.filterGroupLabel}>Disponibilité</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {LENT_FILTERS.map((f) => (
                <Pill
                  key={String(f.key)}
                  label={f.label}
                  active={lentFilter === f.key}
                  color={f.key === true ? Colors.lentColor : Colors.secondary}
                  onPress={() => setLentFilter(lentFilter === f.key && f.key !== null ? null : f.key)}
                />
              ))}
            </ScrollView>

            {/* ── Genre ── */}
            <Text style={styles.filterGroupLabel}>Genre</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {GENRES.map((g) => (
                <Pill
                  key={g.key}
                  label={g.label}
                  icon={g.icon}
                  active={genreFilter === g.key}
                  color={Colors.accent}
                  onPress={() => setGenreFilter(genreFilter === g.key ? null : g.key)}
                />
              ))}
            </ScrollView>

            {/* ── Période de publication ── */}
            <Text style={styles.filterGroupLabel}>Période de parution</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {DATE_PERIODS.map((p) => (
                <Pill
                  key={p.key}
                  label={p.label}
                  active={datePeriodFilter === p.key}
                  color={Colors.primaryLight}
                  onPress={() => setDatePeriodFilter(datePeriodFilter === p.key ? null : p.key)}
                />
              ))}
            </ScrollView>

            {/* Bouton reset */}
            {activeFilterCount > 0 && (
              <TouchableOpacity style={styles.resetButton} onPress={resetAllFilters}>
                <Ionicons name="close-circle-outline" size={14} color={Colors.accent} />
                <Text style={styles.resetButtonText}>
                  Réinitialiser les {activeFilterCount} filtre{activeFilterCount > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* Liste */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <BookCard
              book={item}
              onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
            />
          )}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={books.length === 0 ? styles.emptyList : styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: Spacing.lg,
    paddingTop:        Spacing.lg,
    paddingBottom:     Spacing.md,
  },
  headerTitle: {
    fontSize:   Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.heavy,
    color:      Colors.primary,
  },
  headerSubtitle: {
    fontSize:  Typography.fontSize.sm,
    color:     Colors.textTertiary,
    marginTop: 2,
  },
  filterToggle: {
    width:           40,
    height:          40,
    borderRadius:    BorderRadius.md,
    backgroundColor: Colors.backgroundDark,
    alignItems:      'center',
    justifyContent:  'center',
  },
  filterToggleActive: {
    backgroundColor: Colors.primary,
  },
  filterBadge: {
    position:        'absolute',
    top:             -4,
    right:           -4,
    width:           18,
    height:          18,
    borderRadius:    9,
    backgroundColor: Colors.accent,
    alignItems:      'center',
    justifyContent:  'center',
  },
  filterBadgeText: {
    fontSize:   9,
    color:      Colors.textInverse,
    fontWeight: Typography.fontWeight.bold,
  },

  // Recherche
  searchBar: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  Colors.surface,
    borderRadius:     BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom:     Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm + 2,
    ...Shadow.sm,
  },
  searchInput: {
    flex:       1,
    marginLeft: Spacing.sm,
    fontSize:   Typography.fontSize.md,
    color:      Colors.textPrimary,
  },

  // Filtres
  filtersPanel: {
    backgroundColor:  Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom:     Spacing.md,
    borderRadius:     BorderRadius.md,
    padding:          Spacing.md,
    maxHeight:        280,
    ...Shadow.sm,
  },
  filterGroupLabel: {
    fontSize:      Typography.fontSize.xs,
    fontWeight:    Typography.fontWeight.semiBold,
    color:         Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom:  Spacing.xs,
    marginTop:     Spacing.xs,
  },
  pillRow: {
    flexDirection:  'row',
    marginBottom:   Spacing.sm,
  },
  pill: {
    flexDirection:   'row',
    alignItems:      'center',
    borderRadius:    BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical:   5,
    backgroundColor:   Colors.backgroundDark,
    marginRight:       Spacing.sm,
    borderWidth:       1,
    borderColor:       Colors.border,
  },
  pillText: {
    fontSize:   Typography.fontSize.xs,
    color:      Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  pillTextActive: {
    color: Colors.textInverse,
  },
  resetButton: {
    flexDirection:  'row',
    alignItems:     'center',
    alignSelf:      'flex-start',
    paddingVertical: Spacing.xs,
    gap:            Spacing.xs,
    marginTop:      Spacing.xs,
  },
  resetButtonText: {
    fontSize:   Typography.fontSize.sm,
    color:      Colors.accent,
    fontWeight: Typography.fontWeight.medium,
  },

  // Liste
  list: {
    paddingBottom: Spacing.xxl,
  },
  emptyList: {
    flex: 1,
  },
  loaderContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: Spacing.xxl,
    paddingTop:        Spacing.xxxl,
  },
  emptyTitle: {
    fontSize:     Typography.fontSize.lg,
    fontWeight:   Typography.fontWeight.semiBold,
    color:        Colors.textSecondary,
    marginTop:    Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign:    'center',
  },
  emptySubtitle: {
    fontSize:   Typography.fontSize.sm,
    color:      Colors.textTertiary,
    textAlign:  'center',
    lineHeight: 20,
  },
  resetFiltersBtn: {
    marginTop:       Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.accent,
    borderRadius:    BorderRadius.full,
  },
  resetFiltersBtnText: {
    color:      Colors.textInverse,
    fontWeight: Typography.fontWeight.semiBold,
    fontSize:   Typography.fontSize.sm,
  },
});
