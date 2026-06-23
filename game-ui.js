// ============================================================
// UI-КОМПОНЕНТЫ И ОБРАБОТЧИКИ
// ============================================================

// ---- Модальное окно атаки ----
let currentAirport = null;

function buildWeaponGrid(){
    let container = document.getElementById('weaponGrid'); if(!container) return;
    container.innerHTML = '';
    let available = getAvailableWeapons(myTeam);
    available.sort((a, b) => weaponTypes[a].cost - weaponTypes[b].cost);
    available.forEach(type => {
        let w = weaponTypes[type];
        let card = document.createElement('div');
        card.className = 'weapon-card';
        if(attackType === type) card.classList.add('selected');
        let imgSrc = getMissileImage(type, myTeam);
        card.innerHTML = `<img src="${imgSrc}" alt="${w.name}" onerror="this.style.display='none'"><div class="weapon-name">${w.name}</div><div class="weapon-stats">💥 Урон: ${w.damage}<br>⚡ Цена: ${w.cost}</div>`;
        card.onclick = () => { attackType = type; updateCostDisplay(); document.querySelectorAll('.weapon-card').forEach(c=>c.classList.remove('selected')); card.classList.add('selected'); };
        container.appendChild(card);
    });
    if (!attackType || !available.includes(attackType)) {
        if (available.length > 0) {
            attackType = available[0];
            document.querySelectorAll('.weapon-card').forEach(c => c.classList.remove('selected'));
            const firstCard = container.querySelector('.weapon-card');
            if (firstCard) firstCard.classList.add('selected');
            updateCostDisplay();
        }
    }
}
function updateCostDisplay(){ let w = weaponTypes[attackType]; document.getElementById('costDisplay').innerHTML = `СТОИМОСТЬ: ${w.cost * attackCount} ⚡`; }
function closeAttackModal(){ document.getElementById('attackModal').style.display='none'; }
function showAttackModal(airport){
    currentAirport = airport;
    let targets = getEnemyTargets();
    if (targets.length === 0) { alert("Нет вражеских целей!"); return; }
    let select = document.getElementById('targetSelect');
    select.innerHTML = '';
    targets.forEach(t => {
        let opt = document.createElement('option');
        opt.value = t.id;
        opt.setAttribute('data-type', t.type);
        opt.textContent = t.display;
        select.appendChild(opt);
    });
    attackType = getAvailableWeapons(myTeam)[0];
    attackCount = 1;
    document.getElementById('countValue').innerText = attackCount;
    updateCostDisplay();
    buildWeaponGrid();
    document.getElementById('attackModal').style.display = 'block';
}
document.getElementById('countMinus').onclick = () => { if (attackCount > 1) attackCount--; document.getElementById('countValue').innerText = attackCount; updateCostDisplay(); };
document.getElementById('countPlus').onclick = () => { if (attackCount < 5) attackCount++; document.getElementById('countValue').innerText = attackCount; updateCostDisplay(); };
document.getElementById('attackCancelBtn').onclick = closeAttackModal;
document.getElementById('attackConfirmBtn').onclick = function() {
    let select = document.getElementById('targetSelect');
    let targetId = select.value;
    let targetType = select.options[select.selectedIndex].getAttribute('data-type');
    let target;
    if (targetType === 'zone') {
        let z = zones.find(z => z.id === targetId);
        if (!z) { alert("Цель не найдена"); return; }
        target = { id: z.id, type: 'zone', lat: z.center[0], lng: z.center[1] };
    } else if (targetType === 'pvo') {
        let p = pvoUnits.find(pv => pv.id === targetId);
        if (!p) { alert("Цель не найдена"); return; }
        target = { id: p.id, type: 'pvo', lat: p.lat, lng: p.lng };
    } else {
        let b = buildings.find(b => b.id == targetId);
        if (!b) { alert("Цель не найдена"); return; }
        target = { id: b.id, type: 'building', lat: b.lat, lng: b.lng };
    }
    if (currentAirport) launchAttack(currentAirport, target, attackType, attackCount);
    closeAttackModal();
};

// ---- ШТАБ ПВО (UI) ----
const pvoModal = document.getElementById('pvoModal');
const closePvoBtn = document.getElementById('closePvoModal');
const pvoGrid = document.getElementById('pvoGrid');
const pvoInfoPanel = document.getElementById('pvoInfoPanel');
const pvoEnergyDisplay = document.getElementById('pvoEnergyDisplay');
const pvoDeployBtn = document.getElementById('pvoDeployBtn');
const pvoCancelBtn = document.getElementById('pvoCancelBtn');
let selectedPvoType = null;

