import BlacklistedToken from '../models/BlacklistedToken.js';
import User from '../models/User.js';
import { verifyToken } from '../utils/jwt.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access, no token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    const blacklisted = await BlacklistedToken.findOne({ where: { token } });
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
