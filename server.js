// server.js
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// static serve: index.html ve diğer dosyaları direkt sunar
app.use(express.static(__dirname));

const USERS_FILE = path.join(__dirname, 'users.json');

// helpers
const readUsers = () => {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error reading users.json:', err);
    return [];
  }
};

const saveUsers = (users) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing users.json:', err);
  }
};

// DEBUG: health route
app.get('/_health', (req, res) => res.json({ status: 'ok' }));

// root -> index.html (explicit so http://localhost:3000/ açınca sorun olmasın)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// register
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });

    const users = readUsers();
    if (users.find(u => u.email === email)) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    users.push({ name, email, password: hashed });
    saveUsers(users);
    console.log(`Registered new user: ${email}`);
    return res.json({ message: 'Registration successful! You can now login.' });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'All fields required' });

    const users = readUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password.' });

    return res.json({ message: `Welcome, ${user.name}! You are now logged in.` });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// start
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT}/index.html in your browser`);
});