function openPvoModal() {
    if(!pvoStaffBuilt){ alert("Сначала постройте Штаб ПВО через панель 'Стройка'"); return; }
    pvoModal.style.display = 'block';
    renderPvoGrid();
    updatePvoInfo();
    selectedPvoType = null;
}
function closePvoModal() { pvoModal.style.display = 'none'; }
closePvoBtn.onclick = closePvoModal;
window.addEventListener('click', function(e) { if (e.target === pvoModal) closePvoModal(); });

function renderPvoGrid() {
    pvoGrid.innerHTML = '';
    for(let key in pvoTypes) {
        const pvo = pvoTypes[key];
        const card = document.createElement('div');
        card.className = 'pvo-card';
        if(selectedPvoType === key) card.classList.add('selected');
        const chanceDrone = Math.round(pvo.chances.shahed * 100);
        const chanceMissile = Math.round(pvo.chances.x101 * 100);
        const chanceBallistic = Math.round(pvo.chances.iskander * 100);
        const costDisplay = isSandbox ? '0' : pvo.cost;
        card.innerHTML = `
            <img src="${pvo.icon}" alt="${pvo.name}" onerror="this.style.display='none'">
            <div class="pvo-info">
                <div class="name">${pvo.name}</div>
                <div class="stats">
                    <span class="range">📡 ${pvo.range} км</span>
                    <span class="cost">⚡ ${costDisplay}</span>
                    <span class="chance">🎯 Дрон: ${chanceDrone}%</span>
                    <span class="chance">🎯 Крылатая: ${chanceMissile}%</span>
                    <span class="chance">🎯 Баллистическая: ${chanceBallistic}%</span>
                </div>
            </div>
            <div class="badge">${pvo.burstCount > 1 ? 'Залп' : 'Одиночный'}</div>
        `;
        card.onclick = function() { selectedPvoType = key; renderPvoGrid(); updatePvoInfo(); };
        pvoGrid.appendChild(card);
    }
}
function updatePvoInfo() {
    pvoEnergyDisplay.textContent = isSandbox ? '∞' : Math.floor(resources);
    let infoText = '', costText = '';
    if(selectedPvoType) {
        const pvo = pvoTypes[selectedPvoType];
        const cost = isSandbox ? 0 : pvo.cost;
        infoText = `Выбран: ${pvo.name}`;
        costText = `Стоимость: ${cost} ⚡`;
    } else {
        infoText = 'Выберите тип ПВО';
        costText = '';
    }
    document.querySelector('#pvoInfoPanel span:first-child').textContent = infoText;
    const costSpan = document.querySelector('#pvoInfoPanel span:last-child');
    if (costText) {
        costSpan.textContent = costText + '  ⚡ Энергия: ' + (isSandbox ? '∞' : Math.floor(resources));
    } else {
        costSpan.textContent = '⚡ Энергия: ' + (isSandbox ? '∞' : Math.floor(resources));
    }
}
pvoDeployBtn.onclick = function() {
    if(!selectedPvoType) { alert("Сначала выберите тип ПВО"); return; }
    enterPlacementMode(selectedPvoType);
    closePvoModal();
};
pvoCancelBtn.onclick = closePvoModal;

// ---- Тосты и оповещения ----
function showToast(message, type = 'warning', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'danger' ? '🚨' : '⚠️';
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-text">${message}</span>
        <span class="toast-time">${new Date().toLocaleTimeString()}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

function showThreatAlert(region, seconds) {
    const panel = document.getElementById("threatAlert");
    const timer = document.getElementById("threatTimer");
    const regionEl = document.getElementById("threatRegion");
    const progress = document.getElementById("threatProgress");
    if (!panel || !timer || !regionEl || !progress) return;
    regionEl.textContent = region;
    panel.classList.add("show");
    panel.classList.remove("critical");
    let remain = seconds;
    const startSeconds = seconds;
    if (window._threatInterval) clearInterval(window._threatInterval);
    window._threatInterval = setInterval(() => {
        timer.textContent = `До удара: ${remain} сек`;
        progress.style.width = (remain / startSeconds * 100) + "%";
        if (remain <= 10) {
            panel.classList.add("critical");
        }
        if (remain <= 0) {
            clearInterval(window._threatInterval);
            panel.querySelector(".threat-title").textContent = "💥 ПОПАДАНИЕ";
            timer.textContent = "Объект получил повреждения";
            progress.style.width = "0%";
            setTimeout(() => {
                panel.classList.remove("show", "critical");
                panel.querySelector(".threat-title").textContent = "🚨 РАКЕТНАЯ ОПАСНОСТЬ";
            }, 3000);
        }
        remain--;
    }, 1000);
}

// ---- Кнопки стройки ----
const buildToggle = document.getElementById('buildToggle');
const buildMenu = document.getElementById('buildMenu');
let buildMenuOpen = false;
buildToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    buildMenuOpen = !buildMenuOpen;
    buildMenu.classList.toggle('open', buildMenuOpen);
    buildToggle.textContent = buildMenuOpen ? '🏗️ Закрыть' : '🏗️ Стройка';
});
document.querySelectorAll('#buildMenu .build-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        if (buildMenuOpen) {
            buildMenu.classList.remove('open');
            buildMenuOpen = false;
            buildToggle.textContent = '🏗️ Стройка';
        }
    });
});
document.getElementById('buildRadarBtn').onclick = () => { buildMode = 'radar'; };
document.getElementById('buildPvoStaffBtn').onclick = function() {
    if (!gameActive) { alert("Игра не начата"); return; }
    if (!airportPlaced) { alert("Сначала постройте аэродром!"); return; }
    buildMode = 'pvoStaff';
    showHint("Кликните на карту, чтобы построить Штаб ПВО");
};
document.getElementById('buildPowerPlantBtn').onclick = () => { buildMode = 'powerPlant'; };
document.getElementById('buildRefineryBtn').onclick = () => { buildMode = 'refinery'; };
document.getElementById('buildRocketFactoryBtn').onclick = () => { buildMode = 'rocketFactory'; };
document.getElementById('cancelBuild').onclick = () => { buildMode = null; };

