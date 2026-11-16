import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Pressable, StyleSheet, Text, View } from 'react-native';

import { Bubble, TypingBubble } from './Bubble';
import { ScreenHeader } from './ScreenHeader';
import { ComposerInput } from './ComposerInput';
import { formatDuration, useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useChats } from '../store/chats';
import { useNotes } from '../store/notes';
import { colors, gradients, radius, shadow } from '../theme';
import type { ChatMessage } from '../types';

const NONE: ChatMessage[] = [];

export function Conversation({ id, onBack }: { id: string; onBack: () => void }) {
    const { notes } = useNotes();
  const { conversations, typing, send } = useChats();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const { isRecording, durationMs, start, stop } = useVoiceRecorder();

  const note = notes.find((n) => n.id === id);
  const messages = conversations[id] ?? NONE;
  const isTyping = !!typing[id];

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [messages.length, isTyping]);

  if (!note?.partner) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Conversation introuvable.</Text>
        <Pressable onPress={() => onBack()}>
          <Text style={styles.link}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const partner = note.partner;
  const topic = note.kind && note.product ? `${note.kind === 'offer' ? 'Vous vendez' : 'Vous cherchez'} · ${note.product}` : '';

  const sendText = () => {
    const t = text.trim();
    if (!t) return;
    send(id, { text: t });
    setText('');
  };

  const sendVoice = async () => {
    const rec = await stop();
    if (rec) send(id, { audioUri: rec.uri, durationMs: rec.durationMs });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior="padding">
      <ScreenHeader
        title={partner.name}
        subtitle={`${partner.place}${topic ? ' · ' + topic : ''}`}
        left={
          <Pressable onPress={() => onBack()} hitSlop={10} accessibilityLabel="Retour" style={styles.back}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
        }
      />

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.hint}>Vous êtes en relation avec {partner.name}. Écrivez ou envoyez un vocal pour discuter.</Text>
        }
        ListFooterComponent={isTyping ? <TypingBubble label={`${partner.name.split(' ')[0]} est en train de répondre…`} /> : undefined}
        renderItem={({ item }) => <Bubble m={item} />}
      />

      <View style={[styles.barWrap, { paddingBottom: 10 }]}>
        {isRecording ? (
          <View style={styles.bar}>
            <Pressable onPress={() => stop()} hitSlop={8} accessibilityLabel="Annuler" style={styles.roundGhost}>
              <Ionicons name="close" size={20} color={colors.muted} />
            </Pressable>
            <View style={styles.recInfo}>
              <View style={styles.dot} />
              <Text style={styles.recText}>Enregistrement… {formatDuration(durationMs)}</Text>
            </View>
            <RoundButton icon="send" onPress={sendVoice} label="Envoyer le vocal" />
          </View>
        ) : (
          <View style={styles.bar}>
            <ComposerInput value={text} onChangeText={setText} placeholder="Votre message…" />
            {text.trim() ? (
              <RoundButton icon="send" onPress={sendText} label="Envoyer" />
            ) : (
              <RoundButton icon="mic" onPress={start} label="Message vocal" />
            )}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function RoundButton({ icon, onPress, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label}>
      <LinearGradient colors={gradients.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sendBtn}>
        <Ionicons name={icon} size={19} color="#fff" />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.bg },
  missingText: { color: colors.muted, fontSize: 16 },
  link: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  hint: { textAlign: 'center', color: colors.muted, fontSize: 13, lineHeight: 18, marginBottom: 8, paddingHorizontal: 20 },
  barWrap: { paddingHorizontal: 14, paddingTop: 6 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 6, borderRadius: 30, backgroundColor: colors.card, ...shadow },
  roundGhost: { width: 42, height: 42, borderRadius: radius.full, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  recInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 42 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
  recText: { color: colors.text, fontSize: 15, fontVariant: ['tabular-nums'] },
});
