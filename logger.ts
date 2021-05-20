const winston = require('winston');
require('winston-daily-rotate-file');

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

const consoleTransport = new winston.transports.Console({
  format: winston.format.prettyPrint()
});

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ level, message, timestamp }: { level: string; message: string; timestamp: string }) =>
        `[${timestamp}] ${level}: ${JSON.stringify(message)}`
    )
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

export default logger;
