// ============================================================
// ОСНОВНЫЕ ПЕРЕМЕННЫЕ И КОНСТАНТЫ (игровой движок)
// ============================================================
let map, gameActive = false;
let resources = 300;
let buildings = [], zones = [], projectiles = [];
let radars = [], powerPlants = [], refineries = [], rocketFactories = [];
let pvoUnits = [];
let pvoStaffBuilt = false;
let buildMode = null;
let airportMarker = null;
let airportPlaced = false;
let lastUpdate = 0;
let myTeam = null, enemyTeam = null;
let isAI = false;
let isSandbox = false;
let russiaGeoJSON = null, ukraineGeoJSON = null, bordersLoaded = false;
let radarAnimationInterval = null, aiInterval = null, economyInterval = null;
let attackType = null, attackCount = 1;
let maxRadars = 8, maxPvo = 12, maxPowerPlants = 5, maxRefineries = 3;
let pvoPlacementMode = false, pvoPlacementType = null;

// ---- Типы ПВО ----
const pvoTypes = {
    strela10: {
        id: 'strela10', name: 'Стрела-10', icon: 'images/pvo_strela10.png', range: 5, cost: 150, reloadTime: 3,
        chances: { shahed: 0.35, x101: 0.10, iskander: 0.05, kinzhal: 0.05, kalibr: 0.10, geran5: 0.35, lutyi: 0.35, grom2: 0.10, flamingo: 0.15, stormshadow: 0.15 },
        burstCount: 1
    },
    tor: {
        id: 'tor', name: 'Тор-М2', icon: 'images/pvo_tor.png', range: 15, cost: 300, reloadTime: 5,
        chances: { shahed: 0.40, x101: 0.22, iskander: 0.08, kinzhal: 0.08, kalibr: 0.22, geran5: 0.40, lutyi: 0.40, grom2: 0.15, flamingo: 0.20, stormshadow: 0.20 },
        burstCount: 1
    },
    buk: {
        id: 'buk', name: 'Бук-М3', icon: 'images/pvo_buk.png', range: 45, cost: 500, reloadTime: 8,
        chances: { shahed: 0.28, x101: 0.33, iskander: 0.18, kinzhal: 0.18, kalibr: 0.33, geran5: 0.28, lutyi: 0.28, grom2: 0.25, flamingo: 0.30, stormshadow: 0.30 },
        burstCount: 1
    },
    s300: {
        id: 's300', name: 'С-300В4', icon: 'images/pvo_s300.png', range: 90, cost: 800, reloadTime: 12,
        chances: { shahed: 0.20, x101: 0.35, iskander: 0.25, kinzhal: 0.25, kalibr: 0.35, geran5: 0.20, lutyi: 0.20, grom2: 0.30, flamingo: 0.32, stormshadow: 0.32 },
        burstCount: 1
    },
    s400: {
        id: 's400', name: 'С-400', icon: 'images/pvo_s400.png', range: 120, cost: 1200, reloadTime: 15,
        chances: { shahed: 0.18, x101: 0.38, iskander: 0.30, kinzhal: 0.30, kalibr: 0.38, geran5: 0.18, lutyi: 0.18, grom2: 0.35, flamingo: 0.35, stormshadow: 0.35 },
        burstCount: 1
    },
    pantsir: {
        id: 'pantsir', name: 'Панцирь-С1', icon: 'images/pvo_pantsir.png', range: 20, cost: 400, reloadTime: 4,
        chances: { shahed: 0.40, x101: 0.25, iskander: 0.10, kinzhal: 0.10, kalibr: 0.25, geran5: 0.40, lutyi: 0.40, grom2: 0.18, flamingo: 0.22, stormshadow: 0.22 },
        burstCount: 3
    }
};

// ---- Базовый список городов ----
const allCities = [
    { name: 'БРЯНСК', center: [53.2433, 34.3637], team: 'russia' },
    { name: 'СМОЛЕНСК', center: [54.7826, 32.0453], team: 'russia' },
    { name: 'БЕЛГОРОД', center: [50.5975, 36.5858], team: 'russia' },
    { name: 'КУРСК', center: [51.7304, 36.1927], team: 'russia' },
    { name: 'КАЛУГА', center: [54.5138, 36.2612], team: 'russia' },
    { name: 'ВЕЛИКИЙ НОВГОРОД', center: [58.5213, 31.2755], team: 'russia' },
    { name: 'МОСКВА', center: [55.7558, 37.6173], team: 'russia' },
    { name: 'РОСТОВ-НА-ДОНУ', center: [47.2357, 39.7015], team: 'russia' },
    { name: 'КРАСНОДАР', center: [45.0355, 38.9753], team: 'russia' },
    { name: 'СТАВРОПОЛЬ', center: [45.0448, 41.9691], team: 'russia' },
    { name: 'ИЖЕВСК', center: [56.8528, 53.2119], team: 'russia' },
    { name: 'ЕКАТЕРИНБУРГ', center: [56.8389, 60.6057], team: 'russia' },
    { name: 'ПЕРМЬ', center: [58.0104, 56.2294], team: 'russia' },
    { name: 'ЧЕЛЯБИНСК', center: [55.1644, 61.4368], team: 'russia' },
    { name: 'ЧЕБОКСАРЫ (ЧУВАШИЯ)', center: [56.1432, 47.2489], team: 'russia' },
    { name: 'ХАРЬКОВ', center: [49.9935, 36.2304], team: 'ukraine' },
    { name: 'ДНЕПР', center: [48.4647, 35.0467], team: 'ukraine' },
    { name: 'ЗАПОРОЖЬЕ', center: [47.8388, 35.1396], team: 'ukraine' },
    { name: 'СУМЫ', center: [50.9077, 34.7981], team: 'ukraine' },
    { name: 'ПОЛТАВА', center: [49.5891, 34.5514], team: 'ukraine' },
    { name: 'ЧЕРНИГОВ', center: [51.4982, 31.2893], team: 'ukraine' },
    { name: 'КИЕВ', center: [50.4501, 30.5234], team: 'ukraine' },
    { name: 'ЧЕРКАССЫ', center: [49.4264, 32.0591], team: 'ukraine' },
    { name: 'ВИННИЦА', center: [49.2328, 28.4810], team: 'ukraine' },
    { name: 'ХМЕЛЬНИЦКИЙ', center: [49.4223, 26.9872], team: 'ukraine' },
    { name: 'НИКОЛАЕВ', center: [46.9750, 31.9946], team: 'ukraine' },
    { name: 'КРИВОЙ РОГ', center: [47.9087, 33.3947], team: 'ukraine' },
    { name: 'МАРИУПОЛЬ', center: [47.0971, 37.5433], team: 'ukraine' },
    { name: 'ОДЕССА', center: [46.4825, 30.7233], team: 'ukraine' },
    { name: 'ЛЬВОВ', center: [49.8397, 24.0297], team: 'ukraine' }
];

// ---- Оружие ----
const weaponTypes = {
    shahed: { name: 'ШАХЕД', speed: 0.006, damage: 25, cost: 60, pvoChance: 0.08, spriteOffset: 0, img: 'drone.png' },
    x101: { name: 'X-101', speed: 0.03, damage: 65, cost: 160, pvoChance: 0.12, spriteOffset: 0, img: 'x101.png' },
    iskander: { name: 'ИСКАНДЕР', speed: 0.07, damage: 300, cost: 1000, pvoChance: 0.04, spriteOffset: 0, img: 'iskander.png' },
    kinzhal: { name: 'КИНЖАЛ', speed: 0.11, damage: 250, cost: 850, pvoChance: 0.05, spriteOffset: 0, img: 'kinzhal.png' },
    kalibr: { name: 'КАЛИБР', speed: 0.025, damage: 200, cost: 750, pvoChance: 0.08, spriteOffset: 0, img: 'kalibr.png' },
    geran5: { name: 'ГЕРАНЬ-5', speed: 0.05, damage: 45, cost: 120, pvoChance: 0.07, spriteOffset: 0, img: 'geran5.png' },
    lutyi: { name: 'ЛЮТИЙ', speed: 0.006, damage: 30, cost: 70, pvoChance: 0.08, spriteOffset: 0, img: 'droneua.png' },
    grom2: { name: 'ГРОМ-2', speed: 0.06, damage: 150, cost: 500, pvoChance: 0.06, spriteOffset: 0, img: 'grom2.png' },
    flamingo: { name: 'ФЛАМИНГО', speed: 0.04, damage: 80, cost: 250, pvoChance: 0.10, spriteOffset: 0, img: 'flamingo.png' },
    stormshadow: { name: 'ШТОРМ ШАДОУ', speed: 0.035, damage: 120, cost: 400, pvoChance: 0.09, spriteOffset: 0, img: 'stormshadow.png' }
};

// ---- Ранги и стоимость ----
const costs = { radar: 180, powerPlant: 250, refinery: 400, rocketFactory: 500 };
const ranks = [
    { level:1, xp:0, title:"Рядовой" }, { level:2, xp:500, title:"Сержант" }, { level:3, xp:1200, title:"Лейтенант" },
    { level:4, xp:2500, title:"Капитан" }, { level:5, xp:5000, title:"Майор" }, { level:6, xp:9000, title:"Полковник" },
    { level:7, xp:15000, title:"Генерал" }
];
let playerXP = 0;
let playerStats = { wins:0, losses:0, citiesDestroyed:0, buildingsDestroyed:0, missilesLaunched:0, hits:0, totalShots:0 };
let audioCtx = null;

