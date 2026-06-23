// ============================================================
// 1. ХЕШИРОВАНИЕ и ЛИЦЕНЗИОННЫЕ КЛЮЧИ
// ============================================================
function hashSHA256(text) {
    return CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex);
}

const VALID_KEYS_ORIGINAL = [
"9o3lt6kg03keo41rqfps-2l5tmq",
"0o4lt3kg03keo41rqfps-3l6tms",
"2l5tmqlg03keo41rqf-6k9it5",
"5k7it0g03keo41rqfps-9o2lt7",
"8o1lt4kg03keo41rqfps-1l3tmu",
"0l1tmwlg03keo41rqf-1k3it7",
"3k6it0g03keo41rqfps-4o7lt5",
"6o9lt2kg03keo41rqfps-7l0tmy",
"8l4tmxlg03keo41rqf-0k5it8",
"1k3it7g03keo41rqfps-2o8lt6",
"4o7lt5kg03keo41rqfps-5l1tmz",
"7l0tmylg03keo41rqf-8k2it9",
"0k5it8g03keo41rqfps-1o9lt3",
"2o8lt6kg03keo41rqfps-3l5tma",
"5l1tmzlg03keo41rqf-6k3it0",
"8k2it9g03keo41rqfps-9o6lt4",
"1o9lt3kg03keo41rqfps-2l7tmb",
"3l5tmalg03keo41rqf-4k1it3",
"6k3it0g03keo41rqfps-7o8lt6",
"9o6lt4kg03keo41rqfps-0l2tmc",
"2l7tmblg03keo41rqf-3k4it5"
];
const VALID_KEYS_HASHES = VALID_KEYS_ORIGINAL.map(k => hashSHA256(k));

// ============================================================
// 2. УПРАВЛЕНИЕ АККАУНТАМИ
// ============================================================
let currentUser = null;
let currentSessionToken = null;
const authOverlay = document.getElementById('authOverlay');
const authLogin = document.getElementById('authLogin');
const authPassword = document.getElementById('authPassword');
const authKeyGroup = document.getElementById('authKeyGroup');
const authKey = document.getElementById('authKey');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authMessage = document.getElementById('authMessage');
const authTitle = document.getElementById('authTitle');
const authSub = document.getElementById('authSub');
const toggleLink = document.getElementById('toggleAuthMode');
let isLoginMode = true;

function showKeyInput() {
    authKeyGroup.style.display = 'block';
    authSubmitBtn.innerText = "АКТИВИРОВАТЬ КЛЮЧ";
}

function toggleMode() {
    isLoginMode = !isLoginMode;
    authTitle.innerText = isLoginMode ? "ВХОД" : "РЕГИСТРАЦИЯ";
    authSub.innerText = isLoginMode ? "Вход в систему" : "Регистрация нового аккаунта";
    authSubmitBtn.innerText = isLoginMode ? "ВОЙТИ" : "ЗАРЕГИСТРИРОВАТЬСЯ";
    authMessage.innerText = "";
    authKeyGroup.style.display = 'none';
    authLogin.style.display = 'block';
    authPassword.style.display = 'block';
    toggleLink.style.display = 'block';
    toggleLink.innerText = isLoginMode ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти";
}

function register(login, password) {
    if(!login || !password) { authMessage.innerText = "Введите логин и пароль"; return false; }
    const passwordHash = hashSHA256(password);
    usersRef.child(login).get().then(snapshot => {
        if(snapshot.exists()) { authMessage.innerText = "Аккаунт уже существует!"; }
        else {
            usersRef.child(login).set({
                passwordHash: passwordHash,
                keyUsed: null,
                gameData: null,
                elo: 1000
            }).then(() => {
                authMessage.innerText = "Аккаунт создан! Теперь войдите.";
                toggleMode();
            }).catch(err => {
                authMessage.innerText = "Ошибка записи в БД: " + err.message;
            });
        }
    }).catch(err => { authMessage.innerText = "Ошибка проверки: " + err.message; });
    return false;
}

async function login(login, password) {
    if(!login || !password) { authMessage.innerText = "Введите логин и пароль"; return false; }
    try {
        const snapshot = await usersRef.child(login).get();
        if(!snapshot.exists()) { authMessage.innerText = "Аккаунт не найден"; return false; }
        const userData = snapshot.val();
        const passwordHash = hashSHA256(password);
        if(userData.passwordHash !== passwordHash) {
            authMessage.innerText = "Неверный пароль";
            return false;
        }
        currentUser = login;
        const token = btoa(login + ":" + Date.now() + ":" + Math.random().toString(36));
        currentSessionToken = token;
        await sessionsRef.child(token).set({ login: login, createdAt: Date.now() });
        localStorage.setItem("skyfire_session_token", token);
        authMessage.innerText = "Вход выполнен!";
        if(userData.keyUsed) { loadGameForUser(userData); }
        else {
            authTitle.innerText = "АКТИВАЦИЯ ЛИЦЕНЗИИ";
            authSub.innerText = "Активация лицензионного ключа";
            authLogin.style.display = 'none';
            authPassword.style.display = 'none';
            toggleLink.style.display = 'none';
            authMessage.innerText = "Введите лицензионный ключ";
            showKeyInput();
        }
        return true;
    } catch(err) { authMessage.innerText = "Ошибка: " + err.message; return false; }
}

