import { createLogger, format, Logger, transports } from 'winston';

const logFormat = format.printf(({ level, message, timestamp, stack }) => {
  let text: string;
  if (stack) text = stack;
  else if (typeof message === 'string') text = message;
  else text = JSON.stringify(message);
  return `${timestamp} - ${level} - ${text}`;
});

export const logger: Logger = createLogger({
  format: format.combine(
    format.colorize(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    logFormat,
  ),
  transports: [new transports.Console()],
});
