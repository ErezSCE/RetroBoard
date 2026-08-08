const logger = require('../src/logger');

describe('Logger configuration', () => {
  test('should be a winston logger with JSON format and transports', () => {
    expect(logger).toBeDefined();
    // Check level
    expect(logger.level).toBe('info');
    // Check transports count (Console + File)
    const transportNames = logger.transports.map(t => t.name);
    expect(transportNames).toEqual(expect.arrayContaining(['console', 'file']));
    // Check format is JSON (has transform function)
    expect(logger.format).toBeDefined();
    expect(typeof logger.format.transform).toBe('function');
  });
});
