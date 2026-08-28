-- CreateEnum
CREATE TYPE "EstadoComercio" AS ENUM ('PENDIENTE', 'VERIFICADO', 'RECHAZADO');

-- AlterTable
ALTER TABLE "Comercio" DROP COLUMN "verificado",
ADD COLUMN     "actualizadoEn" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "avisoOperacionesPath" TEXT NOT NULL,
ADD COLUMN     "direccion" TEXT NOT NULL,
ADD COLUMN     "direccionFiscal" TEXT NOT NULL,
ADD COLUMN     "estado" "EstadoComercio" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "motivoRechazo" TEXT,
ADD COLUMN     "representanteLegal" TEXT NOT NULL,
ADD COLUMN     "ruc" TEXT NOT NULL,
ADD COLUMN     "terminosAceptadosEn" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usuarioId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Comercio_usuarioId_key" ON "Comercio"("usuarioId");

-- AddForeignKey
ALTER TABLE "Comercio" ADD CONSTRAINT "Comercio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

