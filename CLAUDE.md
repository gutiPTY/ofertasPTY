# CLAUDE.md — Instrucciones de proyecto para Claude Code

> Este archivo va en la raíz del repo. Claude Code lo lee automáticamente al iniciar sesión en el proyecto.

## Contexto del proyecto

Encuentra Ofertas PTY es una plataforma web + móvil donde usuarios registrados publican ofertas de comercios en Panamá, las cuales pasan por moderación de un administrador antes de publicarse. Monorepo con Turborepo. Ver `/docs` para PRD, arquitectura, modelo de datos y user stories.

## Cómo trabajar en este repo (Spec-Driven Development)

1. Antes de escribir código para una épica nueva, lee el spec correspondiente en `/docs/04-USER-STORIES.md`.
2. Si el spec no cubre un caso borde, pregúntame antes de asumir — no inventes reglas de negocio de moderación o de datos.
3. Cada feature se implementa en una rama `feature/<epica>-<descripcion-corta>`.
4. Todo endpoint nuevo en `apps/api` debe tener: validación de input (zod), test unitario básico, y verificación de rol si aplica.
5. Todo cambio en `packages/database/schema.prisma` debe ir acompañado de una migración (`prisma migrate dev --name <nombre>`).

## Convenciones de código

- TypeScript estricto en todo el monorepo (`strict: true`).
- Nombres de tablas/campos en `schema.prisma` en español (coherente con el dominio del producto), nombres de variables/funciones en el código en inglés.
- Componentes React: PascalCase. Hooks: `useAlgo`.
- Commits en formato Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
- No dejar `console.log` en código de producción; usar el logger configurado.

## Reglas de negocio críticas (no romper)

- Una oferta **nunca** se muestra en el feed público sin `estado = PUBLICADA`.
- Solo un usuario con `rol = ADMIN` puede cambiar el estado de una oferta a `PUBLICADA` o `RECHAZADA`.
- Las ofertas de comercios con `planPago = true` siguen pasando por una revisión ligera anti-fraude, aunque tengan prioridad — **nunca** se saltan la moderación por completo.
- Toda decisión de moderación debe registrarse en la tabla `Moderacion` (auditoría obligatoria).
- Un usuario no puede reportar la misma oferta dos veces (constraint único en DB).

## Testing

- Backend: Vitest + supertest para endpoints críticos (creación de oferta, moderación, auth).
- Priorizar tests en: flujo de moderación, expiración automática, límites de reportes.

## Qué NO hacer sin confirmar conmigo

- No cambiar el modelo de roles o el flujo de moderación sin avisar (es el corazón del control de calidad del producto).
- No integrar SDKs de pago/ads reales sin credenciales de sandbox provistas por mí.
- No eliminar el paso de aprobación manual del admin, ni para comercios pagos.
