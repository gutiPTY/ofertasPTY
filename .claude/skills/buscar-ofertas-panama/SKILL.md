---
name: buscar-ofertas-panama
description: Busca promociones vigentes y públicas de comercios reales en Panamá por categoría, descarga la imagen de cada una, y las inserta como ofertas PENDIENTE en la base de datos de ofertaspty (usuario INTERNET), evitando duplicados. Usar cuando el usuario pida buscar/cargar ofertas automáticamente desde internet.
---

# Buscar y cargar ofertas para ofertaspty

Este skill busca promociones públicas y vigentes de comercios en Panamá, extrae
sus datos, descarga la imagen de la promoción, y las inserta en la base de
datos Supabase que alimenta la página web de ofertaspty. Máximo 30 ofertas
por ejecución, repartidas entre 7 categorías. Evita duplicados.

## 0. Configuración (ajustar aquí si el esquema real cambia)

- **Backend**: Supabase (Postgres + REST/PostgREST + Storage). El skill corre
  server-side con la service role key, sin sesión real de usuario — por eso
  inserta directo contra la base (PostgREST), en vez de pasar por el
  endpoint `POST /ofertas` de la app (que requiere auth de un usuario real).
- **Variables de entorno requeridas**: `SUPABASE_URL` y
  `SUPABASE_SERVICE_ROLE_KEY`. Si no están definidas, detente y pídeselas al
  usuario — nunca hardcodees credenciales en este archivo ni en el código.
- **Tabla principal**: `"Oferta"` — **el nombre real empieza con mayúscula**
  (Prisma no usa `@@map` en este schema, así que el nombre físico de la tabla
  en Postgres coincide exacto con el modelo). Verificado contra el schema real
  (`packages/database/prisma/schema.prisma`) y contra PostgREST en vivo:
  `GET /rest/v1/oferta` (minúscula) → 404: no existe. `GET /rest/v1/Oferta`
  (tal cual) → 200. En las URLs de PostgREST, escribí siempre `Oferta` con
  mayúscula inicial.
  - Columnas reales (camelCase, exactas — confirmadas contra el schema):
    `id, slug, titulo, descripcion, imagenUrl, precioOriginal, precioOferta,
    provincia, distrito, direccion, linkExterno, fechaInicio,
    fechaVencimiento, estado, destacada, publicadaEn, diaSemana, categoriaId,
    comercioId, creadoPorId, creadoEn, actualizadoEn`.
  - Ojo con estas en particular, que son fáciles de escribir mal: es
    `descripcion` (no `description`), `provincia` (no `provincial`),
    `fechaInicio` (con I mayúscula, no `fechainicio`), `categoriaId` (con I
    mayúscula, no `categoriaid`), `comercioId` (no `comercioid`),
    `creadoPorId` (no `creadoPorid`). PostgREST es case-sensitive: un nombre
    mal escrito da "column does not exist", no un typo silencioso.
- **`comercioId`**: se inserta SIEMPRE como `null`. No hay que resolver ni
  crear ningún registro en `Comercio` para este flujo.
- **`creadoPorId`**: constante fija (usuario INTERNET), no se busca ni se
  crea nada en `Usuario`. Usar siempre este id:
  `75e8be96-8a75-4386-80e3-5b7aacd798c7`.
- **`categoriaId`**: mapeo fijo confirmado contra `GET /categorias` en vivo
  (no se consulta en cada corrida, se usa directo):
  | nombre | categoriaId |
  |---|---|
  | Restaurantes | 19504c9f-b839-4e24-84ba-4dca55de2f31 |
  | Supermercados | 3046d5f2-df7c-4ec6-b9e7-8675ad87f654 |
  | Entretenimiento | 3e6042d0-f6e7-4483-800a-5a0abc91ae71 |
  | Ropa y Moda | 56fe6a38-45f5-4f08-8a6a-578c1500443a |
  | Bancos | 99c37da4-4428-468f-beb5-d1eb9e601345 |
  | Farmacias | d215db94-07f0-4859-b427-da4ea44242f2 |
  | Tecnología | d8b97527-5d07-41ae-a3df-b3a0c339af0c |

  Nota: existe una 8va categoría, "Otros" (id
  `4ce10eb5-b22e-41bf-8db1-57b430d24fca`), deliberadamente fuera de esta
  tabla — el alcance original de este skill es 7 categorías. Si el usuario
  pide agregarla, sumarla acá.

  Si el usuario agrega o cambia alguna categoría, actualizar esta tabla (o
  mejor, consultar `GET /categorias` de la API pública al empezar la corrida
  para no depender de ids hardcodeados que puedan quedar desactualizados).
- **Enum `EstadoOferta`**: `PENDIENTE, PUBLICADA, RECHAZADA, EXPIRADA,
  EN_REVISION`. Cuando un usuario normal publica una oferta a través de la
  app, queda en `PENDIENTE` a la espera de revisión — este skill imita esa
  misma convención e inserta con `estado = PENDIENTE` (no `PUBLICADA`), para
  que entren a la misma cola de revisión que usan los administradores. Esto
  no es negociable sin confirmación explícita del usuario: ninguna oferta se
  publica sin que un admin la apruebe (ver CLAUDE.md del proyecto).
