import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import {
  getWishlist,
  removeFromWishlist,
  moveWishlistToLibrary,
  updateWishlistNotes,
} from '../database/database';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadow,
  GENRES,
} from '../theme';

// ─── URL Place des Libraires ──────────────────────────────────────────────────
const buildLibraireURL = (book) => {
  const query = [book.title, book.author].filter(Boolean).join(' ');
  return `https://www.placedeslibraires.fr/recherche/?q=${encodeURIComponent(query)}`;
};

// ─── Carte Wishlist ───────────────────────────────────────────────────────────
const WishlistCard = ({ item, onDelete, onMoveToLibrary, onOpenLibrairie, onEditNotes }) => {
  const genreInfo = GENRES.find((g) => g.key === item.genre);

  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.row}>
        {/* Couverture */}
        {item.cover_url ? (
          <Image source={{ uri: item.cover_url }} style={cardStyles.cover} resizeMode="cover" />
        ) : (
          <View style={[cardStyles.cover, cardStyles.coverPlaceholder]}>
            <Ionicons name="book-outline" size={24} color={Colors.primaryLight} />
          </View>
        )}

        {/* Infos */}
        <View style={cardStyles.info}>
          <Text style={cardStyles.title} numberOfLines={2}>{item.title}</Text>
          {item.author ? (
            <Text style={cardStyles.author} numberOfLines={1}>{item.author}</Text>
          ) : null}
          {item.published_date ? (
            <Text style={cardStyles.meta}>{item.published_date}</Text>
          ) : null}
          {genreInfo ? (
            <View style={cardStyles.genreBadge}>
              <Ionicons name={genreInfo.icon} size={11} color={Colors.accent} />
              <Text style={cardStyles.genreText}>{genreInfo.label}</Text>
            </View>
          ) : null}
          {item.notes ? (
            <Text style={cardStyles.notes} numberOfLines={2}>📝 {item.notes}</Text>
          ) : null}
        </View>

        {/* Actions rapides */}
        <View style={cardStyles.actions}>
          <TouchableOpacity style={cardStyles.actionBtn} onPress={() => onDelete(item)}>
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
          </TouchableOpacity>
          <TouchableOpacity style={cardStyles.actionBtn} onPress={() => onEditNotes(item)}>
            <Ionicons name="create-outline" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Boutons principaux */}
      <View style={cardStyles.btnRow}>
        {/* Trouver en librairie */}
        <TouchableOpacity
          style={cardStyles.libraireBtn}
          onPress={() => onOpenLibrairie(item)}
        >
          <Ionicons name="storefront-outline" size={15} color={Colors.textInverse} />
          <Text style={cardStyles.libraireBtnText}>Trouver en librairie</Text>
        </TouchableOpacity>

        {/* Déjà acheté */}
        <TouchableOpacity
          style={cardStyles.gotItBtn}
          onPress={() => onMoveToLibrary(item)}
        >
          <Ionicons name="checkmark-circle-outline" size={15} color={Colors.secondary} />
          <Text style={cardStyles.gotItBtnText}>Acheté !</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius:    BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginVertical:   Spacing.xs,
    padding:          Spacing.md,
    ...Shadow.sm,
  },
  row: {
    flexDirection: 'row',
    marginBottom:  Spacing.md,
  },
  cover: {
    width:        56,
    height:       78,
    borderRadius: BorderRadius.sm,
    marginRight:  Spacing.md,
  },
  coverPlaceholder: {
    backgroundColor: Colors.backgroundDark,
    alignItems:      'center',
    justifyContent:  'center',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize:     Typography.fontSize.md,
    fontWeight:   Typography.fontWeight.semiBold,
    color:        Colors.textPrimary,
    marginBottom: 3,
  },
  author: {
    fontSize:   Typography.fontSize.sm,
    color:      Colors.textSecondary,
    marginBottom: 2,
  },
  meta: {
    fontSize: Typography.fontSize.xs,
    color:    Colors.textTertiary,
  },
  genreBadge: {
    flexDirection:  'row',
    alignItems:     'center',
    marginTop:      4,
    gap:            3,
  },
  genreText: {
    fontSize:   Typography.fontSize.xs,
    color:      Colors.accent,
    fontWeight: Typography.fontWeight.medium,
  },
  notes: {
    fontSize:   Typography.fontSize.xs,
    color:      Colors.textSecondary,
    fontStyle:  'italic',
    marginTop:  4,
    lineHeight: 16,
  },
  actions: {
    alignItems: 'center',
    gap:        Spacing.xs,
    marginLeft: Spacing.xs,
  },
  actionBtn: {
    padding: Spacing.xs,
  },
  btnRow: {
    flexDirection: 'row',
    gap:           Spacing.sm,
  },
  libraireBtn: {
    flex:            2,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.primary,
    borderRadius:    BorderRadius.sm,
    paddingVertical: Spacing.sm + 2,
    gap:             Spacing.xs,
  },
  libraireBtnText: {
    fontSize:   Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color:      Colors.textInverse,
  },
  gotItBtn: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#EAF3F0',
    borderRadius:    BorderRadius.sm,
    paddingVertical: Spacing.sm + 2,
    gap:             Spacing.xs,
    borderWidth:     1,
    borderColor:     Colors.secondary,
  },
  gotItBtnText: {
    fontSize:   Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color:      Colors.secondary,
  },
});

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function WishlistScreen({ navigation }) {
  const [items,         setItems]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [notesModal,    setNotesModal]    = useState(null); // item en édition
  const [notesText,     setNotesText]     = useState('');
  const [notesSaving,   setNotesSaving]   = useState(false);

  // ─── Chargement ─────────────────────────────────────────────────────────────
  const loadWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWishlist();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWishlist();
    }, [loadWishlist])
  );

  // ─── Actions ────────────────────────────────────────────────────────────────
  const handleDelete = (item) => {
    Alert.alert(
      'Retirer de la wishlist',
      `Retirer « ${item.title} » de votre liste de souhaits ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            await removeFromWishlist(item.id);
            setItems((prev) => prev.filter((i) => i.id !== item.id));
          },
        },
      ]
    );
  };

  const handleMoveToLibrary = (item) => {
    Alert.alert(
      '🎉 Vous l\'avez acheté !',
      `Ajouter « ${item.title} » à votre bibliothèque et le retirer de la wishlist ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Ajouter à la bibliothèque',
          onPress: async () => {
            await moveWishlistToLibrary(item);
            setItems((prev) => prev.filter((i) => i.id !== item.id));
            Alert.alert(
              'Livre ajouté !',
              `« ${item.title} » est maintenant dans votre bibliothèque.`,
              [{ text: 'Voir la bibliothèque', onPress: () => navigation.navigate('LibraryTab') }]
            );
          },
        },
      ]
    );
  };

  const handleOpenLibrairie = async (item) => {
    const url = buildLibraireURL(item);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Impossible d\'ouvrir le navigateur', url);
      }
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ouvrir Place des Libraires.');
    }
  };

  const handleEditNotes = (item) => {
    setNotesText(item.notes || '');
    setNotesModal(item);
  };

  const handleSaveNotes = async () => {
    if (!notesModal) return;
    setNotesSaving(true);
    try {
      await updateWishlistNotes(notesModal.id, notesText.trim());
      setItems((prev) =>
        prev.map((i) => i.id === notesModal.id ? { ...i, notes: notesText.trim() } : i)
      );
      setNotesModal(null);
    } finally {
      setNotesSaving(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={64} color={Colors.border} />
      <Text style={styles.emptyTitle}>Votre wishlist est vide</Text>
      <Text style={styles.emptySubtitle}>
        Retrouvez un livre depuis la bibliothèque ou lors d'un ajout pour l'ajouter ici.
      </Text>
      <TouchableOpacity style={styles.librairePromoBtn} onPress={() => Linking.openURL('https://www.placedeslibraires.fr')}>
        <Ionicons name="storefront-outline" size={18} color={Colors.textInverse} />
        <Text style={styles.librairePromoBtnText}>Découvrir Place des Libraires</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Ma Wishlist</Text>
          <Text style={styles.headerSubtitle}>
            {items.length} livre{items.length !== 1 ? 's' : ''} souhaité{items.length !== 1 ? 's' : ''}
          </Text>
        </View>
        {/* Lien Place des Libraires */}
        <TouchableOpacity
          style={styles.libraireHeaderBtn}
          onPress={() => Linking.openURL('https://www.placedeslibraires.fr')}
        >
          <Ionicons name="storefront-outline" size={16} color={Colors.primary} />
          <Text style={styles.libraireHeaderBtnText}>placedeslibraires.fr</Text>
        </TouchableOpacity>
      </View>

      {/* Bannière info */}
      {items.length > 0 && (
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
          <Text style={styles.infoBannerText}>
            Appuyez sur «{' '}<Text style={{ fontWeight: '700' }}>Trouver en librairie</Text>{' '}» pour chercher un livre sur Place des Libraires et soutenir les librairies indépendantes.
          </Text>
        </View>
      )}

      {/* Liste */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <WishlistCard
              item={item}
              onDelete={handleDelete}
              onMoveToLibrary={handleMoveToLibrary}
              onOpenLibrairie={handleOpenLibrairie}
              onEditNotes={handleEditNotes}
            />
          )}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modale notes */}
      <Modal
        visible={!!notesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setNotesModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Notes personnelles</Text>
            <Text style={styles.modalSubtitle}>
              {notesModal?.title}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={notesText}
              onChangeText={setNotesText}
              placeholder="Pourquoi voulez-vous ce livre ? Où l'avez-vous vu ?…"
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={4}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setNotesModal(null)}
              >
                <Text style={styles.modalCancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, notesSaving && { opacity: 0.6 }]}
                onPress={handleSaveNotes}
                disabled={notesSaving}
              >
                {notesSaving
                  ? <ActivityIndicator size="small" color={Colors.textInverse} />
                  : <Text style={styles.modalConfirmBtnText}>Enregistrer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flex:       1,
    fontSize:   Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.heavy,
    color:      Colors.primary,
  },
  headerSubtitle: {
    fontSize:  Typography.fontSize.sm,
    color:     Colors.textTertiary,
    marginTop: 2,
  },
  libraireHeaderBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.backgroundDark,
    borderRadius:    BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.xs,
    borderWidth:       1,
    borderColor:       Colors.border,
    gap:               Spacing.xs,
  },
  libraireHeaderBtnText: {
    fontSize:   Typography.fontSize.xs,
    color:      Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },

  // Bannière
  infoBanner: {
    flexDirection:    'row',
    alignItems:       'flex-start',
    backgroundColor:  '#F2EDE5',
    borderRadius:     BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginBottom:     Spacing.md,
    padding:          Spacing.md,
    gap:              Spacing.sm,
    borderWidth:      1,
    borderColor:      Colors.border,
  },
  infoBannerText: {
    flex:      1,
    fontSize:  Typography.fontSize.xs,
    color:     Colors.textSecondary,
    lineHeight: 17,
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
    marginBottom: Spacing.xl,
  },
  librairePromoBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.primary,
    borderRadius:    BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.md,
    gap:             Spacing.sm,
    ...Shadow.md,
  },
  librairePromoBtnText: {
    fontSize:   Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color:      Colors.textInverse,
  },

  // Modale notes
  modalOverlay: {
    flex:            1,
    backgroundColor: Colors.overlay,
    justifyContent:  'flex-end',
  },
  modalSheet: {
    backgroundColor:     Colors.surface,
    borderTopLeftRadius:  BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding:         Spacing.xl,
    paddingBottom:   Spacing.xxxl,
  },
  modalHandle: {
    width:           40,
    height:          4,
    borderRadius:    BorderRadius.full,
    backgroundColor: Colors.border,
    alignSelf:       'center',
    marginBottom:    Spacing.lg,
  },
  modalTitle: {
    fontSize:     Typography.fontSize.xl,
    fontWeight:   Typography.fontWeight.bold,
    color:        Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize:     Typography.fontSize.sm,
    color:        Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontStyle:    'italic',
  },
  modalInput: {
    backgroundColor:   Colors.background,
    borderRadius:      BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.md,
    fontSize:          Typography.fontSize.md,
    color:             Colors.textPrimary,
    borderWidth:       1,
    borderColor:       Colors.border,
    marginBottom:      Spacing.lg,
    minHeight:         100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap:           Spacing.md,
  },
  modalCancelBtn: {
    flex:            1,
    alignItems:      'center',
    paddingVertical: Spacing.md,
    borderRadius:    BorderRadius.md,
    backgroundColor: Colors.backgroundDark,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  modalCancelBtnText: {
    fontSize:   Typography.fontSize.md,
    color:      Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  modalConfirmBtn: {
    flex:            2,
    alignItems:      'center',
    paddingVertical: Spacing.md,
    borderRadius:    BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  modalConfirmBtnText: {
    fontSize:   Typography.fontSize.md,
    color:      Colors.textInverse,
    fontWeight: Typography.fontWeight.semiBold,
  },
});
