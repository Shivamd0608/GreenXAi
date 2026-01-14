/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental: {
  //   appDir: true,
  // },
    webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, "async_hooks": false };
    return config;
  }
}

module.exports = nextConfig