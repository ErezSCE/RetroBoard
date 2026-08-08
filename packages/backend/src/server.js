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

// Action Item endpoints
app.post('/action-items', async (req, res) => {
  const { sessionId, source_type, source_id, title, ownerParticipantId, due_date } = req.body;
  if (!sessionId || !source_type || !source_id || !title) {
    return res.status(400).json({ error: 'sessionId, source_type, source_id, and title are required' });
  }
  if (!['card', 'cluster'].includes(source_type)) {
    return res.status(400).json({ error: 'source_type must be either "card" or "cluster"' });
  }
  try {
    const actionItem = await prisma.actionItem.create({
      data: {
        sessionId,
        source_type,
        source_id,
        title,
        ownerParticipantId: ownerParticipantId ?? null,
        due_date: due_date ? new Date(due_date) : null,
        status: 'open',
      },
    });
    res.status(201).json(actionItem);
  } catch (err) {
    logger.error('Error creating action item', { error: err });
    res.status(500).json({ error: 'Failed to create action item' });
  }
});

app.put('/action-items/:id', async (req, res) => {
  const { id } = req.params;
  const { title, ownerParticipantId, due_date, status } = req.body;
  try {
    const actionItem = await prisma.actionItem.update({
      where: { id: Number(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(ownerParticipantId !== undefined && { ownerParticipantId: ownerParticipantId ?? null }),
        ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
        ...(status !== undefined && { status }),
      },
    });
    res.json(actionItem);
  } catch (err) {
    logger.error('Error updating action item', { error: err });
    res.status(500).json({ error: 'Failed to update action item' });
  }
});

app.delete('/action-items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.actionItem.delete({ where: { id: Number(id) } });
    res.status(204).end();
  } catch (err) {
    logger.error('Error deleting action item', { error: err });
    res.status(500).json({ error: 'Failed to delete action item' });
  }
});
const prisma = require('./prismaClient');

// Voting endpoint (POST /votes)
app.post('/votes', async (req, res) => {
  const { participantId, sessionId, targetType, targetId, voteCount } = req.body;
  if (!participantId || !sessionId || !targetType || !targetId || typeof voteCount !== 'number') {
    return res.status(400).json({ error: 'participantId, sessionId, targetType, targetId, and voteCount are required' });
  }
  if (!['card', 'cluster'].includes(targetType)) {
    return res.status(400).json({ error: 'targetType must be either "card" or "cluster"' });
  }
  try {
    // Verify participant belongs to session
    const participant = await prisma.participant.findUnique({
      where: { id: Number(participantId) },
      select: { sessionId: true },
    });
    if (!participant || participant.sessionId !== Number(sessionId)) {
      return res.status(400).json({ error: 'Invalid participant for session' });
    }
    // Get session vote budget
    const session = await prisma.session.findUnique({
      where: { id: Number(sessionId) },
      select: { vote_budget: true },
    });
    const voteBudget = session?.vote_budget ?? 5; // default fallback
    // Calculate current used votes
    const cardVotesAgg = await prisma.cardVote.aggregate({
      where: { participantId: Number(participantId), card: { sessionId: Number(sessionId) } },
      _sum: { vote_count: true },
    });
    const clusterVotesAgg = await prisma.clusterVote.aggregate({
      where: { participantId: Number(participantId), cluster: { sessionId: Number(sessionId) } },
      _sum: { vote_count: true },
    });
    const usedVotes = (cardVotesAgg._sum.vote_count || 0) + (clusterVotesAgg._sum.vote_count || 0);
    if (usedVotes + voteCount > voteBudget) {
      return res.status(400).json({ error: 'Vote budget exceeded' });
    }
    // Upsert vote record
    if (targetType === 'card') {
      const existing = await prisma.cardVote.findFirst({
        where: { participantId: Number(participantId), cardId: Number(targetId) },
      });
      if (existing) {
        const updated = await prisma.cardVote.update({
          where: { participantId_cardId: { participantId: Number(participantId), cardId: Number(targetId) } },
          data: { vote_count: { increment: voteCount } },
        });
        return res.json(updated);
      } else {
        const created = await prisma.cardVote.create({
          data: {
            participantId: Number(participantId),
            cardId: Number(targetId),
            vote_count: voteCount,
          },
        });
        return res.status(201).json(created);
      }
    } else {
      // cluster
      const existing = await prisma.clusterVote.findUnique({
        where: { participantId_clusterId: { participantId: Number(participantId), clusterId: Number(targetId) } },
      });
      if (existing) {
        const updated = await prisma.clusterVote.update({
          where: { participantId_clusterId: { participantId: Number(participantId), clusterId: Number(targetId) } },
          data: { vote_count: { increment: voteCount } },
        });
        return res.json(updated);
      } else {
        const created = await prisma.clusterVote.create({
          data: {
            participantId: Number(participantId),
            clusterId: Number(targetId),
            vote_count: voteCount,
          },
        });
        return res.status(201).json(created);
      }
    }
  } catch (err) {
    logger.error('Error processing vote', { error: err });
    return res.status(500).json({ error: 'Failed to process vote' });
  }
});

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