// ---- Функции иконок ----
function getAirportIcon() {
    try { return L.icon({ iconUrl: 'images/airport.png', iconSize: [48,48], iconAnchor: [24,24] }); }
    catch(e){ return L.divIcon({ html:'🏠', iconSize:[48,48] }); }
}
function getRadarIcon() {
    try { return L.icon({ iconUrl: 'images/radar.png', iconSize: [40,40], iconAnchor: [20,20] }); }
    catch(e){ return L.divIcon({ html:'📡', iconSize:[40,40] }); }
}
function getPvoStaffIcon() {
    try { return L.icon({ iconUrl: 'images/pvobase.png', iconSize: [40,40], iconAnchor: [20,20] }); }
    catch(e){ return L.divIcon({ html:'🏛️', iconSize:[40,40] }); }
}
function getPowerPlantIcon() {
    try { return L.icon({ iconUrl: 'images/powerplant.png', iconSize: [40,40], iconAnchor: [20,20] }); }
    catch(e){ return L.divIcon({ html:'⚡', iconSize:[40,40] }); }
}
function getRefineryIcon() {
    try { return L.icon({ iconUrl: 'images/refinery.png', iconSize: [40,40], iconAnchor: [20,20] }); }
    catch(e){ return L.divIcon({ html:'⛽', iconSize:[40,40] }); }
}
function getRocketFactoryIcon() {
    try { return L.icon({ iconUrl: 'images/rocket_factory.png', iconSize: [40,40], iconAnchor: [20,20] }); }
    catch(e){ return L.divIcon({ html:'🏭', iconSize:[40,40] }); }
}
function getInterceptorIcon() {
    try { return L.icon({ iconUrl: 'images/pvo_rocket.png', iconSize: [24,24], iconAnchor: [12,12] }); }
    catch(e){ return L.divIcon({ html:'🚀', iconSize:[24,24] }); }
}
function getPvoIcon(typeId) {
    const pvo = pvoTypes[typeId];
    try {
        return L.icon({ iconUrl: pvo.icon, iconSize: [48, 32], iconAnchor: [24, 16] });
    } catch(e) {
        return L.divIcon({ html: '🛡️', iconSize:[48, 32], iconAnchor: [24, 16] });
    }
}
function getMissileImage(type, team) {
    if (type === 'shahed') return (team === 'russia') ? 'images/drone.png' : 'images/droneua.png';
    if (type === 'x101') return 'images/x101.png';
    if (type === 'iskander') return 'images/iskander.png';
    if (type === 'kinzhal') return 'images/kinzhal.png';
    if (type === 'kalibr') return 'images/kalibr.png';
    if (type === 'geran5') return 'images/geran5.png';
    if (type === 'lutyi') return (team === 'ukraine') ? 'images/droneua.png' : 'images/drone.png';
    if (type === 'grom2') return 'images/grom2.png';
    if (type === 'flamingo') return 'images/flamingo.png';
    if (type === 'stormshadow') return 'images/stormshadow.png';
    return 'images/missile.png';
}
function getMissileIcon(type, team) {
    const url = getMissileImage(type, team);
    try { return L.icon({ iconUrl: url, iconSize: [28,28], iconAnchor: [14,14] }); }
    catch(e) { return L.divIcon({ html: '💥', iconSize:[28,28] }); }
}

// ---- Вспомогательные функции ----
function getMyCities() { return zones.filter(z => z.team === myTeam); }
function getInterceptChance(pvoUnit, projectileType) {
    if (isTutorial) return 1.0;
    const pvo = pvoTypes[pvoUnit.type];
    if (!pvo) return 0.1;
    const chance = pvo.chances[projectileType];
    if (chance === undefined) return 0.1;
    return chance;
}
function playBeep(freq, duration, type='sine') {
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.value = freq; osc.type = type;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + duration);
    osc.start(); osc.stop(now + duration);
}
function createCityMarker(city) {
    const percent = Math.floor((city.hp / city.baseHp) * 100);
    const hpClass = percent > 60 ? 'hp-high' : (percent > 30 ? 'hp-mid' : 'hp-low');
    const teamClass = city.team === 'russia' ? 'russia' : 'ukraine';
    const html = `
        <div class="zone-marker ${teamClass}">
            <span class="city-name">${city.name}</span>
            <span class="city-hp ${hpClass}">${percent}%</span>
        </div>
    `;
    return L.divIcon({ html, className: '', iconSize: [100, 60], iconAnchor: [50, 30] });
}
function updateTotalPercent() {
    let ruTotal=0,ruBase=0,uaTotal=0,uaBase=0;
    zones.forEach(z=>{ if(z.team==='russia'){ ruTotal+=z.hp; ruBase+=z.baseHp; } else { uaTotal+=z.hp; uaBase+=z.baseHp; } });
    let ruPercent=ruBase?(ruTotal/ruBase*100):0;
    let uaPercent=uaBase?(uaTotal/uaBase*100):0;
    document.getElementById('ruPercent').innerText=Math.floor(ruPercent)+'%';
    document.getElementById('uaPercent').innerText=Math.floor(uaPercent)+'%';
    document.getElementById('ruFill').style.width=ruPercent+'%';
    document.getElementById('uaFill').style.width=uaPercent+'%';
    if(ruTotal<=0 && gameActive){
        gameActive=false;
        const victory = (myTeam==='ukraine');
        if(victory) alert("🏆 ПОБЕДА! Вы уничтожили все города России.");
        else alert("💀 ПОРАЖЕНИЕ! Ваши города России уничтожены.");
        updateStatsAfterGame(victory);
        if (isMultiplayer) updateElo(victory, 'multiplayer');
        else if (isAI) updateElo(victory, 'single');
        if(isMultiplayer && isHost && currentRoomId) gamesRef.child(currentRoomId).remove();
        setTimeout(()=>location.reload(),3000);
    }
    if(uaTotal<=0 && gameActive){
        gameActive=false;
        const victory = (myTeam==='russia');
        if(victory) alert("🏆 ПОБЕДА! Вы уничтожили все города Украины.");
        else alert("💀 ПОРАЖЕНИЕ! Ваши города Украины уничтожены.");
        updateStatsAfterGame(victory);
        if (isMultiplayer) updateElo(victory, 'multiplayer');
        else if (isAI) updateElo(victory, 'single');
        if(isMultiplayer && isHost && currentRoomId) gamesRef.child(currentRoomId).remove();
        setTimeout(()=>location.reload(),3000);
    }
}
function updateZoneMarkers(){
    zones.forEach(z => {
        z.marker.setIcon(createCityMarker(z));
    });
    updateTotalPercent();
}
function removeZoneIfDestroyed(zone){
    if(zone.hp<=0){
        if(zone.circle) map.removeLayer(zone.circle);
        if(zone.marker) map.removeLayer(zone.marker);
        const index=zones.findIndex(z=>z.id===zone.id);
        if(index!==-1) zones.splice(index,1);
        showHint(`🏙️ Город ${zone.name} уничтожен!`);
    }
}
function showHint(text){ let h=document.createElement('div'); h.innerHTML=text; h.style.cssText='position:fixed; top:clamp(60px,15vh,120px); left:50%; transform:translateX(-50%); background:#000; color:#fff; padding:clamp(10px,2vh,20px) clamp(16px,4vw,30px); border-radius:15px; border:2px solid gold; z-index:9999; font-size:clamp(.9rem,2.5vw,1.4rem); text-align:center; max-width:90%; pointer-events:none;'; document.body.appendChild(h); setTimeout(()=>h.remove(),5000); }
function destroyBuilding(building){
    if(building.marker) map.removeLayer(building.marker);
    if(building.radarCircle && map.hasLayer(building.radarCircle)) map.removeLayer(building.radarCircle);
    buildings = buildings.filter(b=>b.id!==building.id);
    radars = radars.filter(r=>r.id!==building.id);
    powerPlants = powerPlants.filter(p=>p.id!==building.id);
    refineries = refineries.filter(r=>r.id!==building.id);
    rocketFactories = rocketFactories.filter(r=>r.id!==building.id);
    showHint(`⚠️ Здание ${getBuildingName(building.type)} уничтожено!`);
    addXP(50);
}
function getBuildingName(type){
    switch(type){
        case 'radar': return 'РАДАР';
        case 'powerPlant': return 'ЭЛЕКТРОСТАНЦИЯ';
        case 'refinery': return 'НПЗ';
        case 'rocketFactory': return 'ЗАВОД РАКЕТ';
        case 'pvoStaff': return 'ШТАБ ПВО';
        default: return 'ЗДАНИЕ';
    }
}
function updateUI(){ document.getElementById('energy').innerHTML = isSandbox ? '∞' : Math.floor(resources); }
function addXP(amount){ playerXP += amount; updateRankUI(); }
function updateRankUI(){
    let idx = ranks.length-1; while(idx>0 && playerXP < ranks[idx].xp) idx--;
    document.getElementById('rankTitle').innerHTML = ranks[idx].title;
    document.getElementById('rankXp').innerHTML = playerXP + " XP";
}
function updateStatsAfterHit(damage, targetType, isHit){ playerStats.totalShots++; if(isHit){ playerStats.hits++; if(targetType === 'zone') playerStats.citiesDestroyed++; else if(targetType === 'pvo') playerStats.buildingsDestroyed++; else playerStats.buildingsDestroyed++; } }
function updateStatsAfterGame(victory){ if(victory) playerStats.wins++; else playerStats.losses++; if(victory) addXP(300); }

