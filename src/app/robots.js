import { SITE_URL } from '../lib/constants';

export default function robots() {
  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: '/private/',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: '/private/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
