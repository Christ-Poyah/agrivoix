import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNotes } from '../../store/notes';
import { colors } from '../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const icon = (active: IconName, idle: IconName) =>
  function TabIcon({ color, focused }: { color: ColorValue; size: number; focused: boolean }) {
    return <Ionicons name={focused ? active : idle} size={24} color={color as string} />;
  };

export default function TabsLayout() {
  const { unseenCount } = useNotes();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9AA59D',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 70 + bottom,
          paddingTop: 10,
          paddingBottom: bottom,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Vocal', tabBarIcon: icon('mic', 'mic-outline') }} />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Mes vocaux',
          tabBarIcon: icon('albums', 'albums-outline'),
          tabBarBadge: unseenCount > 0 ? unseenCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: '#fff', fontWeight: '800' },
        }}
      />
      <Tabs.Screen name="assistant" options={{ title: 'Assistant', tabBarIcon: icon('chatbubble', 'chatbubble-outline') }} />
    </Tabs>
  );
}
