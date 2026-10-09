'use strict';

require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number.parseInt(process.env.PORT, 10) || 3000,
  apiKey: process.env.API_KEY || '',
};

module.exports = Object.freeze(config);
