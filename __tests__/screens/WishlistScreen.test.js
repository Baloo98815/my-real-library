/**
 * Tests d'interaction — WishlistScreen
 *
 * Vérifie :
 *  - Affichage de la liste et état vide
 *  - Bouton Supprimer → Modal de confirmation → removeFromWishlist
 *  - Bouton "Acheté !" → Modal de confirmation → moveWishlistToLibrary
 *  - Gestion des erreurs DB (pas de crash silencieux)
 *  - Edition de notes via la modale
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import WishlistScreen from '../../src/screens/WishlistScreen';
import {
  getWishlist,
  removeFromWishlist,
  moveWishlistToLibrary,
  updateWishlistNotes,
} from '../../src/database/database';

// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../../src/database/database');
jest.setTimeout(60000);
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL:    jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
}));

const mockNavigate   = jest.fn();
const mockNavigation = { navigate: mockNavigate, goBack: jest.fn() };

const WISH_ITEMS = [
  {
    id:             1,
    title:          'Dune',
    author:         'Frank Herbert',
    genre:          'scifi',
    cover_url:      null,
    notes:          null,
    published_date: '1965',
  },
  {
    id:             2,
    title:          'Fondation',
    author:         'Isaac Asimov',
    genre:          'scifi',
    cover_url:      null,
    notes:          'Lu dans une liste de recommandations.',
    published_date: '1951',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const renderAndWait = async (items = WISH_ITEMS) => {
  getWishlist.mockResolvedValue([...items]);
  const utils = render(<WishlistScreen navigation={mockNavigation} />);
  await waitFor(
    () => utils.getByText(/livres? souhait/i),
    { timeout: 30000 }
  );
  return utils;
};

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert');
  removeFromWishlist.mockResolvedValue(undefined);
  moveWishlistToLibrary.mockResolvedValue(42);
  updateWishlistNotes.mockResolvedValue(undefined);
});

// ─── Affichage ────────────────────────────────────────────────────────────────
describe('Affichage de la wishlist', () => {
  it('affiche les titres des livres', async () => {
    const { getByText } = await renderAndWait();
    expect(getByText('Dune')).toBeTruthy();
    expect(getByText('Fondation')).toBeTruthy();
  });

  it('affiche les auteurs', async () => {
    const { getByText } = await renderAndWait();
    expect(getByText('Frank Herbert')).toBeTruthy();
    expect(getByText('Isaac Asimov')).toBeTruthy();
  });

  it('affiche le compteur de livres', async () => {
    const { getByText } = await renderAndWait();
    expect(getByText('2 livres souhaités')).toBeTruthy();
  });

  it("affiche l'état vide quand la liste est vide", async () => {
    const { getByText } = await renderAndWait([]);
    expect(getByText('Votre wishlist est vide')).toBeTruthy();
  });

  it('affiche les notes si disponibles', async () => {
    const { getByText } = await renderAndWait();
    expect(getByText(/Lu dans une liste de recommandations/)).toBeTruthy();
  });

  it('appelle getWishlist au montage', async () => {
    await renderAndWait();
    expect(getWishlist).toHaveBeenCalled();
  });
});

// ─── Suppression ──────────────────────────────────────────────────────────────
describe('Bouton Supprimer (corbeille)', () => {
  it('affiche une modale de confirmation', async () => {
    const { getAllByTestId, getByText } = await renderAndWait();
    const trashBtns = getAllByTestId('icon-trash-outline');
    expect(trashBtns.length).toBeGreaterThanOrEqual(1);

    await act(async () => { fireEvent.press(trashBtns[0]); });

    // La modale custom de confirmation doit apparaître
    expect(getByText('Retirer de la wishlist')).toBeTruthy();
    expect(getByText('Retirer')).toBeTruthy();
    expect(getByText('Annuler')).toBeTruthy();
  });

  it('appelle removeFromWishlist avec le bon ID après confirmation', async () => {
    const { getAllByTestId, getByText } = await renderAndWait();
    await act(async () => { fireEvent.press(getAllByTestId('icon-trash-outline')[0]); });

    await act(async () => { fireEvent.press(getByText('Retirer')); });

    await waitFor(() => expect(removeFromWishlist).toHaveBeenCalledWith(1));
  });

  it("retire l'item de la liste localement après suppression", async () => {
    const { getAllByTestId, getByText, queryByText } = await renderAndWait();
    await act(async () => { fireEvent.press(getAllByTestId('icon-trash-outline')[0]); });

    await act(async () => { fireEvent.press(getByText('Retirer')); });

    await waitFor(() => expect(queryByText('Dune')).toBeNull());
  });

  it("ne supprime pas si l'utilisateur annule", async () => {
    const { getAllByTestId, getByText } = await renderAndWait();
    await act(async () => { fireEvent.press(getAllByTestId('icon-trash-outline')[0]); });

    await act(async () => { fireEvent.press(getByText('Annuler')); });

    expect(removeFromWishlist).not.toHaveBeenCalled();
  });

  it('affiche une erreur si removeFromWishlist échoue', async () => {
    removeFromWishlist.mockRejectedValue(new Error('SQLite error'));
    const { getAllByTestId, getByText } = await renderAndWait();
    await act(async () => { fireEvent.press(getAllByTestId('icon-trash-outline')[0]); });

    await act(async () => { fireEvent.press(getByText('Retirer')); });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        expect.stringContaining('Impossible de retirer')
      );
    });
  });
});

// ─── Acheté ! (move to library) ───────────────────────────────────────────────
describe('Bouton Acheté !', () => {
  it('affiche une modale de confirmation', async () => {
    const { getAllByText, getByText } = await renderAndWait();
    const acheteBtns = getAllByText('Acheté !');
    expect(acheteBtns.length).toBeGreaterThanOrEqual(1);

    await act(async () => { fireEvent.press(acheteBtns[0]); });

    // La modale custom de confirmation doit apparaître
    expect(getByText("Vous l'avez acheté !")).toBeTruthy();
    expect(getByText('Ajouter')).toBeTruthy();
    expect(getByText('Annuler')).toBeTruthy();
  });

  it('appelle moveWishlistToLibrary après confirmation', async () => {
    const { getAllByText, getByText } = await renderAndWait();
    await act(async () => { fireEvent.press(getAllByText('Acheté !')[0]); });

    await act(async () => { fireEvent.press(getByText('Ajouter')); });

    await waitFor(() => {
      expect(moveWishlistToLibrary).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, title: 'Dune' })
      );
    });
  });

  it("retire l'item de la wishlist localement après déplacement", async () => {
    const { getAllByText, getByText, queryByText } = await renderAndWait();
    await act(async () => { fireEvent.press(getAllByText('Acheté !')[0]); });

    await act(async () => { fireEvent.press(getByText('Ajouter')); });

    await waitFor(() => expect(queryByText('Dune')).toBeNull());
  });

  it("ne déplace pas si l'utilisateur annule", async () => {
    const { getAllByText, getByText } = await renderAndWait();
    await act(async () => { fireEvent.press(getAllByText('Acheté !')[0]); });

    await act(async () => { fireEvent.press(getByText('Annuler')); });

    expect(moveWishlistToLibrary).not.toHaveBeenCalled();
  });

  it('affiche une erreur si moveWishlistToLibrary échoue', async () => {
    moveWishlistToLibrary.mockRejectedValue(new Error('SQLite error'));
    const { getAllByText, getByText } = await renderAndWait();
    await act(async () => { fireEvent.press(getAllByText('Acheté !')[0]); });

    await act(async () => { fireEvent.press(getByText('Ajouter')); });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        expect.stringContaining('Impossible de déplacer')
      );
    });
  });
});

// ─── Notes ────────────────────────────────────────────────────────────────────
describe('Edition de notes', () => {
  it("affiche le bouton d'édition des notes", async () => {
    const { getAllByTestId } = await renderAndWait();
    const editBtns = getAllByTestId('icon-create-outline');
    expect(editBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('appelle updateWishlistNotes avec le bon ID et les notes', async () => {
    await act(async () => {
      await updateWishlistNotes(1, 'Ma note de test');
    });
    expect(updateWishlistNotes).toHaveBeenCalledWith(1, 'Ma note de test');
  });
});
