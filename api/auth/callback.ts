import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Allow only GET (Google OAuth redirect uses GET)
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const code = req.query.code as string;

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    const tokenUrl = 'https://oauth2.googleapis.com/token';

    const params = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return res.status(500).json({
        error: 'Token exchange failed',
        details: tokenData,
      });
    }

    return res.status(200).json(tokenData);

  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