async function activateKey(key) {
    if(!key) { authMessage.innerText = "Введите ключ"; return false; }
    const keyHash = hashSHA256(key);
    if(!VALID_KEYS_HASHES.includes(keyHash)) {
        authMessage.innerText = "Неверный лицензионный ключ";
        return false;
    }
    const usedSnap = await db.ref('usedKeys/' + keyHash).get();
    if(usedSnap.exists()) {
        authMessage.innerText = "Этот ключ уже был использован другим игроком!";
        return false;
    }
    await db.ref('usedKeys/' + keyHash).set(currentUser);
    const userRef = usersRef.child(currentUser);
    await userRef.update({ keyUsed: keyHash });
    authMessage.innerText = "Ключ активирован! Запуск игры...";
    const updatedData = (await userRef.get()).val();
    loadGameForUser(updatedData);
    return true;
}

function loadGameForUser(userData) {
    if(userData.gameData) {
        try {
            const data = JSON.parse(userData.gameData);
            if(data.playerXP) window.playerXP = data.playerXP;
            if(data.playerStats) window.playerStats = data.playerStats;
            if(data.pvoUnits) window.pvoUnits = data.pvoUnits;
            if(data.pvoStaffBuilt !== undefined) window.pvoStaffBuilt = data.pvoStaffBuilt;
        } catch(e) {}
    }
    authOverlay.style.display = 'none';
    document.getElementById('menuScreen').style.display = 'flex';
    if(window.saveInterval) clearInterval(window.saveInterval);
    window.saveInterval = setInterval(() => {
        if(currentUser) {
            const data = JSON.stringify({ 
                playerXP: window.playerXP, 
                playerStats: window.playerStats, 
                pvoUnits: window.pvoUnits, 
                pvoStaffBuilt: window.pvoStaffBuilt 
            });
            usersRef.child(currentUser).update({ gameData: data });
        }
    }, 30000);
}

async function restoreSession() {
    const token = localStorage.getItem("skyfire_session_token");
    if(!token) { authOverlay.style.display = 'flex'; return; }
    try {
        const snap = await sessionsRef.child(token).get();
        if(!snap.exists()) {
            localStorage.removeItem("skyfire_session_token");
            authOverlay.style.display = 'flex';
            return;
        }
        const sessionData = snap.val();
        const login = sessionData.login;
        const userSnap = await usersRef.child(login).get();
        if(!userSnap.exists()) {
            localStorage.removeItem("skyfire_session_token");
            authOverlay.style.display = 'flex';
            return;
        }
        currentUser = login; currentSessionToken = token;
        const userData = userSnap.val();
        const age = Date.now() - sessionData.createdAt;
        if(age > 30*24*3600*1000) {
            await sessionsRef.child(token).remove();
            localStorage.removeItem("skyfire_session_token");
            authOverlay.style.display = 'flex';
            return;
        }
        if(userData.keyUsed) { loadGameForUser(userData); }
        else {
            authOverlay.style.display = 'flex';
            authTitle.innerText = "АКТИВАЦИЯ ЛИЦЕНЗИИ";
            authSub.innerText = "Активация лицензионного ключа";
            authLogin.style.display = 'none'; authPassword.style.display = 'none';
            toggleLink.style.display = 'none';
            authMessage.innerText = "Введите лицензионный ключ";
            showKeyInput();
        }
    } catch(err) { console.error("Ошибка восстановления сессии:", err); authOverlay.style.display = 'flex'; }
}

async function logout() {
    if(window.saveInterval) clearInterval(window.saveInterval);
    if(currentUser) {
        const data = JSON.stringify({ 
            playerXP: window.playerXP, 
            playerStats: window.playerStats, 
            pvoUnits: window.pvoUnits, 
            pvoStaffBuilt: window.pvoStaffBuilt 
        });
        await usersRef.child(currentUser).update({ gameData: data });
    }
    if(currentSessionToken) await sessionsRef.child(currentSessionToken).remove();
    localStorage.removeItem("skyfire_session_token");
    currentUser = null; currentSessionToken = null;
    location.reload();
}

authSubmitBtn.onclick = async () => {
    if(authKeyGroup.style.display === 'block') await activateKey(authKey.value.trim());
    else if(isLoginMode) await login(authLogin.value.trim(), authPassword.value.trim());
    else register(authLogin.value.trim(), authPassword.value.trim());
};
toggleLink.onclick = toggleMode;
restoreSession();
