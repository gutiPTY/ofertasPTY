/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ofertaspty/shared-types", "@ofertaspty/ui"],
  images: {
    remotePatterns: [
      // Imágenes de ofertas suben a Supabase Storage (bucket público "ofertas").
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/**" },
    ],
    // Next 16 exige declarar los valores de quality permitidos (default
    // solo [75] — un quality={60} en un componente se ignoraba en
    // silencio sin esto). 60 para miniaturas de grilla (OfertaCard,
    // Favoritos, Mis Ofertas); 75 se mantiene para el resto.
    qualities: [60, 75],
  },
};

export default nextConfig;
