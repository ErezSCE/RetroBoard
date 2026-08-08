const express = require('express');
const logger = require('./logger');
const client = require('prom-client');

// Initialize Prometheus metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ labels: { app: 'retroboard' } });

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['app', 'method', 'route', 'code'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
});

const httpRequestCount = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['app', 'method', 'route', 'code']
});

const app = express();

// Middleware to record request metrics
app.use((req, res, next) => {
  // Skip metric collection for the /metrics endpoint; it will be recorded manually.
  if (req.path === '/metrics') {
    return next();
  }
  const end = httpRequestDurationSeconds.startTimer();
  res.on('finish', () => {
    const route = req.path;
    const labels = {
      app: 'retroboard',
      method: req.method,
      route: route,
      code: res.statusCode
    };
    // Record duration and count
    end(labels);
    httpRequestCount.inc(labels);
  });
  next();
});
const port = process.env.PORT || 3000;

// Health‑check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    // Expose Prometheus metrics without double-counting (middleware already records this request)
    res.set('Content-Type', client.register.contentType);
    const metrics = await client.register.metrics();
    res.end(metrics);
  } catch (ex) {
    logger.error('Metrics collection error', { error: ex });
    res.status(500).end();
  }
});

if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Backend listening on port ${port}`);
  });
}

module.exports = app; // Export for testing
