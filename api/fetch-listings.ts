import type { VercelRequest, VercelResponse } from '@vercel/node';

const MARKETPLACE_BASE =
  'https://prod.marketplace.tryrelevance.com/public/listings';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user } = req.body || {};

    // Build API query
    const url = new URL(MARKETPLACE_BASE);
    url.searchParams.set('entityType', 'agent');
    url.searchParams.set('orderBy', 'clone_count');
    url.searchParams.set('orderDirection', 'desc');
    url.searchParams.set('page', '1');
    url.searchParams.set('pageSize', '3');

    const resp = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    if (!resp.ok) {
      return res.status(502).json({ error: 'Marketplace API failed' });
    }

    const data = await resp.json();
    const [l1, l2, l3] = data.results || [];

    const listingUrl = (l: any) =>
      l?.display_id
        ? `https://marketplace.tryrelevance.com/listings/${l.display_id}`
        : '';

    return res.json({
      listing_1_name: l1?.name ?? '',
      listing_1_desc: l1?.description ?? '',
      listing_1_url: listingUrl(l1),
      listing_1_image: l1?.image ?? '',

      listing_2_name: l2?.name ?? '',
      listing_2_desc: l2?.description

