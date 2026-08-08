/**
 * Offline sync endpoint handler.
 * Accepts a batch of client actions, validates them, applies via Prisma, and returns per‑action results.
 *
 * Expected request body shape:
 * {
 *   actions: [
 *     { type: 'createCard', payload: { sessionId, columnId, content, author_name, position } },
 *     ...
 *   ]
 * }
 */

const logger = require('./logger');

/**
 * Creates an Express router with the /offline/sync POST endpoint.
 * The router expects a Prisma client instance to be passed for DB operations.
 */
function createOfflineSyncRouter(prisma) {
  const express = require('express');
  const router = express.Router();

  router.post('/offline/sync', async (req, res) => {
    const { actions } = req.body || {};
    if (!Array.isArray(actions)) {
      logger.warn('Offline sync called with invalid payload', { body: req.body });
      return res.status(400).json({ error: 'Invalid payload: actions must be an array' });
    }

    const results = [];
    for (const action of actions) {
      if (!action || typeof action.type !== 'string' || !action.payload) {
        results.push({ action, status: 'error', error: 'Malformed action' });
        continue;
      }
      try {
        switch (action.type) {
          case 'createCard': {
            const { sessionId, columnId, content, author_name, position } = action.payload;
            // Basic validation
            if (
              typeof sessionId !== 'number' ||
              typeof columnId !== 'number' ||
              typeof content !== 'string' ||
              typeof author_name !== 'string' ||
              typeof position !== 'number'
            ) {
              throw new Error('Invalid createCard payload');
            }
            const created = await prisma.card.create({
              data: { sessionId, columnId, content, author_name, position },
            });
            results.push({ action, status: 'success', result: created });
            break;
          }
          // Future action types can be added here.
          default: {
            results.push({ action, status: 'ignored', reason: 'Unsupported action type' });
          }
        }
      } catch (err) {
        logger.error('Error processing offline action', { error: err, action });
        results.push({ action, status: 'error', error: err.message });
      }
    }

    return res.json({ results });
  });

  return router;
}

module.exports = { createOfflineSyncRouter };
