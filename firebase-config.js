const firebaseConfig = {
    apiKey: "AIzaSyCksMAKAI1U2gXRHefO0vAZYbY4Y6ES1Sg",
    authDomain: "keys-c7467.firebaseapp.com",
    databaseURL: "https://keys-c7467-default-rtdb.firebaseio.com",
    projectId: "keys-c7467",
    storageBucket: "keys-c7467.firebasestorage.app",
    messagingSenderId: "573161424340",
    appId: "1:573161424340:web:6fe203312d2a18079f0241"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const usersRef = db.ref('users');
const sessionsRef = db.ref('sessions');
const gamesRef = db.ref('games');
