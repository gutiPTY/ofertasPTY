import fp from "fastify-plugin";
import { createSecretKey } from "node:crypto";
import { jwtVerify } from "jose";
import { Rol, type Rol as RolType } from "@ofertaspty/shared-types";
import { env } from "../env";

// NOTA: esto asume que el proyecto de Supabase firma con HS256 y un secreto
// compartido (JWT_SECRET) — el esquema "legacy" de Supabase Auth. Si el
// proyecto usa el esquema nuevo de signing keys asimétricas/JWKS, esta
// verificación fallará siempre y hay que cambiarla por jwtVerify con
// createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)).
// Confirmar en el dashboard de Supabase: Authentication -> JWT Settings.
const secretKey = createSecretKey(Buffer.from(env.JWT_SECRET, "utf-8"));

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
      const { payload } = await jwtVerify(header.slice(7), secretKey);
      const claimedRole = payload.role ?? (payload.app_metadata as { role?: unknown } | undefined)?.role;
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
