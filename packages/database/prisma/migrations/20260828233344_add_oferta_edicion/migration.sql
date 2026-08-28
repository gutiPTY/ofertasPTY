-- CreateTable
CREATE TABLE "OfertaEdicion" (
    "id" TEXT NOT NULL,
    "ofertaId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "cambios" JSONB NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfertaEdicion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OfertaEdicion" ADD CONSTRAINT "OfertaEdicion_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "Oferta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfertaEdicion" ADD CONSTRAINT "OfertaEdicion_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

