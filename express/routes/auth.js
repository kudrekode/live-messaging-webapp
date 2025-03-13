const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); 
const router = express.Router();

// Assumes that you have created your own .env file for JWT secrets. Mine is a static one however to make it more secure you could dnymically updated and change JWT tokens
const JWT_SECRET = process.env.JWT_SECRET ;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Please configure it in the environment variables.');
}
const DEBUG_MODE = process.env.DEBUG_MODE === 'true'; 

// Utility function for standardized error responses
const sendError = (res, status, message) => {
  res.status(status).json({ message });
};
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt for email:', email);

  const query = `
    SELECT *
    FROM Users
    WHERE email = $1
  `;

  try {
    const { rows: results } = await db.query(query, [email]);

    if (results.length === 0) {
      console.log('No user found with this email');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];
    let isPasswordValid;

    if (DEBUG_MODE) {
      console.warn('DEBUG_MODE is enabled. Using plain text password comparison.');
      isPasswordValid = password === user.password; // Debug-only plain-text comparison
    } else {
      isPasswordValid = await bcrypt.compare(password, user.password);
      console.log(`Password comparison result: ${isPasswordValid}`); // Log result
    }

    if (!isPasswordValid) {
      console.log('Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.user_id, roleId: user.role_id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('User authenticated successfully. Token generated.');
    res.json({ 
      message: 'Login successful', 
      token, 
      role: user.role_id, 
      name: user.name,
      userId: user.user_id,
    });
  } catch (error) {
    console.error('Database error during login:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// Get User Role route
router.get('/role/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return sendError(res, 400, 'User ID is required');
  }

  console.log('Fetching role for User ID:', userId);

  const query = `
    SELECT Roles.role_name
    FROM Users
    JOIN Roles ON Users.role_id = Roles.role_id
    WHERE Users.user_id = $1
  `;

  try {
    const { rows: results } = await db.query(query, [userId]);

    if (results.length === 0) {
      return sendError(res, 404, 'Role not found');
    }

    res.json({ role: results[0].role_name });
  } catch (error) {
    console.error('Database error while fetching user role:', error);
    sendError(res, 500, 'An internal server error occurred');
  }
});

module.exports = router;