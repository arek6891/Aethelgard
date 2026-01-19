import { config } from './Config.js';
import { state } from './GameState.js';
import { cartesianToIso } from './Utils.js';
import { drawScene, resize } from './Renderer.js';
import { initInput } from './Input.js';

const canvas = document.getElementById('gameCanvas');

// Inicjalizacja świata
export function initGame() {
    state.mapData = [];
    state.enemies = [];
    state.lootBags = [];
    
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
                            // Nadpisz tylko trawę
                            if(state.mapData[x][y] === 0) state.mapData[x][y] = type;
                        }
                    }
                }
            }
        }
    }

    // 3. Generowanie Terenu
    // Woda (2) - gęste jeziora
    spawnCluster(2, 4, 2, 5, 1.0); 
    // Las (3) - gęste lasy, ale z przejściami (density 0.7)
    spawnCluster(3, 10, 3, 6, 0.7); 

    // 4. Detale (Skały i Ruiny)
    for(let i=0; i<50; i++) {
        const rx = Math.floor(Math.random() * config.mapSize);
        const ry = Math.floor(Math.random() * config.mapSize);
        if(state.mapData[rx][ry] === 0) state.mapData[rx][ry] = 4; // Skała (4)
    }
    for(let i=0; i<30; i++) {
         const wx = Math.floor(Math.random() * config.mapSize);
         const wy = Math.floor(Math.random() * config.mapSize);
         if(state.mapData[wx][wy] === 0) state.mapData[wx][wy] = 1; // Ruina (1)
    }

    // 5. Strefa bezpieczna (Spawn) - wyczyść środek
    for(let x = 16; x < 24; x++) {
        for(let y = 16; y < 24; y++) {
            state.mapData[x][y] = 0;
        }
    }

    // 6. Spawn Wrogów
    let enemiesCount = 0;
    while(enemiesCount < 25) {
        const ex = Math.floor(Math.random() * config.mapSize);
        const ey = Math.floor(Math.random() * config.mapSize);
        const isSafeZone = (ex > 15 && ex < 25 && ey > 15 && ey < 25);
        
        if (state.mapData[ex][ey] === 0 && !isSafeZone) {
            state.enemies.push({
                x: ex, y: ey,
                hp: 30, maxHp: 30,
                name: "Szkielet"
            });
            enemiesCount++;
        }
    }
    
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
