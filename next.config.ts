import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*', // Jika frontend memanggil rute yang berawalan /api/...
        destination: 'http://163.61.58.96:5000/api/:path*', // ...Vercel yang akan meneruskannya ke VPS ini
      },
    ]
  },
};

export default nextConfig;
