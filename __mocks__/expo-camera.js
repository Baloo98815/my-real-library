// Mock d'expo-camera pour les tests unitaires
import React from 'react';
import { View } from 'react-native';

export const CameraView = ({ children, onBarcodeScanned, ...props }) => (
  <View testID="camera-view" {...props}>{children}</View>
);

export const useCameraPermissions = jest.fn(() => [
  { granted: true, status: 'granted' },
  jest.fn().mockResolvedValue({ granted: true }),
]);
