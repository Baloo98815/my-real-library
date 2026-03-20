import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadow,
  GENRES,
} from '../theme';

/**
 * GenrePicker — sélecteur de genre réutilisable
 *
 * Props :
 *   value    : string | null  — clé du genre sélectionné
 *   onChange : (key) => void  — appelé quand l'utilisateur choisit un genre
 *   style    : ViewStyle      — style optionnel pour le conteneur du bouton
 */
export default function GenrePicker({ value, onChange, style }) {
  const [open, setOpen] = useState(false);

  const selected = GENRES.find((g) => g.key === value) || null;

  const handleSelect = (key) => {
    onChange(key === value ? null : key); // désélectionne si on retappe le même
    setOpen(false);
  };

  return (
    <>
      {/* Bouton déclencheur */}
      <TouchableOpacity
        testID="genre-trigger"
        style={[styles.trigger, selected && styles.triggerActive, style]}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
      >
        <Ionicons
          name={selected ? selected.icon : 'pricetag-outline'}
          size={16}
          color={selected ? Colors.accent : Colors.textTertiary}
        />
        <Text style={[styles.triggerText, selected && styles.triggerTextActive]}>
          {selected ? selected.label : 'Genre…'}
        </Text>
        <Ionicons
          name="chevron-down"
          size={14}
          color={selected ? Colors.accent : Colors.textTertiary}
        />
      </TouchableOpacity>

      {/* Modale de sélection */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        {open && (
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Choisir un genre</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Option "Aucun" */}
                <TouchableOpacity
                  testID="genre-none-option"
                  style={[styles.option, value === null && styles.optionActive]}
                  onPress={() => { onChange(null); setOpen(false); }}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color={value === null ? Colors.textInverse : Colors.textTertiary}
                  />
                  <Text style={[styles.optionLabel, value === null && styles.optionLabelActive]}>
                    Aucun / Non défini
                  </Text>
                  {value === null && (
                    <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
                  )}
                </TouchableOpacity>

                {/* Liste des genres */}
                {GENRES.map((genre) => {
                  const isActive = value === genre.key;
                  return (
                    <TouchableOpacity
                      key={genre.key}
                      testID={`genre-option-${genre.key}`}
                      style={[styles.option, isActive && styles.optionActive]}
                      onPress={() => handleSelect(genre.key)}
                    >
                      <Ionicons
                        name={genre.icon}
                        size={20}
                        color={isActive ? Colors.textInverse : Colors.textSecondary}
                      />
                      <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                        {genre.label}
                      </Text>
                      {isActive && (
                        <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
                      )}
                    </TouchableOpacity>
                  );
                })}
                <View style={{ height: Spacing.xl }} />
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Bouton déclencheur
  trigger: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  Colors.background,
    borderRadius:     BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm + 2,
    borderWidth:       1,
    borderColor:       Colors.border,
    gap:               Spacing.xs,
  },
  triggerActive: {
    borderColor:     Colors.accent,
    backgroundColor: '#FEF3E2',
  },
  triggerText: {
    flex:       1,
    fontSize:   Typography.fontSize.md,
    color:      Colors.textTertiary,
  },
  triggerTextActive: {
    color:      Colors.accent,
    fontWeight: Typography.fontWeight.medium,
  },

  // Modale
  overlay: {
    flex:            1,
    backgroundColor: Colors.overlay,
    justifyContent:  'flex-end',
  },
  sheet: {
    backgroundColor:     Colors.surface,
    borderTopLeftRadius:  BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal:    Spacing.lg,
    paddingBottom:        Spacing.xxxl,
    maxHeight:            '80%',
  },
  sheetHandle: {
    width:           40,
    height:          4,
    borderRadius:    BorderRadius.full,
    backgroundColor: Colors.border,
    alignSelf:       'center',
    marginVertical:  Spacing.md,
  },
  sheetTitle: {
    fontSize:     Typography.fontSize.lg,
    fontWeight:   Typography.fontWeight.bold,
    color:        Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Options
  option: {
    flexDirection:  'row',
    alignItems:     'center',
    padding:        Spacing.md,
    borderRadius:   BorderRadius.md,
    marginBottom:   Spacing.xs,
    gap:            Spacing.md,
    backgroundColor: Colors.backgroundDark,
  },
  optionActive: {
    backgroundColor: Colors.primary,
  },
  optionLabel: {
    flex:       1,
    fontSize:   Typography.fontSize.md,
    color:      Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  optionLabelActive: {
    color: Colors.textInverse,
  },
});
