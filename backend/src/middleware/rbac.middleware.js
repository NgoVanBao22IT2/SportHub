'use strict';

/**
 * RBAC Authorization Middleware (Task 05.09)
 * Enforces role-based permissions based on users.primary_role
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: `Access denied: Required role [${allowedRoles.join(', ')}] but user role is [${req.user.role}]`
      });
    }

    next();
  };
}

module.exports = {
  requireRole
};
