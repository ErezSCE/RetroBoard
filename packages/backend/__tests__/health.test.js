const request = require('supertest');
// Mock PrismaClient to avoid real DB connections during tests
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({})),
}));
const app = require('../src/server');

describe('Health Check Endpoint', () => {
  test('GET /health returns status ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
