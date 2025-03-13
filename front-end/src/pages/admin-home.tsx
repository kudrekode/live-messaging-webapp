import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'; //Axios is not actually used here but shows that it can be
import Pusher, { Channel } from 'pusher-js';
import ChatModal from '../components/ChatModal'; 

const AdminDashboard: React.FC = () => {
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<number | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [adminName, setAdminName] = useState('Loading...');
  const [newChatRoomName, setNewChatRoomName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
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

  // Fetch admin details (this is where you could use AXIOS)
  const fetchAdminInfo = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('User ID is missing. Please log in again.');
      return;
    }

    try {
      const response = await axios.get(`X/api/users/${userId}`); //or something similar for your specific server
      setAdminName(response.data.user_name);
    } catch (error) {
      console.error('Error fetching admin info:', error);
      setAdminName('Unknown Admin');
    }
  };

  // Fetch all chat rooms
  const fetchChatRooms = async () => {
    console.log("Fetching chat rooms...");

    const token = localStorage.getItem('authToken');
    try {
      const response = await axios.get('X/api/chat/chat-rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Chat rooms API response:', response.data);
      setChatRooms(Array.isArray(response.data.chatRooms) ? response.data.chatRooms : []);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      setChatRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users (to add to chat rooms)
  const fetchUsers = async () => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await axios.get('X/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Create a new chat room
  const createChatRoom = async () => {
    if (!newChatRoomName) {
      alert('Please enter a chat room name.');
      return;
    }

    const token = localStorage.getItem('authToken');
    try {
      const response = await axios.post('X/api/chat/create-channel', 
        { channelName: newChatRoomName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Chat room created:', response.data);
      setNewChatRoomName('');
      fetchChatRooms();
    } catch (error) {
      console.error('Error creating chat room:', error);
    }
  };

  // Add a user to a chat room
  const addUserToChatRoom = async () => {
    if (!selectedChatRoomId || !selectedUserId) {
      alert('Select both a chat room and a user.');
      return;
    }

    const token = localStorage.getItem('authToken');
    try {
      await axios.post(`X/api/chat/chat-rooms/${selectedChatRoomId}/add-user`, 
        { userId: selectedUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('User added to chat room successfully.');
      setSelectedUserId('');
    } catch (error) {
      console.error('Error adding user to chat room:', error);
    }
  };

  // Open chat modal when clicking on a chat room
  // we use useState to track the status of the modal being open or closed
  const openChatModal = (chatRoomId: number) => {
    setSelectedChatRoomId(chatRoomId);
    setChatModalOpen(true);
  };

  // Subscribe to chat updates via Pusher
  // we use useEffect to subscribe to the chat room when the component mounts by having chatRooms as the dependency
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

  // we use useEffect to fetch the chat rooms, admin info and users on load using an empty dependency array
  useEffect(() => {
    fetchChatRooms();
    fetchAdminInfo();
    fetchUsers();
  }, []);

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {adminName}</h1>
      </header>

      {/* Create Chat Room */}
      <div className="chat-room-creation">
        <input 
          type="text" 
          placeholder="Enter chat room name" 
          value={newChatRoomName} 
          onChange={(e) => setNewChatRoomName(e.target.value)} 
        />
        <button onClick={createChatRoom}>Create Chat Room</button>
      </div>

      {/* Add User to Chat Room */}
      <div className="add-user-section">
        <select onChange={(e) => setSelectedChatRoomId(Number(e.target.value))}>
          <option value="">Select Chat Room</option>
          {chatRooms.map((room) => (
            <option key={room.chat_room_id} value={room.chat_room_id}>
              {room.name}
            </option>
          ))}
        </select>

        <select onChange={(e) => setSelectedUserId(e.target.value)}>
          <option value="">Select User</option>
          {users.map((user) => (
            <option key={user.user_id} value={user.user_id}>
              {user.name}
            </option>
          ))}
        </select>

        <button onClick={addUserToChatRoom}>Add User</button>
      </div>

      {/* Chat Room List */}
      {loading ? (
        <p>Loading chat rooms...</p>
      ) : chatRooms.length > 0 ? (
        <ul className="chat-room-list">
          {chatRooms.map((room) => (
            <li key={room.chat_room_id} onClick={() => openChatModal(room.chat_room_id)}>
              <h2>{room.name}</h2>
              <p className="latest-message">{room.latest_message_content || 'No messages yet'}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No chat rooms available.</p>
      )}

      {/* Message Modal */}
      <ChatModal isOpen={chatModalOpen} chatRoomId={selectedChatRoomId} onClose={() => setChatModalOpen(false)} />
    </div>
  );
};

export default AdminDashboard;
