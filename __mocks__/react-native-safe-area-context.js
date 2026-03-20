import React from 'react';
import { View } from 'react-native';

export const SafeAreaView = ({ children, ...props }) => (
  <View {...props}>{children}</View>
);

export const SafeAreaProvider = ({ children }) => children;

export const useSafeAreaInsets = jest.fn(() => ({
  top: 0, bottom: 0, left: 0, right: 0,
}));
