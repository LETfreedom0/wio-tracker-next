import { SITE_URL } from '../lib/constants';

export default function sitemap() {
  const baseUrl = SITE_URL;
  // Google 建议仅在内容实际发生变化时更新 lastModified
  // 使用固定的日期而不是 new Date()，以避免 Google 忽略频繁变动但内容未变的 lastmod
  const lastModified = new Date('2025-12-25');

  return [
    {
      url: baseUrl,
      lastModified: lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/settings`,
      lastModified: lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}
