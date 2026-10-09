'use strict';

const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const { ArticleService } = require('./services/articleService');
const { AIService } = require('./services/aiService');
const { createArticleRouter } = require('./routes/articleRoutes');
const { createChatRouter } = require('./routes/chatRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp({
  service = new ArticleService(),
  aiService = new AIService()
} = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet({
    // Inline styles are used in the small static frontend; scripts remain external.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: null
      }
    }
  }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/articles', createArticleRouter(service));
  app.use('/api/chat', createChatRouter({ aiService, articleService: service }));

  // Serve the browser UI from the same Express server.
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
