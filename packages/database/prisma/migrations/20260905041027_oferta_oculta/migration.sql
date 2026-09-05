-- AlterTable
ALTER TABLE "Oferta" ADD COLUMN     "oculta" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ocultaEn" TIMESTAMP(3),
ADD COLUMN     "ocultaPorId" TEXT;

-- AddForeignKey
ALTER TABLE "Oferta" ADD CONSTRAINT "Oferta_ocultaPorId_fkey" FOREIGN KEY ("ocultaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
