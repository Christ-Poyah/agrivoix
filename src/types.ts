export type Kind = 'offer' | 'need';

export const PRODUCTS = ['Maïs', 'Manioc', 'Riz', 'Tomate', 'Igname', 'Banane', 'Cacao', 'Café'] as const;
export type Product = (typeof PRODUCTS)[number];

export type Partner = {
  id: string;
  name: string;
  place: string;
  phone: string;
  quantity: string;
};

export type VoiceNote = {
  id: string;
  /** Vocal : fichier audio. Note écrite : absent, voir `text`. */
  uri?: string;
  text?: string;
  durationMs: number;
  createdAt: number;
  /** Renseignés après l'analyse du vocal. */
  kind?: Kind;
  product?: Product;
  status: 'analyzing' | 'pending' | 'matched';
  partner?: Partner;
  seen: boolean;
};

/** `assistant` = l'autre côté de la conversation (IA ou correspondant). */
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  createdAt: number;
  text?: string;
  imageUri?: string;
  audioUri?: string;
  durationMs?: number;
};
