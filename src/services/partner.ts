/**
 * MOCK des réponses du correspondant (aucun back-end).
 * Remplacer par une vraie messagerie (websocket / push) entre utilisateurs.
 */
const REPLIES = [
  "Bonjour ! J'ai bien reçu votre vocal, ça m'intéresse.",
  'Quelle quantité exactement et pour quand ?',
  'On peut s’arranger sur le prix. Vous proposez combien ?',
  'D’accord. Où peut-on se retrouver pour la livraison ?',
  'Parfait, merci, à bientôt !',
];

export async function partnerReply(count: number, wasVoice: boolean): Promise<string> {
  await new Promise((r) => setTimeout(r, wasVoice ? 3000 : 1800));
  if (wasVoice && count === 0) return "J'ai bien écouté votre message. Pouvez-vous me confirmer la quantité ?";
  return REPLIES[count % REPLIES.length];
}
