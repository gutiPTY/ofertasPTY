# Arquitectura Técnica — Encuentra Ofertas PTY

## 1. Estructura del monorepo (Turborepo)

```
encuentraofertasPTY/
├── apps/
│   ├── web/            # Next.js 14 (App Router) - sitio público + panel admin
│   ├── mobile/          # React Native + Expo - app iOS/Android
│   └── api/             # Fastify - API REST/RPC compartida
├── packages/
│   ├── database/        # Prisma schema + client
│   ├── shared-types/     # Tipos TS compartidos (Oferta, Usuario, etc.)
│   ├── ui/               # Componentes compartidos (si aplica, vía tamagui/nativewind)
│   └── config/            # ESLint, TS config compartidos
└── turbo.json
```

**Por qué monorepo:** web y móvil consumen la misma API y los mismos tipos, evitando duplicar lógica de negocio (reglas de moderación, validaciones de oferta, etc.).

## 2. Stack por capa

| Capa | Tecnología | Motivo |
|---|---|---|
| Backend API | Node.js + Fastify | Liviano, rápido, buen soporte TS |
| Base de datos | PostgreSQL | Relacional, robusto, soporta geolocalización con PostGIS si se necesita a futuro |
| ORM | Prisma | Migraciones tipadas, buena DX con Claude Code |
| Auth | Supabase Auth | Login email/password + Google/Facebook, roles vía JWT claims |
| Storage de imágenes | Supabase Storage | Integrado con Auth, URLs firmadas, barato |
| Web | Next.js 14 App Router | SSR para SEO (importante: ofertas indexables en Google = tráfico orgánico gratis) |
| Móvil | React Native + Expo | Un solo código para iOS/Android, integración directa con AdMob |
| Ads | Google AdSense (web) / AdMob (móvil) | Monetización desde el día 1 |
| Hosting web/API | Vercel (web) + Railway o Fly.io (API + DB) | Bajo costo inicial, escala simple |
| CI/CD | GitHub Actions | Estándar, gratuito para repos privados pequeños |

## 3. Diagrama de flujo de datos (alto nivel)

```
[App móvil] ─┐
             ├─→ [API Fastify] ─→ [PostgreSQL vía Prisma]
[Web Next.js]┘        │
                       ├─→ [Supabase Auth]  (login/roles)
                       └─→ [Supabase Storage] (fotos de ofertas)
```

## 4. Autenticación y roles

- JWT emitido por Supabase Auth, con `custom claim` `role`: `user | comercio | admin`.
- Middleware en Fastify valida el JWT en cada endpoint protegido y filtra por rol.
- El panel de administración (dentro de `apps/web/admin`) solo es accesible con `role = admin`.

## 5. Servicios en background (jobs)

- **Job diario**: recorrer ofertas `publicada` cuya `fecha_vencimiento` ya pasó → cambiar a `expirada`.
- **Job de reportes**: si una oferta acumula ≥ N reportes → cambiar a `en_revision` y notificar a admins.
- Implementación sugerida: cron job simple en el propio servicio API (node-cron) para el MVP; migrar a un job runner (BullMQ + Redis) si el volumen crece.

## 6. SEO y sostenibilidad orgánica

Cada oferta publicada debe generar una página propia indexable (`/ofertas/[slug]`) en Next.js con SSR, metadatos Open Graph e imagen — esto es clave para tráfico gratuito desde Google, que alimenta el modelo de ads.

## 7. Seguridad y anti-abuso (importante dado tu perfil en fraude/cashier)

- Rate limiting por IP y por usuario en el endpoint de creación de ofertas (evitar spam masivo).
- Validación de imagen (tamaño, formato) y escaneo básico de contenido antes de aceptarla.
- Captcha (hCaptcha/Turnstile) en registro y en publicación de oferta para mitigar bots.
- Logs de auditoría en cada acción de moderación (quién aprobó/rechazó, cuándo, motivo) — trazabilidad tipo "cashier".
- Límite de ofertas pendientes simultáneas por usuario nuevo (anti-flood hasta que gane "confianza").

## 8. Variables de entorno esperadas (referencia para Claude Code)

```
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=
ADMOB_APP_ID=
ADSENSE_CLIENT_ID=
JWT_SECRET=
```