// ---- Кнопки меню ----
document.getElementById('singleBtn').onclick = function() {
    if (!currentUser) { alert("Сначала войдите в аккаунт!"); return; }
    playBeep(400, 0.1);
    setTimeout(() => {
        playBeep(600, 0.1);
        setTimeout(() => {
            playBeep(800, 0.1);
            showSetupModal('single');
        }, 100);
    }, 100);
};
document.getElementById('sandboxBtn').onclick = function() {
    if (!currentUser) { alert("Сначала войдите в аккаунт!"); return; }
    playBeep(400, 0.1);
    setTimeout(() => {
        playBeep(600, 0.1);
        setTimeout(() => {
            playBeep(800, 0.1);
            showSetupModal('sandbox');
        }, 100);
    }, 100);
};
document.getElementById('logoutBtn').onclick = logout;

// ---- Настройка игры (UI) ----
let setupDifficulty = 'NORMAL';
let setupMode = 'single';
let selectedCityNames = [];
let selectedCountry = 'russia';

function showSetupModal(mode) {
    setupMode = mode;
    const modal = document.getElementById('setupModal');
    populateCityLists();
    document.querySelectorAll('.country-btn-modal').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.country === selectedCountry);
    });
    document.querySelectorAll('.difficulty-btn-modal').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.diff === setupDifficulty);
    });
    modal.style.display = 'block';
}

document.querySelectorAll('.country-btn-modal').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.country-btn-modal').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        selectedCountry = this.dataset.country;
    });
});
document.querySelectorAll('.difficulty-btn-modal').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.difficulty-btn-modal').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        setupDifficulty = this.dataset.diff;
    });
});
document.getElementById('closeSetupModal').onclick = function() {
    document.getElementById('setupModal').style.display = 'none';
};
window.addEventListener('click', function(e) {
    if (e.target === document.getElementById('setupModal')) {
        document.getElementById('setupModal').style.display = 'none';
    }
});
document.getElementById('startGameBtn').onclick = function() {
    const modal = document.getElementById('setupModal');
    modal.style.display = 'none';
    const checkboxes = modal.querySelectorAll('.city-list input[type="checkbox"]');
    selectedCityNames = [];
    checkboxes.forEach(cb => { if (cb.checked) selectedCityNames.push(cb.value); });
    if (selectedCityNames.length < 2) {
        alert("Выберите хотя бы 2 города (в обеих странах)");
        return;
    }
    const preparedCities = prepareCities(selectedCityNames);
    isSandbox = (setupMode === 'sandbox');
    isAI = true;
    isMultiplayer = false;
    myTeam = selectedCountry;
    enemyTeam = (myTeam === 'russia') ? 'ukraine' : 'russia';
    initGameMapAndLogic(preparedCities);
};

