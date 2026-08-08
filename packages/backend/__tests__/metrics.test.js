const request = require('supertest');
const { app } = require('../src/server');

describe('Metrics Endpoint', () => {
  test('GET /metrics returns Prometheus metrics', async () => {
    const response = await request(app).get('/metrics');
    expect(response.status).toBe(200);
    // Content-Type should be the one set by prom-client
    expect(response.headers['content-type']).toContain('text/plain');
    // The body should contain at least one of our custom metrics
    const body = response.text;
    expect(body).toMatch(/http_requests_total/);
    expect(body).toMatch(/http_request_duration_seconds_bucket/);
  });
});
