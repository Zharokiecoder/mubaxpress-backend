const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      error: error.message
    });
  }
};

// Restrict access to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user is the owner of a resource
exports.checkOwnership = (Model) => {
  return async (req, res, next) => {
    try {
      const doc = await Model.findById(req.params.id);
      
      if (!doc) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Admins can access anything, or if user is the owner
      if (req.user.role === 'admin' || doc.vendor.toString() === req.user.id || doc.user?.toString() === req.user.id) {
        req.document = doc;
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking ownership',
        error: error.message
      });
    }
  };
};