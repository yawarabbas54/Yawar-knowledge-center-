'use strict';

const config = require('../config');
const { HttpError } = require('../utils/httpError');

function notFound(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Express requires the four-argument signature for error middleware.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }

  const status = err instanceof HttpError ? err.status : err.status || 500;
  const isServerError = status >= 500;

  if (isServerError) {
    console.error(err);
  }

  const body = {
    error: isServerError && config.env === 'production' ? 'Internal server error' : err.message,
  };

  if (err.details) {
    body.details = err.details;
  }

  return res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
