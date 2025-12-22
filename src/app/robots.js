export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/',
    },
    sitemap: 'https://wio-calculator.vercel.app/sitemap.xml', // 请替换为您的实际域名
  }
}
