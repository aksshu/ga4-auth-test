
export default async function handler(req: any, res: any) {
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: 'No code provided' });
  
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
        grant_type: 'authorization_code',
      }),
    });
    
    const tokens: any = await tokenResponse.json();
    if (tokens.error) return res.status(400).json({ error: tokens.error });
    
    let userEmail = '';
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` }
      });
      const userInfo: any = await userInfoResponse.json();
      userEmail = userInfo.email;
    } catch (e) {}
    
    return res.status(200).json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user_email: userEmail
    });
  } catch (error) {
    return res.status(500).json({ error: 'Auth failed' });
  }
}
