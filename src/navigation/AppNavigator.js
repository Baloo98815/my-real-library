import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

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
            paddingBottom:   6,
            paddingTop:      6,
            height:          60,
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
