const { createDefaultColumns } = require('../src/defaultColumns');

describe('createDefaultColumns', () => {
  test('should create default columns with correct titles and positions', async () => {
    const mockCreateMany = jest.fn().mockResolvedValue({ count: 3 });
    const prisma = { column: { createMany: mockCreateMany } };
    const sessionId = 42;
    await createDefaultColumns(prisma, sessionId);
    expect(mockCreateMany).toHaveBeenCalledTimes(1);
    const callArg = mockCreateMany.mock.calls[0][0];
    expect(callArg.data).toEqual([
      { sessionId, title: 'Went Well', position: 0 },
      { sessionId, title: 'To Improve', position: 1 },
      { sessionId, title: 'Action Items', position: 2 }
    ]);
    expect(callArg.skipDuplicates).toBe(true);
  });
});