// ---- Функции границ и территории ----
function loadRealBorders(cb) {
    if (bordersLoaded) {
        if (cb) cb();
        return;
    }
    Promise.all([
        fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries/RUS.geo.json').then(r=>r.json()).catch(()=>fallbackRussia),
        fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries/UKR.geo.json').then(r=>r.json()).catch(()=>fallbackUkraine)
    ]).then(([rus,ukr])=>{
        russiaGeoJSON=rus; ukraineGeoJSON=ukr; bordersLoaded=true;
        L.geoJSON(rus,{style:{color:'#ff6666',weight:2,fillOpacity:0.08}}).addTo(map);
        L.geoJSON(ukr,{style:{color:'#66aaff',weight:2,fillOpacity:0.08}}).addTo(map);
        if(cb)cb();
    }).catch(e=>{
        console.warn("Ошибка загрузки границ, использую fallback", e);
        russiaGeoJSON=fallbackRussia; ukraineGeoJSON=fallbackUkraine; bordersLoaded=true;
        L.geoJSON(fallbackRussia,{style:{color:'#ff6666',weight:2,fillOpacity:0.08}}).addTo(map);
        L.geoJSON(fallbackUkraine,{style:{color:'#66aaff',weight:2,fillOpacity:0.08}}).addTo(map);
        if(cb)cb();
    });
}
const fallbackRussia = {
    "type":"FeatureCollection",
    "features":[{
        "type":"Feature",
        "properties":{},
        "geometry":{
            "type":"Polygon",
            "coordinates":[[[19.6,41.2],[60.0,41.2],[85.0,45.0],[105.0,45.0],[105.0,55.0],[85.0,55.0],[60.0,50.0],[19.6,50.0],[19.6,41.2]]]
        }
    }]
};
const fallbackUkraine = {
    "type":"FeatureCollection",
    "features":[{
        "type":"Feature",
        "properties":{},
        "geometry":{
            "type":"Polygon",
            "coordinates":[[[22.0,44.3],[40.0,44.3],[40.0,52.4],[22.0,52.4],[22.0,44.3]]]
        }
    }]
};
function isInsideCountry(lat,lng,country) {
    if(!bordersLoaded||!russiaGeoJSON||!ukraineGeoJSON) return false;
    const point=turf.point([lng,lat]);
    const geojson=country==='russia'?russiaGeoJSON:ukraineGeoJSON;
    let feat=geojson.features?geojson.features[0]:geojson;
    try { return turf.booleanPointInPolygon(point,feat); } catch(e){ return true; }
}
function isOwnTerritory(lat,lng){ if(!myTeam) return false; return isInsideCountry(lat,lng,myTeam); }
function canBuildHere(lat,lng){
    if(!isOwnTerritory(lat,lng)) return false;
    for(let b of buildings) if(map.distance([lat,lng],[b.lat,b.lng])<4000) return false;
    return true;
}
function canBuildForTeam(lat,lng,team){ if(!isInsideCountry(lat,lng,team)) return false; for(let b of buildings) if(map.distance([lat,lng],[b.lat,b.lng])<4000) return false; return true; }

// ---- Подготовка городов ----
function prepareCities(selectedNames) {
    let filtered = allCities.filter(c => selectedNames.includes(c.name));
    let russia = filtered.filter(c => c.team === 'russia').sort((a,b) => a.center[1] - b.center[1]);
    let ukraine = filtered.filter(c => c.team === 'ukraine').sort((a,b) => b.center[1] - a.center[1]);
    let minHp = 200, maxHp = 500;
    russia.forEach((city, idx) => {
        let hp = Math.round(minHp + (idx / (russia.length - 1 || 1)) * (maxHp - minHp));
        city.hp = hp;
        city.baseHp = hp;
    });
    ukraine.forEach((city, idx) => {
        let hp = Math.round(minHp + (idx / (ukraine.length - 1 || 1)) * (maxHp - minHp));
        city.hp = hp;
        city.baseHp = hp;
    });
    return [...russia, ...ukraine];
}
function populateCityLists() {
    const russiaList = document.getElementById('russiaCityList');
    const ukraineList = document.getElementById('ukraineCityList');
    russiaList.innerHTML = '';
    ukraineList.innerHTML = '';
    const russiaCities = allCities.filter(c => c.team === 'russia').sort((a,b) => a.center[1] - b.center[1]);
    const ukraineCities = allCities.filter(c => c.team === 'ukraine').sort((a,b) => b.center[1] - a.center[1]);
    russiaCities.forEach(city => {
        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = city.name;
        cb.checked = true;
        label.appendChild(cb);
        label.appendChild(document.createTextNode(' ' + city.name));
        russiaList.appendChild(label);
    });
    ukraineCities.forEach(city => {
        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = city.name;
        cb.checked = true;
        label.appendChild(cb);
        label.appendChild(document.createTextNode(' ' + city.name));
        ukraineList.appendChild(label);
    });
}

// ---- Функции зон и инициализации ----
function initZones(cities) {
    zones = [];
    cities.forEach(z => {
        let circle = L.circle(z.center, { radius: 15000, color: z.team === 'russia' ? '#ff5555' : '#55aaff', weight: 2, fillOpacity: 0.25 }).addTo(map);
        let marker = L.marker(z.center, { icon: createCityMarker(z) }).addTo(map);
        zones.push({ id: z.name, name: z.name, center: z.center, team: z.team, hp: z.hp, baseHp: z.baseHp, circle: circle, marker: marker });
    });
    updateZoneMarkers();
    updateTotalPercent();
}

function initGameMapAndLogic(citiesArray) {
    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    if(map) map.remove();
    map = L.map('map', { zoomControl: false }).setView([55.0,40.0],5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'© CartoDB'}).addTo(map);
    let ld = document.createElement('div'); ld.className='loading-indicator'; ld.innerText='Загрузка границ...'; document.body.appendChild(ld);
    loadRealBorders(()=>{
        if(ld) ld.remove();
        initZones(citiesArray);
        buildings = []; radars = []; powerPlants = []; refineries = []; rocketFactories = [];
        pvoUnits = [];
        pvoStaffBuilt = false;
        if(isSandbox){
            resources = 999999;
            maxRadars = 999; maxPvo = 999; maxPowerPlants = 999; maxRefineries = 999;
        } else {
            if(setupDifficulty === "EASY") resources = 400;
            else if(setupDifficulty === "NORMAL") resources = 300;
            else if(setupDifficulty === "HARD") resources = 220;
            else resources = 150;
            maxRadars = 8; maxPvo = 12; maxPowerPlants = 5; maxRefineries = 3;
        }
        airportPlaced = false; updateUI();
        map.off('click');
        map.on('click', (e) => {
            if(!airportPlaced){
                let lat = e.latlng.lat, lng = e.latlng.lng;
                if(!isOwnTerritory(lat,lng)){ alert("Аэродром можно поставить только на своей территории!"); return; }
                let icon = getAirportIcon();
                airportMarker = L.marker([lat,lng], {icon}).addTo(map);
                airportMarker.bindPopup('<b>АЭРОДРОМ</b>');
                airportMarker.on('click', () => showAttackModal(airportMarker));
                airportPlaced = true; gameActive = true; updateUI(); lastUpdate = performance.now();
                if(isAI) initAI();
                startRadarAnimation();
                requestAnimationFrame(gameLoop);
                if(economyInterval) clearInterval(economyInterval);
                economyInterval = setInterval(() => { if(gameActive && !isSandbox){ let income = 5 + powerPlants.filter(p=>p.team===myTeam).length*3 + refineries.filter(r=>r.team===myTeam).length*15; resources += income; updateUI(); } else updateUI(); }, 1000);
                showHint("📡 Теперь постройте Радар");
                return;
            }
            if(pvoPlacementMode && pvoPlacementType){
                const lat = e.latlng.lat, lng = e.latlng.lng;
                if(!isOwnTerritory(lat,lng)){ alert("Можно размещать ПВО только на своей территории!"); return; }
                let nearestCity = null, minDist = Infinity;
                for(const city of getMyCities()){
                    const d = map.distance([lat,lng], city.center);
                    if(d < minDist){ minDist = d; nearestCity = city; }
                }
                const cityName = nearestCity ? nearestCity.name : 'Полевая позиция';
                const success = deployPvo(pvoPlacementType, cityName, lat, lng);
                if(success){ exitPlacementMode(); }
                return;
            }
            if(buildMode){
                if(!isOwnTerritory(e.latlng.lat, e.latlng.lng)){ alert("Можно строить только на своей территории!"); return; }
                tryBuild(e.latlng.lat, e.latlng.lng, buildMode);
                buildMode = null;
            }
        });
    });
}

// ---- Постройки ----
function tryBuild(lat,lng,type){
    if(!airportPlaced){ alert("Сначала постройте аэродром!"); return false; }
    if(!canBuildHere(lat,lng)){ alert("Можно строить только на своей территории и не ближе 4 км к другим зданиям!"); return false; }
    if(isTutorial && tutorialMission && tutorialMission.id === 'radar' && type !== 'radar') {
        showTutorialHint('❌ Сначала постройте радар!', 3000);
        return false;
    }
    if(!isSandbox){
        if(type==='radar' && radars.filter(r=>r.team===myTeam).length >= maxRadars){ alert(`Максимум ${maxRadars} радаров`); return false; }
        if(type==='powerPlant' && powerPlants.filter(p=>p.team===myTeam).length >= maxPowerPlants){ alert(`Максимум ${maxPowerPlants} электростанций`); return false; }
        if(type==='refinery' && refineries.filter(r=>r.team===myTeam).length >= maxRefineries){ alert(`Максимум ${maxRefineries} НПЗ`); return false; }
        if(type==='pvoStaff'){
            if(pvoStaffBuilt){ alert("Штаб ПВО уже построен"); return false; }
            if(resources < 250){ alert("Не хватает энергии (нужно 250)"); return false; }
            resources -= 250;
        } else {
            let cost = costs[type];
            if(resources < cost){ alert("Не хватает энергии"); return false; }
            resources -= cost;
        }
    }
    let building = {
        id: Date.now()+Math.random(),
        lat, lng,
        type: type,
        team: myTeam,
        hp: (type==='radar'?120:(type==='powerPlant'?100:(type==='refinery'?150:(type==='pvoStaff'?200:150)))),
        marker: null,
        radarCircle: null
    };
    let icon;
    if(type==='radar') icon=getRadarIcon();
    else if(type==='powerPlant') icon=getPowerPlantIcon();
    else if(type==='refinery') icon=getRefineryIcon();
    else if(type==='rocketFactory') icon=getRocketFactoryIcon();
    else if(type==='pvoStaff') icon=getPvoStaffIcon();
    else return false;
    let marker = L.marker([lat,lng], {icon}).addTo(map);
    if(type === 'pvoStaff') {
        marker.on('click', function() {
            if (pvoStaffBuilt && building.team === myTeam) {
                openPvoModal();
            } else {
                showHint("⚠️ Это не ваш штаб ПВО");
            }
        });
    }
    building.marker = marker;
    buildings.push(building);
    if(type==='radar'){
        radars.push(building);
        let circle = L.circle([lat,lng], {radius:150000, color:'#00ffff', weight:1, fillOpacity:0.05}).addTo(map);
        building.radarCircle = circle;
        showHint("🛡️ Теперь используйте Штаб ПВО для размещения ПВО");
        addXP(5);
        updateProjectileVisibility();
    }
    if(type==='powerPlant'){ powerPlants.push(building); if(!isTutorial) showHint("⛽ Постройте НПЗ"); addXP(10); }
    if(type==='refinery'){ refineries.push(building); if(!isTutorial) showHint("🏭 Постройте Завод ракет"); }
    if(type==='rocketFactory'){ rocketFactories.push(building); }
    if(type==='pvoStaff'){ pvoStaffBuilt = true; showHint("✅ Штаб ПВО построен! Кликните по нему, чтобы открыть меню."); openPvoModal(); }
    updateUI();
    if(isMultiplayer && !isHost) {
        sendEvent('build', building);
    } else if(isMultiplayer && isHost) {
        syncGameState();
    }
    return true;
}

