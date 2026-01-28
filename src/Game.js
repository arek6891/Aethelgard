import { config } from './Config.js';
import { state } from './GameState.js';
import { cartesianToIso } from './Utils.js';
import { drawScene, resize } from './Renderer.js';
import { initInput } from './Input.js';
import { updateSlowEffects } from './Skills.js';
import { updateEffects } from './SkillEffects.js';

const canvas = document.getElementById('gameCanvas');

function generateLevel(levelNum) {
    console.log(`Generowanie Poziomu ${levelNum}...`);
    state.mapData = [];
    state.enemies = [];
    state.lootBags = [];
    state.currentLootBag = null;
    document.getElementById('loot-window').style.display = 'none';

    // 0. Ustal Biom
    // 30% Uytek, 25% Inferno, 45% Normal
    const biomeRoll = Math.random();
    if (biomeRoll < 0.30) {
        state.biome = 'uytek';
    } else if (biomeRoll < 0.55) {
        state.biome = 'inferno';
    } else {
        state.biome = 'normal';
    }
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
        for (let i = 0; i < count; i++) {
            const cx = Math.floor(Math.random() * (config.mapSize - 6)) + 3;
            const cy = Math.floor(Math.random() * (config.mapSize - 6)) + 3;
            const rad = Math.floor(Math.random() * (maxRad - minRad)) + minRad;

            for (let x = cx - rad; x <= cx + rad; x++) {
                for (let y = cy - rad; y <= cy + rad; y++) {
                    if (x > 1 && x < config.mapSize - 1 && y > 1 && y < config.mapSize - 1) {
                        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                        if (dist <= rad && Math.random() < density) {
                            if (state.mapData[x][y] === 0) state.mapData[x][y] = type;
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
    for (let i = 0; i < 50; i++) {
        const rx = Math.floor(Math.random() * config.mapSize);
        const ry = Math.floor(Math.random() * config.mapSize);
        if (state.mapData[rx][ry] === 0) state.mapData[rx][ry] = 4;
    }
    for (let i = 0; i < 30; i++) {
        const wx = Math.floor(Math.random() * config.mapSize);
        const wy = Math.floor(Math.random() * config.mapSize);
        if (state.mapData[wx][wy] === 0) state.mapData[wx][wy] = 1;
    }

    // 5. Strefa bezpieczna (Spawn)
    for (let x = 16; x < 24; x++) {
        for (let y = 16; y < 24; y++) {
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
    for (let i = sx - 1; i <= sx + 1; i++) {
        for (let j = sy - 1; j <= sy + 1; j++) {
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
        while (!placed) {
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
    // Eloryba3000 (40% szansy) - SPAWN W WODZIE LUB OBOK!
    if (Math.random() < 0.4) {
        // Znajdź tile wody do spawnu
        let waterTiles = [];
        for (let x = 2; x < config.mapSize - 2; x++) {
            for (let y = 2; y < config.mapSize - 2; y++) {
                if (state.mapData[x][y] === 2) { // Woda
                    waterTiles.push({ x, y });
                }
            }
        }

        let spawnX, spawnY;

        if (waterTiles.length > 0) {
            // Spawnuj NA wodzie
            const spawnTile = waterTiles[Math.floor(Math.random() * waterTiles.length)];
            spawnX = spawnTile.x;
            spawnY = spawnTile.y;
            console.log(`Eloryba3000 wyskakuje z wody na (${spawnX}, ${spawnY})!`);
        } else {
            // Fallback - znajdź losowe miejsce daleko od gracza
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 100) {
                const ex = Math.floor(Math.random() * config.mapSize);
                const ey = Math.floor(Math.random() * config.mapSize);
                if (state.mapData[ex][ey] === 0 && (ex < 10 || ex > 30 || ey < 10 || ey > 30)) {
                    spawnX = ex;
                    spawnY = ey;
                    placed = true;
                }
                attempts++;
            }
            if (!placed) {
                spawnX = 5;
                spawnY = 5;
            }
            console.log(`Eloryba3000 pojawia się na lądzie (${spawnX}, ${spawnY}) - brak wody!`);
        }

        state.enemies.push({
            x: spawnX,
            y: spawnY,
            type: 'eloryba3000',
            hp: 60 + (levelNum * 10),
            maxHp: 60 + (levelNum * 10),
            name: "Eloryba3000",
            isWaterBoss: true,
            throwCooldown: 0,
            jumpAnimation: 0,
            lastAttackTime: 0,
            speed: 0.02
        });
    }

    // Fire Lord (Boss Biomu Inferno) - 40% szansy w biomie inferno
    if (state.biome === 'inferno' && Math.random() < 0.4) {
        // Znajdź lawę (water w inferno) lub losowe miejsce
        let lavaTiles = [];
        for (let x = 2; x < config.mapSize - 2; x++) {
            for (let y = 2; y < config.mapSize - 2; y++) {
                if (state.mapData[x][y] === 2) { // Lawa (water tile)
                    // Sprawdź sąsiednie tile lądu
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            if (state.mapData[x + dx] && state.mapData[x + dx][y + dy] === 0) {
                                lavaTiles.push({ x: x + dx, y: y + dy });
                            }
                        }
                    }
                }
            }
        }

        let spawnX, spawnY;
        if (lavaTiles.length > 0) {
            const tile = lavaTiles[Math.floor(Math.random() * lavaTiles.length)];
            spawnX = tile.x;
            spawnY = tile.y;
        } else {
            spawnX = 5 + Math.floor(Math.random() * 5);
            spawnY = 5 + Math.floor(Math.random() * 5);
        }

        state.enemies.push({
            x: spawnX,
            y: spawnY,
            type: 'fireLord',
            hp: 100 + (levelNum * 15),
            maxHp: 100 + (levelNum * 15),
            name: "Władca Ognia",
            isBoss: true,
            fireAttackCooldown: 0,
            lastAttackTime: 0,
            speed: 0.025
        });
        console.log(`Władca Ognia pojawia się w Piekle!`);
    }

    // 7. Spawn Wrogów (Skalowanie z poziomem)
    let enemiesCount = 0;
    const maxEnemies = 10 + (levelNum * 2);

    while (enemiesCount < maxEnemies) {
        const ex = Math.floor(Math.random() * config.mapSize);
        const ey = Math.floor(Math.random() * config.mapSize);
        const isSafeZone = (ex > 15 && ex < 25 && ey > 15 && ey < 25);

        if (state.mapData[ex][ey] === 0 && !isSafeZone) {
            let enemyType, baseHp, enemyName;

            if (state.biome === 'uytek') {
                // W Biomie Uytek 90% szans na Uyteka, 10% na Pająka
                const isRare = Math.random() < 0.1;
                enemyType = isRare ? 'spider' : 'uytek';
                enemyName = isRare ? 'Pająk' : 'Minion Uytek';
                baseHp = isRare ? 20 : 15;
            } else if (state.biome === 'inferno') {
                // W Biomie Inferno - Demony i Płomienne Szkielety
                const isDemon = Math.random() < 0.6;
                enemyType = isDemon ? 'demon' : 'fireSkeleton';
                enemyName = isDemon ? 'Demon' : 'Płomienny Szkielet';
                baseHp = isDemon ? 35 : 40; // Silniejsze moby w Inferno
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
        for (let i = 0; i < state.player.backpackSize; i++) {
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
    const dist = Math.sqrt(dx * dx + dy * dy);

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

        const distToPlayer = Math.sqrt((state.player.x - enemy.x) ** 2 + (state.player.y - enemy.y) ** 2);

        if (distToPlayer < 8) { // AGGRO RANGE
            enemy.patrolTarget = null; // Forget patrol

            // UYTEK SPECIAL: Wołanie pobliskich mobów!
            if (enemy.type === 'uytek') {
                // Woła moby co 3 sekundy
                if (!enemy.lastRallyTime) enemy.lastRallyTime = 0;
                if (now - enemy.lastRallyTime > 3000) {
                    enemy.lastRallyTime = now;

                    // Znajdź wszystkie moby w promieniu 10 tile
                    let ralliedCount = 0;
                    state.enemies.forEach(ally => {
                        if (ally === enemy) return; // Nie siebie

                        const dx = ally.x - enemy.x;
                        const dy = ally.y - enemy.y;
                        const allyDist = Math.sqrt(dx * dx + dy * dy);

                        if (allyDist < 10) {
                            // "Przyciągnij" moba do gracza - ustaw patrol target na gracza
                            ally.patrolTarget = { x: state.player.x, y: state.player.y };
                            ally.rallied = true; // Oznacz jako zwołanego
                            ralliedCount++;
                        }
                    });

                    if (ralliedCount > 0) {
                        console.log(`Uytek woła ${ralliedCount} sojuszników do ataku!`);
                        // Efekt wizualny - fioletowa fala (będzie renderowana)
                        if (!state.rallyEffects) state.rallyEffects = [];
                        state.rallyEffects.push({
                            x: enemy.x,
                            y: enemy.y,
                            radius: 0,
                            maxRadius: 10,
                            spawnTime: now
                        });
                    }
                }
            }

            // ELORYBA SPECIAL: Rzucanie kartkami z dystansu!
            if (enemy.type === 'eloryba3000') {
                // Animacja wyskoku z wody
                if (enemy.jumpAnimation < 1) {
                    enemy.jumpAnimation += 0.02;
                }

                // Eloryba rzuca kartkami z dystansu (range 6), nie goni gracza
                if (distToPlayer > 2 && distToPlayer < 7) {
                    // Rzuć kartkę co 1.5 sekundy
                    if (!enemy.throwCooldown || now - enemy.throwCooldown > 1500) {
                        enemy.throwCooldown = now;

                        // Losowa ocena na kartce
                        const grades = ['1', '2', '3', '4', '5', '6', '1-', '2+', 'nb'];
                        const grade = grades[Math.floor(Math.random() * grades.length)];

                        // Stwórz projectile (kartkę)
                        const dx = state.player.x - enemy.x;
                        const dy = state.player.y - enemy.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        state.projectiles.push({
                            x: enemy.x,
                            y: enemy.y,
                            vx: (dx / dist) * 0.15, // Prędkość kartki
                            vy: (dy / dist) * 0.15,
                            damage: 8 + (state.level * 2),
                            grade: grade,
                            owner: 'enemy',
                            lifetime: 3000,
                            spawnTime: now
                        });

                        console.log(`Eloryba rzuca kartką z oceną ${grade}!`);
                    }
                } else if (distToPlayer <= 2) {
                    // Bliska walka - skok i uderzenie
                    if (now - enemy.lastAttackTime > 1000) {
                        enemy.lastAttackTime = now;
                        let dmg = 5 + (state.level * 2);
                        dmg *= 2.0;
                        state.player.hp -= Math.floor(dmg);
                        console.log(`${enemy.name} uderza ogonem! Obrażenia: ${Math.floor(dmg)}. HP: ${state.player.hp}`);
                    }
                }
                // Eloryba nie goni - stoi w miejscu i rzuca
                return;
            }

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
                if (rx > 1 && rx < config.mapSize - 1 && ry > 1 && ry < config.mapSize - 1) {
                    enemy.patrolTarget = { x: rx, y: ry };
                }
            }

            if (enemy.patrolTarget) {
                const pdx = enemy.patrolTarget.x - enemy.x;
                const pdy = enemy.patrolTarget.y - enemy.y;
                const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

                if (pdist > enemy.speed) {
                    enemy.x += (pdx / pdist) * (enemy.speed * 0.5); // Walk slower when patrolling
                    enemy.y += (pdy / pdist) * (enemy.speed * 0.5);
                } else {
                    enemy.patrolTarget = null; // Arrived
                }
            }
        }
    });

    // --- UPDATE PROJECTILES (Kartki z ocenami) ---
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const proj = state.projectiles[i];

        // Ruch
        proj.x += proj.vx;
        proj.y += proj.vy;

        // Sprawdź lifetime
        if (now - proj.spawnTime > proj.lifetime) {
            state.projectiles.splice(i, 1);
            continue;
        }

        // Kolizja z graczem (jeśli projektyl wroga)
        if (proj.owner === 'enemy') {
            const dx = state.player.x - proj.x;
            const dy = state.player.y - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 0.8) { // Trafienie
                state.player.hp -= proj.damage;
                console.log(`Kartka z oceną ${proj.grade} trafia gracza! -${proj.damage} HP`);
                state.projectiles.splice(i, 1);
                continue;
            }
        }

        // Kolizja z wrogiem (jeśli projektyl gracza)
        if (proj.owner === 'player') {
            for (let j = state.enemies.length - 1; j >= 0; j--) {
                const enemy = state.enemies[j];
                const dx = enemy.x - proj.x;
                const dy = enemy.y - proj.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 0.8) {
                    enemy.hp -= proj.damage;
                    console.log(`Gracz rzuca kartką! ${enemy.name} -${proj.damage} HP`);
                    state.projectiles.splice(i, 1);

                    // Sprawdź śmierć wroga
                    if (enemy.hp <= 0) {
                        state.enemies.splice(j, 1);
                        // Drop loot
                        state.lootBags.push({
                            x: enemy.x, y: enemy.y,
                            items: [{
                                name: "Kartka z Oceną",
                                type: 'throwable',
                                icon: 'assets/items/kartka.svg',
                                damage: 15,
                                grade: ['1', '2', '3', '4', '5'][Math.floor(Math.random() * 5)],
                                description: "Można rzucić w wroga (PPM)"
                            }]
                        });
                    }
                    break;
                }
            }
        }

        // Sprawdź czy wyleciał poza mapę
        if (proj.x < 0 || proj.x > config.mapSize || proj.y < 0 || proj.y > config.mapSize) {
            state.projectiles.splice(i, 1);
        }
    }

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
        state.projectiles = []; // Wyczyść kartki przy respawn
        console.log("GAME OVER - RESPAWN");
    }

    // Kamera
    const playerIso = cartesianToIso(state.player.x, state.player.y);
    config.offsetX = canvas.width / 2 - playerIso.x;
    config.offsetY = canvas.height / 2 - playerIso.y;

    // Update skill effects
    updateEffects();
    updateSlowEffects();

    // MP Regeneration (1 MP per second)
    if (now - state.player.lastMpRegen >= 1000) {
        state.player.lastMpRegen = now;
        state.player.mp = Math.min(state.player.mp + 1, state.player.maxMp);
    }

    // UI Pasków (HP/MP)
    const hpPercent = (state.player.hp / state.player.maxHp) * 100;
    const hpBar = document.querySelector('#hp-bar .bar-fill');
    if (hpBar) hpBar.style.width = `${hpPercent}%`;
    const hpText = document.getElementById('hp-text');
    if (hpText) hpText.innerText = `${Math.floor(state.player.hp)}/${state.player.maxHp}`;

    const mpPercent = (state.player.mp / state.player.maxMp) * 100;
    const mpBar = document.querySelector('#mp-bar .bar-fill');
    if (mpBar) mpBar.style.width = `${mpPercent}%`;
    const mpText = document.getElementById('mp-text');
    if (mpText) mpText.innerText = `${Math.floor(state.player.mp)}/${state.player.maxMp}`;

    // Update Skill Bar UI
    if (window.updateSkillBarUI) window.updateSkillBarUI();

    // Update Level Badge
    const levelBadge = document.getElementById('level-badge');
    if (levelBadge) levelBadge.innerText = state.level;
}

export function gameLoop() {
    update();
    drawScene();
    requestAnimationFrame(gameLoop);
}