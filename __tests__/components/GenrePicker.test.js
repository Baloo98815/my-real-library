/**
 * Tests unitaires — src/components/GenrePicker.js
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import GenrePicker from '../../src/components/GenrePicker';

describe('GenrePicker', () => {

  describe('état initial', () => {
    it('affiche "Genre…" quand aucun genre n\'est sélectionné', () => {
      const { getByText } = render(
        <GenrePicker value={null} onChange={jest.fn()} />
      );
      expect(getByText('Genre…')).toBeTruthy();
    });

    it('affiche le libellé du genre sélectionné', () => {
      const { getByText } = render(
        <GenrePicker value="fantasy" onChange={jest.fn()} />
      );
      expect(getByText('Fantasy / Fantastique')).toBeTruthy();
    });

    it('affiche "Roman" quand genre=roman', () => {
      const { getByText } = render(
        <GenrePicker value="roman" onChange={jest.fn()} />
      );
      expect(getByText('Roman')).toBeTruthy();
    });
  });

  describe('ouverture de la modale', () => {
    it('ouvre la modale quand on tape le bouton', () => {
      const { getByText, queryByText } = render(
        <GenrePicker value={null} onChange={jest.fn()} />
      );
      // La modale est fermée au départ : "Choisir un genre" absent
      expect(queryByText('Choisir un genre')).toBeNull();

      fireEvent.press(getByText('Genre…'));

      // Après le tap, la modale est ouverte
      expect(getByText('Choisir un genre')).toBeTruthy();
    });

    it('affiche tous les genres dans la modale', () => {
      const { getByText } = render(
        <GenrePicker value={null} onChange={jest.fn()} />
      );
      fireEvent.press(getByText('Genre…'));

      // Vérifie quelques genres clés
      expect(getByText('Roman')).toBeTruthy();
      expect(getByText('Science-Fiction')).toBeTruthy();
      expect(getByText('Jeunesse')).toBeTruthy();
      expect(getByText('Policier / Thriller')).toBeTruthy();
    });

    it('affiche l\'option "Aucun / Non défini"', () => {
      const { getByText } = render(
        <GenrePicker value="fantasy" onChange={jest.fn()} />
      );
      fireEvent.press(getByText('Fantasy / Fantastique'));
      expect(getByText('Aucun / Non défini')).toBeTruthy();
    });
  });

  describe('sélection d\'un genre', () => {
    it('appelle onChange avec la clé du genre sélectionné', () => {
      const onChange = jest.fn();
      const { getByText } = render(
        <GenrePicker value={null} onChange={onChange} />
      );

      fireEvent.press(getByText('Genre…'));
      fireEvent.press(getByText('Roman'));

      expect(onChange).toHaveBeenCalledWith('roman');
    });

    it('appelle onChange avec null si on sélectionne "Aucun"', () => {
      const onChange = jest.fn();
      const { getByText } = render(
        <GenrePicker value="fantasy" onChange={onChange} />
      );

      fireEvent.press(getByText('Fantasy / Fantastique'));
      fireEvent.press(getByText('Aucun / Non défini'));

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('ferme la modale après sélection', () => {
      const { getByText, queryByText } = render(
        <GenrePicker value={null} onChange={jest.fn()} />
      );

      fireEvent.press(getByText('Genre…'));
      expect(getByText('Choisir un genre')).toBeTruthy();

      fireEvent.press(getByText('Roman'));

      expect(queryByText('Choisir un genre')).toBeNull();
    });

    it('désélectionne le genre si on retape le même', () => {
      const onChange = jest.fn();
      const { getByText, getByTestId } = render(
        <GenrePicker value="fantasy" onChange={onChange} />
      );

      // Premier tap : ouvre la modale (le déclencheur est la seule occurrence du texte)
      fireEvent.press(getByText('Fantasy / Fantastique'));
      // Deuxième tap : la modale est ouverte → deux occurrences de "Fantasy / Fantastique"
      // (déclencheur + option modale) → on cible l'option via son testID
      fireEvent.press(getByTestId('genre-option-fantasy'));

      expect(onChange).toHaveBeenCalledWith(null);
    });
  });
});
