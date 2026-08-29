/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ofertaspty/shared-types", "@ofertaspty/ui"],
  images: {
    remotePatterns: [
      // Imágenes de ofertas suben a Supabase Storage (bucket público "ofertas").
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/**" },
      // Solo por las 5 ofertas [PRUEBA] de Fase 4 sembradas con imágenes de
      // relleno — sacar cuando esas ofertas se limpien de la base.
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
