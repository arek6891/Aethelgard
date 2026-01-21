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

    // 0. Ustal Biom
    // 30% szans na Biom Uytek
    state.biome = Math.random() < 0.3 ? 'uytek' : 'normal';
    console.log(`Generowanie Poziomu ${levelNum} [Biom: ${state.biome}]`);
    
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
    // Wymuszona pozycja w rogu mapy (koniec poziomu)
    const sx = config.mapSize - 4;
    const sy = config.mapSize - 4;
    
    // Wyczyść teren wokół schodów, żeby były widoczne i dostępne
    for(let i = sx - 1; i <= sx + 1; i++) {
        for(let j = sy - 1; j <= sy + 1; j++) {
            if (state.mapData[i] && state.mapData[i][j] !== undefined) {
                state.mapData[i][j] = 0; // Trawa
            }
        }
    }
    
    state.mapData[sx][sy] = 5; // Schody
    console.log(`Schody umieszczone na stałe: [${sx}, ${sy}]`);

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
    const maxEnemies = 10 + (levelNum * 2);
    
    while(enemiesCount < maxEnemies) {
        const ex = Math.floor(Math.random() * config.mapSize);
        const ey = Math.floor(Math.random() * config.mapSize);
        const isSafeZone = (ex > 15 && ex < 25 && ey > 15 && ey < 25);
        
        if (state.mapData[ex][ey] === 0 && !isSafeZone) {
            let enemyType, baseHp, enemyName;

            if (state.biome === 'uytek') {
                // W Biomie Uytek 90% szans na Uyteka, 10% na Elorybę (jeśli rzadki) lub Pająka
                const isRare = Math.random() < 0.1;
                enemyType = isRare ? 'spider' : 'uytek';
                enemyName = isRare ? 'Pająk' : 'Minion Uytek';
                baseHp = isRare ? 20 : 15;
            } else {
                // Normalny Biom
                const isSpider = Math.random() < 0.4;
                baseHp = isSpider ? 20 : 30;
                enemyType = isSpider ? 'spider' : 'skeleton';
                enemyName = isSpider ? 'Pająk' : 'Szkielet';
            }

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

    // --- ENEMY AI ---
    const now = Date.now();
    state.enemies.forEach(enemy => {
        // Init properties if missing
        if (!enemy.lastAttackTime) enemy.lastAttackTime = 0;
        if (!enemy.speed) enemy.speed = 0.03 + (Math.random() * 0.02); // Slight variation
        
        // Simple Patrol Logic
        if (!enemy.patrolTarget) enemy.patrolTarget = null;

        const distToPlayer = Math.sqrt((state.player.x - enemy.x)**2 + (state.player.y - enemy.y)**2);

        if (distToPlayer < 8) { // AGGRO RANGE
            enemy.patrolTarget = null; // Forget patrol
            
            if (distToPlayer > 1.2) { // CHASE
                const edx = state.player.x - enemy.x;
                const edy = state.player.y - enemy.y;
                enemy.x += (edx / distToPlayer) * enemy.speed;
                enemy.y += (edy / distToPlayer) * enemy.speed;
            } else { // ATTACK
                if (now - enemy.lastAttackTime > 1000) { // 1 sec cooldown
                    enemy.lastAttackTime = now;
                    // Calc damage
                    let dmg = 5 + (state.level * 2); // Scaling damage
                    if (enemy.type === 'uytek') dmg *= 1.5;
                    if (enemy.type === 'eloryba3000') dmg *= 2.0;
                    
                    state.player.hp -= Math.floor(dmg);
                    console.log(`${enemy.name || 'Wróg'} atakuje! Obrażenia: ${Math.floor(dmg)}. HP: ${state.player.hp}`);
                    
                    // Visual feedback could go here (screen shake etc)
                }
            }
        } else { // PATROL (Random Wander)
            if (!enemy.patrolTarget && Math.random() < 0.02) {
                // Pick random point nearby
                const rx = enemy.x + (Math.random() * 6 - 3);
                const ry = enemy.y + (Math.random() * 6 - 3);
                // Basic bounds check
                if (rx > 1 && rx < config.mapSize-1 && ry > 1 && ry < config.mapSize-1) {
                     enemy.patrolTarget = { x: rx, y: ry };
                }
            }
            
            if (enemy.patrolTarget) {
                const pdx = enemy.patrolTarget.x - enemy.x;
                const pdy = enemy.patrolTarget.y - enemy.y;
                const pdist = Math.sqrt(pdx*pdx + pdy*pdy);
                
                if (pdist > enemy.speed) {
                    enemy.x += (pdx / pdist) * (enemy.speed * 0.5); // Walk slower when patrolling
                    enemy.y += (pdy / pdist) * (enemy.speed * 0.5);
                } else {
                    enemy.patrolTarget = null; // Arrived
                }
            }
        }
    });

    // Check Game Over
    if (state.player.hp <= 0) {
        state.player.hp = 0;
        // Simple Game Over handling
        // For now, just a console log or maybe a reload if we want to be harsh
        // console.log("GAME OVER");
        // alert("GAME OVER!"); 
        // window.location.reload(); 
        // Commented out alert to avoid loop, but let's reset to safe spawn
        state.player.x = 20;
        state.player.y = 20;
        state.player.hp = state.player.maxHp;
        console.log("GAME OVER - RESPAWN");
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