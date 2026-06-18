const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- ROBUST PATH CALCULATION ---
// This finds the folder "Frontend" which is next to the "Backend" folder
const frontendPath = path.resolve(__dirname, '..', 'Frontend');

// DEBUG LOG: This will show you in the terminal exactly where the server is looking
console.log("----------------------------------------------");
console.log("Checking for Frontend folder at:", frontendPath);
console.log("----------------------------------------------");

// Serve static files (CSS, JS)
app.use(express.static(frontendPath));

// Data Storage
let users = [];
let contacts = {}; 
let history = {};

// Home Route
app.get('/', (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error("❌ ERROR: Could not find index.html at:", indexPath);
            res.status(404).send("<h1>File Not Found</h1><p>The server is looking for index.html in the wrong place. Check your terminal for the full path.</p>");
        }
    });
});

// --- API ENDPOINTS ---

app.post('/api/signup', (req, res) => {
    const { username, password, pincode, age } = req.body;
    users.push({ username, password, pincode, age });
    contacts[username] = [];
    history[username] = [];
    res.json({ message: "created account successfully" });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        res.json({ success: true, message: "user found", username: user.username });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

app.get('/api/contacts/:user', (req, res) => res.json(contacts[req.params.user] || []));

app.post('/api/contacts', (req, res) => {
    const { user, name, phone } = req.body;
    if (!contacts[user]) contacts[user] = [];
    contacts[user].push({ id: Date.now(), name, phone });
    res.json({ success: true });
});

app.delete('/api/contacts/:user/:id', (req, res) => {
    const { user, id } = req.params;
    contacts[user] = contacts[user].filter(c => c.id != id);
    res.json({ success: true });
});

app.post('/api/history', (req, res) => {
    const { user, location } = req.body;
    if (!history[user]) history[user] = [];
    history[user].push({ time: new Date().toLocaleString(), location });
    res.json({ success: true });
});

app.get('/api/history/:user', (req, res) => res.json(history[req.params.user] || []));

app.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
});