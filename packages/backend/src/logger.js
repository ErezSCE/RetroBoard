const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const path = require('path');
// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = createLogger({
  level: 'info',
  format: format.json(),
  transports: [
    new transports.Console(),
    new transports.File({ filename: require('path').join(__dirname, '..', 'logs', 'app.log') })
  ]
});

module.exports = logger;
