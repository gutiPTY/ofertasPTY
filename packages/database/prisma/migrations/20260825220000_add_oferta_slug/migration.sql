-- AlterTable: agrega "slug" como nullable primero (hay filas existentes)
ALTER TABLE "Oferta" ADD COLUMN "slug" TEXT;

-- Backfill: genera un slug para las filas que ya existen
UPDATE "Oferta"
SET "slug" = lower(
  regexp_replace(
    regexp_replace(trim(both '-' from regexp_replace(titulo, '[^a-zA-Z0-9]+', '-', 'g')), '-+', '-', 'g'),
    '^-|-$', '', 'g'
  )
) || '-' || left(id::text, 8)
WHERE "slug" IS NULL;

-- Ahora que todas las filas tienen valor, se puede exigir NOT NULL + UNIQUE
ALTER TABLE "Oferta" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Oferta_slug_key" ON "Oferta"("slug");
