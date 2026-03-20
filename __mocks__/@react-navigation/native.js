// Mock de @react-navigation/native
export const useNavigation = jest.fn(() => ({
  navigate: jest.fn(),
  goBack:   jest.fn(),
  push:     jest.fn(),
  replace:  jest.fn(),
}));

export const useRoute = jest.fn(() => ({
  params: {},
}));

export const useFocusEffect = jest.fn((cb) => cb());

export const NavigationContainer = ({ children }) => children;