// ---- Мультиплеер UI ----
document.getElementById('multiplayerBtn').onclick = function() {
    const controls = document.getElementById('multiplayerControls');
    controls.style.display = controls.style.display === 'none' ? 'block' : 'none';
};
document.getElementById('createRoomBtn').onclick = function() {
    if (!currentUser) { alert("Сначала войдите в аккаунт!"); return; }
    const roomId = generateRoomId();
    const gameData = {
        host: currentUser,
        players: {
            [currentUser]: { team: 'russia', ready: false, resources: 300, elo: 1000 }
        },
        status: 'waiting',
        starting: false,
        createdAt: Date.now(),
        gameState: {
            zones: [],
            buildings: [],
            pvoUnits: [],
            projectiles: [],
            pvoStaffBuilt: false
        }
    };
    const allCitiesWithHp = prepareCities(allCities.map(c => c.name));
    gameData.gameState.zones = allCitiesWithHp.map(z => ({ id: z.name, hp: z.hp }));
    gamesRef.child(roomId).set(gameData).then(() => {
        currentRoomId = roomId;
        isHost = true;
        document.getElementById('roomDisplay').innerHTML = `Комната создана! Код: <b>${roomId}</b>`;
        document.getElementById('multiplayerControls').style.display = 'none';
        enterLobby(roomId);
    }).catch(err => alert("Ошибка создания комнаты: " + err.message));
};
document.getElementById('joinRoomBtn').onclick = function() {
    const roomId = document.getElementById('roomCodeInput').value.trim().toUpperCase();
    if (!roomId) { alert("Введите код комнаты"); return; }
    if (!currentUser) { alert("Сначала войдите в аккаунт!"); return; }
    gamesRef.child(roomId).once('value').then(snapshot => {
        if (!snapshot.exists()) { alert("Комната не найдена!"); return; }
        const data = snapshot.val();
        if (data.status === 'playing') { alert("Игра уже началась!"); return; }
        if (data.players && data.players[currentUser]) { alert("Вы уже в этой комнате!"); return; }
        const teams = Object.values(data.players).map(p => p.team);
        let myTeam = 'ukraine';
        if (!teams.includes('russia')) myTeam = 'russia';
        else if (!teams.includes('ukraine')) myTeam = 'ukraine';
        else { alert("В комнате уже два игрока!"); return; }
        const updates = {};
        updates[`players/${currentUser}`] = { team: myTeam, ready: false, resources: 300 };
        gamesRef.child(roomId).update(updates).then(() => {
            currentRoomId = roomId;
            isHost = false;
            document.getElementById('roomDisplay').innerHTML = `Подключено к комнате: <b>${roomId}</b>`;
            document.getElementById('multiplayerControls').style.display = 'none';
            enterLobby(roomId);
        });
    }).catch(err => alert("Ошибка подключения: " + err.message));
};
document.getElementById('copyRoomCodeBtn').onclick = function() {
    const code = document.getElementById('lobbyRoomCode').innerText;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
            showCopyNotification('✅ Код скопирован!');
        }).catch(() => {
            fallbackCopy(code);
        });
    } else {
        fallbackCopy(code);
    }
};
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showCopyNotification('✅ Код скопирован!');
    } catch (e) {
        alert('Не удалось скопировать код. Скопируйте его вручную: ' + text);
    }
    document.body.removeChild(textarea);
}
function showCopyNotification(msg) {
    const el = document.getElementById('copyNotification');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2500);
}

function enterLobby(roomId) {
    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('lobbyScreen').style.display = 'flex';
    document.getElementById('lobbyRoomCode').innerText = roomId;
    gamesRef.child(roomId).child('players').child(currentUser).onDisconnect().remove();
    if (gameListenerRef) gameListenerRef.off();
    gameListenerRef = gamesRef.child(roomId);
    gameListenerRef.on('value', snapshot => {
        const data = snapshot.val();
        if (!data) {
            alert("Комната удалена!");
            leaveLobby();
            return;
        }
        updateLobbyUI(data);
        if (data.status === 'playing' && !mpInitDone) {
            mpInitDone = true;
            startMultiplayerGame(roomId, data);
        }
    });
    if (isHost) {
        if (roomCleanupInterval) clearInterval(roomCleanupInterval);
        roomCleanupInterval = setInterval(() => {
            gamesRef.once('value', snap => {
                const all = snap.val();
                if (!all) return;
                const now = Date.now();
                Object.keys(all).forEach(key => {
                    const room = all[key];
                    if (room && room.createdAt && (now - room.createdAt) > 24*3600*1000) {
                        gamesRef.child(key).remove();
                    }
                });
            });
        }, 60000);
    }
}

