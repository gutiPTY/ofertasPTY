/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ofertaspty/shared-types", "@ofertaspty/ui"],
  images: {
    remotePatterns: [
      // Imágenes de ofertas suben a Supabase Storage (bucket público "ofertas").
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/**" },
    ],
  },
};

export default nextConfig;