- **`diaSemana`**: opcional. Solo se llena cuando la promoción aplica un día
  fijo de la semana (ej. "2x1 los martes"); si no aplica, se deja `null`.
- **Storage de imágenes — bucket `ofertas`**:
  - Bucket público, límite 5MB por archivo, solo acepta `image/jpeg`,
    `image/png` o `image/webp`. Si la imagen descargada no cumple (otro
    formato o pesa más de 5MB), conviértela a jpeg/webp y/o comprime antes
    de subir; si no se puede, inserta la oferta sin imagen y marca el caso
    en el resumen final.
  - Hay una política RLS que exige que el primer segmento del path sea el
    `auth.uid()` del usuario que sube. El skill usa la **service role key**,
    que bypasea esa política, pero por orden y trazabilidad igual sube todo
    dentro de una carpeta con el id del usuario INTERNET:
    `75e8be96-8a75-4386-80e3-5b7aacd798c7/<timestamp>-<slug>.<ext>`.
  - `imagenUrl` final = la `publicUrl` que devuelve Supabase Storage para ese
    path, con forma:
    `https://<project>.supabase.co/storage/v1/object/public/ofertas/<carpeta>/<archivo>`.
    Ojo: `imagenUrl` en la app solo se valida como `z.string().url()` —no hay
    FK real hacia Storage— así que la URL debe quedar bien formada y
    accesible, pero técnicamente nada evita que apunte a otro host; aun así,
    usá siempre el bucket `ofertas` para que quede consistente con el resto
    de la app.
- **Tope total**: 30 ofertas por ejecución del skill (no por categoría).
  Como meta interna, apunta a ~4 ofertas por categoría, pero prioriza
  calidad y vigencia sobre completar el cupo exacto.

## 1. Verificación inicial

Confirma que `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` están disponibles
en el entorno antes de empezar. Las 7 categorías y sus ids ya están fijas en
la sección 0, no hace falta consultarlas (aunque si querés más robustez ante
un cambio futuro de categorías, podés confirmarlas contra `GET
{SUPABASE_URL-de-la-API-pública}/categorias` primero).

## 2. Buscar ofertas por categoría

Para cada una de las 7 categorías (búsqueda web general, sin sitios fijos
predefinidos):

1. Busca promociones/ofertas vigentes y públicas de comercios panameños
   reales en esa categoría (bancos, cines/entretenimiento, farmacias,
   restaurantes, tiendas de ropa, supermercados, tiendas de tecnología).
   Prioriza fuentes oficiales del comercio (su sitio web, su página de
   Facebook/Instagram pública) sobre agregadores de terceros.
2. Descarta cualquier oferta cuya fecha de vencimiento ya haya pasado.
3. Para cada oferta candidata, extrae:
   - `titulo`: nombre corto de la promoción. Incluye el nombre del comercio
     dentro del título o la descripción (ej. "20% en Farmacia Arrocha"),
     porque `comercioId` va null y esta es la única forma de que el nombre
     del comercio quede reflejado en la oferta.
   - `descripcion`: descripción, incluyendo el % de descuento en el texto
     cuando se pueda calcular o esté indicado (el esquema no tiene columna
     propia para el %, así que se documenta en el texto y se usa además
     para validar que `precioOferta` sea coherente con `precioOriginal`).
   - `imagenUrl`: se completa en el paso 4, no la dejes como URL externa
     cruda (nunca uses la URL de la fuente original, siempre sube al bucket
     `ofertas` primero).
   - `precioOriginal` / `precioOferta`: numéricos si el comercio los publica;
     si la oferta es "% de descuento" sin precios base publicados, deja
     ambos en null y dilo en el resumen final en vez de inventar precios.
   - `provincia`, `distrito`, `direccion`: lugar donde se redime la oferta
     (sucursal, tienda física, o "Todo el país" / "Online" si aplica).
   - `linkExterno`: URL de la fuente original de la promoción.
   - `fechaInicio`, `fechaVencimiento`: fechas de vigencia. Si el comercio
     no publica fecha de inicio, usa la fecha de hoy.
   - `diaSemana`: solo si la promo aplica un día fijo de la semana.
4. Si para una categoría no se encuentran ofertas vigentes reales, no
   inventes ninguna — repórtalo como "0 encontradas" en el resumen final.

## 3. Deduplicar (obligatorio antes de insertar)

**Orden de ejecución obligatorio: de a una oferta por vez, no por lotes.**
Para cada candidata encontrada en el paso 2, completá el ciclo entero
(deduplicar → descargar/subir imagen → insertar) antes de pasar a la
siguiente candidata — de la misma categoría o de otra. Si primero buscás
todos los candidatos de una categoría (o de todas) y recién al final
deduplicás/insertás en bloque, dos ofertas iguales encontradas en la *misma*
corrida pueden no detectarse entre sí, porque el chequeo de abajo compara
contra lo que ya está insertado en la base, no contra el resto del lote
todavía pendiente. Procesando de a una, cada inserción queda visible de
inmediato para el chequeo de la siguiente candidata.

