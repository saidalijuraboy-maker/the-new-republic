export async function rpc(name, args = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('NO_CONFIG');
  const r = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args),
    cache: 'no-store'
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'RPC_ERROR');
  return d;
}

export const TYPE_EMOJI = {
  house: '🏠',
  villa: '🏡',
  shop: '🏪',
  cafe: '☕',
  bank: '🏦',
  tower: '🏢',
  farm: '🌾',
  park: '🌳'
};
