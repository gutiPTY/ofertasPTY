# Modelo de Datos — Encuentra Ofertas PTY

Este esquema está pensado en formato Prisma para que Claude Code lo use directamente como `schema.prisma`.

```prisma
enum Rol {
  USUARIO
  COMERCIO
  ADMIN
}

enum EstadoOferta {
  PENDIENTE
  PUBLICADA
  RECHAZADA
  EXPIRADA
  EN_REVISION
}

enum EstadoComercio {
  PENDIENTE
  VERIFICADO
  RECHAZADO
}

model Usuario {
  id              String     @id @default(uuid())
  email           String     @unique
  nombre          String
  rol             Rol        @default(USUARIO)
  supabaseAuthId  String     @unique
  suspendido      Boolean    @default(false)
  reputacion      Int        @default(0)   // Épica 10: +N por oferta aprobada, -N por rechazada/reportada
  creadoEn        DateTime   @default(now())

  ofertas         Oferta[]   @relation("OfertasCreadas")
  reportes        Reporte[]
  favoritos       Favorito[]
  moderaciones    Moderacion[] @relation("Moderador")
  preferencias    PreferenciaUsuario[]  // Épica 9: categorías/provincias favoritas para alertas
  comercio        Comercio?
}

// Épica 9 — Personalización y notificaciones
model PreferenciaUsuario {
  id          String    @id @default(uuid())
  usuario     Usuario   @relation(fields: [usuarioId], references: [id])
  usuarioId   String
  categoria   Categoria? @relation(fields: [categoriaId], references: [id])
  categoriaId String?
  provincia   String?
  creadoEn    DateTime  @default(now())

  @@unique([usuarioId, categoriaId, provincia])
}

// Épica 5 — Comercios y plan freemium. Alta por autoservicio (usuario
// envía sus datos fiscales), queda PENDIENTE hasta que un admin lo
// verifica; ahí el usuario pasa a rol=COMERCIO. planPago se activa a
// mano por el admin (no hay pagos reales integrados en el MVP).
model Comercio {
  id                   String   @id @default(uuid())
  nombre               String
  categoria            Categoria @relation(fields: [categoriaId], references: [id])
  categoriaId          String
  usuario              Usuario  @relation(fields: [usuarioId], references: [id])
  usuarioId            String   @unique
  direccion            String
  ruc                  String
  direccionFiscal      String
  representanteLegal   String
  avisoOperacionesPath String   // ruta privada en bucket "comercio-docs", no URL pública
  estado               EstadoComercio @default(PENDIENTE)
  motivoRechazo        String?
  planPago             Boolean  @default(false)
  terminosAceptadosEn  DateTime
  ofertas              Oferta[]
  creadoEn             DateTime @default(now())
  actualizadoEn        DateTime @updatedAt
}

model Categoria {
  id            String     @id @default(uuid())
  nombre        String     @unique   // Supermercados, Bancos, Farmacias, etc.
  comercios     Comercio[]
  ofertas       Oferta[]
  preferencias  PreferenciaUsuario[]
}

model Oferta {
  id                String        @id @default(uuid())
  titulo            String
  descripcion       String
  imagenUrl         String
  precioOriginal    Decimal?
  precioOferta      Decimal?
  provincia         String
  distrito          String?
  direccion         String?
  linkExterno       String?
  fechaInicio       DateTime
  fechaVencimiento  DateTime
  estado            EstadoOferta  @default(PENDIENTE)
  destacada         Boolean       @default(false)  // true si viene de comercio con plan pago

  categoria         Categoria     @relation(fields: [categoriaId], references: [id])
  categoriaId       String
  comercio          Comercio?     @relation(fields: [comercioId], references: [id])
  comercioId        String?
  creadoPor         Usuario       @relation("OfertasCreadas", fields: [creadoPorId], references: [id])
  creadoPorId       String

  reportes          Reporte[]
  favoritos         Favorito[]
  moderaciones      Moderacion[]

  creadoEn          DateTime      @default(now())
  actualizadoEn     DateTime      @updatedAt

  @@index([estado])
  @@index([provincia])
  @@index([categoriaId])
}

model Moderacion {
  id           String    @id @default(uuid())
  oferta       Oferta    @relation(fields: [ofertaId], references: [id])
  ofertaId     String
  moderador    Usuario   @relation("Moderador", fields: [moderadorId], references: [id])
  moderadorId  String
  decision     EstadoOferta   // PUBLICADA o RECHAZADA
  motivo       String?
  fecha        DateTime  @default(now())
}

model Reporte {
  id        String   @id @default(uuid())
  oferta    Oferta   @relation(fields: [ofertaId], references: [id])
  ofertaId  String
  usuario   Usuario  @relation(fields: [usuarioId], references: [id])
  usuarioId String
  motivo    String
  creadoEn  DateTime @default(now())

  @@unique([ofertaId, usuarioId]) // un usuario solo puede reportar una vez la misma oferta
}

model Favorito {
  id        String   @id @default(uuid())
  usuario   Usuario  @relation(fields: [usuarioId], references: [id])
  usuarioId String
  oferta    Oferta   @relation(fields: [ofertaId], references: [id])
  ofertaId  String
  creadoEn  DateTime @default(now())

  @@unique([usuarioId, ofertaId])
}
```

## Notas de diseño (actualizado tras análisis competitivo)

- **`reputacion` en Usuario:** valor simple tipo contador para el MVP (no karma complejo). Suficiente para ordenar la cola de moderación por riesgo y para mostrar una insignia de "colaborador confiable" en el perfil.
- **`PreferenciaUsuario`:** un usuario puede tener múltiples filas (una por categoría o provincia que le interesa). Se usa para armar el resumen/alerta periódica de la Épica 9. No requiere infraestructura de push desde el inicio — un job diario que arma un email de resumen es suficiente para el MVP.


- **`provincia` como string libre vs. tabla catálogo:** para el MVP se recomienda un enum o tabla `Provincia` con las 10 provincias + comarcas de Panamá, para evitar inconsistencias en filtros.
- **`destacada`:** permite diferenciar en el feed las ofertas de comercios con plan pago (aparecen primero) de las orgánicas subidas por usuarios.
- **Auditoría:** la tabla `Moderacion` guarda historial completo de decisiones — útil dado tu experiencia en control de operaciones/cashier, permite detectar patrones de abuso o admins con criterio inconsistente.
- **Umbral de reportes:** se recomienda una constante de configuración (ej. `REPORTES_PARA_REVISION = 5`) en vez de un valor fijo en código.
