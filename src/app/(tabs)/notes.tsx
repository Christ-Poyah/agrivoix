import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AudioPlayer } from '../../components/AudioPlayer';
import { Conversation } from '../../components/Conversation';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useChats } from '../../store/chats';
import { useNotes } from '../../store/notes';
import { colors, gradients, radius, shadow } from '../../theme';
import type { VoiceNote } from '../../types';

const dateFmt = (t: number) =>
  new Date(t).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function NotesScreen() {
  const { notes, deleteNote, markAllSeen } = useNotes();
  const { conversations } = useChats();
  const [openId, setOpenId] = useState<string | null>(null);

  // Retour matériel Android : referme la conversation au lieu de quitter l'app.
  useEffect(() => {
    if (!openId) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpenId(null);
      return true;
    });
    return () => sub.remove();
  }, [openId]);

  useFocusEffect(
    useCallback(() => {
      // Marqué comme vu en quittant l'onglet, pour que le badge reste visible à l'arrivée.
      return markAllSeen;
    }, [markAllSeen]),
  );

  const confirmDelete = (n: VoiceNote) =>
    Alert.alert('Supprimer ce vocal ?', 'Il sera retiré de votre historique.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteNote(n.id) },
    ]);

  if (openId) return <Conversation id={openId} onBack={() => setOpenId(null)} />;

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader
        title="Mes vocaux"
        subtitle={notes.length ? `${notes.length} commande${notes.length > 1 ? 's' : ''}` : 'Vos commandes apparaîtront ici'}
      />
      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aucun vocal pour l’instant</Text>
            <Text style={styles.emptyText}>Dites ou écrivez ce que vous vendez ou cherchez, nous trouvons la bonne personne.</Text>
            <Pressable onPress={() => router.navigate('/')}>
              <LinearGradient colors={gradients.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>Enregistrer un vocal</Text>
              </LinearGradient>
            </Pressable>
          </View>
        }
        renderItem={({ item: n }) => {
          const count = conversations[n.id]?.length ?? 0;
          return (
            <View style={styles.card}>
              <View style={styles.head}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.product}>
                    {n.status === 'analyzing' || !n.kind
                      ? 'Analyse du vocal…'
                      : `${n.kind === 'offer' ? 'Je vends' : 'Je cherche'} · ${n.product}`}
                  </Text>
                  <Text style={styles.date}>{dateFmt(n.createdAt)}</Text>
                </View>
                <Pressable onPress={() => confirmDelete(n)} hitSlop={10} accessibilityLabel="Supprimer" style={styles.trash}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>

              {n.uri ? <AudioPlayer uri={n.uri} durationMs={n.durationMs} /> : <Text style={styles.noteText}>{n.text}</Text>}

              {n.status === 'matched' && n.partner ? (
                <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.match}>
                  <Text style={styles.matchTag}>Correspondance trouvée</Text>
                  <Text style={styles.matchName}>{n.partner.name}</Text>
                  <Text style={styles.matchInfo}>
                    {n.partner.place} · {n.partner.quantity}
                  </Text>
                  <Pressable style={styles.chatBtn} onPress={() => setOpenId(n.id)}>
                    <Text style={styles.chatText}>{count ? `Continuer la discussion (${count})` : 'Discuter'}</Text>
                  </Pressable>
                </LinearGradient>
              ) : (
                <View style={styles.waiting}>
                  <Text style={styles.waitingText}>
                    {n.status === 'analyzing'
                      ? 'Nous écoutons votre message pour comprendre votre demande.'
                      : 'En attente d’une correspondance. Vous serez prévenu dès qu’il y en a une.'}
                  </Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28, gap: 16 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, gap: 14, ...shadow },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  product: { fontSize: 18, fontWeight: '800', color: colors.text },
  noteText: { fontSize: 15.5, lineHeight: 22, color: colors.text },
  date: { marginTop: 2, fontSize: 12.5, color: colors.muted, fontWeight: '500' },
  trash: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  match: { borderRadius: radius.md, padding: 16 },
  matchTag: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: 0.6 },
  matchName: { marginTop: 8, fontSize: 20, fontWeight: '800', color: '#fff' },
  matchInfo: { marginTop: 2, color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  chatBtn: { marginTop: 14, paddingVertical: 12, borderRadius: radius.sm, backgroundColor: '#fff', alignItems: 'center' },
  chatText: { fontWeight: '800', color: colors.primaryDark, fontSize: 15 },
  waiting: { backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: 12 },
  waitingText: { color: '#7A5410', fontSize: 13, lineHeight: 18, fontWeight: '500' },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20, gap: 10 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: 'center', lineHeight: 21 },
  emptyBtn: { marginTop: 10, paddingHorizontal: 22, paddingVertical: 14, borderRadius: radius.md },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
