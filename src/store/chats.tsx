import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { partnerReply } from '../services/partner';
import type { ChatMessage } from '../types';

const KEY = 'agrivoix.chats.v1';

type Payload = { text?: string; audioUri?: string; durationMs?: number };

type Ctx = {
  conversations: Record<string, ChatMessage[]>;
  typing: Record<string, boolean>;
  send: (noteId: string, payload: Payload) => void;
};

const ChatsContext = createContext<Ctx | null>(null);

const mk = (role: ChatMessage['role'], p: Payload): ChatMessage => ({
  id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  role,
  createdAt: Date.now(),
  ...p,
});

export function ChatsProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({});
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);
  const counts = useRef<Record<string, number>>({});

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const data: Record<string, ChatMessage[]> = JSON.parse(raw);
        setConversations(data);
        Object.entries(data).forEach(([id, list]) => (counts.current[id] = list.filter((m) => m.role === 'assistant').length));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(conversations)).catch(() => {});
  }, [conversations, ready]);

  const append = useCallback((id: string, m: ChatMessage) => {
    setConversations((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), m] }));
  }, []);

  const send: Ctx['send'] = useCallback(
    async (noteId, payload) => {
      append(noteId, mk('user', payload));
      setTyping((t) => ({ ...t, [noteId]: true }));
      const n = counts.current[noteId] ?? 0;
      const reply = await partnerReply(n, !!payload.audioUri);
      counts.current[noteId] = n + 1;
      setTyping((t) => ({ ...t, [noteId]: false }));
      append(noteId, mk('assistant', { text: reply }));
    },
    [append],
  );

  const value = useMemo(() => ({ conversations, typing, send }), [conversations, typing, send]);
  return <ChatsContext.Provider value={value}>{children}</ChatsContext.Provider>;
}

export function useChats() {
  const ctx = useContext(ChatsContext);
  if (!ctx) throw new Error('useChats doit être utilisé dans ChatsProvider');
  return ctx;
}
