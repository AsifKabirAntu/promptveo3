/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable and enabled by default
  
  // Exclude fluxframe directory from compilation
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/fluxframe/**', '**/node_modules/**'],
    };
    return config;
  },
};

export default nextConfig;
