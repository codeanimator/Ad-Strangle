import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Allowing the local network IP for development
    serverActions: {
      allowedOrigins: ["192.168.137.1", "localhost:3000"]
    }
  }
};

export default nextConfig;
