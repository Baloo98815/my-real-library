// Mock de @react-navigation/native
import { useEffect } from 'react';

export const useNavigation = jest.fn(() => ({
  navigate: jest.fn(),
  goBack:   jest.fn(),
  push:     jest.fn(),
  replace:  jest.fn(),
}));

export const useRoute = jest.fn(() => ({
  params: {},
}));

/**
 * useFocusEffect doit se comporter comme useEffect (appelé une seule fois au montage),
 * pas de façon synchrone pendant le render (ce qui causerait une boucle infinie via setState).
 */
export const useFocusEffect = (cb) => {
  useEffect(() => {
    const cleanup = cb();
    if (typeof cleanup === 'function') return cleanup;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
};

export const NavigationContainer = ({ children }) => children;
