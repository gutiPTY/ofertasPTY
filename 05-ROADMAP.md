# Roadmap — Encuentra Ofertas PTY

## Fase 0 — Fundación (1-2 sesiones con Claude Code)

### 0.a — Cuentas y servicios a crear (antes de tocar código)

Como no tienes ninguna cuenta todavía, este es el checklist a resolver primero. Ninguna requiere pago para arrancar en modo desarrollo/sandbox:

| Servicio | Para qué | Plan gratuito suficiente para MVP |
|---|---|---|
| **GitHub** | Repositorio del monorepo | Sí |
| **Supabase** | Auth + Storage + Postgres gestionado | Sí (proyecto free) |
| **Vercel** | Hosting del sitio web (Next.js) | Sí |
| **Expo (EAS)** | Build y publicación de la app móvil | Sí para desarrollo; el build de producción para tiendas tiene límites free |
| **Google AdSense** | Anuncios en la web | Se solicita, requiere sitio ya publicado con contenido real para aprobarse |
| **Google AdMob** | Anuncios en la app móvil | Sí (requiere cuenta de Google + vincular a la app en Play Console/App Store luego) |
| **Google Play Console** | Publicar la app en Android | Pago único ~US$25 (una sola vez, de por vida) |
| **Apple Developer Program** | Publicar la app en iOS | US$99/año — se puede posponer y lanzar solo Android+Web al inicio |

**Sugerencia de orden:** GitHub → Supabase → Vercel → Expo. AdSense/AdMob se solicitan recién cuando ya haya una web con contenido real (Fase 2 en adelante), porque Google exige eso para aprobar la cuenta. Play Console/Apple Developer se dejan para cuando la app esté lista para publicarse (Fase 4-5), no en la Fase 0.

### 0.b — Setup técnico
- Setup monorepo (Turborepo), configuración de `apps/web`, `apps/mobile`, `apps/api`.
- Conectar PostgreSQL + Prisma (usando la base que provee Supabase), correr primera migración con el schema de `03-MODELO-DE-DATOS.md`.
- Configurar Supabase Auth (registro/login) en web y móvil.
- Deploy inicial "hola mundo" en Vercel (web) y build de desarrollo en Expo (móvil).

**Entregable:** repo funcionando end-to-end con login, sin features de negocio aún, y todas las cuentas de infraestructura ya creadas y conectadas.

## Fase 1 — MVP de moderación (Épicas 1, 2, 3)
- Formulario de publicación de oferta (web + móvil).
- Endpoint de creación de oferta con estado `PENDIENTE`.
- Panel admin básico (solo web) con cola de moderación y aprobar/rechazar.
- "Mis ofertas" para que el usuario vea el estado de lo que publicó.

**Entregable:** un usuario puede publicar y un admin puede aprobar/rechazar. Aún no hay feed público.

## Fase 2 — Feed público (Épica 4)
- Listado de ofertas publicadas con filtros (categoría, provincia, comercio, búsqueda de texto).
- Página de detalle de oferta con SSR (SEO-ready).
- Favoritos.

**Entregable:** producto usable por el público general.

## Fase 3 — Calidad automática (Épica 6)
- Job de expiración automática de ofertas vencidas.
- Sistema de reportes + umbral que reenvía a revisión.

## Fase 4 — Monetización (Épica 7)
- Integración AdSense en web.
- Integración AdMob en móvil.
- Medición básica de impresiones/ingresos si las APIs lo permiten.

**Entregable:** la app empieza a generar ingresos — hito de "sostenibilidad autónoma".

## Fase 5 — Comercios y freemium (Épica 5)
- Perfil de comercio verificado.
- Plan pago: ofertas destacadas con prioridad en el feed.
- Panel simple de gestión para comercios.

## Fase 6 — SEO y crecimiento orgánico (Épica 8)
- Sitemap dinámico.
- Metadatos Open Graph optimizados por oferta.
- Revisión de performance (Core Web Vitals) para no perder ranking.
- Auto-publicación de ofertas aprobadas en Instagram/Facebook (canal de adquisición gratuito, inspirado en el crecimiento orgánico de RantanOfertas).

## Fase 7 — Reputación de usuarios (Épica 10) *(agregada tras análisis competitivo)*
- Lógica de puntos: +N al aprobar una oferta, -N al rechazarla o al ser reportada y confirmada como inválida.
- Insignia de "colaborador confiable" visible en el perfil público.
- Ordenar la cola de moderación priorizando usuarios de bajo puntaje (mayor riesgo de contenido falso).

## Fase 8 — Personalización y alertas (Épica 9) *(agregada tras análisis competitivo)*
- Selección de categorías/provincias favoritas en el perfil.
- Resumen periódico por email con ofertas nuevas relevantes (sin necesidad de infraestructura push todavía).
- Evaluar push notifications geolocalizadas como evolución natural, una vez validado el engagement con el email digest.

---

## Cómo usar este roadmap con Claude Code

Cada fase se puede pasar como una sesión de trabajo independiente:
1. Abrir el repo con Claude Code.
2. Decirle: *"Vamos a implementar la Fase X del roadmap, lee `/docs/06-ROADMAP.md` y `/docs/04-USER-STORIES.md` para la épica correspondiente."*
3. Pedirle que primero te proponga el plan técnico antes de escribir código (esto es el corazón de spec-driven development: spec → plan → código → test).
4. Revisar el plan, ajustar si hace falta, y recién ahí aprobar la implementación.
