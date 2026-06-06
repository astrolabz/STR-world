import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Rimosso output: "export" per permettere il funzionamento di API e Database
  // Rimosso basePath di GitHub Pages per deploy su Vercel/Custom Domain
};

export default nextConfig;
