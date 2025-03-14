const express = require('express');
const db = require('../db'); 
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// GET all users
router.get('/', authMiddleware, async (req, res) => {
  const { roleId } = req.user; // Extract role from auth middleware

  if (roleId !== 2) {
    return res.status(403).json({ message: 'Access denied. Only admins can fetch users.' });
  }

  try {
    const query = `
      SELECT user_id, name, role_id 
      FROM Users
      ORDER BY user_id ASC
      LIMIT 50
    `;
    const { rows: users } = await db.query(query);
    res.json({ users });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// GET user by specific userID
router.get('/:userId', authMiddleware, async (req, res) => {
  const { userId } = req.params;

  try {
    const query = `
      SELECT user_id, name, role_id
      FROM Users
      WHERE user_id = $1
    `;
    const { rows: results } = await db.query(query, [userId]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(results[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// POST admin can create a new user
router.post('/', authMiddleware, async (req, res) => {
  const { roleId } = req.user;
  const { name, email, password, role } = req.body;

  if (roleId !== 2) {
    return res.status(403).json({ message: 'Access denied. Only admins can create users.' });
  }

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const query = `
      INSERT INTO Users (name, email, password, role_id)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id, name, role_id
    `;
    const { rows } = await db.query(query, [name, email, password, role]);

    res.status(201).json({ message: 'User created successfully', user: rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// DELETE admin can delete a user
router.delete('/:userId', authMiddleware, async (req, res) => {
  const { roleId } = req.user;
  const { userId } = req.params;

  if (roleId !== 2) {
    return res.status(403).json({ message: 'Access denied. Only admins can delete users.' });
  }

  try {
    const query = `
      DELETE FROM Users WHERE user_id = $1
    `;
    await db.query(query, [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;
