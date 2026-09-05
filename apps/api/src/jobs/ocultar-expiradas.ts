import { prisma } from "@ofertaspty/database";

const UN_DIA_MS = 24 * 60 * 60 * 1000;

// La oferta nunca se borra de la base (preserva Moderacion/Reporte/
// OfertaEdicion para auditoría, ver CLAUDE.md) — se oculta automáticamente
// cuando lleva 1+ día EXPIRADA, para que deje de aparecer en las colas
// normales del admin. Sigue siendo visible desde "Todas las ofertas".
export async function ocultarOfertasExpiradasViejas(): Promise<number> {
  const { count } = await prisma.oferta.updateMany({
    where: {
      estado: "EXPIRADA",
      oculta: false,
      fechaVencimiento: { lt: new Date(Date.now() - UN_DIA_MS) },
    },
    data: { oculta: true, ocultaEn: new Date() },
  });
  return count;
}
