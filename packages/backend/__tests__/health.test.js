const request = require('supertest');
const { app } = require('../src/server');

describe('Health Check Endpoint', () => {
  test('GET /health returns status ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
