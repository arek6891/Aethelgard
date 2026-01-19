import { config } from './Config.js';
import { state } from './GameState.js';
import { cartesianToIso } from './Utils.js';
import { drawScene, resize } from './Renderer.js';
import { initInput } from './Input.js';

const canvas = document.getElementById('gameCanvas');

function generateLevel(levelNum) {
    console.log(`Generowanie Poziomu ${levelNum}...`);
    state.mapData = [];
    state.enemies = [];
    state.lootBags = [];
    state.currentLootBag = null;
    document.getElementById('loot-window').style.display = 'none';
    
    // 1. Inicjalizacja pustej mapy (Trawa)
    for (let x = 0; x < config.mapSize; x++) {
        state.mapData[x] = [];
        for (let y = 0; y < config.mapSize; y++) {
            state.mapData[x][y] = 0;
        }
    }

    // 2. Granice mapy (Ściany)
    for (let i = 0; i < config.mapSize; i++) {
        state.mapData[i][0] = 1;
        state.mapData[i][config.mapSize - 1] = 1;
        state.mapData[0][i] = 1;
        state.mapData[config.mapSize - 1][i] = 1;
    }

    // Helper: Generowanie klastrów (dla lasów i jezior)
    function spawnCluster(type, count, minRad, maxRad, density) {
        for(let i=0; i<count; i++) {
            const cx = Math.floor(Math.random() * (config.mapSize - 6)) + 3;
            const cy = Math.floor(Math.random() * (config.mapSize - 6)) + 3;
            const rad = Math.floor(Math.random() * (maxRad - minRad)) + minRad;
            
            for(let x = cx - rad; x <= cx + rad; x++) {
                for(let y = cy - rad; y <= cy + rad; y++) {
                    if(x > 1 && x < config.mapSize-1 && y > 1 && y < config.mapSize-1) {
                        const dist = Math.sqrt((x-cx)**2 + (y-cy)**2);
                        if(dist <= rad && Math.random() < density) {
                            if(state.mapData[x][y] === 0) state.mapData[x][y] = type;
                        }
                    }
                }
            }
        }
    }

    // 3. Generowanie Terenu
    spawnCluster(2, 4, 2, 5, 1.0); // Woda
    spawnCluster(3, 10, 3, 6, 0.7); // Las

    // 4. Detale (Skały i Ruiny)
    for(let i=0; i<50; i++) {
        const rx = Math.floor(Math.random() * config.mapSize);
        const ry = Math.floor(Math.random() * config.mapSize);
        if(state.mapData[rx][ry] === 0) state.mapData[rx][ry] = 4; 
    }
    for(let i=0; i<30; i++) {
         const wx = Math.floor(Math.random() * config.mapSize);
         const wy = Math.floor(Math.random() * config.mapSize);
         if(state.mapData[wx][wy] === 0) state.mapData[wx][wy] = 1; 
    }

    // 5. Strefa bezpieczna (Spawn)
    for(let x = 16; x < 24; x++) {
        for(let y = 16; y < 24; y++) {
            state.mapData[x][y] = 0;
        }
    }
    // Reset Gracza
    state.player.x = 20;
    state.player.y = 20;
    state.player.targetX = 20;
    state.player.targetY = 20;

    // 6. Wyjście (Schody - Typ 5)
    let stairsPlaced = false;
    while(!stairsPlaced) {
        const sx = Math.floor(Math.random() * (config.mapSize - 4)) + 2;
        const sy = Math.floor(Math.random() * (config.mapSize - 4)) + 2;
        // Musi być daleko od środka (bezpiecznej strefy)
        const distFromCenter = Math.sqrt((sx-20)**2 + (sy-20)**2);
        
        if(state.mapData[sx][sy] === 0 && distFromCenter > 10) {
            state.mapData[sx][sy] = 5;
            stairsPlaced = true;
            console.log(`Schody umieszczone na [${sx}, ${sy}]`);
        }
    }

    // 7a. Spawn Unikatowych Mobów (Bosses/Rares)
    // Uytek (30% szansy)
    if (Math.random() < 0.3) {
        let placed = false;
        while(!placed) {
            const ux = Math.floor(Math.random() * config.mapSize);
            const uy = Math.floor(Math.random() * config.mapSize);
            if (state.mapData[ux][uy] === 0 && (ux < 15 || ux > 25 || uy < 15 || uy > 25)) {
                state.enemies.push({
                    x: ux, y: uy,
                    type: 'uytek',
                    hp: 15 + (levelNum * 2), // Słaby, ale irytujący
                    maxHp: 15 + (levelNum * 2),
                    name: "Uytek"
                });
                placed = true;
                console.log("Uytek pojawił się na mapie!");
            }
        }
    }
    // Eloryba3000 (20% szansy)
    if (Math.random() < 0.2) {
        let placed = false;
        while(!placed) {
            const ex = Math.floor(Math.random() * config.mapSize);
            const ey = Math.floor(Math.random() * config.mapSize);
            if (state.mapData[ex][ey] === 0 && (ex < 15 || ex > 25 || ey < 15 || ey > 25)) {
                state.enemies.push({
                    x: ex, y: ey,
                    type: 'eloryba3000',
                    hp: 60 + (levelNum * 10), // Boss Tank
                    maxHp: 60 + (levelNum * 10),
                    name: "Eloryba3000"
                });
                placed = true;
                console.log("Eloryba3000 nadpływa!");
            }
        }
    }

    // 7. Spawn Wrogów (Skalowanie z poziomem)
    let enemiesCount = 0;
    const maxEnemies = 20 + (levelNum * 5);
    
    while(enemiesCount < maxEnemies) {
        const ex = Math.floor(Math.random() * config.mapSize);
        const ey = Math.floor(Math.random() * config.mapSize);
        const isSafeZone = (ex > 15 && ex < 25 && ey > 15 && ey < 25);
        
        if (state.mapData[ex][ey] === 0 && !isSafeZone) {
            const isSpider = Math.random() < 0.4;
            const baseHp = isSpider ? 20 : 30;
            const enemyType = isSpider ? 'spider' : 'skeleton';
            const enemyName = isSpider ? 'Pająk' : 'Szkielet';

            state.enemies.push({
                x: ex, y: ey,
                type: enemyType,
                hp: baseHp + (levelNum * 5),
                maxHp: baseHp + (levelNum * 5),
                name: enemyName
            });
            enemiesCount++;
        }
    }
}

