/**
 * MOCK de l'assistant (aucun back-end).
 * Remplacer `askAssistant` par un appel à votre API d'IA :
 * envoyer le texte, l'image (base64 / upload) et/ou l'audio (transcrit côté serveur),
 * puis retourner la réponse en texte.
 */

export type AssistantInput = {
  text?: string;
  hasImage?: boolean;
  hasAudio?: boolean;
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const PHOTO_REPLIES = [
  "J'observe des taches brunes sur les feuilles et un léger jaunissement sur les bords. Cela ressemble à une maladie fongique (cercosporiose ou mildiou selon la culture).\n\n• Retirez et brûlez les feuilles atteintes\n• Évitez d'arroser le feuillage, arrosez au pied\n• Appliquez un fongicide à base de cuivre\n• Espacez les plants pour mieux aérer\n\nSi vous me dites la culture, je précise le diagnostic.",
  "Les feuilles sont trouées et enroulées : c'est typique d'une attaque de chenilles ou de criquets.\n\n• Inspectez le dessous des feuilles tôt le matin\n• Ramassez à la main si l'attaque est faible\n• Un traitement au neem (huile ou extrait) est efficace et peu toxique\n\nLes dégâts touchent-ils tout le champ ou seulement quelques plants ?",
  "Les feuilles jaunissent entre les nervures : il s'agit probablement d'une carence (azote ou fer) ou d'un excès d'eau.\n\n• Vérifiez que l'eau ne stagne pas\n• Apportez du compost ou un engrais NPK équilibré\n• Refaites un point dans 10 jours avec une nouvelle photo",
];

const KEYWORDS: [RegExp, string][] = [
  [/engrais|fertili|npk|compost/i, "Pour l'engrais, tout dépend de la culture et du sol. En général : compost ou fumier bien décomposé avant le semis, puis un apport d'azote (urée / NPK) 3 à 4 semaines après la levée. Quelle culture et quelle surface ?"],
  [/arros|eau|sécheresse|secheresse/i, "Arrosez tôt le matin ou en fin de journée, au pied des plants, plutôt que souvent et peu. Un paillage (herbes sèches, paille) garde l'humidité et limite les mauvaises herbes."],
  [/maladie|champignon|tache|pourri|jaun/i, "Pouvez-vous m'envoyer une photo de la feuille ou du fruit atteint ? Avec l'image, je pourrai vous dire plus précisément quelle maladie est probable et comment la traiter."],
  [/insecte|chenille|ravageur|puceron|parasite/i, "Contre les ravageurs : surveillez régulièrement, favorisez les insectes utiles, et utilisez d'abord des solutions douces (neem, savon noir) avant les produits chimiques. Une photo m'aidera à identifier l'insecte."],
  [/prix|vendre|vente|marché|marche/i, "Pour vendre ou acheter vos récoltes, utilisez l'onglet Vocal : enregistrez votre message, choisissez le produit, et vous serez mis en relation dès qu'une correspondance existe."],
  [/semis|semer|planter|plantation|saison/i, "La date de semis dépend de votre région et de la culture. Dites-moi où vous êtes et ce que vous souhaitez planter, je vous donne un calendrier simple."],
  [/bonjour|salut|coucou|hello/i, "Bonjour ! Posez-moi une question sur vos cultures, envoyez une photo de votre plantation ou faites un message vocal."],
];

export async function askAssistant(input: AssistantInput): Promise<string> {
  // Le vocal est plus long à traiter, comme demandé.
  await wait(input.hasAudio ? 3200 : input.hasImage ? 2200 : 1200);

  if (input.hasImage) {
    return PHOTO_REPLIES[Math.floor(Math.random() * PHOTO_REPLIES.length)];
  }
  if (input.hasAudio && !input.text) {
    return "J'ai bien écouté votre message vocal. Pour une réponse précise, pouvez-vous me dire la culture concernée et, si possible, m'envoyer une photo ?";
  }
  const hit = KEYWORDS.find(([re]) => re.test(input.text ?? ''));
  return hit
    ? hit[1]
    : "Merci pour votre question. Donnez-moi un peu plus de détails (culture, région, ce que vous observez) ou envoyez une photo, et je vous conseille.";
}
