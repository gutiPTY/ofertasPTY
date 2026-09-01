-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- AlterTable
ALTER TABLE "Favorito" ADD COLUMN     "notifDiaria" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifElDia" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifInterna" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifUltimoDia" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifUnDiaAntes" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Oferta" ADD COLUMN     "diaSemana" "DiaSemana";

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "ofertaSlug" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notificacion_usuarioId_leida_idx" ON "Notificacion"("usuarioId", "leida");

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
