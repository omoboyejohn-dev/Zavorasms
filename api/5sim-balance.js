// ============================================
// GET /api/5sim-balance
// Fetches your 5SIM account balance
// ============================================

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_KEY = process.env.FIVESIM_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: '5SIM credentials not configured' });
  }

  try {
    const profileRes = await fetch('https://5sim.net/v1/user/profile', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!profileRes.ok) {
      const errText = await profileRes.text();
      return res.status(500).json({
        error: 'Failed to fetch 5SIM profile',
        status: profileRes.status,
        details: errText.substring(0, 300)
      });
    }

    const data = await profileRes.json();

    return res.status(200).json({
      success: true,
      balance: data.balance || 0,
      email: data.email,
      id: data.id
    });

  } catch (error) {
    console.error('5sim-balance error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
