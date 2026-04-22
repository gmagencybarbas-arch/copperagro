import type { NextConfig } from "next";

const isWindows = process.platform === "win32";

const nextConfig: NextConfig = {
  // Em Windows, o file watcher (Watchpack) por vezes não deteta alterações; o
  // HMR deixa o CSS/JS "desatualizado" e parece que o estilo não carregou.
  webpack: (config, { dev }) => {
    if (dev && isWindows) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
