import { pino } from "pino";

const logLevel = process.env["LOG_LEVEL"] ?? "info";

const pinoLogger = pino({
  level: logLevel,
});

export default pinoLogger;