// ---- Цели и атаки ----
function getAvailableWeapons(team) {
    return team === 'russia' ? ['shahed','geran5','x101','kalibr','kinzhal','iskander'] : ['lutyi','flamingo','stormshadow','grom2'];
}
function getEnemyTargets(){
    let targets = [];
    buildings.forEach(b => {
        if(b.team !== myTeam && b.hp > 0){
            let maxHp = (b.type==='radar'?120:(b.type==='powerPlant'?100:(b.type==='refinery'?150:(b.type==='pvoStaff'?200:150))));
            let priority = 0;
            if(b.type === 'refinery') priority = 100;
            else if(b.type === 'rocketFactory') priority = 80;
            else if(b.type === 'pvoStaff') priority = 90;
            else if(b.type === 'radar') priority = 40;
            else priority = 30;
            targets.push({ id: b.id, type: 'building', name: getBuildingName(b.type), lat: b.lat, lng: b.lng, hp: b.hp, maxHp: maxHp, priority: priority, display: `${getBuildingName(b.type)} (${Math.floor(b.hp/maxHp*100)}%)` });
        }
    });
    pvoUnits.forEach(p => {
        if(p.team !== myTeam && p.status === 'active'){
            const pvoType = pvoTypes[p.type];
            const maxHp = 100;
            targets.push({ id: p.id, type: 'pvo', name: pvoType.name, lat: p.lat, lng: p.lng, hp: p.hp || 100, maxHp: 100, priority: 95, display: `${pvoType.name} (ПВО) (${Math.floor((p.hp||100)/100*100)}%)` });
        }
    });
    zones.forEach(z => {
        if(z.team !== myTeam && z.hp > 0){
            targets.push({ id: z.id, type: 'zone', name: z.name, lat: z.center[0], lng: z.center[1], hp: z.hp, maxHp: z.baseHp, priority: 20, display: `${z.name} (${Math.floor(z.hp/z.baseHp*100)}%)` });
        }
    });
    targets.sort((a,b)=>b.priority - a.priority);
    return targets;
}

function launchAttack(airport, targetObj, type, count){
    let weapon = weaponTypes[type];
    let costPerUnit = weapon.cost;
    if(!isSandbox && resources < costPerUnit * count){ alert("Не хватает энергии"); return false; }
    let fromLatLng = airport.getLatLng();
    if (!fromLatLng || typeof fromLatLng.lat !== 'number') return false;
    for(let i=0;i<count;i++){
        if(!isSandbox) resources -= costPerUnit;
        let offset = (i - (count-1)/2) * 0.03;
        let targetLat = targetObj.lat + offset;
        let targetLng = targetObj.lng + offset * 0.5;
        let p1 = map.latLngToLayerPoint([fromLatLng.lat, fromLatLng.lng]);
        let p2 = map.latLngToLayerPoint([targetLat, targetLng]);
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let angle = Math.atan2(dx, -dy) * 180 / Math.PI + weapon.spriteOffset;
        let proj = {
            id: Date.now()+Math.random()+i,
            from: fromLatLng,
            to: {lat: targetLat, lng: targetLng},
            progress: 0,
            speed: weapon.speed,
            damage: weapon.damage,
            team: myTeam,
            targetType: targetObj.type,
            targetId: targetObj.id,
            type: type,
            active: true,
            marker: null,
            lastInterceptCheck: 0,
            interceptedFlag: false,
            angle: angle,
            launchTime: Date.now()
        };
        let marker = L.marker([proj.from.lat, proj.from.lng], {
            icon: getMissileIcon(type, myTeam),
            rotationOrigin: 'center center',
            rotationAngle: angle
        }).addTo(map);
        proj.marker = marker;
        projectiles.push(proj);
    }
    updateUI();
    playBeep(800,0.2);
    if(isMultiplayer && !isHost) {
        sendEvent('launch', {
            from: fromLatLng,
            to: {lat: targetObj.lat, lng: targetObj.lng},
            weaponType: type,
            count: count,
            targetType: targetObj.type,
            targetId: targetObj.id,
            team: myTeam,
            launchTime: Date.now()
        });
    } else if(isMultiplayer && isHost) {
        syncGameState();
    }
    return true;
}

// ---- ПВО ----
function deployPvo(typeId, cityName, lat, lng) {
    if(!pvoStaffBuilt){ alert("Сначала постройте Штаб ПВО!"); return false; }
    if(lat === undefined || lng === undefined){
        const city = zones.find(z => z.name === cityName && z.team === myTeam);
        if(!city){ alert("Город не найден или не принадлежит вам"); return false; }
        lat = city.center[0]; lng = city.center[1];
    } else {
        if(!isOwnTerritory(lat, lng)){ alert("Можно размещать ПВО только на своей территории!"); return false; }
        for(let p of pvoUnits){
            if(p.team === myTeam){
                const dist = map.distance([lat,lng], [p.lat, p.lng]);
                if(dist < 3000){ alert("Слишком близко к другому ПВО (мин. 3 км)"); return false; }
            }
        }
    }
    const pvoType = pvoTypes[typeId];
    if(!pvoType){ alert("Неизвестный тип ПВО"); return false; }
    if(!isSandbox && resources < pvoType.cost){ alert("Не хватает энергии"); return false; }
    if(pvoUnits.filter(p => p.team === myTeam).length >= maxPvo){ alert(`Максимум ${maxPvo} комплексов ПВО`); return false; }
    const pvoUnit = {
        id: Date.now()+Math.random(),
        type: typeId,
        lat: lat, lng: lng,
        team: myTeam,
        city: cityName,
        status: 'active',
        cooldown: 0,
        hp: 100,
        marker: null,
        rangeCircle: null
    };
    const icon = getPvoIcon(typeId);
    const marker = L.marker([pvoUnit.lat, pvoUnit.lng], { icon }).addTo(map);
    marker.bindPopup(`<b>${pvoType.name}</b><br>Город: ${cityName}<br>Дальность: ${pvoType.range} км<br>HP: 100`);
    pvoUnit.marker = marker;
    const circle = L.circle([pvoUnit.lat, pvoUnit.lng], {
        radius: pvoType.range * 1000,
        color: '#00ffaa',
        weight: 1,
        fillOpacity: 0.08,
        dashArray: '5,5'
    }).addTo(map);
    pvoUnit.rangeCircle = circle;
    pvoUnits.push(pvoUnit);
    if(!isSandbox) resources -= pvoType.cost;
    updateUI();
    showHint(`✅ ПВО ${pvoType.name} размещён в ${cityName}`);
    if(isMultiplayer && !isHost) {
        sendEvent('deployPvo', pvoUnit);
    } else if(isMultiplayer && isHost) {
        syncGameState();
    }
    return true;
}

function enterPlacementMode(typeId) {
    pvoPlacementMode = true;
    pvoPlacementType = typeId;
    document.getElementById('buildPanel').style.display = 'none';
    document.getElementById('gameHUD').style.display = 'none';
    document.getElementById('pvoPlacementOverlay').classList.add('active');
    showHint("Кликните на карте, чтобы разместить ПВО");
}
function exitPlacementMode() {
    pvoPlacementMode = false;
    pvoPlacementType = null;
    document.getElementById('buildPanel').style.display = 'flex';
    document.getElementById('gameHUD').style.display = 'flex';
    document.getElementById('pvoPlacementOverlay').classList.remove('active');
}

// ---- Перехват (исправлен) ----
function tryIntercept(proj){
    // НЕ перехватываем свои снаряды
    if (proj.team === myTeam) return false;

    const now = Date.now();
    if (now - proj.lastInterceptCheck < 2000) return false;
    proj.lastInterceptCheck = now;
    const pos = proj.marker.getLatLng();
    for (let pvo of pvoUnits) {
        if (pvo.team !== myTeam) continue;
        if (pvo.status !== 'active') continue;
        const dist = map.distance([pvo.lat, pvo.lng], [pos.lat, pos.lng]);
        const rangeMeters = pvoTypes[pvo.type].range * 1000;
        if (dist > rangeMeters) continue;
        let chance = getInterceptChance(pvo, proj.type);
        if (pvo.cooldown > 0) chance *= 0.3;
        if (Math.random() < chance) {
            playBeep(600, 0.15);
            if (pvo.type === 'pantsir') {
                launchPantsirBurst({lat: pvo.lat, lng: pvo.lng}, pos, pvoTypes.pantsir.burstCount);
            } else {
                launchInterceptor({lat: pvo.lat, lng: pvo.lng}, pos);
            }
            pvo.cooldown = pvoTypes[pvo.type].reloadTime;
            if (isMultiplayer && isHost) syncGameState();
            return true;
        }
    }
    if (isAI && aiPvo && aiPvo.team !== proj.team) {
        const dist = map.distance([aiPvo.lat, aiPvo.lng], [pos.lat, pos.lng]);
        const rangeMeters = 100000;
        if (dist < rangeMeters) {
            let chance = 0.10;
            if (Math.random() < chance) {
                playBeep(600, 0.15);
                launchInterceptor({lat: aiPvo.lat, lng: aiPvo.lng}, pos);
                return true;
            }
        }
    }
    return false;
}

