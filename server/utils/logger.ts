import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Logs-Verzeichnis erstellen falls nicht vorhanden
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom Logging-Levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Farben für die Konsole
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Log-Format definieren
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Transports definieren
const transports = [
  // Console
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.simple()
    )
  }),
  // Error Logs
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  // All Logs
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    maxsize: 5242880,
    maxFiles: 5
  })
];

// Logger erstellen
export const logger = winston.createLogger({
  levels,
  format,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log')
    })
  ],
  exitOnError: false
});

// Debug-Level in Entwicklung
if (process.env.NODE_ENV !== 'production') {
  logger.level = 'debug';
}

export type LoggerType = typeof logger;
