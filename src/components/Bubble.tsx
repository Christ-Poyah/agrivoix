import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, gradients, radius, shadow } from '../theme';
import type { ChatMessage } from '../types';
import { AudioPlayer } from './AudioPlayer';

export function Bubble({ m }: { m: ChatMessage }) {
  const mine = m.role === 'user';
  const content = (
    <>
      {m.imageUri && <Image source={{ uri: m.imageUri }} style={styles.img} />}
      {m.audioUri && <AudioPlayer uri={m.audioUri} durationMs={m.durationMs ?? 0} tone={mine ? 'dark' : 'light'} />}
      {m.text ? <Text style={[styles.msg, mine && { color: '#fff' }]}>{m.text}</Text> : null}
    </>
  );
  if (mine) {
    return (
      <LinearGradient colors={gradients.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.bubble, styles.mine]}>
        {content}
      </LinearGradient>
    );
  }
  return <View style={[styles.bubble, styles.theirs]}>{content}</View>;
}

export function TypingBubble({ label }: { label: string }) {
  return (
    <View style={[styles.bubble, styles.theirs]}>
      <Text style={[styles.msg, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { padding: 13, borderRadius: 20, gap: 8, maxWidth: '85%' },
  mine: { alignSelf: 'flex-end', minWidth: 120, borderBottomRightRadius: 6 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.card, borderBottomLeftRadius: 6, ...shadow },
  msg: { fontSize: 15.5, lineHeight: 22, color: colors.text },
  img: { width: 220, height: 220, borderRadius: radius.sm },
});
