const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  console.log('authMiddleware - Authorization Header:', req.headers.authorization); 
  const token = req.headers.authorization?.split(' ')[1];
  console.log('Received token:', token);

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    console.log('About to verify token');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verified successfully', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    res.status(400).json({ message: 'Invalid token.' });
  }
};