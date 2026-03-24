const API_URL = "http://localhost:3000/api";
let activeUser = sessionStorage.getItem("activeUser") || null;

function showPage(id) {
    const locked = ['contacts', 'history', 'admin'];
    if (locked.includes(id) && !activeUser) {
        alert("🔒 Login Required! Redirection to login page.");
        showPage('login');
        return;
    }
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => {
        if(item.innerText.toLowerCase().includes(id)) item.classList.add('active');
    });

    if (id === 'contacts') loadContacts();
    if (id === 'history') loadHistory();
    document.getElementById('user-display').innerText = activeUser ? `User: ${activeUser}` : "Logged Out";
}

function toggleAuth(isSignup) {
    document.getElementById('login-form').style.display = isSignup ? 'none' : 'block';
    document.getElementById('signup-form').style.display = isSignup ? 'block' : 'none';
}

async function signup() {
    const username = document.getElementById('s-user').value;
    const password = document.getElementById('s-pass').value;
    const pincode = document.getElementById('s-pin').value;
    const age = document.getElementById('s-age').value;

    const res = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password, pincode, age })
    });
    if (res.ok) {
        document.getElementById('signup-msg').innerText = "created account successfully";
        setTimeout(() => toggleAuth(false), 2000);
    }
}

async function login() {
    const username = document.getElementById('l-user').value;
    const password = document.getElementById('l-pass').value;
    const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
        alert("user found");
        activeUser = data.username;
        sessionStorage.setItem("activeUser", activeUser);
        showPage('home');
    } else { alert(data.message); }
}

async function handleSOS() {
    if (!activeUser) {
        alert("🔒 Login Required! Redirection to login page.");
        showPage('login');
        return;
    }
    const res = await fetch(`${API_URL}/contacts/${activeUser}`);
    const list = await res.json();
    if (list.length === 0) {
        alert("Please add emergency contacts first!");
        showPage('contacts');
        return;
    }

    document.getElementById('sos-sound').play();
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const maps = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        await fetch(`${API_URL}/history`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user: activeUser, location: maps })
        });
        alert("SOS Alert sound triggered and live location fetched!");
        window.open(`https://wa.me/${list[0].phone}?text=🚨 SOS ALERT! Help Me! Live Location: ${maps}`, '_blank');
    });
}

async function loadContacts() {
    const res = await fetch(`${API_URL}/contacts/${activeUser}`);
    const data = await res.json();
    document.getElementById('contact-list').innerHTML = data.map(c => `
        <tr><td>${c.name}</td><td>${c.phone}</td><td><i class="fas fa-trash" style="color:red; cursor:pointer" onclick="deleteContact(${c.id})"></i></td></tr>
    `).join('');
}

async function addContact() {
    const name = document.getElementById('c-name').value;
    const phone = document.getElementById('c-phone').value;
    await fetch(`${API_URL}/contacts`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user: activeUser, name, phone })
    });
    loadContacts();
}

async function deleteContact(id) {
    await fetch(`${API_URL}/contacts/${activeUser}/${id}`, { method: 'DELETE' });
    loadContacts();
}

async function loadHistory() {
    const res = await fetch(`${API_URL}/history/${activeUser}`);
    const data = await res.json();
    document.getElementById('history-list').innerHTML = data.map(h => `
        <tr><td>${h.time}</td><td style="color:red">SOS SENT</td><td><a href="${h.location}" target="_blank" style="color:cyan">Open Map</a></td></tr>
    `).join('');
}