// Inicjalizacja świata
export function initGame() {
    state.level = 1;
    generateLevel(state.level);
    
    // Inicjalizacja UI Plecaka (puste sloty - listenery)
    const backpackGrid = document.getElementById('backpack-grid');
    if (backpackGrid) {
        backpackGrid.innerHTML = '';
        for(let i=0; i<state.player.backpackSize; i++) {
            const slot = document.createElement('div');
            slot.className = 'item-slot';
            slot.dataset.index = i;
            slot.onclick = () => window.useItem(i); 
            backpackGrid.appendChild(slot);
        }
    }

    initInput();
    window.addEventListener('resize', resize);
    resize();
}

function update() {
    // Ruch gracza
    const dx = state.player.targetX - state.player.x;
    const dy = state.player.targetY - state.player.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist > state.player.speed) {
        state.player.x += (dx / dist) * state.player.speed;
        state.player.y += (dy / dist) * state.player.speed;
    } else {
        state.player.x = state.player.targetX;
        state.player.y = state.player.targetY;
        
        // Sprawdź czy stoimy na schodach (Tile 5)
        const pX = Math.round(state.player.x);
        const pY = Math.round(state.player.y);
        
        if (state.mapData[pX] && state.mapData[pX][pY] === 5) {
            console.log("Wejście na schody!");
            state.level++;
            // Mały delay dla efektu
            state.player.targetX = state.player.x; // Stop movement
            state.player.targetY = state.player.y;
            
            // Opcjonalnie: alert lub UI
            // alert(`Schodzisz głębiej... Poziom ${state.level}`);
            generateLevel(state.level);
        }
    }

    // Kamera
    const playerIso = cartesianToIso(state.player.x, state.player.y);
    config.offsetX = canvas.width / 2 - playerIso.x;
    config.offsetY = canvas.height / 2 - playerIso.y;

    // UI Pasków (HP/MP)
    const hpPercent = (state.player.hp / state.player.maxHp) * 100;
    const hpBar = document.querySelector('#hp-bar .bar-fill');
    if(hpBar) hpBar.style.width = `${hpPercent}%`;
    const hpText = document.getElementById('hp-text');
    if(hpText) hpText.innerText = `${Math.floor(state.player.hp)}/${state.player.maxHp}`;
}

export function gameLoop() {
    update();
    drawScene();
    requestAnimationFrame(gameLoop);
}