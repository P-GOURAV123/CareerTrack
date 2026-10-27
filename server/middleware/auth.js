const jwt = require('jsonwebtoken');
const store = require('../storage/jsonStore');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token is missing or invalid',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.slice('Bearer '.length), process.env.JWT_SECRET || 'development-secret');
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }

  try {
    const user = await store.findById('users', decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found for this token',
      });
    }

    const { password, ...safeUser } = user;
    req.user = safeUser;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = protect;
