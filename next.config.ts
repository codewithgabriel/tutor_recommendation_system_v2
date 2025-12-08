import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // exclude LanceDB native modules from being bundled
      config.externals.push('@lancedb/lancedb');
      config.externals.push('@lancedb/lancedb-linux-x64-gnu');
      config.externals.push(/@lancedb\/lancedb-.*/); // catch other platform variants
    }
    return config;
  },
  experimental: {
    
  },
};

export default nextConfig;
