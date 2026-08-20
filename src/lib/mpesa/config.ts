export interface MpesaConfig {
  env: 'sandbox' | 'production';
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackUrl: string;
}

export function getMpesaConfig(): MpesaConfig {
  const env = (process.env.MPESA_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production';
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;

  if (!consumerKey || !consumerSecret || !shortcode || !passkey || !callbackUrl) {
    throw new Error(
      'Missing M-Pesa configuration. Required: MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL.'
    );
  }

  return {
    env,
    baseUrl: env === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke',
    consumerKey,
    consumerSecret,
    shortcode,
    passkey,
    callbackUrl,
  };
}
