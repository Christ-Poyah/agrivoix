import { Kind, PRODUCTS, Product } from '../types';

/**
 * Analyse d'une note : vend / cherche + produit.
 * - Texte : détection par mots-clés (fonctionne tel quel, sans serveur).
 * - Vocal : MOCK (aucun back-end). Remplacer par un appel serveur :
 *   transcription du vocal, puis extraction de l'intention, du produit et de la quantité.
 */
type Info = { kind: Kind; product: Product };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const randomProduct = () => PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];

export async function analyzeText(text: string): Promise<Info> {
  await wait(900);
  const t = norm(text);
  const need = /cherch|besoin|achet|recherch|je veux|il me faut|demande/.test(t);
  const offer = /vend|propose|dispo|offre|j'ai |jai /.test(t);
  const kind: Kind = need && !offer ? 'need' : offer ? 'offer' : 'offer';
  const product = PRODUCTS.find((p) => t.includes(norm(p))) ?? randomProduct();
  return { kind, product };
}

export async function analyzeVoice(_uri: string): Promise<Info> {
  await wait(1800);
  return { kind: Math.random() < 0.5 ? 'offer' : 'need', product: randomProduct() };
}
