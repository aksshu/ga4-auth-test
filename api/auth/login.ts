
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  
  const options = {
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/analytics.readonly'
    ].join(' '),
    state: req.query.state as string || 'default'
  };

  const qs = new URLSearchParams(options);
  return res.redirect(`${rootUrl}?${qs.toString()}`);
}
