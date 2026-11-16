import type { Kind, Partner, Product } from '../types';

/**
 * MOCK de la mise en relation (aucun back-end).
 * Remplacer `findMatch` par un appel API : envoyer le vocal + { kind, product },
 * recevoir un `Partner` (ou null) et écouter les nouvelles correspondances
 * (push / websocket) pour appeler `onLateMatch`.
 */

type CommunityEntry = Partner & { kind: Kind; product: Product };

const COMMUNITY: CommunityEntry[] = [
  { id: 'c1', kind: 'offer', product: 'Maïs', name: 'Kouassi Yao', place: 'Bouaké', phone: '+2250700000001', quantity: '500 kg' },
  { id: 'c2', kind: 'need', product: 'Maïs', name: 'Coopérative Nafa', place: 'Korhogo', phone: '+2250700000002', quantity: '2 tonnes' },
  { id: 'c3', kind: 'offer', product: 'Manioc', name: 'Aminata Traoré', place: 'Daloa', phone: '+2250700000003', quantity: '300 kg' },
  { id: 'c4', kind: 'need', product: 'Manioc', name: 'Attiéké Mama', place: 'Abidjan', phone: '+2250700000004', quantity: '1 tonne' },
  { id: 'c5', kind: 'offer', product: 'Tomate', name: 'Jean-Marc Kone', place: 'Yamoussoukro', phone: '+2250700000005', quantity: '80 caisses' },
  { id: 'c6', kind: 'need', product: 'Tomate', name: 'Marché de Treichville', place: 'Abidjan', phone: '+2250700000006', quantity: '50 caisses' },
  { id: 'c7', kind: 'offer', product: 'Riz', name: 'Fatou Diallo', place: 'Man', phone: '+2250700000007', quantity: '1 tonne' },
  { id: 'c8', kind: 'need', product: 'Cacao', name: 'Exportateur Sucaf', place: 'San-Pédro', phone: '+2250700000008', quantity: '5 tonnes' },
];

const LATE_NAMES = ['Paul Ouattara', 'Mariam Sylla', 'Ibrahim Koffi', 'Estelle N’Guessan'];
const LATE_PLACES = ['Gagnoa', 'Séguéla', 'Abengourou', 'Odienné'];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Cherche tout de suite un vocal de sens opposé pour le même produit. */
export async function findMatch(kind: Kind, product: Product): Promise<Partner | null> {
  await wait(600);
  const opposite: Kind = kind === 'offer' ? 'need' : 'offer';
  const hit = COMMUNITY.find((c) => c.kind === opposite && c.product === product);
  if (!hit) return null;
  const { kind: _k, product: _p, ...partner } = hit;
  return partner;
}

/**
 * Simule une correspondance qui arrive plus tard (quelqu'un d'autre
 * publie un vocal). Retourne une fonction d'annulation.
 */
export function scheduleLateMatch(onLateMatch: (p: Partner) => void, delayMs = 15000) {
  const t = setTimeout(() => {
    const i = Math.floor(Math.random() * LATE_NAMES.length);
    onLateMatch({
      id: `late-${Date.now()}`,
      name: LATE_NAMES[i],
      place: LATE_PLACES[i],
      phone: `+22507000010${i}`,
      quantity: 'à discuter',
    });
  }, delayMs);
  return () => clearTimeout(t);
}
