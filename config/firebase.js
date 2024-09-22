// src/config/firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-adminsdk.json'); // Đường dẫn tới file JSON tải từ Firebase

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://worknet-e9-default-rtdb.asia-southeast1.firebasedatabase.app/',
});

const chatRef = admin.database().ref('chats');

module.exports = { chatRef };