function launchPantsirBurst(from, target, count) {
    const delay = 200;
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const marker = L.marker([from.lat, from.lng], {
                icon: getInterceptorIcon(),
                rotationOrigin: 'center center',
                rotationAngle: 0
            }).addTo(map);
            const start = { lat: from.lat, lng: from.lng };
            const end = { lat: target.lat, lng: target.lng };
            let progress = 0;
            const speed = 0.02;
            const interval = setInterval(() => {
                progress += speed;
                if (progress >= 1) {
                    clearInterval(interval);
                    map.removeLayer(marker);
                    createExplosion(end.lat, end.lng);
                    return;
                }
                const lat = start.lat + (end.lat - start.lat) * progress;
                const lng = start.lng + (end.lng - start.lng) * progress;
                marker.setLatLng([lat, lng]);
            }, 30);
        }, i * delay);
    }
}

function launchInterceptor(start,end){
    let missile = L.marker([start.lat,start.lng], { icon: getInterceptorIcon() }).addTo(map);
    let trail = L.polyline([[start.lat,start.lng]], { color:'#ffffaa', weight:3 }).addTo(map);
    let t=0;
    const flight=setInterval(()=>{
        t+=0.03;
        if(t>=1){ clearInterval(flight); map.removeLayer(missile); createExplosion(end.lat,end.lng); setTimeout(()=>{ map.removeLayer(trail); },1500); return; }
        let lat=start.lat+(end.lat-start.lat)*t;
        let lng=start.lng+(end.lng-start.lng)*t;
        let arcHeight=0.15;
        lat+=Math.sin(t*Math.PI)*arcHeight;
        missile.setLatLng([lat,lng]);
        trail.addLatLng([lat,lng]);
    },20);
}

function createExplosion(lat,lng){
    let exp = L.marker([lat,lng], { icon: L.divIcon({ className:'', html:'<div class="explosion"></div>', iconSize:[60,60] }) }).addTo(map);
    setTimeout(()=>{ map.removeLayer(exp); },500);
}

function updatePvoCooldowns(dt) {
    for(let pvo of pvoUnits){
        if(pvo.cooldown > 0){
            pvo.cooldown -= dt;
            if(pvo.cooldown < 0) pvo.cooldown = 0;
        }
    }
}

function updatePvoMovement(dt) {
    for(let pvo of pvoUnits){
        if(pvo.status === 'moving'){
            pvo.moveProgress += pvo.moveSpeed * dt * 10;
            if(pvo.moveProgress >= 1){
                pvo.status = 'active';
                pvo.lat = pvo.targetLat;
                pvo.lng = pvo.targetLng;
                pvo.city = pvo.targetCity;
                pvo.marker.setLatLng([pvo.lat, pvo.lng]);
                const pvoType = pvoTypes[pvo.type];
                if(pvo.rangeCircle) map.removeLayer(pvo.rangeCircle);
                const circle = L.circle([pvo.lat, pvo.lng], {
                    radius: pvoType.range * 1000,
                    color: '#00ffaa',
                    weight: 1,
                    fillOpacity: 0.08,
                    dashArray: '5,5'
                }).addTo(map);
                pvo.rangeCircle = circle;
                showHint(`📍 ПВО прибыл в ${pvo.city}`);
            } else {
                const lat = pvo.startLat + (pvo.targetLat - pvo.startLat) * pvo.moveProgress;
                const lng = pvo.startLng + (pvo.targetLng - pvo.startLng) * pvo.moveProgress;
                pvo.marker.setLatLng([lat, lng]);
            }
        }
    }
}

// ---- AI ----
const priorityWeights = { refinery:100, city:90, radar:70, powerPlant:60, rocketFactory:85 };
function chooseAITargets(maxTargets=3){
    let candidates = [];
    buildings.forEach(b => { if(b.team === myTeam) { let base = priorityWeights[b.type] || 30; let hpFactor = (b.hp < 50) ? 20 : 0; candidates.push({ target: b, score: base + hpFactor }); } });
    zones.forEach(z => { if(z.team === myTeam) { let base = 90; let hpFactor = (z.hp < 50) ? 30 : 0; candidates.push({ target: z, score: base + hpFactor }); } });
    candidates.sort((a,b) => b.score - a.score);
    let result = [];
    for(let i=0; i<Math.min(maxTargets, candidates.length); i++) result.push(candidates[i].target);
    if(setupDifficulty === "EXTREME" && result.length > 1 && Math.random() < 0.4 && candidates.length > 3) result.push(candidates[3].target);
    return result;
}
let aiPvo = null, aiAirportCoords = null, aiBuildInterval = null;
function aiBuildLogic(){
    if(!gameActive || !isAI) return;
    let aiBuildings = buildings.filter(b=>b.team===enemyTeam);
    let aiRadars = aiBuildings.filter(b=>b.type==='radar');
    let aiRefineries = aiBuildings.filter(b=>b.type==='refinery');
    let aiFactories = aiBuildings.filter(b=>b.type==='rocketFactory');
    if(aiRadars.length < 2) aiBuild('radar');
    else if(aiRefineries.length < 2) aiBuild('refinery');
    else if(aiFactories.length < 1) aiBuild('rocketFactory');
}
function aiBuild(type){
    let enemyZones = zones.filter(z=>z.team===enemyTeam);
    if(enemyZones.length===0) return;
    let zone = enemyZones[Math.floor(Math.random()*enemyZones.length)];
    let lat = zone.center[0] + (Math.random()-0.5)*0.2;
    let lng = zone.center[1] + (Math.random()-0.5)*0.2;
    if(!canBuildForTeam(lat,lng,enemyTeam)) return;
    let building = {id:Date.now()+Math.random(), lat, lng, type, team:enemyTeam, hp:(type==='radar'?120:(type==='powerPlant'?100:(type==='refinery'?150:200))), marker:null, radarCircle:null};
    let icon; if(type==='radar') icon=getRadarIcon(); else if(type==='powerPlant') icon=getPowerPlantIcon(); else if(type==='refinery') icon=getRefineryIcon(); else if(type==='rocketFactory') icon=getRocketFactoryIcon();
    if(icon){
        let marker=L.marker([lat,lng],{icon}).addTo(map);
        building.marker=marker;
        buildings.push(building);
        if(type==='radar') radars.push(building);
        else if(type==='powerPlant') powerPlants.push(building);
        else if(type==='refinery') refineries.push(building);
        else if(type==='rocketFactory') rocketFactories.push(building);
    }
}

function aiDeployPvo() {
    if (!gameActive || !isAI) return;
    const enemyCities = zones.filter(z => z.team === enemyTeam);
    if (enemyCities.length === 0) return;
    const city = enemyCities[Math.floor(Math.random() * enemyCities.length)];
    const types = Object.keys(pvoTypes).filter(t => pvoTypes[t].cost <= 500);
    if (types.length === 0) return;
    const typeId = types[Math.floor(Math.random() * types.length)];
    const pvoType = pvoTypes[typeId];
    const lat = city.center[0] + (Math.random() - 0.5) * 0.05;
    const lng = city.center[1] + (Math.random() - 0.5) * 0.05;
    for (let p of pvoUnits) {
        if (p.team === enemyTeam) {
            const dist = map.distance([lat, lng], [p.lat, p.lng]);
            if (dist < 3000) return;
        }
    }
    const pvoUnit = {
        id: Date.now() + Math.random(),
        type: typeId,
        lat: lat,
        lng: lng,
        team: enemyTeam,
        city: city.name,
        status: 'active',
        cooldown: 0,
        hp: 100,
        marker: null,
        rangeCircle: null
    };
    const icon = getPvoIcon(typeId);
    const marker = L.marker([lat, lng], { icon }).addTo(map);
    marker.bindPopup(`<b>${pvoType.name}</b><br>Город: ${city.name}<br>Дальность: ${pvoType.range} км<br>HP: 100`);
    pvoUnit.marker = marker;
    const circle = L.circle([lat, lng], {
        radius: pvoType.range * 1000,
        color: '#00ffaa',
        weight: 1,
        fillOpacity: 0.08,
        dashArray: '5,5'
    }).addTo(map);
    pvoUnit.rangeCircle = circle;
    pvoUnits.push(pvoUnit);
}

