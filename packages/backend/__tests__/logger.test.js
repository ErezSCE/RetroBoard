const logger = require('../src/logger');

describe('Logger configuration', () => {
  test('should log messages in JSON format to file transport', async () => {
    expect(logger).toBeDefined();
    // Check level
    expect(logger.level).toBe('info');
    // Check transports count (Console + File)
    const transportNames = logger.transports.map(t => t.name);
    expect(transportNames).toEqual(expect.arrayContaining(['console', 'file']));
    // Log a unique message
    const uniqueMsg = `test-message-${Date.now()}`;
    logger.info(uniqueMsg);
    // Wait briefly for the file transport to flush
    await new Promise(resolve => setTimeout(resolve, 500));
    const fs = require('fs');
    const logPath = require('path').join(__dirname, '..', 'logs', 'app.log');
    const logContent = fs.readFileSync(logPath, 'utf8');
    const lines = logContent.trim().split('\n');
    const matchingLine = lines.find(line => line.includes(uniqueMsg));
    expect(matchingLine).toBeDefined();
    // Parse JSON and verify structure
    const parsed = JSON.parse(matchingLine);
    expect(parsed.message).toBe(uniqueMsg);
    expect(parsed.level).toBe('info');
  });
});
