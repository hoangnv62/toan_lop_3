import { validateToken } from '../services/jwt.service.js';
import { UnauthorizedError } from '../utils/error.utils.js';

export const authenticate = (req, res, next) => {
  const auth = req.headers?.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token required'));
  }
  try {
    req.user = validateToken(auth.slice(7));
    next();
  } catch (err) {
    next(err);
  }
};
