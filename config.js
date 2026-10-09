'use strict';

require('dotenv').config();

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

module.exports = {
  port: positiveInteger(process.env.PORT, 3000),
  env: process.env.NODE_ENV || 'development',
  apiKey: process.env.API_KEY || '',
  aiApiKey: process.env.AI_API_KEY || '',
  aiBaseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
  aiModel: process.env.AI_MODEL || 'gpt-4o-mini'
};
