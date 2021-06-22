import * as winston from 'winston';
import 'winston-daily-rotate-file';

const dailyRotateTransport = new winston.transports.DailyRotateFile({
  filename: '%DATE%.log',
  dirname: 'logs',
  zippedArchive: true
});

const dailyRotateErrorTransport = new winston.transports.DailyRotateFile({
  filename: 'error-%DATE%.log',
  dirname: 'logs',
  zippedArchive: true,
  level: 'error'
});

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => `[${timestamp}] ${level}: ${JSON.stringify(message)}`)
  ),
  transports: [dailyRotateTransport, dailyRotateErrorTransport]
});

if (process.env.NODE_ENV === 'dev') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.prettyPrint()
    })
  );
}

export const logError = (err: Error, event = 'client', data: { [key: string]: string } = {}): void => {
  logger.error({
    event: `${event}_error`,
    error: err,
    ...data
  });
};

export default logger;
