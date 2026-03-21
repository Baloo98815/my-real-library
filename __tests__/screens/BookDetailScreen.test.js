/**
 * Tests d'interaction — BookDetailScreen
 *
 * Vérifie :
 *  - Chargement et affichage du livre
 *  - Bouton Supprimer → Alert de confirmation → deleteBook + goBack
 *  - Bouton Marquer comme rendu → Alert → returnBook
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

// Le premier rendu React Native initialise les modules natifs (~10-20s)
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
/**
 * Rend le composant et attend que le chargement soit terminé.
 * On attend l'icône trash (qui n'apparaît qu'après le chargement du livre).
 */
const renderAndWait = async (bookOverride = {}) => {
  getBookById.mockResolvedValue({ ...BASE_BOOK, ...bookOverride });
  const utils = render(
    <BookDetailScreen route={mockRoute} navigation={mockNavigation} />
  );
  // L'icône trash n'est rendue que quand loading=false ET book!=null
  // timeout 30s : le premier rendu initialise les modules RN natifs (~10-20s)
  await waitFor(() => utils.getByTestId('icon-trash-outline'), { timeout: 30000 });
  return utils;
};

/**
 * Trouve et presse un bouton dans l'Alert (par son texte),
 * en capturant les boutons AVANT tout clearMock éventuel.
 */
const pressAlertButton = async (buttonText, alertCalls = null) => {
  const calls    = alertCalls ?? Alert.alert.mock.calls;
  const lastCall = calls[calls.length - 1];
  const buttons  = lastCall?.[2] || [];
  const btn      = buttons.find((b) => b.text === buttonText);
  if (btn?.onPress) {
    await act(async () => { await btn.onPress(); });
  }
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
    // renderAndWait attend l'icône trash qui n'apparaît qu'après le chargement
    await renderAndWait();
    // À ce stade, getBookById a forcément été appelé
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
  it('affiche une alerte de confirmation', async () => {
    const { getByTestId } = await renderAndWait();

    await act(async () => { fireEvent.press(getByTestId('icon-trash-outline')); });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Supprimer ce livre',
      expect.stringContaining('Dune'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Annuler' }),
        expect.objectContaining({ text: 'Supprimer' }),
      ])
    );
  });

  it('appelle deleteBook puis navigation.goBack après confirmation', async () => {
    const { getByTestId } = await renderAndWait();
    await act(async () => { fireEvent.press(getByTestId('icon-trash-outline')); });

    await pressAlertButton('Supprimer');

    expect(deleteBook).toHaveBeenCalledWith(1);
    expect(mockGoBack).toHaveBeenCalled();
  });

  it("n'appelle pas deleteBook si l'utilisateur annule", async () => {
    const { getByTestId } = await renderAndWait();
    await act(async () => { fireEvent.press(getByTestId('icon-trash-outline')); });

    await pressAlertButton('Annuler');

    expect(deleteBook).not.toHaveBeenCalled();
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it("affiche une alerte d'erreur si deleteBook échoue (pas de crash silencieux)", async () => {
    deleteBook.mockRejectedValue(new Error('SQLite error'));
    const { getByTestId } = await renderAndWait();
    await act(async () => { fireEvent.press(getByTestId('icon-trash-outline')); });

    // Capture les boutons AVANT de réinitialiser le mock
    const savedCalls = [...Alert.alert.mock.calls];
    Alert.alert.mockClear();

    // Presse le bouton Supprimer en utilisant les boutons sauvegardés
    await pressAlertButton('Supprimer', savedCalls);

    expect(mockGoBack).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Erreur',
      expect.stringContaining('Impossible de supprimer')
    );
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
  it('affiche une alerte de confirmation', async () => {
    const { getByText } = await renderAndWait({ lent_to: 'Marie Dupont' });
    await waitFor(() => getByText('Marquer comme rendu'));

    await act(async () => { fireEvent.press(getByText('Marquer comme rendu')); });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Livre rendu',
      expect.stringContaining('Marie Dupont'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Annuler' }),
        expect.objectContaining({ text: 'Confirmer' }),
      ])
    );
  });

  it('appelle returnBook après confirmation', async () => {
    const { getByText } = await renderAndWait({ lent_to: 'Marie Dupont' });
    await waitFor(() => getByText('Marquer comme rendu'));
    await act(async () => { fireEvent.press(getByText('Marquer comme rendu')); });

    await pressAlertButton('Confirmer');

    expect(returnBook).toHaveBeenCalledWith(1);
  });

  it("affiche une alerte d'erreur si returnBook échoue", async () => {
    returnBook.mockRejectedValue(new Error('SQLite error'));
    const { getByText } = await renderAndWait({ lent_to: 'Marie Dupont' });
    await waitFor(() => getByText('Marquer comme rendu'));
    await act(async () => { fireEvent.press(getByText('Marquer comme rendu')); });

    // Capture les boutons AVANT de réinitialiser le mock
    const savedCalls = [...Alert.alert.mock.calls];
    Alert.alert.mockClear();

    await pressAlertButton('Confirmer', savedCalls);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Erreur',
      expect.stringContaining('Impossible de marquer')
    );
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