function updateLobbyUI(data) {
    const players = data.players || {};
    const playerNames = Object.keys(players);
    const p1 = playerNames[0] || '—';
    const p2 = playerNames[1] || '—';
    const p1Team = players[p1]?.team || '—';
    const p2Team = players[p2]?.team || '—';
    const p1Ready = players[p1]?.ready ? '✅' : '⚪';
    const p2Ready = players[p2]?.ready ? '✅' : '⚪';
    document.getElementById('player1Name').textContent = p1;
    document.getElementById('player1Team').textContent = p1Team === 'russia' ? '🇷🇺' : '🇺🇦';
    document.getElementById('player1Ready').textContent = p1Ready;
    document.getElementById('player2Name').textContent = p2;
    document.getElementById('player2Team').textContent = p2Team === 'russia' ? '🇷🇺' : '🇺🇦';
    document.getElementById('player2Ready').textContent = p2Ready;
    const allReady = Object.values(players).every(p => p.ready);
    const count = playerNames.length;
    const statusEl = document.getElementById('lobbyStatus');
    if (data.status === 'playing') {
        statusEl.textContent = '🎮 Игра началась!';
        statusEl.className = 'playing';
    } else if (data.starting) {
        statusEl.textContent = '⏳ Запуск игры...';
        statusEl.className = 'waiting';
    } else if (count < 2) {
        statusEl.textContent = '⏳ Ожидание второго игрока...';
        statusEl.className = 'waiting';
    } else if (allReady) {
        statusEl.textContent = '✅ Все готовы! Игра начинается...';
        statusEl.className = 'ready';
        if (isHost && data.status !== 'playing' && !data.starting) {
            gamesRef.child(currentRoomId).update({ starting: true });
            setTimeout(() => {
                gamesRef.child(currentRoomId).update({ status: 'playing' });
            }, 2000);
        }
    } else {
        statusEl.textContent = '🔄 Ожидание готовности...';
        statusEl.className = 'waiting';
    }
    const readyBtn = document.getElementById('readyBtn');
    if (data.status === 'playing' || data.starting) {
        readyBtn.style.display = 'none';
    } else if (players[currentUser]) {
        readyBtn.style.display = 'block';
        const isReady = players[currentUser].ready;
        readyBtn.textContent = isReady ? '❌ ОТМЕНА' : 'ГОТОВ';
        readyBtn.disabled = false;
        readyBtn.onclick = function() {
            const newReady = !isReady;
            gamesRef.child(currentRoomId).child(`players/${currentUser}/ready`).set(newReady);
        };
    } else {
        readyBtn.style.display = 'none';
    }
}

document.getElementById('leaveLobbyBtn').onclick = function() {
    leaveLobby();
};

function leaveLobby() {
    mpInitDone = false;
    if (gameListenerRef) { gameListenerRef.off(); gameListenerRef = null; }
    if (gameStateListenerRef) { gameStateListenerRef.off(); gameStateListenerRef = null; }
    if (currentRoomId) {
        gamesRef.child(currentRoomId).child('players').child(currentUser).onDisconnect().cancel();
        if (isHost) {
            gamesRef.child(currentRoomId).remove().catch(()=>{});
        } else {
            gamesRef.child(currentRoomId).child(`players/${currentUser}`).remove().catch(()=>{});
        }
        currentRoomId = null;
        isHost = false;
    }
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('menuScreen').style.display = 'flex';
    document.getElementById('multiplayerControls').style.display = 'none';
    document.getElementById('roomDisplay').innerHTML = '';
}

// ---- Рейтинг (UI) ----
document.getElementById('rankBtn').onclick = function() {
    document.getElementById('rankModal').style.display = 'block';
    loadRanking();
};
document.getElementById('closeRankModal').onclick = function() {
    document.getElementById('rankModal').style.display = 'none';
};
window.addEventListener('click', function(e) {
    if (e.target === document.getElementById('rankModal')) {
        document.getElementById('rankModal').style.display = 'none';
    }
});
async function loadRanking() {
    const list = document.getElementById('rankList');
    list.innerHTML = '<li style="text-align:center; color:#888; padding:20px;">Загрузка...</li>';
    try {
        const snapshot = await usersRef.once('value');
        const data = snapshot.val();
        if (!data) {
            list.innerHTML = '<li class="no-players">Нет игроков</li>';
            return;
        }
        const players = Object.keys(data).map(key => ({
            login: key,
            elo: data[key].elo || 1000
        })).sort((a,b) => b.elo - a.elo);
        const top = players.slice(0, 10);
        list.innerHTML = '';
        top.forEach((p, index) => {
            const li = document.createElement('li');
            const rankSpan = document.createElement('span');
            rankSpan.innerHTML = `<span class="rank">#${index+1}</span> ${p.login}`;
            const eloSpan = document.createElement('span');
            eloSpan.className = 'elo';
            eloSpan.textContent = p.elo;
            li.appendChild(rankSpan);
            li.appendChild(eloSpan);
            list.appendChild(li);
        });
    } catch(e) {
        console.error('Ошибка загрузки рейтинга:', e);
        list.innerHTML = '<li class="no-players">Ошибка загрузки</li>';
    }
}

