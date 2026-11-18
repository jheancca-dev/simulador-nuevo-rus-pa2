import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Origen del panel de vista previa autorizado para consumir los recursos
  // del dev server (elimina el aviso cross-origin de Next 16 durante el
  // desarrollo; no tiene efecto en producción).
  allowedDevOrigins: ["*.space-z.ai"],
};

export default nextConfig;
