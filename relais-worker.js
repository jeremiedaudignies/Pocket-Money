// Relais Pocket-Money → API Wallet (Cloudflare Worker)
// - Lecture seule : seules les requêtes GET vers /v1/api/accounts et /v1/api/records passent.
// - Seule ton app (GitHub Pages) peut l'appeler depuis un navigateur.
// - Le jeton n'est jamais stocké ici : il arrive de l'app à chaque appel et repart vers Wallet.

const ORIGINE_AUTORISEE = 'https://jeremiedaudignies.github.io';
const WALLET = 'https://rest.budgetbakers.com/wallet';
const CHEMINS = ['/v1/api/accounts', '/v1/api/records'];

const cors = {
  'Access-Control-Allow-Origin': ORIGINE_AUTORISEE,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Accept',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origine = request.headers.get('Origin');

    if (origine && origine !== ORIGINE_AUTORISEE) return new Response('Origine refusée', { status: 403 });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'GET') return new Response('Méthode refusée', { status: 405, headers: cors });
    if (!CHEMINS.includes(url.pathname)) return new Response('Chemin refusé', { status: 404, headers: cors });

    const reponse = await fetch(WALLET + url.pathname + url.search, {
      headers: {
        Authorization: request.headers.get('Authorization') || '',
        Accept: 'application/json',
      },
    });

    const entetes = new Headers(cors);
    entetes.set('Content-Type', reponse.headers.get('Content-Type') || 'application/json');
    const retry = reponse.headers.get('Retry-After');
    if (retry) entetes.set('Retry-After', retry);
    return new Response(reponse.body, { status: reponse.status, headers: entetes });
  },
};
