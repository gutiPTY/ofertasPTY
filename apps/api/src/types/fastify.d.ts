import "fastify";
import type { Rol } from "@ofertaspty/shared-types";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      role: Rol;
    };
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (
      roles: Rol[],
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