function launchAIAttack(target){
    let available = (enemyTeam === 'russia') ? ['shahed','geran5','x101','kalibr','kinzhal','iskander'] : ['lutyi','flamingo','stormshadow','grom2'];
    let type = available[Math.floor(Math.random() * available.length)];
    let count = 1;
    if(setupDifficulty === "NORMAL") count = Math.floor(Math.random()*2)+1;
    if(setupDifficulty === "HARD") count = Math.floor(Math.random()*3)+1;
    if(setupDifficulty === "EXTREME") count = Math.floor(Math.random()*4)+2;
    let targetLat, targetLng;
    if(target.center){ targetLat = target.center[0]; targetLng = target.center[1]; }
    else { targetLat = target.lat; targetLng = target.lng; }
    for(let i=0;i<count;i++){
        let offset = (i-(count-1)/2)*0.03;
        let lat = targetLat + offset, lng = targetLng + offset*0.5;
        let fromLatLng = {lat: aiAirportCoords.lat, lng: aiAirportCoords.lng};
        let p1 = map.latLngToLayerPoint([fromLatLng.lat, fromLatLng.lng]), p2 = map.latLngToLayerPoint([lat, lng]);
        let dx = p2.x - p1.x, dy = p2.y - p1.y;
        let angle = Math.atan2(dx, -dy) * 180 / Math.PI + weaponTypes[type].spriteOffset;
        let proj = { id: Date.now()+Math.random(), from: fromLatLng, to: {lat, lng}, progress:0, speed: weaponTypes[type].speed, damage: weaponTypes[type].damage, team: enemyTeam, targetType: (target.center ? 'zone' : 'building'), targetId: target.id, type: type, active:true, marker:null, lastInterceptCheck:0, interceptedFlag:false, angle:angle, launchTime: Date.now() };
        let marker = L.marker([proj.from.lat, proj.from.lng], { icon: getMissileIcon(type, enemyTeam), rotationOrigin: 'center center', rotationAngle: angle }).addTo(map);
        proj.marker = marker;
        projectiles.push(proj);
    }
}
function initAI(){
    let enemyZones = zones.filter(z=>z.team===enemyTeam);
    if(enemyZones.length===0) return;
    let getCenter=(z)=>z.center;
    aiAirportCoords = {lat: getCenter(enemyZones[0])[0] + (Math.random()-0.5)*0.3, lng: getCenter(enemyZones[0])[1] + (Math.random()-0.5)*0.3};
    aiPvo = {lat: getCenter(enemyZones[2]||enemyZones[0])[0] + (Math.random()-0.5)*0.3, lng: getCenter(enemyZones[2]||enemyZones[0])[1] + (Math.random()-0.5)*0.3, team: enemyTeam};
    if(aiInterval) clearInterval(aiInterval);
    let attackIntervalMs = 25000;
    if(setupDifficulty==="EASY") attackIntervalMs = 38000;
    if(setupDifficulty==="HARD") attackIntervalMs = 15000;
    if(setupDifficulty==="EXTREME") attackIntervalMs = 8000;
    aiInterval = setInterval(()=>{
        if(!gameActive) return;
        let targets = chooseAITargets(setupDifficulty === "EXTREME" ? 4 : 3);
        if(targets.length === 0) return;
        for(let t of targets) launchAIAttack(t);
    }, attackIntervalMs);
    if(aiBuildInterval) clearInterval(aiBuildInterval);
    aiBuildInterval = setInterval(() => aiBuildLogic(), 30000);
    // AI размещает ПВО
    setInterval(() => aiDeployPvo(), 45000);
    setTimeout(() => aiDeployPvo(), 5000);
}

// ---- Игровой цикл ----
function gameLoop(now) {
    if (!gameActive) return;
    let dt = Math.min(0.1, (now - lastUpdate) / 1000);
    lastUpdate = now;
    updatePvoCooldowns(dt);
    updatePvoMovement(dt);
    updateProjectiles(dt);
    requestAnimationFrame(gameLoop);
}

function updateProjectiles(dt){
    for(let i=0;i<projectiles.length;i++){
        let p=projectiles[i]; if(!p.active) continue;
        if(tryIntercept(p)){ p.active=false; map.removeLayer(p.marker); projectiles.splice(i,1); i--; continue; }
        p.progress += p.speed * dt;
        if(p.progress >= 1){
            p.active=false; map.removeLayer(p.marker);
            if(p.targetType === 'zone'){
                let targetZone = zones.find(z => z.id === p.targetId);
                if(targetZone && targetZone.hp > 0){
                    targetZone.hp = Math.max(0, targetZone.hp - p.damage);
                    updateZoneMarkers(); playBeep(200,0.4); addXP(20);
                    if (targetZone.hp <= 0) { removeZoneIfDestroyed(targetZone); addXP(100); }
                    if(isMultiplayer && isHost) syncGameState();
                }
            } else if(p.targetType === 'building'){
                let targetBuilding = buildings.find(b => b.id == p.targetId);
                if(targetBuilding && targetBuilding.hp > 0){
                    targetBuilding.hp -= p.damage; playBeep(200,0.4); addXP(20);
                    if(targetBuilding.hp <= 0) destroyBuilding(targetBuilding);
                    if(isMultiplayer && isHost) syncGameState();
                }
            } else if(p.targetType === 'pvo'){
                let targetPvo = pvoUnits.find(pv => pv.id === p.targetId);
                if(targetPvo && targetPvo.team !== myTeam){
                    targetPvo.hp = (targetPvo.hp || 100) - p.damage;
                    if(targetPvo.hp <= 0){
                        if(targetPvo.marker) map.removeLayer(targetPvo.marker);
                        if(targetPvo.rangeCircle) map.removeLayer(targetPvo.rangeCircle);
                        pvoUnits = pvoUnits.filter(pv => pv.id !== targetPvo.id);
                        showHint(`🛡️ ПВО ${pvoTypes[targetPvo.type].name} уничтожено!`);
                        addXP(50);
                        if(isMultiplayer && isHost) syncGameState();
                    } else {
                        if(targetPvo.marker) targetPvo.marker.setPopupContent(`<b>${pvoTypes[targetPvo.type].name}</b><br>Город: ${targetPvo.city}<br>Дальность: ${pvoTypes[targetPvo.type].range} км<br>HP: ${Math.floor(targetPvo.hp)}`);
                        if(isMultiplayer && isHost) syncGameState();
                    }
                }
            }
            updateStatsAfterHit(p.damage, p.targetType, true);
            projectiles.splice(i,1); i--;
            continue;
        }
        let lat = p.from.lat + (p.to.lat - p.from.lat) * p.progress;
        let lng = p.from.lng + (p.to.lng - p.from.lng) * p.progress;
        p.marker.setLatLng([lat, lng]);
        if (p.marker.setRotationAngle) p.marker.setRotationAngle(p.angle);
    }
}

function updateProjectileVisibility(){
    for(let p of projectiles){
        if (!p.marker || !p.marker._icon) continue;
        if(p.team === myTeam){
            p.marker._icon.classList.remove('hidden-projectile');
            continue;
        }
        let detected = false;
        for(let r of radars){
            if(r.team !== myTeam) continue;
            let dist = map.distance([r.lat,r.lng], [p.marker.getLatLng().lat, p.marker.getLatLng().lng]);
            if(dist < 150000){ detected = true; break; }
        }
        if(detected) p.marker._icon.classList.remove('hidden-projectile');
        else p.marker._icon.classList.add('hidden-projectile');
    }
}

function startRadarAnimation(){
    if(radarAnimationInterval) clearInterval(radarAnimationInterval);
    radarAnimationInterval = setInterval(() => {
        for(let r of radars){ if(r.marker){ r.radarAngle = (r.radarAngle + 30) % 360; let iconDiv = r.marker._icon?.querySelector('.radar-icon'); if(iconDiv) iconDiv.style.transform = `rotate(${r.radarAngle}deg)`; } }
        updateProjectileVisibility();
    },1500);
}
// ============================================================
// МУЛЬТИПЛЕЕР (централизованный подход)
// ============================================================
let currentRoomId = null;
let gameListenerRef = null;
let isHost = false;
let mpGameRef = null;
let isMultiplayer = false;
let mpInitDone = false;
let gameStateListenerRef = null;
let roomCleanupInterval = null;

function generateRoomId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    return id;
}

function startMultiplayerGame(roomId, data) {
    console.log("startMultiplayerGame", roomId, data);
    gameActive = false;
    if (map) { map.remove(); map = null; }
    buildings = []; radars = []; powerPlants = []; refineries = []; rocketFactories = [];
    projectiles = []; zones = [];
    pvoUnits = [];
    pvoStaffBuilt = false;
    airportPlaced = false; airportMarker = null;
    if (economyInterval) clearInterval(economyInterval);
    if (radarAnimationInterval) clearInterval(radarAnimationInterval);

    const players = data.players;
    const myTeamFromData = players[currentUser].team;
    myTeam = myTeamFromData;
    enemyTeam = myTeam === 'russia' ? 'ukraine' : 'russia';
    isAI = false;
    isMultiplayer = true;
    isSandbox = false;
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('map').style.display = 'block';

    mpGameRef = gamesRef.child(roomId).child('gameState');
    gameStateListenerRef = mpGameRef;

    gameStateListenerRef.on('value', snapshot => {
        const state = snapshot.val();
        if (state) {
            applyGameState(state);
        }
    });

    if (isHost) {
        mpGameRef.once('value', snap => {
            if (!snap.exists()) {
                const allCitiesWithHp = prepareCities(allCities.map(c => c.name));
                const initialState = {
                    zones: allCitiesWithHp.map(z => ({ id: z.name, hp: z.hp })),
                    buildings: [],
                    pvoUnits: [],
                    projectiles: [],
                    pvoStaffBuilt: false
                };
                mpGameRef.set(initialState).then(() => {
                    initMPGame(initialState);
                });
            } else {
                initMPGame(snap.val());
            }
        });
        subscribeEvents();
    } else {
        mpGameRef.once('value', snap => {
            const state = snap.val();
            if (state) {
                initMPGame(state);
            } else {
                setTimeout(() => startMultiplayerGame(roomId, data), 500);
            }
        });
    }
}

