const express = require('express');
const db = require('../db'); 
const router = express.Router();
const Pusher = require('pusher');
const authMiddleware = require('../middleware/authMiddleware');

// Initialize Pusher with env for security, have an or operator if you are testing, can manually add in your env values where the 'x' is (dont keep in production!)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || 'X',
  key: process.env.PUSHER_KEY || 'X',
  secret: process.env.PUSHER_SECRET || 'X',
  cluster: process.env.PUSHER_CLUSTER || 'X',
  useTLS: true,
});

// Middleware to parse JSON bodies 
router.use(express.json());

// Get all chat rooms
router.get('/chat-rooms', authMiddleware, async (req, res) => {
    const { userId, roleId } = req.user;
    console.log('Fetching chat rooms for user:', req.user);
  
    try {
      let query;
      let params = [userId];
  
      if (roleId === 2) { // Admin sees all chat rooms
        query = `SELECT chat_room_id, name FROM chat_rooms`;
        params = []; // No filter needed for admins
      } else { // User sees only their chat rooms
        query = `
          SELECT cr.chat_room_id, cr.name
          FROM chat_rooms cr
          JOIN user_access ua ON cr.chat_room_id = ua.chat_room_id
          WHERE ua.user_id = $1 AND ua.is_active = 1
        `;
      }
  
      const { rows: chatRooms } = await db.query(query, params);
      res.json({ chatRooms });
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ message: 'Database error' });
    }
  });
  
// POST Create chat room 
  router.post('/create-channel', authMiddleware, async (req, res) => {
    const { roleId, userId } = req.user;
    const { channelName } = req.body;
  
    if (roleId !== 2) {
      return res.status(403).json({ message: 'Only admins can create chat rooms' });
    }
  
    if (!channelName) {
      return res.status(400).json({ message: 'Channel name is required' });
    }
  
    try {
      const insertChatRoomQuery = `
        INSERT INTO chat_rooms (name)
        VALUES ($1)
        RETURNING chat_room_id
      `;
      const { rows } = await db.query(insertChatRoomQuery, [channelName]);
      const chatRoomId = rows[0].chat_room_id;
  
      res.status(200).json({ success: true, chatRoomId, channelName });
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ message: 'Database error' });
    }
  });
  
// GET Messages in a chat room specfiically
  router.get('/messages/:chatRoomId', authMiddleware, async (req, res) => {
    const { chatRoomId } = req.params;
  
    try {
      const query = `
        SELECT mh.message_content, mh.sent_at, u.name AS sender_name
        FROM message_history mh
        JOIN users u ON mh.user_id = u.user_id
        WHERE mh.chat_room_id = $1
        ORDER BY mh.sent_at ASC
      `;
      const { rows: messages } = await db.query(query, [chatRoomId]);
  
      res.status(200).json({ messages });
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ message: 'Database error' });
    }
  });
  
// POST Send a message to a chat room
  router.post('/messages', authMiddleware, async (req, res) => {
    const { chatRoomId, messageContent } = req.body;
    const { userId } = req.user;
  
    if (!messageContent) {
      return res.status(400).json({ message: 'Message content is required' });
    }
  
    try {
      const insertMessageQuery = `
        INSERT INTO message_history (chat_room_id, user_id, message_content, sent_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING message_id
      `;
      const { rows } = await db.query(insertMessageQuery, [chatRoomId, userId, messageContent]);
  
      const messageId = rows[0].message_id;
  
      // Fetch sender name
      const userQuery = `SELECT name FROM users WHERE user_id = $1`;
      const { rows: userResults } = await db.query(userQuery, [userId]);
      const senderName = userResults[0]?.name || 'Unknown';
  
      // Broadcast the new message
      const newMessage = {
        message_id: messageId,
        chat_room_id: chatRoomId,
        sender_name: senderName,
        message_content: messageContent,
        sent_at: new Date().toISOString(),
      };
  
      pusher.trigger(`chat-room-${chatRoomId}`, 'new-message', newMessage);
      res.status(200).json({ success: true, messageId });
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ message: 'Database error' });
    }
  });
  
//POST add user to chat room
  router.post('/chat-rooms/:chatRoomId/add-user', authMiddleware, async (req, res) => {
    const { chatRoomId } = req.params;
    const { userId } = req.body;
    const { roleId } = req.user;
  
    if (roleId !== 2) {
      return res.status(403).json({ message: 'Only admins can add users' });
    }
  
    try {
      const query = `
        INSERT INTO user_access (user_id, chat_room_id, is_active)
        VALUES ($1, $2, 1)
      `;
      await db.query(query, [userId, chatRoomId]);
  
      res.json({ success: true });
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ message: 'Database error' });
    }
  });
  
// DELETE remove user from chat room
  router.delete('/chat-rooms/:chatRoomId/remove-user', authMiddleware, async (req, res) => {
    const { chatRoomId } = req.params;
    const { userId } = req.body;
    const { roleId } = req.user;
  
    if (roleId !== 2) {
      return res.status(403).json({ message: 'Only admins can remove users' });
    }
  
    try {
      const query = `
        UPDATE user_access 
        SET is_active = 0 
        WHERE user_id = $1 AND chat_room_id = $2
      `;
      await db.query(query, [userId, chatRoomId]);
  
      res.json({ success: true });
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ message: 'Database error' });
    }
  });

module.exports = router;