// api/google-token.js
// Vercel serverless function — proxies Google OAuth token exchange.
// GOOGLE_CLIENT_SECRET is server-only and never exposed to the client.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  // Input validation — reject missing or non-string fields
  const { code, code_verifier, redirect_uri } = req.body ?? {};
  if (
    typeof code !== 'string' || !code ||
    typeof code_verifier !== 'string' || !code_verifier ||
    typeof redirect_uri !== 'string' || !redirect_uri
  ) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Missing required fields' });
  }

  // Length guards — prevents oversized payloads
  if (code.length > 512 || code_verifier.length > 128 || redirect_uri.length > 256) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Field too long' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  console.log('[google-token] client_id present:', !!clientId);
  console.log('[google-token] client_secret present:', !!clientSecret);
  console.log('[google-token] client_secret length:', clientSecret?.length);
  console.log('[google-token] request body keys:', Object.keys(req.body ?? {}));

  if (!clientId || !clientSecret) {
    console.error('[google-token] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET env vars');
    return res.status(500).json({ error: 'server_error', error_description: 'Server misconfiguration' });
  }

  const upstream = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier,
      redirect_uri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  console.log('[google-token] google response status:', upstream.status);
  const responseText = await upstream.text();
  console.log('[google-token] google response body:', responseText);
  const data = JSON.parse(responseText);
  return res.status(upstream.status).json(data);
}
