'use strict';

const { Router } = require('express');
const { HttpError } = require('../utils/httpError');

const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_ITEMS = 10;

/**
 * Small in-memory rate limiter to reduce accidental abuse.
 * For multi-instance production deployments, use a shared store/rate limiter.
 */
function createRateLimiter({ windowMs = 60_000, maxRequests = 20 } = {}) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    let entry = hits.get(key);

    if (!entry || now - entry.startedAt >= windowMs) {
      entry = { startedAt: now, count: 0 };
      hits.set(key, entry);
    }

    entry.count += 1;
    res.set('RateLimit-Limit', String(maxRequests));
    res.set('RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)));

    if (entry.count > maxRequests) {
      return res.status(429).json({ error: 'Too many messages. Please wait a minute and try again.' });
    }

    // Opportunistically clean expired keys without a background timer.
    if (hits.size > 1000) {
      for (const [ip, item] of hits) {
        if (now - item.startedAt >= windowMs) hits.delete(ip);
      }
    }

    return next();
  };
}

function createChatRouter({ aiService, articleService }) {
  const router = Router();
  router.use(createRateLimiter());

  router.post('/', async (req, res, next) => {
    try {
      const message = req.body?.message;
      const history = req.body?.history;

      if (typeof message !== 'string' || !message.trim()) {
        throw new HttpError(400, 'message must be a non-empty string');
      }
      if (message.length > MAX_MESSAGE_LENGTH) {
        throw new HttpError(400, `message must be ${MAX_MESSAGE_LENGTH} characters or fewer`);
      }
      if (history !== undefined && !Array.isArray(history)) {
        throw new HttpError(400, 'history must be an array');
      }

      const safeHistory = (history || []).slice(-MAX_HISTORY_ITEMS);
      const knowledge = articleService.list({ search: message }).slice(0, 5);
      const reply = await aiService.reply({
        message: message.trim(),
        history: safeHistory,
        knowledge
      });

      res.json({ reply, knowledgeUsed: knowledge.map(({ id, title }) => ({ id, title })) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createChatRouter };
