# PRD — Encuentra Ofertas PTY
**Producto:** Plataforma web + móvil de ofertas colaborativas para Panamá
**Versión:** 0.1 (borrador base para desarrollo con Claude Code / Spec-Driven Development)
**Fecha:** Agosto 2026

---

## 1. Visión del producto

Una plataforma donde cualquier usuario registrado puede publicar ofertas, promociones y descuentos que encuentra en comercios de todo Panamá (supermercados, bancos, retail, restaurantes, farmacias, etc.). Cada oferta pasa por un proceso de validación por un administrador antes de publicarse, garantizando que la información sea real y esté vigente. La app debe ser económicamente sostenible por sí misma mediante publicidad y planes freemium para comercios.

## 2. Problema que resuelve

Los usuarios en Panamá no tienen un lugar centralizado y confiable para descubrir ofertas reales y vigentes de múltiples rubros. La información está dispersa en redes sociales, WhatsApp, folletos, etc., sin curaduría ni verificación.

## 3. Objetivos del MVP

1. Permitir que usuarios se registren y publiquen ofertas con foto, descripción, comercio, categoría, ubicación y vigencia.
2. Cola de moderación donde un administrador aprueba o rechaza cada oferta antes de publicarla.
3. Feed público de ofertas aprobadas, filtrable por categoría, provincia y comercio.
4. Sistema de reportes ("esta oferta ya no es válida") para mantener la calidad del contenido con el tiempo.
5. Monetización desde el día 1 vía anuncios (AdSense en web, AdMob en móvil).
6. Plan freemium para comercios que quieran publicar ofertas propias destacadas (sin pasar por moderación comunitaria, con prioridad en el feed).

## 4. Fuera de alcance del MVP (v2+)

- Cupones/códigos canjeables con integración de pago.
- Notificaciones push geolocalizadas por cercanía al comercio.
- App de comercios para autogestión de campañas.
- Pagos dentro de la app (Yappy u otros) — el producto no vende vouchers, ver sección 10.

> Nota: el sistema de reputación de usuarios, que originalmente estaba fuera de alcance, se movió a v1.x (ver sección 10 y roadmap) tras el análisis competitivo, por su bajo costo de implementación y su impacto directo en reducir la carga de moderación.

## 5. Roles de usuario

| Rol | Capacidades |
|---|---|
| **Visitante** | Ver ofertas públicas aprobadas, buscar y filtrar. |
| **Usuario registrado** | Todo lo anterior + publicar ofertas, reportar ofertas vencidas/falsas, guardar favoritos. |
| **Comercio (cuenta verificada)** | Publicar ofertas propias con prioridad, ver métricas básicas de sus ofertas. |
| **Administrador/Moderador** | Aprobar/rechazar ofertas, suspender usuarios, gestionar categorías y comercios. |

## 6. Categorías iniciales de ofertas

Supermercados, Bancos y financieras, Farmacias, Restaurantes, Retail/moda, Tecnología, Combustibles, Entretenimiento, Servicios (telefonía, streaming), Otros.

## 7. Flujo principal: publicar una oferta

1. Usuario inicia sesión.
2. Toca "Nueva oferta" → sube foto (obligatoria, prueba visual), título, comercio, categoría, provincia/distrito, descripción, precio original/precio oferta (opcional), fecha de inicio y de vencimiento, link o dirección del comercio (opcional).
3. La oferta entra con estado `pendiente`.
4. Administrador revisa desde el panel: aprueba, rechaza (con motivo) o pide corrección.
5. Si se aprueba, pasa a estado `publicada` y aparece en el feed.
6. Si vence la fecha de vigencia declarada, el sistema la pasa automáticamente a `expirada`.
7. Cualquier usuario puede reportar una oferta publicada; a partir de N reportes se reenvía a revisión.

## 8. Métricas de éxito del MVP

- Nº de ofertas publicadas por semana.
- Tiempo promedio de moderación (objetivo: < 24h).
- % de ofertas rechazadas (indicador de calidad de la comunidad).
- Usuarios activos semanales.
- Ingreso por publicidad + nº de comercios en plan pago.

## 9. Restricciones y consideraciones

- Contenido: prohibir ofertas de rubros regulados sensibles (armas, apuestas, alcohol/tabaco dirigido a menores) desde las políticas de uso.
- Cumplimiento con políticas de AdSense/AdMob (contenido debe ser apto para anunciantes).
- Escalabilidad geográfica: el modelo de datos debe soportar todas las provincias de Panamá desde el inicio, aunque el lanzamiento inicial se enfoque en la zona metropolitana.

## 10. Análisis competitivo y diferenciación

**Competidor mencionado (ptyofertas.com / @ptyofertas507):** no fue posible acceder directamente al sitio (bloquea acceso automatizado), y la evidencia disponible indica que es una cuenta/página de redes sociales ligera, no una plataforma con cuentas, moderación y app propia. No representa un competidor estructuralmente comparable.

**Competidores reales identificados en el mercado panameño de ofertas:**

| Competidor | Modelo | Características clave |
|---|---|---|
| **Oferta24** | Marketplace de vouchers pagados | +280K usuarios, búsqueda por ubicación, alertas personalizadas por gustos, pago con Yappy/tarjeta/créditos internos, sistema de puntos por compra y por referir amigos, acceso anticipado a ofertas |
| **RantanOfertas** | Marketplace de vouchers (tipo Shopify) | 300K+ seguidores en Instagram como canal principal de distribución, checkout con QR, formulario simple para que comercios soliciten publicar |
| **OfertaSimple** | Marketplace de vouchers pagados | Recomendaciones basadas en historial de compra, catálogo por experiencias/categorías |
| **quierOfertas** | Catálogo de descuentos | Enfocado en canje directo en comercio, sin voucher digital |

**Diferenciación clave de Encuentra Ofertas PTY:** todos los competidores anteriores son marketplaces que **venden** vouchers/cupones (el usuario paga por adelantado y canjea con QR). Nuestro producto es **gratuito y colaborativo**: cualquier usuario publica lo que ve, sin fricción de pago, y el valor está en la curaduría comunitaria + moderación, no en la venta de cupones. Esto también nos permite lanzar sin integrar pasarelas de pago, reduciendo el alcance técnico del MVP.

**Mejoras incorporadas al producto a partir de este análisis** (ya reflejadas en el resto de los documentos):

1. **Alertas personalizadas por categoría y provincia favorita** — inspirado en Oferta24. Se agrega como Épica 9 en `04-USER-STORIES.md`.
2. **Sistema de reputación/puntos para usuarios que publican** — inspirado en el modelo de puntos de Oferta24, adaptado a un contexto gratuito: en vez de premiar compras, premia publicaciones aprobadas y penaliza publicaciones rechazadas/reportadas. Reduce carga de moderación con el tiempo al dar más confianza a usuarios con buen historial. Se agrega como Épica 10.
3. **Distribución vía redes sociales (Instagram/Facebook) de ofertas aprobadas** — inspirado en el crecimiento orgánico de RantanOfertas (300K seguidores usando solo redes). Se agrega como parte de la Épica 8 (SEO y crecimiento) en el roadmap.
4. **Badge visible de "oferta verificada"** en el feed — refuerza la propuesta de valor central frente a competidores que también dicen verificar pero no muestran el proceso al usuario.
