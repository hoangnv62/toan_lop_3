import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/error.utils.js';

export const generateToken = (userId, role, name) => {
  return jwt.sign(
    { user_id: userId, role, name },
    env.SECRET_KEY,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

export const validateToken = (token) => {
  if (!token) throw new UnauthorizedError('Token is required');
  try {
    return jwt.verify(token, env.SECRET_KEY);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw new UnauthorizedError('Token expired');
    throw new UnauthorizedError('Invalid token');
  }
};
