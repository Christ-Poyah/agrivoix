import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDuration } from '../hooks/useVoiceRecorder';
import { colors, radius } from '../theme';

type Props = { uri: string; durationMs: number; tone?: 'light' | 'dark' };

export function AudioPlayer({ uri, durationMs, tone = 'light' }: Props) {
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);

  const total = status.duration > 0 ? status.duration * 1000 : durationMs;
  const progress = total > 0 ? Math.min(1, (status.currentTime * 1000) / total) : 0;
  const onDark = tone === 'dark';

  const toggle = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (status.didJustFinish || progress >= 0.99) player.seekTo(0);
      player.play();
    }
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={toggle}
        hitSlop={8}
        style={[styles.btn, { backgroundColor: onDark ? 'rgba(255,255,255,0.25)' : colors.primary }]}
        accessibilityLabel={status.playing ? 'Pause' : 'Lecture'}
      >
        <Ionicons name={status.playing ? 'pause' : 'play'} size={18} color="#fff" />
      </Pressable>
      <View style={[styles.track, { backgroundColor: onDark ? 'rgba(255,255,255,0.3)' : colors.border }]}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: onDark ? '#fff' : colors.primary }]} />
      </View>
      <Text style={[styles.time, { color: onDark ? '#fff' : colors.muted }]}>
        {formatDuration(status.playing ? status.currentTime * 1000 : total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btn: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  track: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
  time: { fontSize: 12, fontVariant: ['tabular-nums'], minWidth: 34, textAlign: 'right' },
});
