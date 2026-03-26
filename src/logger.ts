import { pino } from "pino";

const logLevel = process.env["LOG_LEVEL"] ?? "info";

const pinoLogger = pino({
  level: logLevel,
});

const logger = {
  debug: pinoLogger.debug.bind(pinoLogger),
  info: pinoLogger.info.bind(pinoLogger),
  warn: pinoLogger.warn.bind(pinoLogger),
  error: pinoLogger.error.bind(pinoLogger),
};

export default logger;
