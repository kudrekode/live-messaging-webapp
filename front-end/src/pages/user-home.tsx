import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'; //axios not actually used here but shows that it could be!
import Pusher, { Channel } from 'pusher-js';
import ChatModal from '../components/ChatModal.tsx'; // Ensure you have this component
import '../styles/UserDashboard.css'; // Add your custom styles

const UserDashboard: React.FC = () => {
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<number | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [username, setUsername] = useState('Loading...');
  const [loading, setLoading] = useState(true);

  const pusherRef = useRef<Pusher | null>(null);
  const chatChannelsRef = useRef<{ [key: string]: Channel }>({});

  // Initialize Pusher only once (seemed to have issues with multiple instances) 
  // Note, bad pracrtice to store your pusher tokens here in the front end, I have done this for simplicity
  useEffect(() => {
    if (!pusherRef.current) {
      pusherRef.current = new Pusher('X', { cluster: 'X' });
    }
    return () => {
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, []);

  // Fetch user details (name)
  const fetchUserInfo = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('User ID is missing. Please log in again.');
      return;
    }

    try {
        //the endpoint should be similar to this:
      const response = await axios.get(`YOURURL/api/users/${userId}`);
      const { user_name } = response.data;
      setUsername(user_name);
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUsername('Unknown User');
    }
  };

  // Fetch chat rooms for the user
  const fetchChatRooms = async () => {
    console.log("Fetching chat rooms...");

    const token = localStorage.getItem('authToken');
    try {
      const response = await axios.get('X/api/chat/chat-rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Chat rooms API response:', response.data);
      const rooms = response.data.chatRooms;

      if (Array.isArray(rooms)) {
        setChatRooms(rooms);
      } else {
        setChatRooms([]);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      setChatRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Open chat modal when clicking on a chat room
  // we use useState to track the status of the modal being open or closed
  const openChatModal = (chatRoomId: number) => {
    setSelectedChatRoomId(chatRoomId);
    setChatModalOpen(true);
  };

  // Subscribe to Pusher channels to receive live updates
  useEffect(() => {
    if (!pusherRef.current) return;
    const pusher = pusherRef.current;

    chatRooms.forEach((room) => {
      const channelName = `chat-room-${room.chat_room_id}`;
      if (!chatChannelsRef.current[channelName]) {
        console.log(`Subscribing to channel: ${channelName}`);
        const channel = pusher.subscribe(channelName);

        channel.bind('new-message', (newMessage: any) => {
          console.log('New message received:', newMessage);
          setChatRooms((prevRooms) => {
            return prevRooms.map((r) =>
              r.chat_room_id === Number(newMessage.chat_room_id)
                ? {
                    ...r,
                    latest_message_content: newMessage.message_content,
                    latest_message_sent_at: newMessage.sent_at,
                  }
                : r
            );
          });
        });

        chatChannelsRef.current[channelName] = channel;
      }
    });

    return () => {
      Object.values(chatChannelsRef.current).forEach((channel) => {
        channel.unbind('new-message');
        pusher.unsubscribe(channel.name);
      });
      chatChannelsRef.current = {};
    };
  }, [chatRooms]);

  // Fetch chat rooms and user info on load using useEffect with nothing as the dependency
  useEffect(() => {
    fetchChatRooms();
    fetchUserInfo();
  }, []);

  return (
    <div className="user-dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {username}</h1>
      </header>

      {loading ? (
        <p>Loading chat rooms...</p>
      ) : chatRooms.length > 0 ? (
        <ul className="chat-room-list">
          {chatRooms.map((room) => (
            <li key={room.chat_room_id} className="chat-room-item" onClick={() => openChatModal(room.chat_room_id)}>
              <h2>{room.name}</h2>
              <p className="latest-message">{room.latest_message_content || 'No messages yet'}</p>
              <small>
                {room.latest_message_sent_at
                  ? new Date(room.latest_message_sent_at).toLocaleString()
                  : ''}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p>No chat rooms available.</p>
      )}

      {/* Message Modal */}
      <ChatModal
        isOpen={chatModalOpen}
        chatRoomId={selectedChatRoomId}
        onClose={() => setChatModalOpen(false)}
        chatRoomName={chatRooms.find((r) => r.chat_room_id === selectedChatRoomId)?.name || ''}
        isManager={false}
        onMessageSent={fetchChatRooms} // Reload chat list on message sent
      />
    </div>
  );
};

export default UserDashboard;
