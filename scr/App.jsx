import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:3000');

const App = () => {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chats] = useState(['User1', 'User2', 'User3']); // Пример списка чатов

  useEffect(() => {
    socket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => socket.off('message');
  }, []);

  const handleRegister = async () => {
    await axios.post('http://localhost:3000/register', { username, password });
    alert('Registered successfully');
  };

  const handleLogin = async () => {
    const res = await axios.post('http://localhost:3000/login', { username, password });
    setToken(res.data.token);
  };

  const sendMessage = () => {
    socket.emit('message', { sender: username, recipient, content: message });
    setMessage('');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Боковая панель */}
      <div className="w-1/4 bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Chats</h1>
        {chats.map((chat, index) => (
          <div
            key={index}
            className="p-2 hover:bg-blue-700 cursor-pointer"
            onClick={() => setRecipient(chat)}
          >
            {chat}
          </div>
        ))}
      </div>

      {/* Основное окно */}
      <div className="w-3/4 flex flex-col">
        {!token ? (
          <div className="flex flex-col items-center justify-center h-full">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border p-2 mb-2 w-64"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 mb-2 w-64"
            />
            <button onClick={handleRegister} className="bg-blue-500 text-white p-2 mb-2 w-64">
              Register
            </button>
            <button onClick={handleLogin} className="bg-blue-500 text-white p-2 w-64">
              Login
            </button>
          </div>
        ) : (
          <>
            <div className="bg-blue-500 text-white p-4">
              <h2 className="text-xl">Chat with {recipient || 'Select a chat'}</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {messages
                .filter((msg) => msg.sender === recipient || msg.recipient === recipient)
                .map((msg, index) => (
                  <div
                    key={index}
                    className={`p-2 my-2 rounded-lg ${
                      msg.sender === username ? 'bg-blue-200 ml-auto' : 'bg-gray-200'
                    } max-w-xs`}
                  >
                    <strong>{msg.sender}: </strong>{msg.content}
                  </div>
                ))}
            </div>
            <div className="p-4 flex">
              <input
                type="text"
                placeholder="Type a message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="border p-2 flex-1"
              />
              <button onClick={sendMessage} className="bg-blue-500 text-white p-2 ml-2">
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);