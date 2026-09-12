-- CreateTable
CREATE TABLE "Valoracion" (
    "id" TEXT NOT NULL,
    "ofertaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "esBuena" BOOLEAN NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Valoracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Valoracion_ofertaId_usuarioId_key" ON "Valoracion"("ofertaId", "usuarioId");

-- AddForeignKey
ALTER TABLE "Valoracion" ADD CONSTRAINT "Valoracion_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "Oferta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Valoracion" ADD CONSTRAINT "Valoracion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
