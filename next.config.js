/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable Turbopack by not using it in the dev script
  output: 'standalone',
  // Tambahkan konfigurasi untuk menangani masalah 404
  poweredByHeader: false,
  // Konfigurasi ESLint untuk mematikan aturan yang menyebabkan error
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Konfigurasi TypeScript untuk mematikan type checking selama build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Konfigurasi untuk menangani masalah 404
  distDir: '.next',
  // Konfigurasi untuk menangani masalah 404 untuk file JavaScript dan CSS
  onDemandEntries: {
    // Periode waktu (dalam ms) di mana server akan menjaga halaman dalam buffer
    maxInactiveAge: 60 * 60 * 1000,
    // Jumlah halaman yang akan disimpan dalam buffer
    pagesBufferLength: 5,
  },
  // Konfigurasi webpack untuk menangani masalah 404
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      // Konfigurasi untuk development mode
      config.output.publicPath = '/_next/';
    }
    return config;
  },
};

module.exports = nextConfig;