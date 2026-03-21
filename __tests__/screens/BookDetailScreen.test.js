/**
 * Tests d'interaction — BookDetailScreen
 *
 * Vérifie :
 *  - Chargement et affichage du livre
 *  - Bouton Supprimer → Modal de confirmation → deleteBook + goBack
 *  - Bouton Marquer comme rendu → Modal → returnBook
 *  - Boutons statut de lecture → updateReadingStatus
 *  - Gestion des erreurs DB (pas de crash silencieux)
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import BookDetailScreen from '../../src/screens/BookDetailScreen';
import {
  getBookById,
  deleteBook,
  returnBook,
  lendBook,
  updateReadingStatus,
  addToWishlist,
  isInWishlist,
  updateBook,
} from '../../src/database/database';

// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../../src/database/database');
jest.setTimeout(60000);

const mockGoBack      = jest.fn();
const mockNavigate    = jest.fn();
const mockNavigation  = { goBack: mockGoBack, navigate: mockNavigate };
const mockRoute       = { params: { bookId: 1 } };

const BASE_BOOK = {
  id:             1,
  title:          'Dune',
  author:         'Frank Herbert',
  publisher:      'Gollancz',
  published_date: '1965',
  isbn:           '9780450011849',
  reading_status: 'unread',
  lent_to:        null,
  genre:          'scifi',
  cover_url:      null,
  pages:          412,
  language:       'fr',
  categories:     'Science Fiction',
  description:    "Un chef-d'oeuvre de SF.",
  added_date:     '2024-01-01T00:00:00.000Z',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const renderAndWait = async (bookOverride = {}) => {
  getBookById.mockResolvedValue({ ...BASE_BOOK, ...bookOverride });
  const utils = render(
    <BookDetailScreen route={mockRoute} navigation={mockNavigation} />
  );
  await waitFor(() => utils.getByTestId("btn-delete"), { timeout: 30000 });
  return utils;
};

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert');
  isInWishlist.mockResolvedValue(false);
  deleteBook.mockResolvedValue(undefined);
  returnBook.mockResolvedValue(undefined);
  lendBook.mockResolvedValue(undefined);
  updateReadingStatus.mockResolvedValue(undefined);
  addToWishlist.mockResolvedValue(1);
  updateBook.mockResolvedValue(undefined);
});

// ─── Chargement ───────────────────────────────────────────────────────────────
describe('Chargement du livre', () => {
  it('appelle getBookById avec le bon ID', async () => {
    await renderAndWait();
    expect(getBookById).toHaveBeenCalledWith(1);
  });

  it('affiche le titre du livre après chargement', async () => {
    const { getAllByText } = await renderAndWait();
    expect(getAllByText('Dune').length).toBeGreaterThanOrEqual(1);
  });

  it("affiche l'auteur du livre", async () => {
    const { getByText } = await renderAndWait();
    expect(getByText('Frank Herbert')).toBeTruthy();
  });

  it("vérifie si le livre est déjà dans la wishlist", async () => {
    await renderAndWait();
    expect(isInWishlist).toHaveBeenCalledWith('Dune');
  });
});

// ─── Suppression ──────────────────────────────────────────────────────────────
describe('Bouton Supprimer', () => {
  it('affiche une modale de confirmation', async () => {
    const { getByTestId, getByText } = await renderAndWait();
    await act(async () => { fireEvent.press(getByTestId("btn-delete")); });

    expect(getByText('Supprimer ce livre')).toBeTruthy();
    expect(getByText('Annuler')).toBeTruthy();
    expect(getByText('Supprimer')).toBeTruthy();
  });

  it('appelle deleteBook puis navigation.goBack après confirmation', async () => {
    const { getByTestId, getByText } = await renderAndWait();
    await act(async () => { fireEvent.press(getByTestId("btn-delete")); });

    await act(async () => { fireEvent.press(getByText('Supprimer')); });

    await waitFor(() => {
      expect(deleteBook).toHaveBeenCalledWith(1);
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it("n'appelle pas deleteBook si l'utilisateur annule", async () => {
    const { getByTestId, getByText } = await renderAndWait();
    await act(async () => { fireEvent.press(getByTestId("btn-delete")); });

    await act(async () => { fireEvent.press(getByText('Annuler')); });

    expect(deleteBook).not.toHaveBeenCalled();
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it("affiche une alerte d'erreur si deleteBook échoue (pas de crash silencieux)", async () => {
    deleteBook.mockRejectedValue(new Error('SQLite error'));
    const { getByTestId, getByText } = await renderAndWait();
    await act(async () => { fireEvent.press(getByTestId("btn-delete")); });

    await act(async () => { fireEvent.press(getByText('Supprimer')); });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        expect.stringContaining('Impossible de supprimer')
      );
    });
    expect(mockGoBack).not.toHaveBeenCalled();
  });
});

// ─── Statut de lecture ────────────────────────────────────────────────────────
describe('Statut de lecture', () => {
  it.each([
    ['Non lu',   'unread'],
    ['En cours', 'reading'],
    ['Lu',       'read'],
  ])('appuyer sur "%s" appelle updateReadingStatus("%s")', async (label, status) => {
    const { getByText } = await renderAndWait();

    await act(async () => { fireEvent.press(getByText(label)); });

    expect(updateReadingStatus).toHaveBeenCalledWith(1, status);
  });
});

// ─── Marquer comme rendu ──────────────────────────────────────────────────────
describe('Bouton Marquer comme rendu (livre prêté)', () => {
  it('affiche une modale de confirmation', async () => {
    const { getByText, getAllByText } = await renderAndWait({ lent_to: 'Marie Dupont' });
    await waitFor(() => getByText('Marquer comme rendu'));

    await act(async () => { fireEvent.press(getByText('Marquer comme rendu')); });

    expect(getByText('Livre rendu')).toBeTruthy();
    // "Marie Dupont" apparaît à la fois dans le bandeau prêt et dans la modale
    expect(getAllByText(/Marie Dupont/).length).toBeGreaterThanOrEqual(1);
    expect(getByText('Confirmer')).toBeTruthy();
  });

  it('appelle returnBook après confirmation', async () => {
    const { getByText } = await renderAndWait({ lent_to: 'Marie Dupont' });
    await waitFor(() => getByText('Marquer comme rendu'));
    await act(async () => { fireEvent.press(getByText('Marquer comme rendu')); });

    await act(async () => { fireEvent.press(getByText('Confirmer')); });

    await waitFor(() => expect(returnBook).toHaveBeenCalledWith(1));
  });

  it("affiche une alerte d'erreur si returnBook échoue", async () => {
    returnBook.mockRejectedValue(new Error('SQLite error'));
    const { getByText } = await renderAndWait({ lent_to: 'Marie Dupont' });
    await waitFor(() => getByText('Marquer comme rendu'));
    await act(async () => { fireEvent.press(getByText('Marquer comme rendu')); });

    await act(async () => { fireEvent.press(getByText('Confirmer')); });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        expect.stringContaining('Impossible de marquer')
      );
    });
  });
});

// ─── État du prêt ─────────────────────────────────────────────────────────────
describe('Affichage prêt du livre', () => {
  it("affiche le bouton 'Enregistrer un prêt' quand le livre n'est pas prêté", async () => {
    const { getByText } = await renderAndWait({ lent_to: null });
    expect(getByText('Enregistrer un prêt')).toBeTruthy();
  });

  it("affiche le nom et le bouton de retour quand le livre est prêté", async () => {
    const { getByText } = await renderAndWait({ lent_to: 'Pierre Martin' });
    expect(getByText('Pierre Martin')).toBeTruthy();
    expect(getByText('Marquer comme rendu')).toBeTruthy();
  });
});
