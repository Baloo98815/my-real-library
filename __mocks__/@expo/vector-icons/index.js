// Mock de @expo/vector-icons pour les tests unitaires
// Remplace les composants d'icônes par un simple <Text> avec le nom de l'icône

import React from 'react';
import { Text } from 'react-native';

const createIconComponent = (familyName) => {
  const Icon = ({ name, size, color, style, testID }) =>
    React.createElement(
      Text,
      { testID: testID || `icon-${name}`, style: [{ fontSize: size, color }, style] },
      name
    );
  Icon.displayName = familyName;
  return Icon;
};

export const Ionicons             = createIconComponent('Ionicons');
export const MaterialIcons        = createIconComponent('MaterialIcons');
export const MaterialCommunityIcons = createIconComponent('MaterialCommunityIcons');
export const FontAwesome          = createIconComponent('FontAwesome');
export const FontAwesome5         = createIconComponent('FontAwesome5');
export const Feather              = createIconComponent('Feather');
export const AntDesign            = createIconComponent('AntDesign');
export const Entypo               = createIconComponent('Entypo');
export const EvilIcons            = createIconComponent('EvilIcons');
export const Octicons             = createIconComponent('Octicons');
export const Zocial               = createIconComponent('Zocial');
export const SimpleLineIcons      = createIconComponent('SimpleLineIcons');
export const Foundation           = createIconComponent('Foundation');

export default createIconComponent('Icon');
