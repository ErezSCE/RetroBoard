const express = require('express');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
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
app.use(express.json());

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Handle client connections
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });
  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

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

// Column management endpoints
const prisma = require('./prismaClient');

// Create a new column
app.post('/columns', async (req, res) => {
  const { sessionId, title, position } = req.body;
  if (!sessionId || !title) {
    return res.status(400).json({ error: 'sessionId and title are required' });
  }
  try {
    const column = await prisma.column.create({
      data: { sessionId, title, position: position ?? 0 },
    });
    res.status(201).json(column);
  } catch (err) {
    logger.error('Error creating column', { error: err });
    res.status(500).json({ error: 'Failed to create column' });
  }
});

// Get columns for a session
app.get('/columns', async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId query parameter is required' });
  }
  try {
    const columns = await prisma.column.findMany({
      where: { sessionId: Number(sessionId) },
      orderBy: { position: 'asc' },
    });
    res.json(columns);
  } catch (err) {
    logger.error('Error fetching columns', { error: err });
    res.status(500).json({ error: 'Failed to fetch columns' });
  }
});

// Update a column
app.put('/columns/:id', async (req, res) => {
  const { id } = req.params;
  const { title, position } = req.body;
  try {
    const column = await prisma.column.update({
      where: { id: Number(id) },
      data: { ...(title && { title }), ...(position !== undefined && { position }) },
    });
    res.json(column);
  } catch (err) {
    logger.error('Error updating column', { error: err });
    res.status(500).json({ error: 'Failed to update column' });
  }
});

// Delete a column (prevent deletion if it contains cards)
app.delete('/columns/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const cardCount = await prisma.card.count({ where: { columnId: Number(id) } });
    if (cardCount > 0) {
      return res.status(400).json({ error: 'Column contains cards; cannot delete without confirmation' });
    }
    await prisma.column.delete({ where: { id: Number(id) } });
    res.status(204).end();
  } catch (err) {
    logger.error('Error deleting column', { error: err });
    res.status(500).json({ error: 'Failed to delete column' });
  }
});
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  // Record a dummy observation to ensure histogram buckets are present even if no other requests have been made.
  httpRequestDurationSeconds.observe({ app: 'retroboard', method: 'GET', route: '/metrics', code: 200 }, 0);

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
  server.listen(port, () => {
    logger.info(`Backend listening on port ${port}`);
  });
}

module.exports = { app, server, io }; // Export for testing
