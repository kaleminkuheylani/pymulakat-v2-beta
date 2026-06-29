export default function robots() {
  return {
    rules: [
      // Tüm botlar
      {
        userAgent: '*',
        allow: ['/', '/register', '/login', '/', '/terms', '/interviews/'],
        disallow: ['/_next/', '/static/', '/api/', '/admin/', '/404', '/500'],
      },
      // Googlebot
      {
        userAgent: 'Googlebot',
        allow: ['/', '/interviews/','/'],
        disallow: ['/_next/', '/static/', '/api/', '/admin/', '/404', '/500'],
      },
     
    ],
    sitemap: 'https://www.pythonmulakat.com/sitemap.xml',
  };
}