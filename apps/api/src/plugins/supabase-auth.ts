import fp from "fastify-plugin";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { Rol, type Rol as RolType } from "@ofertaspty/shared-types";
import { env } from "../env.js";

// Este proyecto de Supabase firma con signing keys asimétricas (JWKS), no
// con el esquema legacy de secreto compartido (HS256 + JWT_SECRET). jose
// cachea el JWKS remoto automáticamente y lo refresca cuando cambia el `kid`.
const jwks = createRemoteJWKSet(
  new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
);

function isRol(value: unknown): value is RolType {
  return typeof value === "string" && value in Rol;
}

export default fp(async (fastify) => {
  fastify.decorate("authenticate", async (request, reply) => {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    try {
      const { payload } = await jwtVerify(header.slice(7), jwks);
      // El rol de negocio (USUARIO/COMERCIO/ADMIN) viaja en app_metadata,
      // que Supabase incluye automáticamente en el JWT a partir de
      // auth.users.raw_app_meta_data — no en el claim `role` de nivel
      // superior, que es el rol de Postgres/PostgREST ("authenticated").
      const claimedRole = (payload.app_metadata as { role?: unknown } | undefined)?.role;
      request.user = {
        id: payload.sub as string,
        role: isRol(claimedRole) ? claimedRole : Rol.USUARIO,
      };
    } catch {
      return reply.code(401).send({ error: "invalid_token" });
    }
  });

  fastify.decorate("requireRole", (roles: RolType[]) => async (request, reply) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return reply.code(403).send({ error: "forbidden" });
    }
  });
});