function initMPGame(initialState) {
    console.log("initMPGame", initialState);
    if (map) { map.remove(); map = null; }
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('map').style.display = 'block';

    map = L.map('map', { zoomControl: false }).setView([55.0, 40.0], 5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '© CartoDB' }).addTo(map);
    setTimeout(() => { if (map) map.invalidateSize(); }, 50);

    let ld = document.createElement('div');
    ld.className = 'loading-indicator';
    ld.innerText = 'Загрузка границ...';
    document.body.appendChild(ld);

    loadRealBorders(() => {
        if (ld) ld.remove();

        zones = [];
        const cityMap = {};
        allCities.forEach(c => { cityMap[c.name] = c; });
        initialState.zones.forEach(sz => {
            const base = cityMap[sz.id];
            if (!base) return;
            const z = { id: sz.id, name: base.name, center: base.center, team: base.team, hp: sz.hp, baseHp: sz.hp };
            let circle = L.circle(z.center, { radius: 15000, color: z.team === 'russia' ? '#ff5555' : '#55aaff', weight: 2, fillOpacity: 0.25 }).addTo(map);
            let marker = L.marker(z.center, { icon: createCityMarker(z) }).addTo(map);
            zones.push({ ...z, circle, marker });
        });
        updateTotalPercent();

        buildings = [];
        radars = [];
        powerPlants = [];
        refineries = [];
        rocketFactories = [];
        pvoStaffBuilt = initialState.pvoStaffBuilt || false;
        (initialState.buildings || []).forEach(b => {
            let icon;
            if (b.type === 'radar') icon = getRadarIcon();
            else if (b.type === 'powerPlant') icon = getPowerPlantIcon();
            else if (b.type === 'refinery') icon = getRefineryIcon();
            else if (b.type === 'rocketFactory') icon = getRocketFactoryIcon();
            else if (b.type === 'pvoStaff') icon = getPvoStaffIcon();
            else return;
            let marker = L.marker([b.lat, b.lng], { icon }).addTo(map);
            if (b.type === 'pvoStaff') {
                marker.on('click', function() {
                    if (pvoStaffBuilt && b.team === myTeam) {
                        openPvoModal();
                    } else {
                        showHint("⚠️ Это не ваш штаб ПВО");
                    }
                });
            }
            b.marker = marker;
            buildings.push(b);
            if (b.type === 'radar') {
                let circle = L.circle([b.lat, b.lng], { radius: 150000, color: '#00ffff', weight: 1, fillOpacity: 0.05 }).addTo(map);
                b.radarCircle = circle;
                radars.push(b);
            } else if (b.type === 'powerPlant') {
                powerPlants.push(b);
            } else if (b.type === 'refinery') {
                refineries.push(b);
            } else if (b.type === 'rocketFactory') {
                rocketFactories.push(b);
            }
        });

        pvoUnits = [];
        (initialState.pvoUnits || []).forEach(p => {
            const pvoType = pvoTypes[p.type];
            if (!pvoType) return;
            const icon = getPvoIcon(p.type);
            const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
            marker.bindPopup(`<b>${pvoType.name}</b><br>Город: ${p.city}<br>Дальность: ${pvoType.range} км<br>HP: ${p.hp || 100}`);
            const circle = L.circle([p.lat, p.lng], {
                radius: pvoType.range * 1000,
                color: '#00ffaa',
                weight: 1,
                fillOpacity: 0.08,
                dashArray: '5,5'
            }).addTo(map);
            p.marker = marker;
            p.rangeCircle = circle;
            pvoUnits.push(p);
        });

        projectiles = [];
        (initialState.projectiles || []).forEach(p => {
            let marker = L.marker([p.from.lat, p.from.lng], {
                icon: getMissileIcon(p.type, p.team),
                rotationOrigin: 'center center',
                rotationAngle: p.angle || 0
            }).addTo(map);
            p.marker = marker;
            projectiles.push(p);
        });
        updateProjectileVisibility();

        const playerData = initialState.players ? initialState.players[currentUser] : null;
        resources = (playerData && playerData.resources !== undefined) ? playerData.resources : 300;
        updateUI();

        gameActive = true;
        lastUpdate = performance.now();
        requestAnimationFrame(gameLoop);
        startRadarAnimation();

        if (economyInterval) clearInterval(economyInterval);
        economyInterval = setInterval(() => {
            if (gameActive && !isSandbox && isMultiplayer) {
                let income = 5 + powerPlants.filter(p => p.team === myTeam).length * 3 + refineries.filter(r => r.team === myTeam).length * 15;
                resources += income;
                updateUI();
                if (isHost) {
                    const playersRef = gamesRef.child(currentRoomId).child('players');
                    playersRef.child(currentUser).update({ resources: resources });
                } else {
                    sendEvent('resourceUpdate', { resources: resources });
                }
            }
        }, 1000);

        map.off('click');
        map.on('click', (e) => {
            if (!airportPlaced) {
                let lat = e.latlng.lat, lng = e.latlng.lng;
                if (!isOwnTerritory(lat, lng)) { alert("Аэродром можно поставить только на своей территории!"); return; }
                let icon = getAirportIcon();
                airportMarker = L.marker([lat, lng], { icon }).addTo(map);
                airportMarker.bindPopup('<b>АЭРОДРОМ</b>');
                airportMarker.on('click', () => showAttackModal(airportMarker));
                airportPlaced = true;
                showHint("📡 Теперь постройте Радар");
                return;
            }
            if (pvoPlacementMode && pvoPlacementType) {
                const lat = e.latlng.lat, lng = e.latlng.lng;
                if (!isOwnTerritory(lat, lng)) { alert("Можно размещать ПВО только на своей территории!"); return; }
                let nearestCity = null, minDist = Infinity;
                for (const city of getMyCities()) {
                    const d = map.distance([lat, lng], city.center);
                    if (d < minDist) { minDist = d; nearestCity = city; }
                }
                const cityName = nearestCity ? nearestCity.name : 'Полевая позиция';
                const success = deployPvo(pvoPlacementType, cityName, lat, lng);
                if (success) { exitPlacementMode(); }
                return;
            }
            if (buildMode) {
                if (!isOwnTerritory(e.latlng.lat, e.latlng.lng)) { alert("Можно строить только на своей территории!"); return; }
                tryBuild(e.latlng.lat, e.latlng.lng, buildMode);
                buildMode = null;
            }
        });

        setTimeout(() => { if (map) map.invalidateSize(); }, 300);
    });
}

function sendEvent(eventType, data) {
    if (!isMultiplayer) return;
    const eventsRef = gamesRef.child(currentRoomId).child('events');
    eventsRef.push({
        type: eventType,
        data: data,
        player: currentUser,
        team: myTeam,
        timestamp: Date.now()
    });
}

function subscribeEvents() {
    if (!isHost) return;
    const eventsRef = gamesRef.child(currentRoomId).child('events');
    eventsRef.on('child_added', (snapshot) => {
        const event = snapshot.val();
        if (!event) return;
        if (event.player === currentUser) return;
        console.log("Получено событие от клиента:", event);
        if (event.type === 'build') {
            const b = event.data;
            const playerRef = gamesRef.child(currentRoomId).child('players').child(event.player);
            playerRef.once('value', snap => {
                const player = snap.val();
                if (!player) return;
                const cost = costs[b.type] || 0;
                if (player.resources < cost) {
                    showToast(`⚠️ Игрок ${event.player} пытался построить без ресурсов`, 'danger');
                    return;
                }
                if (!buildings.some(lb => lb.id === b.id)) {
                    let icon;
                    if (b.type === 'radar') icon = getRadarIcon();
                    else if (b.type === 'powerPlant') icon = getPowerPlantIcon();
                    else if (b.type === 'refinery') icon = getRefineryIcon();
                    else if (b.type === 'rocketFactory') icon = getRocketFactoryIcon();
                    else if (b.type === 'pvoStaff') icon = getPvoStaffIcon();
                    else return;
                    let marker = L.marker([b.lat, b.lng], { icon }).addTo(map);
                    if (b.type === 'pvoStaff') {
                        marker.on('click', function() {
                            if (pvoStaffBuilt && b.team === myTeam) {
                                openPvoModal();
                            } else {
                                showHint("⚠️ Это не ваш штаб ПВО");
                            }
                        });
                    }
                    b.marker = marker;
                    buildings.push(b);
                    if (b.type === 'radar') {
                        let circle = L.circle([b.lat, b.lng], { radius: 150000, color: '#00ffff', weight: 1, fillOpacity: 0.05 }).addTo(map);
                        b.radarCircle = circle;
                        radars.push(b);
                    } else if (b.type === 'powerPlant') {
                        powerPlants.push(b);
                    } else if (b.type === 'refinery') {
                        refineries.push(b);
                    } else if (b.type === 'rocketFactory') {
                        rocketFactories.push(b);
                    } else if (b.type === 'pvoStaff') {
                        pvoStaffBuilt = true;
                    }
                    playerRef.update({ resources: player.resources - cost });
                    syncGameState();
                    updateProjectileVisibility();
                }
            });
        } else if (event.type === 'deployPvo') {
            const p = event.data;
            const playerRef = gamesRef.child(currentRoomId).child('players').child(event.player);
            playerRef.once('value', snap => {
                const player = snap.val();
                if (!player) return;
                const pvoType = pvoTypes[p.type];
                if (!pvoType) return;
                if (player.resources < pvoType.cost) {
                    showToast(`⚠️ Игрок ${event.player} пытался разместить ПВО без ресурсов`, 'danger');
                    return;
                }
                if (!pvoUnits.some(pv => pv.id === p.id)) {
                    const icon = getPvoIcon(p.type);
                    const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
                    marker.bindPopup(`<b>${pvoType.name}</b><br>Город: ${p.city}<br>Дальность: ${pvoType.range} км<br>HP: 100`);
                    const circle = L.circle([p.lat, p.lng], {
                        radius: pvoType.range * 1000,
                        color: '#00ffaa',
                        weight: 1,
                        fillOpacity: 0.08,
                        dashArray: '5,5'
                    }).addTo(map);
                    p.marker = marker;
                    p.rangeCircle = circle;
                    pvoUnits.push(p);
                    playerRef.update({ resources: player.resources - pvoType.cost });
                    syncGameState();
                }
            });
        } else if (event.type === 'launch') {
            const data = event.data;
            const playerRef = gamesRef.child(currentRoomId).child('players').child(event.player);
            playerRef.once('value', snap => {
                const player = snap.val();
                if (!player) return;
                const weapon = weaponTypes[data.weaponType];
                if (!weapon) return;
                const totalCost = weapon.cost * data.count;
                if (player.resources < totalCost) {
                    showToast(`⚠️ Игрок ${event.player} пытался атаковать без ресурсов`, 'danger');
                    return;
                }
                const from = data.from;
                const to = data.to;
                const type = data.weaponType;
                const team = data.team || enemyTeam;
                const count = data.count || 1;
                const targetType = data.targetType || 'zone';
                const targetId = data.targetId;
                for (let i = 0; i < count; i++) {
                    let offset = (i - (count-1)/2) * 0.03;
                    let targetLat = to.lat + offset;
                    let targetLng = to.lng + offset * 0.5;
                    let p1 = map.latLngToLayerPoint([from.lat, from.lng]);
                    let p2 = map.latLngToLayerPoint([targetLat, targetLng]);
                    let dx = p2.x - p1.x;
                    let dy = p2.y - p1.y;
                    let angle = Math.atan2(dx, -dy) * 180 / Math.PI + (weaponTypes[type]?.spriteOffset || 0);
                    let proj = {
                        id: Date.now()+Math.random()+i,
                        from: from,
                        to: {lat: targetLat, lng: targetLng},
                        progress: 0,
                        speed: weaponTypes[type]?.speed || 0.03,
                        damage: weaponTypes[type]?.damage || 25,
                        team: team,
                        targetType: targetType,
                        targetId: targetId,
                        type: type,
                        active: true,
                        marker: null,
                        lastInterceptCheck: 0,
                        interceptedFlag: false,
                        angle: angle,
                        launchTime: data.launchTime || Date.now()
                    };
                    let marker = L.marker([from.lat, from.lng], {
                        icon: getMissileIcon(type, team),
                        rotationOrigin: 'center center',
                        rotationAngle: angle
                    }).addTo(map);
                    proj.marker = marker;
                    projectiles.push(proj);
                }
                playerRef.update({ resources: player.resources - totalCost });
                syncGameState();
                updateProjectileVisibility();
                if (targetType === 'zone' && zones.some(z => z.id === targetId && z.team === myTeam)) {
                    const zone = zones.find(z => z.id === targetId);
                    if (zone) {
                        const timeToImpact = Math.round(20 + Math.random() * 10);
                        showThreatAlert(zone.name, timeToImpact);
                        showToast(`🚨 Ракетная опасность! ${zone.name}`, 'danger');
                    }
                } else if (targetType === 'building' && buildings.some(b => b.id === targetId && b.team === myTeam)) {
                    const building = buildings.find(b => b.id === targetId);
                    if (building) {
                        const timeToImpact = Math.round(20 + Math.random() * 10);
                        showThreatAlert(getBuildingName(building.type), timeToImpact);
                        showToast(`🚨 Ракетная опасность! ${getBuildingName(building.type)}`, 'danger');
                    }
                } else if (targetType === 'pvo' && pvoUnits.some(p => p.id === targetId && p.team === myTeam)) {
                    const pvo = pvoUnits.find(p => p.id === targetId);
                    if (pvo) {
                        const timeToImpact = Math.round(20 + Math.random() * 10);
                        showThreatAlert(pvoTypes[pvo.type].name + ' (ПВО)', timeToImpact);
                        showToast(`🚨 Ракетная опасность! ${pvoTypes[pvo.type].name} (ПВО)`, 'danger');
                    }
                }
            });
        } else if (event.type === 'resourceUpdate') {
            const resourcesData = event.data.resources;
            const playerRef = gamesRef.child(currentRoomId).child('players').child(event.player);
            playerRef.update({ resources: resourcesData });
        }
    });
}

