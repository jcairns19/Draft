import logger from '../logger.js';

/**
 * Middleware to log API requests and responses
 * Logs incoming requests and outgoing responses with status codes
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';

  // Log incoming request
  logger.http(`Incoming ${method} ${url} from ${ip} - User-Agent: ${userAgent}`);

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // Log response with status code and duration
    logger.http(`Response ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms`);

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
}