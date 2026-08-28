import { env } from "../env.js";

export const loggerOptions =
  env.NODE_ENV === "development"
    ? { level: "info", transport: { target: "pino-pretty" } }
    : { level: "info" };
