const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());

// Подключение к SQLite
const db = new sqlite3.Database('./messenger.db', (err) => {
  if (err) console.error(err.message);
  console.log('Connected to SQLite database.');
});

// Создание таблиц
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender TEXT,
  recipient TEXT,
  content TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Регистрация
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], (err) => {
    if (err) return res.status(400).send('User already exists');
    res.status(201).send('User registered');
  });
});

// Авторизация
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err || !user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send('Invalid credentials');
    }
    const token = jwt.sign({ username }, 'secret_key');
    res.json({ token });
  });
});

// WebSocket для сообщений
io.on('connection', (socket) => {
  socket.on('message', (data) => {
    const { sender, recipient, content } = data;
    db.run(`INSERT INTO messages (sender, recipient, content) VALUES (?, ?, ?)`, [sender, recipient, content]);
    io.emit('message', { sender, recipient, content, timestamp: new Date() });
  });
});

server.listen(3000, () => console.log('Server running on port 3000'));