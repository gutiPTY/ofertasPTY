import { env } from "../env";

export const loggerOptions =
  env.NODE_ENV === "development"
    ? { level: "info", transport: { target: "pino-pretty" } }
    : { level: "info" };
