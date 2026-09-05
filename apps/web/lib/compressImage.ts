// Comprime/redimensiona una imagen en el navegador antes de subirla a
// Storage, para que la página cargue rápido sin depender de que el usuario
// suba un archivo ya optimizado (las fotos de celular suelen pesar varios
// MB y medir miles de px de lado, mucho más de lo que se muestra en
// cualquier lugar del sitio).
const MAX_DIMENSION = 1440;
const QUALITY = 0.8;

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const nombreBase = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${nombreBase}.webp`, { type: "image/webp" });
  } catch {
    // Si algo falla (formato raro, navegador sin soporte), se sube el
    // archivo original tal cual en vez de bloquear la publicación.
    return file;
  }
}