Como `comercioId` siempre es null, la deduplicación se hace por
`linkExterno` y por `titulo` dentro de la misma categoría:

```bash
curl -s "$SUPABASE_URL/rest/v1/Oferta?select=id,estado,titulo&or=(linkExterno.eq.$LINK_EXTERNO,and(categoriaId.eq.$CATEGORIA_ID,titulo.ilike.$TITULO_NORMALIZADO))" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

- Si ya existe una fila con el mismo `linkExterno`, es duplicado: sáltala,
  sin importar el estado.
- Si ya existe una fila con el mismo `titulo` (normalizado, sin
  tildes/mayúsculas) dentro de la misma `categoriaId` y `estado` distinto de
  `RECHAZADA`/`EXPIRADA`, también es duplicado: sáltala.
- Lleva un contador de duplicados detectados para el resumen final.

## 4. Descargar y subir la imagen al bucket `ofertas`

**Este es en la práctica el paso más costoso/frágil de todo el flujo.**
Muchos sitios de comercios reales cargan sus imágenes de promos por
JavaScript (galería/lazy-load), así que un `curl` simple al HTML no trae la
URL de la imagen — hace falta un navegador real. Con Playwright (headless
Chromium): navegar a la página, esperar a que cargue (`networkidle` +
scroll si hace falta lazy-load), y sacar la URL real inspeccionando el DOM
ya renderizado (`img.currentSrc`/`img.src` y también `background-image` en
CSS computado, no solo tags `<img>` — varios sitios usan fondos CSS para
las imágenes de promos). Si aun así no aparece una URL de imagen limpia,
alternativa que funciona: capturar un screenshot (`page.screenshot` con
`clip`) de la zona exacta de la promo en la página ya renderizada, y usar
ese recorte como imagen — es una imagen real del comercio, aunque incluya
texto superpuesto del propio sitio.

1. Descarga la imagen de la promoción desde la fuente original.
2. Valida que sea `image/jpeg`, `image/png` o `image/webp` y que pese ≤ 5MB;
   convierte/comprime si hace falta.
3. Súbela con la service role key, dentro de la carpeta del usuario
   INTERNET:
   ```bash
   curl -s -X POST "$SUPABASE_URL/storage/v1/object/ofertas/75e8be96-8a75-4386-80e3-5b7aacd798c7/<timestamp>-<slug>.jpg" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Content-Type: image/jpeg" \
     --data-binary @imagen.jpg
   ```
4. Usa como `imagenUrl` la URL pública resultante:
   `$SUPABASE_URL/storage/v1/object/public/ofertas/75e8be96-8a75-4386-80e3-5b7aacd798c7/<timestamp>-<slug>.jpg`.
5. Si la descarga, conversión o subida falla, inserta la oferta igual pero
   deja `imagenUrl` en null y márcalo en el resumen final para revisión
   manual.

## 5. Insertar la oferta

1. Genera `slug` a partir de `titulo` (minúsculas, sin tildes, espacios por
   guiones), verificando que no choque con un slug existente.
2. **Genera vos mismo el `id` (UUID v4) y mandalo explícito en el insert.**
   Verificado insertando en vivo: `id` es `String @id @default(uuid())` en
   Prisma, pero ese default es del lado del *cliente* de Prisma, no una
   columna Postgres con `DEFAULT gen_random_uuid()` — insertando por
   PostgREST sin `id` falla con `null value in column "id" ... violates
   not-null constraint`. Mismo problema aplicaría a cualquier otra tabla
   insertada así (no solo `Oferta`).
3. Setea `creadoEn` y `actualizadoEn` al timestamp actual (no asumas que la
   base los completa sola).
4. `comercioId = null`, `creadoPorId = "75e8be96-8a75-4386-80e3-5b7aacd798c7"`,
   `estado = PENDIENTE`, `destacada = false`, `publicadaEn = null` (salvo
   que se haya reconfigurado para autopublicar, ver sección 0).
5. Inserta (con `id` incluido):
   ```bash
   curl -s -X POST "$SUPABASE_URL/rest/v1/Oferta" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -H "Prefer: return=representation" \
     -d '{ ... }'
   ```
6. Detente al llegar a 30 ofertas insertadas en total (sumando todas las
   categorías), o antes si ya se recorrieron las 7 categorías sin más
   candidatas válidas.

## 6. Resumen final (obligatorio)

Al terminar, presenta un resumen claro con:

- Total de ofertas insertadas, desglosado por categoría.
- Total de duplicados detectados y saltados.
- Categorías donde no se encontró ninguna oferta vigente.
- Cualquier oferta insertada con datos incompletos (ej. sin imagen, sin
  precios) para que el usuario la revise antes de pasarla a `PUBLICADA`.
