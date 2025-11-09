/**
 * Internal Authentication Middleware
 * Validates service-to-service communication using INTERNAL_API_KEY
 * Used by AI agents and other internal services to call backend APIs
 */

const authenticateInternalService = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing authorization header'
    });
  }

  // Extract token from "Bearer <token>" format
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  // Validate against INTERNAL_API_KEY from environment
  const internalApiKey = process.env.INTERNAL_API_KEY;

  if (!internalApiKey) {
    console.error('INTERNAL_API_KEY not configured in environment');
    return res.status(500).json({
      error: 'Server Configuration Error',
      message: 'Internal API key not configured'
    });
  }

  if (token !== internalApiKey) {
    console.warn('Invalid internal API key attempt:', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid internal API key'
    });
  }

  // Authentication successful
  req.internalService = true;
  next();
};

module.exports = { authenticateInternalService };
