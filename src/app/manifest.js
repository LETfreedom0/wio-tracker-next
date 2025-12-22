export default function manifest() {
  return {
    name: 'WIO Calculator',
    short_name: 'WIO Tracker',
    description: 'Track your office attendance and manage your hybrid work schedule.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
