/** @type {import('next').NextConfig} */

//default-src 'self';
//script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.recaptcha.net ${process.env.NEXT_PUBLIC_MAIN_URL};
//style-src 'self' 'unsafe-inline' ${process.env.NEXT_PUBLIC_MAIN_URL};
//font-src 'self' ${process.env.NEXT_PUBLIC_MAIN_URL};

export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'bn', 'fr'],
  localeDetection: true,
};

const nextConfig = {
  i18n,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              connect-src 'self' https://www.google.com https://www.recaptcha.net ${process.env.NEXT_PUBLIC_API_BASE_URL};
              frame-src 'self' https://www.google.com https://www.recaptcha.net https://another-allowed-source.com/ https://yet-another-source.com/;
              base-uri 'self';
              form-action 'self';
            `.replace(/\s{2,}/g, ' ').trim() // CSP directives
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY' // Prevents clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff' // Prevents MIME type sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin' // Controls the amount of referrer information sent
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload' // Enforces HTTPS
          },
        ],
      },
    ];
  },
};

export default nextConfig;
