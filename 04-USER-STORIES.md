# User Stories por Épica — Encuentra Ofertas PTY

Organizado para desarrollo incremental con Claude Code: cada épica es un bloque de trabajo que se le puede pasar como spec independiente.

## Épica 1 — Autenticación y cuentas
- Como visitante, quiero registrarme con email/contraseña o Google para poder publicar ofertas.
- Como usuario, quiero iniciar/cerrar sesión de forma persistente en web y móvil.
- Como admin, quiero que existan roles (usuario/comercio/admin) protegidos a nivel de API.

## Épica 2 — Publicación de ofertas
- Como usuario registrado, quiero subir una oferta con foto, comercio, categoría, precio y vigencia.
- Como usuario, quiero ver el estado de mis ofertas (pendiente/publicada/rechazada) en "Mis ofertas".
- Como usuario, quiero recibir el motivo si mi oferta fue rechazada.

## Épica 3 — Moderación (panel admin)
- Como admin, quiero ver una cola de ofertas pendientes ordenadas por fecha de creación.
- Como admin, quiero aprobar o rechazar una oferta con un motivo opcional.
- Como admin, quiero ver ofertas reportadas que requieren revisión.
- Como admin, quiero suspender usuarios que publican contenido falso repetidamente.

## Épica 4 — Feed público y descubrimiento
- Como visitante, quiero ver un feed de ofertas publicadas ordenado por relevancia/fecha.
- Como visitante, quiero filtrar por categoría, provincia y comercio.
- Como visitante, quiero buscar ofertas por texto.
- Como usuario, quiero guardar ofertas como favoritas.

## Épica 5 — Comercios y plan freemium
- Como comercio, quiero crear un perfil verificado.
- Como comercio con plan pago, quiero que mis ofertas aparezcan destacadas sin pasar por moderación comunitaria estándar (aunque sí con revisión ligera anti-fraude).
- Como admin, quiero gestionar qué comercios están verificados.

## Épica 6 — Reportes y calidad
- Como usuario, quiero reportar una oferta vencida o falsa.
- Como sistema, quiero mover automáticamente una oferta a "en revisión" tras N reportes.
- Como sistema, quiero expirar automáticamente ofertas cuya fecha de vigencia pasó.

## Épica 7 — Monetización
- Como negocio, quiero insertar anuncios de AdSense en el feed web sin degradar demasiado la UX.
- Como negocio, quiero insertar anuncios de AdMob (banner/intersticial) en la app móvil.
- Como admin, quiero ver métricas básicas de impresiones/ingresos si es posible integrarlas.

## Épica 8 — SEO y crecimiento orgánico
- Como negocio, quiero que cada oferta tenga una URL pública indexable con metadatos Open Graph.
- Como negocio, quiero un sitemap dinámico que incluya todas las ofertas publicadas.
- Como negocio, quiero que las ofertas recién aprobadas se publiquen automáticamente en Instagram/Facebook, para aprovechar ese canal como fuente de tráfico gratuito (inspirado en el crecimiento de RantanOfertas, que alcanzó 300K+ seguidores solo con redes).

## Épica 9 — Personalización y notificaciones *(agregada tras análisis competitivo)*
- Como usuario, quiero elegir mis categorías y provincias favoritas al registrarme o desde mi perfil.
- Como usuario, quiero recibir una notificación o resumen (email o push, según fase) cuando se publique una oferta nueva que coincida con mis preferencias.
- Como admin, quiero que este sistema no dependa de infraestructura cara al inicio (ej. digest por email es suficiente para el MVP; push geolocalizado queda para v2, como ya estaba definido en el PRD).

## Épica 10 — Reputación de usuarios *(agregada tras análisis competitivo)*
- Como sistema, quiero asignar puntos a un usuario cada vez que una oferta suya es aprobada, y restar puntos (o marcar advertencia) cuando es rechazada o reportada exitosamente.
- Como usuario, quiero ver mi nivel/insignia de "colaborador confiable" en mi perfil según mi historial.
- Como admin, quiero poder priorizar en la cola de moderación a usuarios con bajo puntaje (mayor riesgo) y, a futuro, dar aprobación semi-automática a usuarios con historial muy confiable (fuera de alcance del MVP, pero el modelo de datos debe soportarlo desde ahora).

---

## Orden recomendado de implementación (fases)

1. **Fase 0:** setup del monorepo, base de datos, Auth.
2. **Fase 1 (MVP moderación):** Épicas 1, 2, 3 — sin esto no hay producto.
3. **Fase 2:** Épica 4 (feed público) — ya hay algo que mostrar.
4. **Fase 3:** Épica 6 (reportes/expiración automática) — mantiene la calidad viva.
5. **Fase 4:** Épica 7 (monetización) — empieza a generar ingresos.
6. **Fase 5:** Épica 5 (comercios/freemium) — capa de ingresos B2B.
7. **Fase 6:** Épica 8 (SEO + distribución en redes) — crecimiento orgánico continuo.
8. **Fase 7:** Épica 10 (reputación de usuarios) — reduce carga de moderación a mediano plazo.
9. **Fase 8:** Épica 9 (personalización/alertas) — retención de usuarios activos.
