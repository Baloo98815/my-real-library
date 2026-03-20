import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadow,
  READING_STATUS_LABELS,
  READING_STATUS_COLORS,
} from '../theme';

// Couverture par défaut si aucune image disponible
const PlaceholderCover = ({ title }) => (
  <View style={styles.placeholderCover}>
    <Ionicons name="book" size={28} color={Colors.primaryLight} />
    <Text style={styles.placeholderTitle} numberOfLines={3}>
      {title}
    </Text>
  </View>
);

export default function BookCard({ book, onPress }) {
  const statusColor = READING_STATUS_COLORS[book.reading_status] || Colors.statusUnread;
  const statusLabel = READING_STATUS_LABELS[book.reading_status] || 'Non lu';
  const isLent      = book.lent_to && book.lent_to.trim() !== '';

  return (
    <TouchableOpacity
      testID="book-card"
      style={styles.container}
      onPress={() => onPress && onPress(book)}
      activeOpacity={0.75}
    >
      {/* Couverture */}
      <View style={styles.coverContainer}>
        {book.cover_url ? (
          <Image
            source={{ uri: book.cover_url }}
            style={styles.cover}
            resizeMode="cover"
          />
        ) : (
          <PlaceholderCover title={book.title} />
        )}
        {/* Badge statut */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>{statusLabel}</Text>
        </View>
      </View>

      {/* Infos */}
      <View style={styles.info}>
        <Text testID="book-title" style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        {book.author ? (
          <Text style={styles.author} numberOfLines={1}>
            {book.author}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {book.published_date ? (
            <Text style={styles.meta}>{book.published_date}</Text>
          ) : null}
          {book.publisher ? (
            <Text style={styles.meta} numberOfLines={1}>
              · {book.publisher}
            </Text>
          ) : null}
        </View>

        {/* Indicateur prêt */}
        {isLent && (
          <View style={styles.lentBadge}>
            <Ionicons name="person" size={11} color={Colors.textInverse} />
            <Text style={styles.lentText} numberOfLines={1}>
              Prêté à {book.lent_to}
            </Text>
          </View>
        )}
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.surface,
    borderRadius:    BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginVertical:  Spacing.xs,
    padding:         Spacing.md,
    ...Shadow.sm,
  },

  // Couverture
  coverContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  cover: {
    width:        60,
    height:       85,
    borderRadius: BorderRadius.sm,
  },
  placeholderCover: {
    width:            60,
    height:           85,
    borderRadius:     BorderRadius.sm,
    backgroundColor:  Colors.backgroundDark,
    alignItems:       'center',
    justifyContent:   'center',
    padding:          Spacing.xs,
  },
  placeholderTitle: {
    marginTop:  Spacing.xs,
    fontSize:   8,
    color:      Colors.textSecondary,
    textAlign:  'center',
  },

  // Badge statut
  statusBadge: {
    position:     'absolute',
    bottom:       -4,
    left:         -4,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 5,
    paddingVertical:   2,
  },
  statusBadgeText: {
    fontSize:   8,
    color:      Colors.textInverse,
    fontWeight: Typography.fontWeight.bold,
  },

  // Infos
  info: {
    flex:           1,
    justifyContent: 'center',
  },
  title: {
    fontSize:   Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color:      Colors.textPrimary,
    marginBottom: 3,
  },
  author: {
    fontSize:     Typography.fontSize.sm,
    color:        Colors.textSecondary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
  },
  meta: {
    fontSize: Typography.fontSize.xs,
    color:    Colors.textTertiary,
  },

  // Prêt
  lentBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.lentColor,
    borderRadius:    BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   3,
    marginTop:         Spacing.xs,
    alignSelf:         'flex-start',
  },
  lentText: {
    fontSize:   Typography.fontSize.xs,
    color:      Colors.textInverse,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: 3,
    maxWidth:   120,
  },
});
