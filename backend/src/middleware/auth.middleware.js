'use strict';

const { verifyAccessToken } = require('../utils/jwt');

/**
 * JWT Authentication Middleware (Task 05.05)
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication token missing or invalid'
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired access token'
    });
  }

  req.user = {
    userId: decoded.sub,
    email: decoded.email,
    role: decoded.role
  };

  next();
}

module.exports = {
  authenticateJWT
};
