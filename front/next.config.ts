import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Handle Node.js modules that can't run in the browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
      'pino-pretty': false,
    };

    // Ignore specific modules that cause issues
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });

    return config;
  },
  // Enable experimental features for better compatibility
  experimental: {
    esmExternals: true,
  },
};

export default nextConfig;
