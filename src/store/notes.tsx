import AsyncStorage from '@react-native-async-storage/async-storage';
import { File } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { analyzeText, analyzeVoice } from '../services/analysis';
import { findMatch, scheduleLateMatch } from '../services/matching';
import type { Partner, VoiceNote } from '../types';

const KEY = 'agrivoix.notes.v2';

type Ctx = {
  notes: VoiceNote[];
  ready: boolean;
  unseenCount: number;
  addNote: (n: { uri?: string; text?: string; durationMs: number }) => void;
  deleteNote: (id: string) => void;
  markAllSeen: () => void;
};

const NotesContext = createContext<Ctx | null>(null);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [ready, setReady] = useState(false);
  const cancels = useRef<Map<string, () => void>>(new Map());

  const applyMatch = useCallback((id: string, partner: Partner) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id && n.status === 'pending' ? { ...n, status: 'matched', partner, seen: false } : n)),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  const watch = useCallback(
    (id: string) => {
      cancels.current.get(id)?.();
      cancels.current.set(id, scheduleLateMatch((p) => applyMatch(id, p)));
    },
    [applyMatch],
  );

  /** Analyse le vocal (produit, vend/cherche) puis cherche une correspondance. */
  const process = useCallback(
    async (id: string, uri?: string, text?: string) => {
      const info = text ? await analyzeText(text) : await analyzeVoice(uri ?? '');
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...info, status: 'pending' } : n)));
      const partner = await findMatch(info.kind, info.product);
      if (partner) applyMatch(id, partner);
      else watch(id);
    },
    [applyMatch, watch],
  );

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        const list: VoiceNote[] = raw ? JSON.parse(raw) : [];
        setNotes(list);
        list.forEach((n) => {
          if (n.status === 'analyzing') process(n.id, n.uri, n.text);
          else if (n.status === 'pending') watch(n.id);
        });
      } catch {
        // stockage illisible : on repart de zéro
      }
      setReady(true);
    })();
    const map = cancels.current;
    return () => map.forEach((c) => c());
  }, [process, watch]);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(notes)).catch(() => {});
  }, [notes, ready]);

  const addNote: Ctx['addNote'] = useCallback(
    ({ uri, text, durationMs }) => {
      const note: VoiceNote = { id: `n-${Date.now()}`, uri, text, durationMs, createdAt: Date.now(), status: 'analyzing', seen: true };
      setNotes((prev) => [note, ...prev]);
      process(note.id, uri, text);
    },
    [process],
  );

  const deleteNote = useCallback((id: string) => {
    cancels.current.get(id)?.();
    cancels.current.delete(id);
    setNotes((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target?.uri) {
        try {
          const f = new File(target.uri);
          if (f.exists) f.delete();
        } catch {
          // fichier déjà absent
        }
      }
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  const markAllSeen = useCallback(() => {
    setNotes((prev) => (prev.some((n) => !n.seen) ? prev.map((n) => ({ ...n, seen: true })) : prev));
  }, []);

  const unseenCount = useMemo(() => notes.filter((n) => !n.seen).length, [notes]);

  const value = useMemo(
    () => ({ notes, ready, unseenCount, addNote, deleteNote, markAllSeen }),
    [notes, ready, unseenCount, addNote, deleteNote, markAllSeen],
  );
  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes doit être utilisé dans NotesProvider');
  return ctx;
}
