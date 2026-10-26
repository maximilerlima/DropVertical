// Use SITE_URL and SITE_ENV=production only after confirming the final domain.
// GitHub Pages project URL derived from the confirmed repository owner/name.
export const site = {
  siteUrl: process.env.SITE_URL || process.env.PAGES_URL || 'https://dropverticalrj.com.br/',
  environment: process.env.SITE_ENV || 'preview',
  name: 'Drop Vertical — Escola de Surf',
  whatsapp: '5521996271203', // Retained from the approved site. Owner must reconfirm before launch.
  instagram: 'https://www.instagram.com/dropvertical/',
  // Empty until explicitly confirmed. Do not infer a pin from weather coordinates.
  confirmedAddress: null,
  confirmedOpeningHours: null,
  mapsUrl: null,
  ga4Id: process.env.GA4_ID || '',
  googleVerification: process.env.GOOGLE_SITE_VERIFICATION || '',
  bingVerification: process.env.BING_SITE_VERIFICATION || '',
};
