import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

import { searchByCode, searchByTitle } from '../services/bookApi';
import { addBook, addToWishlist } from '../database/database';
import GenrePicker from '../components/GenrePicker';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadow,
} from '../theme';

// ─── Modes d'entrée ───────────────────────────────────────────────────────────
const MODE = { CHOOSE: 'choose', SCAN: 'scan', CODE: 'code', MANUAL: 'manual' };

export default function AddBookScreen({ navigation }) {
  const [mode,           setMode]           = useState(MODE.CHOOSE);
  const [cameraPermission, requestPermission] = useCameraPermissions();

  // Scan
  const [scanned,        setScanned]        = useState(false);

  // Saisie code manuel
  const [codeInput,      setCodeInput]      = useState('');
  const [codeLoading,    setCodeLoading]    = useState(false);

  // Recherche titre
  const [titleQuery,     setTitleQuery]     = useState('');
  const [titleResults,   setTitleResults]   = useState([]);
  const [titleLoading,   setTitleLoading]   = useState(false);
  const titleTimer                          = useRef(null);

  // Formulaire livre
  const [bookForm,       setBookForm]       = useState(null);
  const [saving,         setSaving]         = useState(false);
  const [savingWishlist, setSavingWishlist] = useState(false);

  // ─── Scan code-barres ──────────────────────────────────────────────────────
  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    setMode(MODE.CODE);
    setCodeInput(data);
    await fetchBookByCode(data);
  };

  const openScanner = async () => {
    if (!cameraPermission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permission caméra refusée',
          'Activez l\'accès caméra dans les réglages pour scanner des codes-barres.'
        );
        return;
      }
    }
    setScanned(false);
    setMode(MODE.SCAN);
  };

  // ─── Fetch par code ────────────────────────────────────────────────────────
  const fetchBookByCode = async (code) => {
    const cleaned = code.trim();
    if (!cleaned) return;
    setCodeLoading(true);
    try {
      const result = await searchByCode(cleaned);
      if (result) {
        setBookForm(result);
      } else {
        Alert.alert(
          'Livre introuvable',
          'Aucune information trouvée pour ce code. Vous pouvez saisir les informations manuellement.',
          [{ text: 'OK', onPress: () => setMode(MODE.MANUAL) }]
        );
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de récupérer les informations du livre.');
    } finally {
      setCodeLoading(false);
    }
  };

  // ─── Recherche par titre (debounced) ──────────────────────────────────────
  const handleTitleSearch = (text) => {
    setTitleQuery(text);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    if (text.trim().length < 2) { setTitleResults([]); return; }
    titleTimer.current = setTimeout(async () => {
      setTitleLoading(true);
      try {
        const results = await searchByTitle(text);
        setTitleResults(results);
      } finally {
        setTitleLoading(false);
      }
    }, 600);
  };

  const selectTitleResult = (book) => {
    setTitleResults([]);
    setTitleQuery('');
    setBookForm(book);
  };

  // ─── Sauvegarder ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!bookForm?.title?.trim()) {
      Alert.alert('Titre requis', 'Veuillez saisir au moins le titre du livre.');
      return;
    }
    setSaving(true);
    try {
      await addBook(bookForm);
      Alert.alert('Livre ajouté !', `« ${bookForm.title} » a été ajouté à votre bibliothèque.`, [
        {
          text: 'OK',
          onPress: () => {
            setBookForm(null);
            setCodeInput('');
            setMode(MODE.CHOOSE);
            navigation.navigate('LibraryTab');
          },
        },
      ]);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer le livre.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Ajouter à la wishlist ─────────────────────────────────────────────────
  const handleAddToWishlist = async () => {
    if (!bookForm?.title?.trim()) {
      Alert.alert('Titre requis', 'Veuillez saisir au moins le titre du livre.');
      return;
    }
    setSavingWishlist(true);
    try {
      await addToWishlist(bookForm);
      Alert.alert(
        'Ajouté à la wishlist !',
        `« ${bookForm.title} » a été ajouté à votre liste de souhaits.`,
        [{
          text: 'OK',
          onPress: () => {
            setBookForm(null);
            setCodeInput('');
            setMode(MODE.CHOOSE);
            navigation.navigate('WishlistTab');
          },
        }]
      );
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'ajouter à la wishlist.');
    } finally {
      setSavingWishlist(false);
    }
  };

  const resetToChoose = () => {
    setMode(MODE.CHOOSE);
    setBookForm(null);
    setCodeInput('');
    setScanned(false);
    setTitleQuery('');
    setTitleResults([]);
  };

  // ─── Formulaire livre ──────────────────────────────────────────────────────
  const FormField = ({ label, field, placeholder, multiline }) => (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.formInput, multiline && styles.formInputMultiline]}
        value={bookForm?.[field] || ''}
        onChangeText={(v) => setBookForm((prev) => ({ ...prev, [field]: v }))}
        placeholder={placeholder || ''}
        placeholderTextColor={Colors.textTertiary}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────

  // 1. Scanner caméra
  if (mode === MODE.SCAN) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
          }}
        />
        {/* Overlay */}
        <View style={styles.scanOverlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>Positionnez le code-barres dans le cadre</Text>
        </View>
        <SafeAreaView style={styles.scanTopBar}>
          <TouchableOpacity style={styles.scanBackBtn} onPress={resetToChoose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>
        {scanned && (
          <View style={styles.scanLoadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.scanLoadingText}>Recherche en cours…</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            {mode !== MODE.CHOOSE && (
              <TouchableOpacity onPress={resetToChoose} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color={Colors.primary} />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Ajouter un livre</Text>
              <Text style={styles.headerSubtitle}>
                {mode === MODE.CHOOSE ? 'Choisissez une méthode' :
                 mode === MODE.SCAN   ? 'Scanner un code-barres' :
                 mode === MODE.CODE   ? 'Saisie d\'un code' :
                 'Saisie manuelle'}
              </Text>
            </View>
          </View>

          {/* ── MODE CHOOSE ── */}
          {mode === MODE.CHOOSE && (
            <View style={styles.chooseContainer}>
              <TouchableOpacity style={styles.methodCard} onPress={openScanner}>
                <View style={[styles.methodIcon, { backgroundColor: '#EAF3F0' }]}>
                  <Ionicons name="barcode-outline" size={32} color={Colors.secondary} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodTitle}>Scanner un code-barres</Text>
                  <Text style={styles.methodDesc}>Utilisez la caméra pour scanner ISBN, EAN, UPC…</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.methodCard} onPress={() => setMode(MODE.CODE)}>
                <View style={[styles.methodIcon, { backgroundColor: '#FEF3E2' }]}>
                  <Ionicons name="keypad-outline" size={32} color={Colors.accent} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodTitle}>Saisir un code</Text>
                  <Text style={styles.methodDesc}>Entrez manuellement un ISBN, EAN, ASIN…</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.methodCard} onPress={() => setMode(MODE.MANUAL)}>
                <View style={[styles.methodIcon, { backgroundColor: '#F3EEED' }]}>
                  <Ionicons name="create-outline" size={32} color={Colors.primary} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodTitle}>Saisie manuelle</Text>
                  <Text style={styles.methodDesc}>Recherchez par titre ou remplissez le formulaire</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── MODE CODE ── */}
          {mode === MODE.CODE && !bookForm && (
            <View style={styles.codeContainer}>
              <Text style={styles.sectionLabel}>Code ISBN / EAN / ASIN / UPC / ISSN</Text>
              <View style={styles.codeInputRow}>
                <TextInput
                  style={styles.codeInput}
                  value={codeInput}
                  onChangeText={setCodeInput}
                  placeholder="Ex : 9782070360024"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="default"
                  autoFocus
                  returnKeyType="search"
                  onSubmitEditing={() => fetchBookByCode(codeInput)}
                />
                <TouchableOpacity
                  style={styles.codeSearchBtn}
                  onPress={() => fetchBookByCode(codeInput)}
                  disabled={codeLoading || !codeInput.trim()}
                >
                  {codeLoading
                    ? <ActivityIndicator size="small" color={Colors.textInverse} />
                    : <Ionicons name="search" size={20} color={Colors.textInverse} />}
                </TouchableOpacity>
              </View>
              <Text style={styles.codeHint}>
                Saisissez le code situé sous le code-barres de votre livre
              </Text>
            </View>
          )}

          {/* ── MODE MANUAL (recherche titre) ── */}
          {mode === MODE.MANUAL && !bookForm && (
            <View style={styles.manualContainer}>
              <Text style={styles.sectionLabel}>Rechercher par titre</Text>
              <View style={styles.titleSearchRow}>
                <Ionicons name="search-outline" size={18} color={Colors.textTertiary} style={{ marginRight: Spacing.sm }} />
                <TextInput
                  style={styles.titleSearchInput}
                  value={titleQuery}
                  onChangeText={handleTitleSearch}
                  placeholder="Tapez le titre du livre…"
                  placeholderTextColor={Colors.textTertiary}
                  autoFocus
                />
                {titleLoading && <ActivityIndicator size="small" color={Colors.primary} />}
              </View>

              {/* Résultats de recherche titre */}
              {titleResults.length > 0 && (
                <View style={styles.titleResults}>
                  {titleResults.map((book, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.titleResultItem}
                      onPress={() => selectTitleResult(book)}
                    >
                      {book.cover_url ? (
                        <Image source={{ uri: book.cover_url }} style={styles.titleResultCover} />
                      ) : (
                        <View style={[styles.titleResultCover, styles.titleResultCoverPlaceholder]}>
                          <Ionicons name="book" size={16} color={Colors.textTertiary} />
                        </View>
                      )}
                      <View style={styles.titleResultInfo}>
                        <Text style={styles.titleResultTitle} numberOfLines={2}>{book.title}</Text>
                        <Text style={styles.titleResultAuthor} numberOfLines={1}>{book.author}</Text>
                        {book.published_date ? (
                          <Text style={styles.titleResultMeta}>{book.published_date}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity
                style={styles.manualFormBtn}
                onPress={() => setBookForm({ title: titleQuery })}
              >
                <Ionicons name="create-outline" size={18} color={Colors.primary} />
                <Text style={styles.manualFormBtnText}>Remplir le formulaire manuellement</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── FORMULAIRE LIVRE ── */}
          {bookForm && (
            <View style={styles.formContainer}>
              {/* Aperçu couverture */}
              {bookForm.cover_url && (
                <View style={styles.coverPreview}>
                  <Image
                    source={{ uri: bookForm.cover_url }}
                    style={styles.coverImage}
                    resizeMode="contain"
                  />
                </View>
              )}

              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Informations principales</Text>
                <FormField label="Titre *" field="title" placeholder="Titre du livre" />
                <FormField label="Auteur(s)" field="author" placeholder="Prénom Nom" />
                <FormField label="Éditeur" field="publisher" placeholder="Maison d'édition" />
                <FormField label="Date de publication" field="published_date" placeholder="Ex : 2024" />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Codes</Text>
                <FormField label="ISBN" field="isbn" placeholder="978-..." />
                <FormField label="EAN" field="ean" placeholder="EAN-13" />
                <FormField label="ASIN" field="asin" placeholder="Amazon ASIN" />
                <FormField label="UPC" field="upc" placeholder="UPC-A" />
                <FormField label="ISSN" field="issn" placeholder="ISSN" />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Détails</Text>

                {/* Genre */}
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Genre</Text>
                  <GenrePicker
                    value={bookForm?.genre || null}
                    onChange={(key) => setBookForm((prev) => ({ ...prev, genre: key }))}
                  />
                </View>

                <FormField label="Nombre de pages" field="pages" placeholder="300" />
                <FormField label="Langue" field="language" placeholder="fr, en…" />
                <FormField label="Catégories" field="categories" placeholder="Roman, Science-fiction…" />
                <FormField label="URL de couverture" field="cover_url" placeholder="https://…" />
                <FormField label="Description" field="description" placeholder="Résumé du livre…" multiline />
              </View>

              {/* Bouton sauvegarder */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving || savingWishlist}
              >
                {saving
                  ? <ActivityIndicator size="small" color={Colors.textInverse} />
                  : <Ionicons name="checkmark" size={20} color={Colors.textInverse} />}
                <Text style={styles.saveBtnText}>
                  {saving ? 'Enregistrement…' : 'Ajouter à ma bibliothèque'}
                </Text>
              </TouchableOpacity>

              {/* Bouton wishlist */}
              <TouchableOpacity
                style={[styles.wishlistBtn, savingWishlist && styles.saveBtnDisabled]}
                onPress={handleAddToWishlist}
                disabled={saving || savingWishlist}
              >
                {savingWishlist
                  ? <ActivityIndicator size="small" color={Colors.accent} />
                  : <Ionicons name="heart-outline" size={20} color={Colors.accent} />}
                <Text style={styles.wishlistBtnText}>
                  {savingWishlist ? 'Ajout…' : 'Ajouter à ma wishlist'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
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
  backBtn: {
    marginRight: Spacing.md,
    padding:     Spacing.xs,
  },
  headerTitle: {
    fontSize:   Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.heavy,
    color:      Colors.primary,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color:    Colors.textTertiary,
    marginTop: 2,
  },

  // Choix méthode
  chooseContainer: {
    padding: Spacing.lg,
    gap:     Spacing.md,
  },
  methodCard: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.surface,
    borderRadius:    BorderRadius.md,
    padding:         Spacing.lg,
    ...Shadow.sm,
  },
  methodIcon: {
    width:           56,
    height:          56,
    borderRadius:    BorderRadius.md,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     Spacing.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize:     Typography.fontSize.md,
    fontWeight:   Typography.fontWeight.semiBold,
    color:        Colors.textPrimary,
    marginBottom: 3,
  },
  methodDesc: {
    fontSize:  Typography.fontSize.sm,
    color:     Colors.textSecondary,
    lineHeight: 18,
  },

  // Scanner
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width:        260,
    height:       140,
    borderWidth:  2,
    borderColor:  '#fff',
    borderRadius: BorderRadius.md,
    backgroundColor: 'transparent',
  },
  scanHint: {
    color:     '#fff',
    marginTop: Spacing.xl,
    fontSize:  Typography.fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  scanTopBar: {
    position: 'absolute',
    top:      0,
    left:     0,
    right:    0,
    flexDirection: 'row',
    padding:  Spacing.lg,
  },
  scanBackBtn: {
    width:            44,
    height:           44,
    borderRadius:     BorderRadius.full,
    backgroundColor:  'rgba(0,0,0,0.5)',
    alignItems:       'center',
    justifyContent:   'center',
  },
  scanLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  scanLoadingText: {
    color:     '#fff',
    marginTop: Spacing.md,
    fontSize:  Typography.fontSize.md,
  },

  // Code
  codeContainer: {
    padding: Spacing.lg,
  },
  sectionLabel: {
    fontSize:     Typography.fontSize.xs,
    fontWeight:   Typography.fontWeight.semiBold,
    color:        Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom:  Spacing.sm,
  },
  codeInputRow: {
    flexDirection: 'row',
    gap:           Spacing.sm,
  },
  codeInput: {
    flex:             1,
    backgroundColor:  Colors.surface,
    borderRadius:     BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.md,
    fontSize:         Typography.fontSize.md,
    color:            Colors.textPrimary,
    borderWidth:      1,
    borderColor:      Colors.border,
  },
  codeSearchBtn: {
    backgroundColor: Colors.primary,
    borderRadius:    BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    alignItems:      'center',
    justifyContent:  'center',
    minWidth:        50,
  },
  codeHint: {
    fontSize:  Typography.fontSize.xs,
    color:     Colors.textTertiary,
    marginTop: Spacing.sm,
  },

  // Manuel / Titre
  manualContainer: {
    padding: Spacing.lg,
  },
  titleSearchRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.surface,
    borderRadius:    BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    marginBottom:    Spacing.md,
  },
  titleSearchInput: {
    flex:     1,
    fontSize: Typography.fontSize.md,
    color:    Colors.textPrimary,
  },
  titleResults: {
    backgroundColor: Colors.surface,
    borderRadius:    BorderRadius.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    marginBottom:    Spacing.md,
    overflow:        'hidden',
  },
  titleResultItem: {
    flexDirection:  'row',
    padding:        Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  titleResultCover: {
    width:        44,
    height:       60,
    borderRadius: BorderRadius.sm,
    marginRight:  Spacing.md,
  },
  titleResultCoverPlaceholder: {
    backgroundColor: Colors.backgroundDark,
    alignItems:      'center',
    justifyContent:  'center',
  },
  titleResultInfo: { flex: 1 },
  titleResultTitle: {
    fontSize:   Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color:      Colors.textPrimary,
  },
  titleResultAuthor: {
    fontSize:   Typography.fontSize.xs,
    color:      Colors.textSecondary,
    marginTop:  2,
  },
  titleResultMeta: {
    fontSize:  Typography.fontSize.xs,
    color:     Colors.textTertiary,
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginVertical: Spacing.lg,
  },
  divider: {
    flex:            1,
    height:          1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize:         Typography.fontSize.sm,
    color:            Colors.textTertiary,
  },
  manualFormBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.backgroundDark,
    borderRadius:    BorderRadius.md,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  manualFormBtnText: {
    marginLeft: Spacing.sm,
    fontSize:   Typography.fontSize.md,
    color:      Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },

  // Formulaire
  formContainer: {
    padding: Spacing.lg,
  },
  coverPreview: {
    alignItems:    'center',
    marginBottom:  Spacing.lg,
  },
  coverImage: {
    width:        120,
    height:       170,
    borderRadius: BorderRadius.md,
    ...Shadow.md,
  },
  formSection: {
    backgroundColor: Colors.surface,
    borderRadius:    BorderRadius.md,
    padding:         Spacing.md,
    marginBottom:    Spacing.md,
    ...Shadow.sm,
  },
  formSectionTitle: {
    fontSize:     Typography.fontSize.xs,
    fontWeight:   Typography.fontWeight.semiBold,
    color:        Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom:  Spacing.md,
  },
  formField: {
    marginBottom: Spacing.md,
  },
  formLabel: {
    fontSize:     Typography.fontSize.sm,
    fontWeight:   Typography.fontWeight.medium,
    color:        Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  formInput: {
    backgroundColor:  Colors.background,
    borderRadius:     BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm + 2,
    fontSize:         Typography.fontSize.md,
    color:            Colors.textPrimary,
    borderWidth:      1,
    borderColor:      Colors.border,
  },
  formInputMultiline: {
    height:    100,
    textAlignVertical: 'top',
  },

  // Bouton sauvegarder
  saveBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.primary,
    borderRadius:    BorderRadius.md,
    padding:         Spacing.lg,
    marginTop:       Spacing.md,
    marginBottom:    Spacing.xxl,
    gap:             Spacing.sm,
    ...Shadow.md,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize:   Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color:      Colors.textInverse,
  },

  // Bouton wishlist
  wishlistBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.surface,
    borderRadius:    BorderRadius.md,
    padding:         Spacing.lg,
    marginTop:       Spacing.sm,
    marginBottom:    Spacing.xxl,
    gap:             Spacing.sm,
    borderWidth:     1.5,
    borderColor:     Colors.accent,
  },
  wishlistBtnText: {
    fontSize:   Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color:      Colors.accent,
  },
});
