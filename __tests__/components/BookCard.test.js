/**
 * Tests unitaires — src/components/BookCard.js
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BookCard from '../../src/components/BookCard';

// ─── Données de test ─────────────────────────────────────────────────────────
const BOOK_BASE = {
  id:             1,
  title:          'Le Seigneur des Anneaux',
  author:         'J.R.R. Tolkien',
  publisher:      'Gallimard',
  published_date: '1954',
  cover_url:      null,
  reading_status: 'unread',
  lent_to:        null,
};

const makeBook = (overrides = {}) => ({ ...BOOK_BASE, ...overrides });

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('BookCard', () => {

  describe('affichage du titre et de l\'auteur', () => {
    it('affiche le titre du livre', () => {
      const { getByTestId } = render(<BookCard book={BOOK_BASE} />);
      // On cible le testID "book-title" car le titre peut apparaître deux fois
      // (info principale + placeholder cover quand cover_url est null)
      expect(getByTestId('book-title')).toBeTruthy();
    });

    it('affiche l\'auteur', () => {
      const { getByText } = render(<BookCard book={BOOK_BASE} />);
      expect(getByText('J.R.R. Tolkien')).toBeTruthy();
    });

    it('affiche l\'éditeur si disponible', () => {
      const { getByText } = render(<BookCard book={BOOK_BASE} />);
      // getByText n'accepte pas les asymmetric matchers Jest → utiliser une regex
      expect(getByText(/Gallimard/)).toBeTruthy();
    });

    it('n\'affiche pas l\'auteur si absent', () => {
      const { queryByText } = render(
        <BookCard book={makeBook({ author: null })} />
      );
      // Aucun texte d'auteur vide ne doit apparaître
      expect(queryByText('')).toBeNull();
    });
  });

  describe('badge statut de lecture', () => {
    it('affiche "Non lu" pour reading_status=unread', () => {
      const { getByText } = render(
        <BookCard book={makeBook({ reading_status: 'unread' })} />
      );
      expect(getByText('Non lu')).toBeTruthy();
    });

    it('affiche "En cours" pour reading_status=reading', () => {
      const { getByText } = render(
        <BookCard book={makeBook({ reading_status: 'reading' })} />
      );
      expect(getByText('En cours')).toBeTruthy();
    });

    it('affiche "Lu" pour reading_status=read', () => {
      const { getByText } = render(
        <BookCard book={makeBook({ reading_status: 'read' })} />
      );
      expect(getByText('Lu')).toBeTruthy();
    });
  });

  describe('indicateur de prêt', () => {
    it('n\'affiche pas d\'indicateur prêt si non prêté', () => {
      const { queryByText } = render(
        <BookCard book={makeBook({ lent_to: null })} />
      );
      expect(queryByText(/Prêté à/)).toBeNull();
    });

    it('affiche le nom de l\'emprunteur si prêté', () => {
      const { getByText } = render(
        <BookCard book={makeBook({ lent_to: 'Marie Dupont' })} />
      );
      // getByText n'accepte pas les asymmetric matchers Jest → utiliser une regex
      expect(getByText(/Marie Dupont/)).toBeTruthy();
    });

    it('n\'affiche pas d\'indicateur pour lent_to vide', () => {
      const { queryByText } = render(
        <BookCard book={makeBook({ lent_to: '' })} />
      );
      expect(queryByText(/Prêté à/)).toBeNull();
    });
  });

  describe('couverture', () => {
    it('affiche le placeholder quand pas de couverture', () => {
      const { queryByTestId } = render(
        <BookCard book={makeBook({ cover_url: null })} />
      );
      // Le composant Image ne doit pas être rendu avec une URL nulle
      const images = queryByTestId?.('cover-image');
      expect(images).toBeNull();
    });
  });

  describe('interaction', () => {
    it('appelle onPress avec le livre quand on tape', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <BookCard book={BOOK_BASE} onPress={onPress} />
      );
      // On utilise le testID de la carte pour éviter toute ambiguïté de texte
      fireEvent.press(getByTestId('book-card'));
      expect(onPress).toHaveBeenCalledWith(BOOK_BASE);
    });

    it('ne plante pas si onPress n\'est pas fourni', () => {
      const { getByTestId } = render(<BookCard book={BOOK_BASE} />);
      expect(() => fireEvent.press(getByTestId('book-card'))).not.toThrow();
    });
  });
});