function syncGameState() {
    if (!isMultiplayer || !isHost || !mpGameRef) return;
    const state = {
        zones: zones.map(z => ({ id: z.id, hp: z.hp })),
        buildings: buildings.map(b => ({ id: b.id, type: b.type, lat: b.lat, lng: b.lng, team: b.team, hp: b.hp })),
        pvoUnits: pvoUnits.map(p => ({ id: p.id, type: p.type, lat: p.lat, lng: p.lng, team: p.team, city: p.city, status: p.status, cooldown: p.cooldown, hp: p.hp })),
        projectiles: projectiles.map(p => ({ id: p.id, from: p.from, to: p.to, progress: p.progress, speed: p.speed, damage: p.damage, team: p.team, targetType: p.targetType, targetId: p.targetId, type: p.type, active: p.active, angle: p.angle, launchTime: p.launchTime })),
        pvoStaffBuilt: pvoStaffBuilt
    };
    mpGameRef.set(state);
}

function applyGameState(state) {
    if (!state) return;
    if (isHost) return;
    console.log("Применяем состояние от хоста:", state);
    if (state.zones) {
        state.zones.forEach(sz => {
            const zone = zones.find(z => z.id === sz.id);
            if (zone) zone.hp = sz.hp;
        });
        updateZoneMarkers();
    }
    if (state.buildings) {
        state.buildings.forEach(b => {
            if (!buildings.some(lb => lb.id === b.id)) {
                let icon;
                if (b.type === 'radar') icon = getRadarIcon();
                else if (b.type === 'powerPlant') icon = getPowerPlantIcon();
                else if (b.type === 'refinery') icon = getRefineryIcon();
                else if (b.type === 'rocketFactory') icon = getRocketFactoryIcon();
                else if (b.type === 'pvoStaff') icon = getPvoStaffIcon();
                else return;
                let marker = L.marker([b.lat, b.lng], { icon }).addTo(map);
                if (b.type === 'pvoStaff') {
                    marker.on('click', function() {
                        if (pvoStaffBuilt && b.team === myTeam) {
                            openPvoModal();
                        } else {
                            showHint("⚠️ Это не ваш штаб ПВО");
                        }
                    });
                }
                b.marker = marker;
                buildings.push(b);
                if (b.type === 'radar') {
                    let circle = L.circle([b.lat, b.lng], { radius: 150000, color: '#00ffff', weight: 1, fillOpacity: 0.05 }).addTo(map);
                    b.radarCircle = circle;
                    radars.push(b);
                } else if (b.type === 'powerPlant') {
                    powerPlants.push(b);
                } else if (b.type === 'refinery') {
                    refineries.push(b);
                } else if (b.type === 'rocketFactory') {
                    rocketFactories.push(b);
                } else if (b.type === 'pvoStaff') {
                    pvoStaffBuilt = true;
                }
            }
        });
        const remoteIds = state.buildings.map(b => b.id);
        const toRemove = buildings.filter(b => b.team !== myTeam && !remoteIds.includes(b.id));
        toRemove.forEach(b => {
            if (b.marker) map.removeLayer(b.marker);
            if (b.radarCircle) map.removeLayer(b.radarCircle);
        });
        buildings = buildings.filter(b => b.team === myTeam || remoteIds.includes(b.id));
        radars = radars.filter(r => r.team === myTeam || remoteIds.includes(r.id));
        powerPlants = powerPlants.filter(p => p.team === myTeam || remoteIds.includes(p.id));
        refineries = refineries.filter(r => r.team === myTeam || remoteIds.includes(r.id));
        rocketFactories = rocketFactories.filter(r => r.team === myTeam || remoteIds.includes(r.id));
    }
    if (state.pvoUnits) {
        const remoteIds = state.pvoUnits.map(p => p.id);
        const toRemoveP = pvoUnits.filter(p => p.team !== myTeam && !remoteIds.includes(p.id));
        toRemoveP.forEach(p => {
            if (p.marker) map.removeLayer(p.marker);
            if (p.rangeCircle) map.removeLayer(p.rangeCircle);
        });
        pvoUnits = pvoUnits.filter(p => p.team === myTeam || remoteIds.includes(p.id));
        state.pvoUnits.forEach(p => {
            if (!pvoUnits.some(lp => lp.id === p.id)) {
                const pvoType = pvoTypes[p.type];
                if (!pvoType) return;
                const icon = getPvoIcon(p.type);
                const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
                marker.bindPopup(`<b>${pvoType.name}</b><br>Город: ${p.city}<br>Дальность: ${pvoType.range} км<br>HP: ${p.hp || 100}`);
                const circle = L.circle([p.lat, p.lng], {
                    radius: pvoType.range * 1000,
                    color: '#00ffaa',
                    weight: 1,
                    fillOpacity: 0.08,
                    dashArray: '5,5'
                }).addTo(map);
                p.marker = marker;
                p.rangeCircle = circle;
                pvoUnits.push(p);
            } else {
                const existing = pvoUnits.find(lp => lp.id === p.id);
                if (existing) {
                    existing.lat = p.lat;
                    existing.lng = p.lng;
                    existing.city = p.city;
                    existing.status = p.status;
                    existing.cooldown = p.cooldown;
                    existing.hp = p.hp || 100;
                    if (existing.marker) {
                        existing.marker.setLatLng([p.lat, p.lng]);
                        if (p.hp) existing.marker.setPopupContent(`<b>${pvoTypes[p.type].name}</b><br>Город: ${p.city}<br>Дальность: ${pvoTypes[p.type].range} км<br>HP: ${Math.floor(p.hp)}`);
                    }
                    if (existing.rangeCircle) {
                        existing.rangeCircle.setLatLng([p.lat, p.lng]);
                    }
                }
            }
        });
    }
    if (state.projectiles) {
        const remoteIds = state.projectiles.map(p => p.id);
        const toRemoveProj = projectiles.filter(p => !remoteIds.includes(p.id) && p.wave !== 'tutorial');
        toRemoveProj.forEach(p => {
            if (p.marker) map.removeLayer(p.marker);
        });
        projectiles = projectiles.filter(p => remoteIds.includes(p.id) || p.wave === 'tutorial');
        state.projectiles.forEach(p => {
            const existing = projectiles.find(lp => lp.id === p.id);
            if (!existing) {
                let marker = L.marker([p.from.lat, p.from.lng], {
                    icon: getMissileIcon(p.type, p.team),
                    rotationOrigin: 'center center',
                    rotationAngle: p.angle || 0
                }).addTo(map);
                const newProj = { ...p, marker: marker };
                projectiles.push(newProj);
            } else {
                existing.progress = p.progress;
                existing.active = p.active;
                existing.to = p.to;
                existing.from = p.from;
                existing.launchTime = p.launchTime || existing.launchTime;
                if (existing.marker) {
                    const lat = p.from.lat + (p.to.lat - p.from.lat) * p.progress;
                    const lng = p.from.lng + (p.to.lng - p.from.lng) * p.progress;
                    existing.marker.setLatLng([lat, lng]);
                    if (existing.marker.setRotationAngle) existing.marker.setRotationAngle(p.angle || 0);
                }
            }
        });
        updateProjectileVisibility();
    }
}