// ---- Обучение (UI) ----
let isTutorial = false;
let tutorialStep = 0;
let tutorialMission = null;
let tutorialHintElement = null;
let tutorialCheckInterval = null;
function createTutorialHint() {
    if (document.getElementById('tutorialHint')) return;
    const div = document.createElement('div');
    div.id = 'tutorialHint';
    document.body.appendChild(div);
    tutorialHintElement = div;
}
function showTutorialHint(text, duration = 8000) {
    if (!tutorialHintElement) createTutorialHint();
    tutorialHintElement.textContent = text;
    tutorialHintElement.style.display = 'block';
    if (duration > 0) {
        clearTimeout(tutorialHintElement._timeout);
        tutorialHintElement._timeout = setTimeout(() => {
            tutorialHintElement.style.display = 'none';
        }, duration);
    }
}
function hideTutorialHint() {
    if (tutorialHintElement) tutorialHintElement.style.display = 'none';
}
const tutorialMissions = [
    {
        id: 'airport',
        title: 'Миссия 1: Аэродром',
        description: 'Постройте аэродром на своей территории',
        steps: [
            {
                text: 'Кликните на карте в пределах вашей страны (подсвечена), чтобы поставить аэродром.',
                check: () => airportPlaced === true,
                onComplete: () => {
                    showTutorialHint('✅ Отлично! Аэродром построен. Теперь постройте радар.', 8000);
                }
            }
        ]
    },
    {
        id: 'radar',
        title: 'Миссия 2: Радар',
        description: 'Постройте радар для обнаружения целей',
        steps: [
            {
                text: 'Откройте панель "Стройка" (кнопка внизу слева) и выберите "РАДАР". Затем кликните на карте рядом с аэродромом.',
                check: () => radars.some(r => r.team === myTeam),
                onComplete: () => {
                    showTutorialHint('✅ Радар построен! Теперь вражеские цели будут видны. Переходим к ПВО.', 8000);
                }
            }
        ]
    },
    {
        id: 'pvo_staff',
        title: 'Миссия 3: Штаб ПВО',
        description: 'Постройте Штаб ПВО и разместите комплекс "Стрела-10"',
        steps: [
            {
                text: 'Постройте Штаб ПВО (в панели "Стройка" кнопка "ШТАБ ПВО"). Кликните на карте.',
                check: () => pvoStaffBuilt === true,
                onComplete: () => {
                    showTutorialHint('✅ Штаб построен! Теперь откройте его кликом по иконке и разместите ПВО.', 8000);
                }
            },
            {
                text: 'Кликните на Штаб ПВО (иконка 🏛️), выберите комплекс "Стрела-10" и нажмите "РАЗМЕСТИТЬ". Затем кликните на карте рядом с городом.',
                check: () => pvoUnits.some(p => p.team === myTeam && p.type === 'strela10'),
                onComplete: () => {
                    showTutorialHint('✅ ПВО размещено! Теперь мы готовы отразить атаку.', 8000);
                }
            }
        ]
    },
    {
        id: 'intercept',
        title: 'Миссия 4: Отражение атаки',
        description: 'Отразите налёт 15 БПЛА',
        steps: [
            {
                text: 'Внимание! Через 5 секунд на ваш город вылетит 15 дронов-камикадзе. Ваше ПВО будет работать автоматически, наблюдайте.',
                check: () => true,
                onComplete: () => {},
                action: () => {
                    setTimeout(() => {
                        launchDroneWave(15);
                        showTutorialHint('🚨 15 БПЛА приближаются! ПВО начинает перехват...', 8000);
                    }, 5000);
                }
            },
            {
                text: 'Дроны уничтожены! Вы успешно отразили атаку. Переходим к ответному удару.',
                check: () => {
                    const waveDrones = projectiles.filter(p => p.wave === 'tutorial' && p.team === enemyTeam);
                    return waveDrones.length === 0 && waveDrones.every(p => !p.active);
                },
                onComplete: () => {
                    showTutorialHint('✅ Отлично! Теперь научимся атаковать врага.', 8000);
                }
            }
        ]
    },
    {
        id: 'attack',
        title: 'Миссия 5: Ответный удар',
        description: 'Нанесите удар по вражескому городу',
        steps: [
            {
                text: 'Кликните на свой аэродром, чтобы открыть меню атаки. Выберите цель — любой город противника, и запустите 1 ракету (например, "ШАХЕД").',
                check: () => {
                    const enemyZones = zones.filter(z => z.team !== myTeam);
                    return enemyZones.some(z => z.hp < z.baseHp);
                },
                onComplete: () => {
                    showTutorialHint('🎉 Поздравляем! Вы прошли все миссии обучения. Теперь вы готовы к реальным сражениям!', 8000);
                    setTimeout(() => {
                        if (confirm('Обучение завершено! Вернуться в главное меню?')) {
                            location.reload();
                        }
                    }, 3000);
                }
            }
        ]
    }
];
function launchDroneWave(count) {
    const enemyCity = zones.find(z => z.team === enemyTeam && z.name === 'МОСКВА');
    if (!enemyCity) {
        const fallback = zones.find(z => z.team === enemyTeam);
        if (!fallback) return;
        const target = fallback;
        const from = { lat: target.center[0] + 2, lng: target.center[1] + 2 };
        for (let i = 0; i < count; i++) {
            const offset = (i - (count-1)/2) * 0.05;
            const lat = from.lat + offset * 0.5;
            const lng = from.lng + offset * 0.3;
            const to = { lat: target.center[0] + offset * 0.2, lng: target.center[1] + offset * 0.1 };
            const type = 'shahed';
            const speed = 0.008;
            const damage = 10;
            const proj = {
                id: Date.now() + Math.random() + i,
                from: from,
                to: to,
                progress: 0,
                speed: speed,
                damage: damage,
                team: enemyTeam,
                targetType: 'zone',
                targetId: target.id,
                type: type,
                active: true,
                marker: null,
                lastInterceptCheck: 0,
                interceptedFlag: false,
                angle: 0,
                wave: 'tutorial',
                launchTime: Date.now()
            };
            const marker = L.marker([from.lat, from.lng], {
                icon: getMissileIcon(type, enemyTeam),
                rotationOrigin: 'center center'
            }).addTo(map);
            proj.marker = marker;
            projectiles.push(proj);
        }
        return;
    }
    const myCity = zones.find(z => z.team === myTeam && z.name === 'КИЕВ') || getMyCities()[0];
    if (!myCity) return;
    const targetLat = myCity.center[0];
    const targetLng = myCity.center[1];
    const fromLat = enemyCity.center[0] + (Math.random() - 0.5) * 0.5;
    const fromLng = enemyCity.center[1] + (Math.random() - 0.5) * 0.5;
    const from = { lat: fromLat, lng: fromLng };
    for (let i = 0; i < count; i++) {
        const offset = (i - (count-1)/2) * 0.05;
        const lat = from.lat + offset * 0.5;
        const lng = from.lng + offset * 0.3;
        const to = { lat: targetLat + offset * 0.2, lng: targetLng + offset * 0.1 };
        const type = 'shahed';
        const speed = 0.008;
        const damage = 10;
        const proj = {
            id: Date.now() + Math.random() + i,
            from: from,
            to: to,
            progress: 0,
            speed: speed,
            damage: damage,
            team: enemyTeam,
            targetType: 'zone',
            targetId: myCity.id,
            type: type,
            active: true,
            marker: null,
            lastInterceptCheck: 0,
            interceptedFlag: false,
            angle: 0,
            wave: 'tutorial',
            launchTime: Date.now()
        };
        const marker = L.marker([from.lat, from.lng], {
            icon: getMissileIcon(type, enemyTeam),
            rotationOrigin: 'center center'
        }).addTo(map);
        proj.marker = marker;
        projectiles.push(proj);
    }
}
function startTutorial() {
    if (!currentUser) { alert("Сначала войдите в аккаунт!"); return; }
    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    if (map) map.remove();
    buildMode = null;
    pvoPlacementMode = false;
    pvoPlacementType = null;
    const tutorialCities = allCities.filter(c => c.name === 'КИЕВ' || c.name === 'МОСКВА');
    const extra = allCities.filter(c => c.name === 'ХАРЬКОВ' || c.name === 'БЕЛГОРОД');
    const citySet = [...tutorialCities, ...extra];
    citySet.forEach(c => { c.hp = 500; c.baseHp = 500; });
    isTutorial = true;
    isAI = false;
    isMultiplayer = false;
    isSandbox = false;
    myTeam = 'ukraine';
    enemyTeam = 'russia';
    map = L.map('map', { zoomControl: false }).setView([50.0, 30.0], 5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '© CartoDB' }).addTo(map);
    loadRealBorders(() => {
        zones = [];
        citySet.forEach(c => {
            let circle = L.circle(c.center, { radius: 15000, color: c.team === 'russia' ? '#ff5555' : '#55aaff', weight: 2, fillOpacity: 0.25 }).addTo(map);
            let marker = L.marker(c.center, { icon: createCityMarker(c) }).addTo(map);
            zones.push({ id: c.name, name: c.name, center: c.center, team: c.team, hp: c.hp, baseHp: c.baseHp, circle, marker });
        });
        updateZoneMarkers();
        buildings = [];
        radars = [];
        powerPlants = [];
        refineries = [];
        rocketFactories = [];
        pvoUnits = [];
        pvoStaffBuilt = false;
        airportPlaced = false;
        airportMarker = null;
        resources = 9999;
        updateUI();
        if (economyInterval) clearInterval(economyInterval);
        economyInterval = setInterval(() => {}, 1000);
        map.off('click');
        map.on('click', (e) => {
            if (!tutorialMission) return;
            if (!airportPlaced && tutorialMission.id === 'airport') {
                let lat = e.latlng.lat, lng = e.latlng.lng;
                if (!isOwnTerritory(lat, lng)) { showTutorialHint('❌ Поставьте аэродром на своей территории (Украина)!', 3000); return; }
                let icon = getAirportIcon();
                airportMarker = L.marker([lat, lng], { icon }).addTo(map);
                airportMarker.bindPopup('<b>АЭРОДРОМ</b>');
                airportMarker.on('click', () => showAttackModal(airportMarker));
                airportPlaced = true;
                gameActive = true;
                lastUpdate = performance.now();
                startRadarAnimation();
                requestAnimationFrame(gameLoop);
                showTutorialHint('✅ Аэродром построен! Переходим к следующему шагу.', 8000);
                checkTutorialStep();
                return;
            }
            if (buildMode) {
                if (!isOwnTerritory(e.latlng.lat, e.latlng.lng)) { showTutorialHint('❌ Стройте только на своей территории!', 3000); return; }
                const result = tryBuild(e.latlng.lat, e.latlng.lng, buildMode);
                if (result) { buildMode = null; checkTutorialStep(); }
                return;
            }
            if (pvoPlacementMode && pvoPlacementType) {
                const lat = e.latlng.lat, lng = e.latlng.lng;
                if (!isOwnTerritory(lat, lng)) { showTutorialHint('❌ Размещайте ПВО на своей территории!', 3000); return; }
                let nearestCity = null, minDist = Infinity;
                for (const city of getMyCities()) {
                    const d = map.distance([lat, lng], city.center);
                    if (d < minDist) { minDist = d; nearestCity = city; }
                }
                const cityName = nearestCity ? nearestCity.name : 'Полевая позиция';
                const success = deployPvo(pvoPlacementType, cityName, lat, lng);
                if (success) { exitPlacementMode(); checkTutorialStep(); }
                return;
            }
            if (tutorialMission) {
                const currentStep = tutorialMission.steps[tutorialStep];
                if (currentStep) showTutorialHint(currentStep.text, 8000);
            }
        });
        startMission(0);
    });
}
function startMission(index) {
    if (index >= tutorialMissions.length) {
        showTutorialHint('🏁 Все миссии пройдены! Вы великолепны!', 8000);
        return;
    }
    tutorialMission = tutorialMissions[index];
    tutorialStep = 0;
    showTutorialHint(`📖 ${tutorialMission.title}\n${tutorialMission.description}`, 8000);
    setTimeout(() => {
        const step = tutorialMission.steps[0];
        if (step) showTutorialHint(step.text, 8000);
        if (step.action) step.action();
    }, 1000);
    if (tutorialCheckInterval) clearInterval(tutorialCheckInterval);
    tutorialCheckInterval = setInterval(checkTutorialStep, 2000);
}
function checkTutorialStep() {
    if (!tutorialMission) return;
    const steps = tutorialMission.steps;
    if (tutorialStep >= steps.length) {
        completeMission();
        return;
    }
    const step = steps[tutorialStep];
    if (step.check && step.check()) {
        if (step.onComplete) step.onComplete();
        tutorialStep++;
        if (tutorialStep < steps.length) {
            const nextStep = steps[tutorialStep];
            setTimeout(() => {
                showTutorialHint(nextStep.text, 8000);
                if (nextStep.action) nextStep.action();
            }, 1500);
        } else {
            completeMission();
        }
    }
}
function completeMission() {
    clearInterval(tutorialCheckInterval);
    const currentIndex = tutorialMissions.indexOf(tutorialMission);
    if (currentIndex < tutorialMissions.length - 1) {
        showTutorialHint(`✅ Миссия "${tutorialMission.title}" пройдена! Следующая миссия начнётся через 3 секунды.`, 8000);
        setTimeout(() => {
            startMission(currentIndex + 1);
        }, 3500);
    } else {
        showTutorialHint('🎉 Вы прошли все миссии обучения! Теперь вы готовы к бою!', 8000);
        setTimeout(() => {
            if (confirm('Обучение завершено! Вернуться в главное меню?')) {
                location.reload();
            }
        }, 3000);
    }
}
document.getElementById('tutorialBtn').onclick = function() {
    startTutorial();
};

// ---- Эло ----
async function updateElo(win, mode) {
    if (!currentUser) return;
    let eloChange = 0;
    if (mode === 'multiplayer') {
        eloChange = win ? 30 : -15;
    } else {
        switch (setupDifficulty) {
            case 'EASY': eloChange = win ? 10 : -5; break;
            case 'NORMAL': eloChange = win ? 20 : -10; break;
            case 'HARD': eloChange = win ? 30 : -15; break;
            case 'EXTREME': eloChange = win ? 50 : -25; break;
            default: eloChange = win ? 20 : -10;
        }
    }
    const userRef = usersRef.child(currentUser);
    const snap = await userRef.get();
    if (!snap.exists()) return;
    const currentElo = snap.val().elo || 1000;
    const newElo = Math.max(0, currentElo + eloChange);
    await userRef.update({ elo: newElo });
}

// ---- Инициализация ----
// После загрузки всё должно работать. В index.html подключены все скрипты.
console.log("✅ UI загружен. ПВО больше не сбивает свои цели, AI ставит ПВО.");
