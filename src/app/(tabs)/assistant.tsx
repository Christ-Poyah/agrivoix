import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bubble, TypingBubble } from '../../components/Bubble';
import { ComposerInput } from '../../components/ComposerInput';
import { formatDuration, useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { askAssistant } from '../../services/assistant';
import { colors, gradients, radius, shadow } from '../../theme';
import type { ChatMessage } from '../../types';

const KEY = 'agrivoix.assistant.v2';

type Conv = { id: string; title: string; updatedAt: number; messages: ChatMessage[] };

const SUGGESTIONS = [
  'Mes feuilles ont des taches',
  'Quel engrais pour le maïs ?',
  'Comment bien arroser ?',
  'Des chenilles dans mon champ',
];

const titleOf = (m: Omit<ChatMessage, 'id' | 'createdAt'>) =>
  m.text ? m.text.slice(0, 42) : m.imageUri ? 'Photo de plantation' : 'Message vocal';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const drawerW = Math.min(320, width * 0.82);

  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [thinkingId, setThinkingId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [slide] = useState(() => new Animated.Value(0));
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const { isRecording, durationMs, start, stop } = useVoiceRecorder();

  const active = convs.find((c) => c.id === activeId) ?? null;
  const messages = active?.messages ?? [];
  const thinking = thinkingId !== null && thinkingId === activeId;

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setConvs(JSON.parse(raw)))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(KEY, JSON.stringify(convs)).catch(() => {});
  }, [convs, loaded]);

  useEffect(() => {
    Animated.timing(slide, { toValue: menuOpen ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [menuOpen, slide]);

  const scrollEnd = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

  const append = (convId: string, m: Omit<ChatMessage, 'id' | 'createdAt'>) => {
    const msg: ChatMessage = { ...m, id: `m-${uid()}`, createdAt: Date.now() };
    setConvs((prev) =>
      prev.some((c) => c.id === convId)
        ? prev.map((c) => (c.id === convId ? { ...c, updatedAt: Date.now(), messages: [...c.messages, msg] } : c))
        : [{ id: convId, title: titleOf(m), updatedAt: Date.now(), messages: [msg] }, ...prev],
    );
    scrollEnd();
  };

  const ask = async (payload: { text?: string; imageUri?: string; audioUri?: string; durationMs?: number }) => {
    const convId = activeId ?? `c-${uid()}`;
    if (!activeId) setActiveId(convId);
    append(convId, { role: 'user', ...payload });
    setThinkingId(convId);
    scrollEnd();
    const reply = await askAssistant({ text: payload.text, hasImage: !!payload.imageUri, hasAudio: !!payload.audioUri });
    setThinkingId(null);
    append(convId, { role: 'assistant', text: reply });
  };

  const sendText = () => {
    const t = text.trim();
    if ((!t && !image) || thinking) return;
    ask({ text: t || undefined, imageUri: image ?? undefined });
    setText('');
    setImage(null);
  };

  const pick = async (source: 'camera' | 'library') => {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return Alert.alert('Caméra refusée', 'Autorisez la caméra dans les réglages.');
    }
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled) setImage(res.assets[0].uri);
  };

  const choosePhoto = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Annuler', 'Prendre une photo', 'Choisir dans la galerie'], cancelButtonIndex: 0 },
        (i) => (i === 1 ? pick('camera') : i === 2 ? pick('library') : undefined),
      );
    } else {
      Alert.alert('Ajouter une photo', undefined, [
        { text: 'Prendre une photo', onPress: () => pick('camera') },
        { text: 'Galerie', onPress: () => pick('library') },
        { text: 'Annuler', style: 'cancel' },
      ]);
    }
  };

  const sendVoice = useCallback(async () => {
    const rec = await stop();
    if (rec) ask({ audioUri: rec.uri, durationMs: rec.durationMs });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stop, activeId]);

  const cancelVoice = async () => {
    const rec = await stop();
    if (rec) {
      try {
        const f = new File(rec.uri);
        if (f.exists) f.delete();
      } catch {
        // rien à nettoyer
      }
    }
  };

  const newChat = () => {
    setActiveId(null);
    setText('');
    setImage(null);
    setMenuOpen(false);
  };

  const openChat = (id: string) => {
    setActiveId(id);
    setMenuOpen(false);
    scrollEnd();
  };

  const removeChat = (c: Conv) =>
    Alert.alert('Supprimer cette discussion ?', c.title, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          setConvs((prev) => prev.filter((x) => x.id !== c.id));
          if (activeId === c.id) setActiveId(null);
        },
      },
    ]);

  const canSend = (text.trim().length > 0 || !!image) && !thinking;
  const sorted = [...convs].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => setMenuOpen(true)} hitSlop={10} accessibilityLabel="Mes discussions" style={styles.headBtn}>
            <Ionicons name="menu" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headTitle} numberOfLines={1}>
            {active?.title ?? 'Assistant'}
          </Text>
          <Pressable onPress={newChat} hitSlop={10} accessibilityLabel="Nouvelle discussion" style={styles.headBtn}>
            <Ionicons name="create-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Comment puis-je vous aider ?</Text>
            <Text style={styles.emptyText}>Posez une question, envoyez une photo de votre plantation ou faites un vocal.</Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} onPress={() => ask({ text: s })} style={styles.suggestion}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollEnd}
            ListFooterComponent={thinking ? <TypingBubble label="L’assistant réfléchit…" /> : undefined}
            renderItem={({ item: m }) => <Bubble m={m} />}
          />
        )}

        {image && (
          <View style={styles.preview}>
            <Image source={{ uri: image }} style={styles.previewImg} />
            <Pressable onPress={() => setImage(null)} style={styles.previewX} hitSlop={8}>
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          </View>
        )}

        <View style={[styles.barWrap, { paddingBottom: 10 }]}>
          {isRecording ? (
            <View style={styles.bar}>
              <Pressable onPress={cancelVoice} hitSlop={8} accessibilityLabel="Annuler" style={styles.roundGhost}>
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
              <Pressable onPress={choosePhoto} hitSlop={8} accessibilityLabel="Ajouter une photo" style={styles.roundGhost}>
                <Ionicons name="camera-outline" size={22} color={colors.text} />
              </Pressable>
              <ComposerInput value={text} onChangeText={setText} placeholder="Posez votre question…" />
              {canSend ? (
                <RoundButton icon="arrow-up" onPress={sendText} label="Envoyer" />
              ) : (
                <RoundButton icon="mic" onPress={start} label="Message vocal" />
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Menu des discussions, à la ChatGPT */}
      <Animated.View
        pointerEvents={menuOpen ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, { opacity: slide, backgroundColor: 'rgba(10,25,15,0.45)' }]}
      >
        <Pressable style={{ flex: 1 }} onPress={() => setMenuOpen(false)} accessibilityLabel="Fermer le menu" />
      </Animated.View>
      <Animated.View
        pointerEvents={menuOpen ? 'auto' : 'none'}
        style={[
          styles.drawer,
          {
            width: drawerW,
            paddingTop: insets.top + 12,
            paddingBottom: 16,
            transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [-drawerW, 0] }) }],
          },
        ]}
      >
        <Pressable onPress={newChat} style={styles.newBtn}>
          <Ionicons name="create-outline" size={20} color={colors.primaryDark} />
          <Text style={styles.newBtnText}>Nouvelle discussion</Text>
        </Pressable>
        <Text style={styles.drawerLabel}>Discussions</Text>
        <FlatList
          data={sorted}
          keyExtractor={(c) => c.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.drawerEmpty}>Aucune discussion pour l’instant.</Text>}
          renderItem={({ item: c }) => (
            <Pressable
              onPress={() => openChat(c.id)}
              onLongPress={() => removeChat(c)}
              style={[styles.convRow, c.id === activeId && styles.convRowActive]}
            >
              <Text style={styles.convTitle} numberOfLines={1}>
                {c.title}
              </Text>
              <Pressable onPress={() => removeChat(c)} hitSlop={10} accessibilityLabel="Supprimer la discussion">
                <Ionicons name="trash-outline" size={17} color={colors.muted} />
              </Pressable>
            </Pressable>
          )}
        />
      </Animated.View>
    </View>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 10, backgroundColor: colors.bg },
  headBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: colors.text },
  list: { padding: 16, gap: 12 },
  empty: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 },
  emptyTitle: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  emptyText: { marginTop: 8, fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  suggestions: { marginTop: 28, gap: 10 },
  suggestion: { backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 14, borderRadius: radius.md, ...shadow },
  suggestionText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  preview: { marginHorizontal: 16, marginBottom: 6, alignSelf: 'flex-start' },
  previewImg: { width: 76, height: 76, borderRadius: radius.sm },
  previewX: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  barWrap: { paddingHorizontal: 14, paddingTop: 6 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 6, borderRadius: 30, backgroundColor: colors.card, ...shadow },
  roundGhost: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  recInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 42 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
  recText: { color: colors.text, fontSize: 15, fontVariant: ['tabular-nums'] },
  drawer: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: colors.card, paddingHorizontal: 14, ...shadow },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  newBtnText: { fontSize: 15.5, fontWeight: '800', color: colors.primaryDark },
  drawerLabel: { marginTop: 22, marginBottom: 8, marginLeft: 6, fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  drawerEmpty: { marginLeft: 6, marginTop: 8, color: colors.muted, fontSize: 14 },
  convRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 12, borderRadius: radius.sm },
  convRowActive: { backgroundColor: colors.bg },
  convTitle: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '600' },
});
