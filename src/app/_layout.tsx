import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ChatsProvider } from '../store/chats';
import { NotesProvider } from '../store/notes';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NotesProvider>
        <ChatsProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </ChatsProvider>
      </NotesProvider>
    </SafeAreaProvider>
  );
}
