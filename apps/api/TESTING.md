# Tests de apps/api

Los tests corren SIEMPRE contra una Postgres local (`.env.test`), nunca
contra la base de datos de producción (`.env`). Antes de esto, `DATABASE_URL`
apuntaba directo a Supabase — un timeout a mitad de un `beforeAll`/`afterAll`
podía dejar ofertas de prueba visibles en el feed público real (pasó dos
veces, ver memoria de la sesión 2026-08-31).

## Setup, una sola vez por máquina

Necesita PostgreSQL instalado localmente (`sudo apt-get install -y postgresql`
en Ubuntu/WSL).

```bash
# 1. Crear el rol y la base de datos de test (elegí tu propia password local)
sudo -u postgres psql -c "CREATE ROLE ofertaspty_test LOGIN PASSWORD '<password-local>' CREATEDB;"
sudo -u postgres createdb -O ofertaspty_test ofertaspty_test

# 2. Copiar la plantilla y completar
cp apps/api/.env.test.example apps/api/.env.test
# completar DATABASE_URL con la password que usaste arriba, y las 3
# variables de Supabase (copiarlas tal cual desde apps/api/.env — son
# las reales, no hay stack de Supabase local)

# 3. Aplicar el schema a la base de test
cd packages/database
DATABASE_URL="postgresql://ofertaspty_test:<password-local>@localhost:5432/ofertaspty_test" \
DIRECT_URL="postgresql://ofertaspty_test:<password-local>@localhost:5432/ofertaspty_test" \
  npx prisma migrate deploy

# 4. Seedear las categorías (varios tests asumen que existe al menos una)
DATABASE_URL="postgresql://ofertaspty_test:<password-local>@localhost:5432/ofertaspty_test" \
  npx tsx prisma/seed.ts
```

`apps/api/vitest.config.ts` carga `.env.test` explícitamente (no el `.env`
por defecto), así que `pnpm test` dentro de `apps/api` ya usa la base local
sin nada más que hacer.

## Qué SIGUE dependiendo de la red

Los tests de auth (`test/helpers/test-user.ts`) crean/loguean/borran
usuarios reales contra el proyecto de Supabase real vía Auth Admin API —
no hay forma de evitar esto sin correr el stack completo de Supabase local
(necesita Docker, no disponible en este entorno). Esto ya no afecta el feed
público ni ninguna tabla de negocio (esas viven 100% en la Postgres local),
solo crea/borra filas en `auth.users` del proyecto real. Si un test se corta
antes de `cleanup()`, puede quedar un usuario de prueba huérfano en
Supabase Auth — cosmético, no afecta a usuarios reales ni al feed.

`RESEND_API_KEY` a propósito no está en `.env.test`: sin ella, `lib/email.ts`
loguea en vez de enviar, así que los tests no mandan emails reales.

## Cuando cambia el schema

Después de `pnpm db:migrate:dev` (que corre contra producción), aplicar la
misma migración a la base de test:

```bash
cd packages/database
DATABASE_URL="postgresql://ofertaspty_test:<password-local>@localhost:5432/ofertaspty_test" \
  npx prisma migrate deploy
```
