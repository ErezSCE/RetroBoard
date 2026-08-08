const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const path = require('path');
// Ensure logs directory exists
const logsDir = process.env.LOG_DIR ? path.resolve(process.env.LOG_DIR) : path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = createLogger({
  level: 'info',
  format: format.json(),
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(logsDir, 'app.log') })
  ]
});

module.exports = logger;
