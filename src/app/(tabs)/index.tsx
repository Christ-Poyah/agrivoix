import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AudioPlayer } from '../../components/AudioPlayer';
import { MicButton } from '../../components/MicButton';
import { Waveform } from '../../components/Waveform';
import { formatDuration, Recording, useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { useNotes } from '../../store/notes';
import { APP_NAME, colors, gradients, radius, shadow } from '../../theme';

type Mode = 'voice' | 'text';

export default function VocalScreen() {
  const insets = useSafeAreaInsets();
  const { addNote } = useNotes();
  const { isRecording, durationMs, start, stop } = useVoiceRecorder();
  const [mode, setMode] = useState<Mode>('voice');
  const [draft, setDraft] = useState<Recording | null>(null);
  const [text, setText] = useState('');

  const onMic = async () => {
    if (isRecording) {
      const rec = await stop();
      if (rec) setDraft(rec);
    } else {
      setDraft(null);
      await start();
    }
  };

  const sendVoice = () => {
    if (!draft) return;
    addNote(draft);
    setDraft(null);
    router.navigate('/notes');
  };

  const sendText = () => {
    const t = text.trim();
    if (!t) return;
    addNote({ text: t, durationMs: 0 });
    setText('');
    router.navigate('/notes');
  };

  const title = mode === 'text' ? 'Écrivez votre message' : isRecording ? 'Je vous écoute…' : draft ? 'Votre vocal est prêt' : 'Parlez, on s’occupe du reste';
  const subtitle =
    mode === 'text'
      ? 'Dites ce que vous vendez ou cherchez, avec le produit et la quantité.'
      : isRecording
        ? 'Appuyez sur le bouton pour terminer'
        : draft
          ? 'Réécoutez-le, puis envoyez-le'
          : 'Dites ce que vous vendez ou cherchez, avec le produit et la quantité.';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.brand}>{APP_NAME}</Text>

        <View style={styles.toggle}>
          {(['voice', 'text'] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => !isRecording && setMode(m)}
              style={[styles.toggleItem, mode === m && styles.toggleActive]}
            >
              <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>{m === 'voice' ? 'Voix' : 'Texte'}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {mode === 'voice' ? (
          <>
            <View style={styles.micWrap}>
              <MicButton recording={isRecording} onPress={onMic} />
              <Text style={[styles.timer, isRecording && { color: colors.danger }]}>
                {formatDuration(isRecording ? durationMs : (draft?.durationMs ?? 0))}
              </Text>
              <View style={{ height: 40, marginTop: 10 }}>
                {isRecording && <Waveform active bars={26} height={36} color={colors.danger} />}
              </View>
            </View>

            {draft && !isRecording && (
              <View style={styles.card}>
                <AudioPlayer uri={draft.uri} durationMs={draft.durationMs} />
                <View style={styles.actions}>
                  <Pressable onPress={() => setDraft(null)} style={[styles.btn, styles.btnGhost]}>
                    <Text style={styles.btnGhostText}>Recommencer</Text>
                  </Pressable>
                  <Pressable onPress={sendVoice} style={{ flex: 1.2 }}>
                    <LinearGradient colors={gradients.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
                      <Text style={styles.btnPrimaryText}>Envoyer</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.card}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Ex. : Je vends 500 kg de maïs à Bouaké"
              placeholderTextColor={colors.muted}
              style={styles.textArea}
              multiline
              textAlignVertical="top"
            />
            <Pressable onPress={sendText} disabled={!text.trim()} style={[{ marginTop: 16 }, !text.trim() && { opacity: 0.45 }]}>
              <LinearGradient colors={gradients.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
                <Ionicons name="paper-plane" size={16} color="#fff" />
                <Text style={styles.btnPrimaryText}>Envoyer</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingBottom: 32, alignItems: 'center' },
  brand: { color: colors.primary, fontWeight: '800', fontSize: 15, letterSpacing: 1.2, textTransform: 'uppercase' },
  toggle: { flexDirection: 'row', marginTop: 20, padding: 4, borderRadius: radius.full, backgroundColor: '#ECEADF' },
  toggleItem: { paddingHorizontal: 28, paddingVertical: 9, borderRadius: radius.full },
  toggleActive: { backgroundColor: colors.card, ...shadow },
  toggleText: { fontWeight: '700', color: colors.muted, fontSize: 14.5 },
  toggleTextActive: { color: colors.primaryDark },
  title: { marginTop: 32, fontSize: 25, lineHeight: 31, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { marginTop: 8, fontSize: 15, lineHeight: 21, color: colors.muted, textAlign: 'center', paddingHorizontal: 8 },
  micWrap: { alignItems: 'center', marginTop: 8 },
  timer: { marginTop: -24, fontSize: 28, fontWeight: '300', color: colors.text, fontVariant: ['tabular-nums'] },
  card: { alignSelf: 'stretch', marginTop: 24, padding: 18, backgroundColor: colors.card, borderRadius: radius.lg, ...shadow },
  textArea: { minHeight: 150, fontSize: 16, lineHeight: 23, color: colors.text, padding: 0 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: { flexDirection: 'row', gap: 8, paddingVertical: 15, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  btnGhost: { flex: 1, backgroundColor: colors.bg },
  btnGhostText: { color: colors.text, fontWeight: '700', fontSize: 16 },
});
