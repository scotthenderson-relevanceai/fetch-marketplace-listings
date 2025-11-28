import type { VercelRequest, VercelResponse } from '@vercel/node';

const MARKETPLACE_BASE = 'https://prod.marketplace.tryrelevance.com/public/listings';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST (as configured in your Intercom Data Connector)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user } = req.body || {};

    // Optional: personalise query using Intercom user fields
    const email = user?.email as string | undefined;
    const company = user?.company as string | undefined;

    // Build query params for your Marketplace listings
    const url = new URL(MARKETPLACE_BASE);
    url.searchParams.set('entityType', 'agent');
    url.searchParams.set('orderBy', 'clone_count');
    url.searchParams.set('orderDirection', 'desc');
    url.searchParams.set('page', '1');
    url.searchParams.set('pageSize', '3');

    // Example: tweak query by company or email domain if you want
    if (company) {
      // e.g. filter by tag=company or something similar if your API supports it
      // url.searchParams.set('tag', company.toLowerCase());
    } else if (email && email.includes('@')) {
      const domain = email.split('@')[1];
      // url.searchParams.set('tag', domain.split('.')[0]);
    }

    // Call Marketplace Public API
    const resp = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!resp.ok) {
      console.error('Marketplace API error', resp.status, await resp.text());
      return res
        .status(502)
        .json({ error: 'Failed to fetch listings from marketplace' });
    }

    const data = await resp.json();

    const results = (data as any).results || [];
    const [l1, l2, l3] = results;

    const listingUrl = (listing: any | undefined) =>
      listing && listing.display_id
        ? `https://marketplace.tryrelevance.com/listings/${listing.display_id}`
        : '';

    // Flatten into fields Intercom can map easily
    const payload = {
      listing_1_name: l1?.name ?? '',
      listing_1_desc: l1?.description ?? '',
      listing_1_url: listingUrl(l1),
      listing_1_image: l1?.image ?? '',

      listing_2_name: l2?.name ?? '',
      listing_2_desc: l2?.description ?? '',
      listing_2_url: listingUrl(l2),
      listing_2_image: l2?.image ?? '',

      listing_3_name: l3?.name ?? '',
      listing_3_desc: l3?.description ?? '',
      listing_3_url: listingUrl(l3),
      listing_3_image: l3?.image ?? ''
    };

    return res.status(200).json(payload);
  } catch (err: any) {
    console.error('Server error in fetch-listings', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
