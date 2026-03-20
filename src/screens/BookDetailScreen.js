import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  getBookById,
  updateBook,
  deleteBook,
  lendBook,
  returnBook,
  updateReadingStatus,
  addToWishlist,
  isInWishlist,
} from '../database/database';
import GenrePicker from '../components/GenrePicker';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadow,
  READING_STATUS_LABELS,
  READING_STATUS_COLORS,
  GENRES,
} from '../theme';

const READING_STATUSES = ['unread', 'reading', 'read'];

export default function BookDetailScreen({ route, navigation }) {
  const { bookId } = route.params;

  const [book,         setBook]         = useState(null);
  const [loading,      setLoading]      = useState(true);

  // Modales
  const [showLendModal,   setShowLendModal]   = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [lendName,        setLendName]        = useState('');
  const [lendSaving,      setLendSaving]      = useState(false);
  const [inWishlist,      setInWishlist]      = useState(false);

  // ─── Chargement ─────────────────────────────────────────────────────────────
  const loadBook = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBookById(bookId);
      setBook(data);
      if (data?.title) {
        const alreadyInWishlist = await isInWishlist(data.title);
        setInWishlist(alreadyInWishlist);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    loadBook();
  }, [loadBook]);

  // ─── Actions ────────────────────────────────────────────────────────────────
  const handleStatusChange = async (status) => {
    await updateReadingStatus(bookId, status);
    setBook((prev) => ({ ...prev, reading_status: status }));
  };

  const handleLend = async () => {
    if (!lendName.trim()) return;
    setLendSaving(true);
    try {
      await lendBook(bookId, lendName.trim());
      setBook((prev) => ({ ...prev, lent_to: lendName.trim() }));
      setShowLendModal(false);
      setLendName('');
    } finally {
      setLendSaving(false);
    }
  };

  const handleGenreChange = async (key) => {
    await updateBook(bookId, { genre: key });
    setBook((prev) => ({ ...prev, genre: key }));
  };

  const handleAddToWishlist = async () => {
    try {
      await addToWishlist(book);
      setInWishlist(true);
      Alert.alert('Ajouté à la wishlist !', `« ${book.title} » est dans votre liste de souhaits.`);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'ajouter à la wishlist.');
    }
  };

  const handleReturn = () => {
    Alert.alert(
      'Livre rendu',
      `Confirmer que ${book.lent_to} a rendu le livre ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            await returnBook(bookId);
            setBook((prev) => ({ ...prev, lent_to: null }));
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer ce livre',
      `Êtes-vous sûr de vouloir supprimer « ${book?.title} » de votre bibliothèque ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteBook(bookId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (loading || !book) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const statusColor = READING_STATUS_COLORS[book.reading_status] || Colors.statusUnread;
  const statusLabel = READING_STATUS_LABELS[book.reading_status] || 'Non lu';
  const isLent      = book.lent_to && book.lent_to.trim() !== '';

  const InfoRow = ({ icon, label, value }) =>
    value ? (
      <View style={styles.infoRow}>
        <Ionicons name={icon} size={16} color={Colors.textTertiary} style={styles.infoIcon} />
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{book.title}</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={22} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Hero ── */}
        <View style={styles.heroSection}>
          {/* Couverture */}
          <View style={styles.coverContainer}>
            {book.cover_url ? (
              <Image source={{ uri: book.cover_url }} style={styles.cover} resizeMode="cover" />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Ionicons name="book" size={48} color={Colors.primaryLight} />
              </View>
            )}
          </View>

          {/* Titre / Auteur */}
          <Text style={styles.bookTitle}>{book.title}</Text>
          {book.author ? <Text style={styles.bookAuthor}>{book.author}</Text> : null}
          {book.publisher ? (
            <Text style={styles.bookMeta}>
              {book.publisher}{book.published_date ? ` · ${book.published_date}` : ''}
            </Text>
          ) : (
            book.published_date ? <Text style={styles.bookMeta}>{book.published_date}</Text> : null
          )}
        </View>

        {/* ── Statut de lecture ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statut de lecture</Text>
          <View style={styles.statusRow}>
            {READING_STATUSES.map((s) => {
              const active = book.reading_status === s;
              const color  = READING_STATUS_COLORS[s];
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusBtn,
                    active && { backgroundColor: color, borderColor: color },
                  ]}
                  onPress={() => handleStatusChange(s)}
                >
                  <Ionicons
                    name={
                      s === 'read'    ? 'checkmark-circle' :
                      s === 'reading' ? 'time'             : 'ellipse-outline'
                    }
                    size={16}
                    color={active ? Colors.textInverse : color}
                  />
                  <Text style={[styles.statusBtnText, active && styles.statusBtnTextActive]}>
                    {READING_STATUS_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Prêt ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prêt du livre</Text>
          {isLent ? (
            <View style={styles.lentInfo}>
              <View style={styles.lentBanner}>
                <Ionicons name="person-circle" size={32} color={Colors.lentColor} />
                <View style={styles.lentBannerText}>
                  <Text style={styles.lentLabel}>Prêté à</Text>
                  <Text style={styles.lentName}>{book.lent_to}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.returnBtn} onPress={handleReturn}>
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.textInverse} />
                <Text style={styles.returnBtnText}>Marquer comme rendu</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.lendBtn} onPress={() => setShowLendModal(true)}>
              <Ionicons name="person-add-outline" size={18} color={Colors.primary} />
              <Text style={styles.lendBtnText}>Enregistrer un prêt</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Genre ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genre</Text>
          <GenrePicker
            value={book.genre || null}
            onChange={handleGenreChange}
          />
        </View>

        {/* ── Informations ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="document-text-outline" label="ISBN"       value={book.isbn} />
            <InfoRow icon="barcode-outline"        label="EAN"        value={book.ean} />
            <InfoRow icon="pricetag-outline"        label="ASIN"       value={book.asin} />
            <InfoRow icon="barcode-outline"         label="UPC"        value={book.upc} />
            <InfoRow icon="document-outline"        label="ISSN"       value={book.issn} />
            <InfoRow icon="bookmarks-outline"       label="Pages"      value={book.pages?.toString()} />
            <InfoRow icon="globe-outline"           label="Langue"     value={book.language} />
            <InfoRow icon="folder-outline"          label="Catégories" value={book.categories} />
            <InfoRow icon="calendar-outline"        label="Ajouté le"  value={
              book.added_date ? new Date(book.added_date).toLocaleDateString('fr-FR') : null
            } />
          </View>
        </View>

        {/* ── Description ── */}
        {book.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{book.description}</Text>
          </View>
        ) : null}

        {/* ── Wishlist ── */}
        <View style={[styles.section, { borderBottomWidth: 0 }]}>
          <TouchableOpacity
            style={[styles.wishlistBtn, inWishlist && styles.wishlistBtnActive]}
            onPress={inWishlist ? undefined : handleAddToWishlist}
            disabled={inWishlist}
          >
            <Ionicons
              name={inWishlist ? 'heart' : 'heart-outline'}
              size={18}
              color={inWishlist ? Colors.textInverse : Colors.accent}
            />
            <Text style={[styles.wishlistBtnText, inWishlist && styles.wishlistBtnTextActive]}>
              {inWishlist ? 'Déjà dans la wishlist' : 'Ajouter à la wishlist'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Modale prêt ── */}
      <Modal
        visible={showLendModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLendModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Prêter ce livre</Text>
            <Text style={styles.modalSubtitle}>À qui prêtez-vous « {book.title} » ?</Text>
            <TextInput
              style={styles.modalInput}
              value={lendName}
              onChangeText={setLendName}
              placeholder="Nom de la personne"
              placeholderTextColor={Colors.textTertiary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleLend}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setShowLendModal(false); setLendName(''); }}
              >
                <Text style={styles.modalCancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, (!lendName.trim() || lendSaving) && { opacity: 0.5 }]}
                onPress={handleLend}
                disabled={!lendName.trim() || lendSaving}
              >
                {lendSaving
                  ? <ActivityIndicator size="small" color={Colors.textInverse} />
                  : <Text style={styles.modalConfirmBtnText}>Confirmer le prêt</Text>}
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
  loaderContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  // Barre de navigation
  navBar: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor:   Colors.surface,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  navTitle: {
    flex:       1,
    marginLeft: Spacing.md,
    fontSize:   Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color:      Colors.textPrimary,
  },
  deleteBtn: {
    padding: Spacing.xs,
  },

  // Hero
  heroSection: {
    alignItems:      'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  coverContainer: {
    marginBottom: Spacing.lg,
    ...Shadow.lg,
  },
  cover: {
    width:        140,
    height:       200,
    borderRadius: BorderRadius.md,
  },
  coverPlaceholder: {
    width:           140,
    height:          200,
    borderRadius:    BorderRadius.md,
    backgroundColor: Colors.backgroundDark,
    alignItems:      'center',
    justifyContent:  'center',
  },
  bookTitle: {
    fontSize:   Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color:      Colors.textPrimary,
    textAlign:  'center',
    marginBottom: Spacing.xs,
  },
  bookAuthor: {
    fontSize:  Typography.fontSize.md,
    color:     Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  bookMeta: {
    fontSize:  Typography.fontSize.sm,
    color:     Colors.textTertiary,
    textAlign: 'center',
  },

  // Sections
  section: {
    margin:          Spacing.lg,
    marginBottom:    0,
    paddingBottom:   Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize:     Typography.fontSize.xs,
    fontWeight:   Typography.fontWeight.semiBold,
    color:        Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom:  Spacing.md,
  },

  // Statut
  statusRow: {
    flexDirection: 'row',
    gap:           Spacing.sm,
  },
  statusBtn: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius:    BorderRadius.md,
    borderWidth:     1.5,
    borderColor:     Colors.border,
    backgroundColor: Colors.surface,
    gap:             Spacing.xs,
  },
  statusBtnText: {
    fontSize:   Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color:      Colors.textSecondary,
  },
  statusBtnTextActive: {
    color: Colors.textInverse,
  },

  // Prêt
  lentBanner: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#FEF3F3',
    borderRadius:    BorderRadius.md,
    padding:         Spacing.md,
    marginBottom:    Spacing.md,
    borderWidth:     1,
    borderColor:     '#F5C6C6',
  },
  lentBannerText: {
    marginLeft: Spacing.md,
  },
  lentLabel: {
    fontSize:   Typography.fontSize.xs,
    color:      Colors.lentColor,
    fontWeight: Typography.fontWeight.semiBold,
    textTransform: 'uppercase',
  },
  lentName: {
    fontSize:   Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color:      Colors.textPrimary,
  },
  lentInfo: {},
  returnBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.secondary,
    borderRadius:    BorderRadius.md,
    padding:         Spacing.md,
    gap:             Spacing.sm,
  },
  returnBtnText: {
    fontSize:   Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color:      Colors.textInverse,
  },
  lendBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.backgroundDark,
    borderRadius:    BorderRadius.md,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    gap:             Spacing.sm,
  },
  lendBtnText: {
    fontSize:   Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color:      Colors.primary,
  },

  // Infos
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius:    BorderRadius.md,
    overflow:        'hidden',
    ...Shadow.sm,
  },
  infoRow: {
    flexDirection:  'row',
    alignItems:     'center',
    padding:        Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoIcon: {
    marginRight: Spacing.sm,
    width:       20,
  },
  infoLabel: {
    fontSize:   Typography.fontSize.sm,
    color:      Colors.textTertiary,
    width:      90,
  },
  infoValue: {
    flex:       1,
    fontSize:   Typography.fontSize.sm,
    color:      Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },

  // Description
  description: {
    fontSize:   Typography.fontSize.sm,
    color:      Colors.textSecondary,
    lineHeight: 22,
    backgroundColor: Colors.surface,
    borderRadius:    BorderRadius.md,
    padding:         Spacing.md,
    ...Shadow.sm,
  },

  // Wishlist
  wishlistBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.surface,
    borderRadius:    BorderRadius.md,
    padding:         Spacing.md,
    borderWidth:     1.5,
    borderColor:     Colors.accent,
    gap:             Spacing.sm,
    ...Shadow.sm,
  },
  wishlistBtnActive: {
    backgroundColor: Colors.accent,
    borderColor:     Colors.accent,
  },
  wishlistBtnText: {
    fontSize:   Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color:      Colors.accent,
  },
  wishlistBtnTextActive: {
    color: Colors.textInverse,
  },

  // Modale prêt
  modalOverlay: {
    flex:            1,
    backgroundColor: Colors.overlay,
    justifyContent:  'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
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
  },
  modalInput: {
    backgroundColor:  Colors.background,
    borderRadius:     BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.md,
    fontSize:         Typography.fontSize.md,
    color:            Colors.textPrimary,
    borderWidth:      1,
    borderColor:      Colors.border,
    marginBottom:     Spacing.lg,
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
