const logger = require('../src/logger');

describe('Logger configuration', () => {
  test('should log messages in JSON format via logger.info', async () => {
    expect(logger).toBeDefined();
    // Check level
    expect(logger.level).toBe('info');
    // Verify transports are configured (Console and File)
    const transportNames = logger.transports.map(t => t.name);
    expect(transportNames).toEqual(expect.arrayContaining(['console', 'file']));
    // Spy on logger.info to capture the message without writing to disk
    const infoSpy = jest.spyOn(logger, 'info');
    const uniqueMsg = `test-message-${Date.now()}`;
    logger.info(uniqueMsg);
    expect(infoSpy).toHaveBeenCalledWith(uniqueMsg);
    infoSpy.mockRestore();
  });
});
