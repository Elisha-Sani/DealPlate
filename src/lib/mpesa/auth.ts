import { getMpesaConfig } from './config';

let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * Fetches (and caches, per warm server instance) an OAuth access token for
 * the Daraja API. Tokens are valid for ~1hr; cached for slightly less to
 * avoid using an expired token.
 */
export async function getMpesaAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.value;
  }

  const config = getMpesaConfig();
  const credentials = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');

  const response = await fetch(`${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Failed to obtain M-Pesa access token: ${response.status} ${body}`);
  }

  const data = await response.json();
  const accessToken = data.access_token as string;
  const expiresInSeconds = Number(data.expires_in) || 3600;

  cachedToken = {
    value: accessToken,
    // Refresh a little early to avoid edge-of-expiry failures.
    expiresAt: now + (expiresInSeconds - 60) * 1000,
  };

  return accessToken;
}
