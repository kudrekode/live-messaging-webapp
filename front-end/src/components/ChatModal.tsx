import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'; // again not used here actually but can be
import Pusher from 'pusher-js';
import '../styles/ChatModal.css'; 

// we use props so we can take information from the parent component and pass it down to the child component
// i.e., from user or admin home pages (can track roles etc then)
interface ChatModalProps {
  isOpen: boolean;
  chatRoomId: number | null;
  chatRoomName: string | null;
  onClose: () => void;
  isManager: boolean;
  onMessageSent?: () => void;
}

// import the props here by using the ChatModalProps interface
const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  chatRoomId,
  chatRoomName,
  onClose,
  isManager,
  onMessageSent,
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // use refs to reference the message end of the chat modal
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const token = localStorage.getItem('authToken');
  const userId = localStorage.getItem('userId');
  const senderName = localStorage.getItem('name');

  // Fetch Messages
  useEffect(() => {
    if (chatRoomId && token) {
      fetchMessages(chatRoomId, token);
    }
  }, [chatRoomId, token]);

  // the token is included in the headers of the request so that the server can verify the request
  const fetchMessages = async (chatRoomId: number, token: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        //insert own api url here of course
        `X/api/chat/messages/${chatRoomId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data.messages || []);
      setTimeout(scrollToBottom, 0);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send Message
  const sendMessage = async () => {
    if (!newMessage.trim()) {
      alert('Message cannot be empty');
      return;
    }
    if (!userId || !senderName || !chatRoomId || !token) {
      alert('Missing user info. Please log in again.');
      return;
    }

    try {
      await axios.post(
        //insert own api url here of course
        'X/api/chat/messages',
        { chatRoomId, userId, messageContent: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchMessages(chatRoomId, token);
      setNewMessage('');
      setTimeout(scrollToBottom, 100);
      if (onMessageSent) onMessageSent();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Subscribe to Pusher updates
  // using useEffect to subscribe to the chat room when the component mounts by having chatRooms as the dependency
  useEffect(() => {
    if (!chatRoomId || !token) return;

    const pusher = new Pusher('X', { cluster: 'X' });
    const channel = pusher.subscribe(`chat-room-${chatRoomId}`);

    channel.bind('new-message', (newMessage: any) => {
      setMessages((prevMessages) => {
        return prevMessages.some((msg) => msg.message_id === newMessage.message_id)
          ? prevMessages
          : [...prevMessages, newMessage];
      });
    });

    // unbind and unsubscribe from the channel when the component unmounts
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [chatRoomId, token]);

  // Auto-scroll to latest message
  // this may be broken :/ hopefully working though!
  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`chat-modal ${isOpen ? 'open' : ''}`}>
      <div className="chat-header">
        <button onClick={onClose} className="close-btn">✖</button>
        <h2>{chatRoomName || 'Chat Room'}</h2>
      </div>

      <div className="chat-content">
        {loading ? <p>Loading messages...</p> : messages.length > 0 ? (
          messages.map((msg, index) => (
            <div key={index} className="chat-message">
              <strong>{msg.sender_name || 'Unknown'}</strong>
              <p>{msg.message_content}</p>
              <small>{msg.sent_at ? new Date(msg.sent_at).toLocaleString() : ''}</small>
            </div>
          ))
        ) : (
          <p>No messages yet.</p>
        )}
        <div ref={messageEndRef} />
      </div>

      <div className="chat-footer">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="chat-input"
        />
        <button onClick={sendMessage} className="send-btn">Send</button>
      </div>
    </div>
  );
};

export default ChatModal;
