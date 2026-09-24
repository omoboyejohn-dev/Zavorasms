export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.FIVESIM_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: '5SIM credentials not configured' });

  try {
    const balanceRes = await fetch('https://5sim.net/v1/user/profile', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!balanceRes.ok) {
      return res.status(500).json({ error: 'Failed to fetch balance' });
    }

    const data = await balanceRes.json();
    return res.status(200).json({
      success: true,
      balance: data.balance || 0,
      email: data.email
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
