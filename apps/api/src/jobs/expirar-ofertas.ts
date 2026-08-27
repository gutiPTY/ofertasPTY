import { prisma } from "@ofertaspty/database";

// Épica 6: una oferta PUBLICADA cuya fechaVencimiento ya pasó deja de
// mostrarse en el feed público (que solo lista estado = PUBLICADA).
export async function expirarOfertasVencidas(): Promise<number> {
  const { count } = await prisma.oferta.updateMany({
    where: { estado: "PUBLICADA", fechaVencimiento: { lt: new Date() } },
    data: { estado: "EXPIRADA" },
  });
  return count;
}
