import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LibraryScreen    from '../screens/LibraryScreen';
import AddBookScreen    from '../screens/AddBookScreen';
import BookDetailScreen from '../screens/BookDetailScreen';
import WishlistScreen   from '../screens/WishlistScreen';
import { Colors, Typography } from '../theme';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

// ─── Stack Bibliothèque ───────────────────────────────────────────────────────
function LibraryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LibraryMain"  component={LibraryScreen} />
      <Stack.Screen name="BookDetail"   component={BookDetailScreen} />
    </Stack.Navigator>
  );
}

// ─── Icônes des onglets ───────────────────────────────────────────────────────
const TAB_ICONS = {
  LibraryTab:  { active: 'library',       inactive: 'library-outline'      },
  AddBookTab:  { active: 'add-circle',    inactive: 'add-circle-outline'   },
  WishlistTab: { active: 'heart',         inactive: 'heart-outline'        },
};

// ─── Navigateur principal ─────────────────────────────────────────────────────
export default function AppNavigator() {
  const insets = useSafeAreaInsets();
  // Sur Android avec barre de navigation gestuelle ou boutons, insets.bottom
  // reflète la hauteur de cette barre — on s'assure que la tab bar ne passe pas dessous.
  const tabBarPaddingBottom = Math.max(insets.bottom, 6);
  const tabBarHeight        = 56 + tabBarPaddingBottom;

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="LibraryTab"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor:   Colors.primary,
          tabBarInactiveTintColor: Colors.textTertiary,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor:  Colors.border,
            borderTopWidth:  1,
            paddingBottom:   tabBarPaddingBottom,
            paddingTop:      6,
            height:          tabBarHeight,
          },
          tabBarLabelStyle: {
            fontSize:   Typography.fontSize.xs,
            fontWeight: Typography.fontWeight.medium,
            marginTop:  2,
          },
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name];
            const name  = focused ? icons?.active : icons?.inactive;
            return <Ionicons name={name || 'ellipse'} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="LibraryTab"
          component={LibraryStack}
          options={{ tabBarLabel: 'Bibliothèque' }}
        />
        <Tab.Screen
          name="AddBookTab"
          component={AddBookScreen}
          options={{ tabBarLabel: 'Ajouter' }}
        />
        <Tab.Screen
          name="WishlistTab"
          component={WishlistScreen}
          options={{ tabBarLabel: 'Wishlist' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
