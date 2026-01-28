import { config } from './Config.js';
import { state } from './GameState.js';
import { isoToCartesian, generateRandomItem, generateBossItem } from './Utils.js';
import { refreshLootUI } from './UI.js';
import { initAudio, sfx } from './Audio.js';
import { selectSkill, useSkill, SKILLS } from './Skills.js';

const canvas = document.getElementById('gameCanvas');

export function initInput() {
    // Keyboard input for skills
    document.addEventListener('keydown', (e) => {
        const key = e.key.toUpperCase();

        // Skill hotkeys
        if (key === 'Q') {
            e.preventDefault();
            selectSkill('fireball');
        } else if (key === 'W') {
            e.preventDefault();
            selectSkill('frostNova');
        } else if (key === 'E') {
            e.preventDefault();
            selectSkill('lightning');
        } else if (key === 'ESCAPE') {
            // Cancel skill selection
            state.player.selectedSkill = null;
        }
    });

    canvas.addEventListener('mousedown', (e) => {
        initAudio(); // Upewnij się, że audio działa

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const gridPos = isoToCartesian(clickX, clickY);
        const tX = Math.floor(gridPos.x);
        const tY = Math.floor(gridPos.y);

        // 0. Sprawdź czy używamy SKILLA
        if (state.player.selectedSkill) {
            const skillUsed = useSkill(state.player.selectedSkill, gridPos.x, gridPos.y);
            if (skillUsed) {
                return; // Skill zużyty, nie rób nic więcej
            }
            // Jeśli skill nie mógł być użyty (cooldown/brak MP), kontynuuj normalną logikę
        }

        // 0.5. Sprawdź czy rzucamy KARTKĄ
        if (state.player.selectedThrowable) {
            const throwable = state.player.selectedThrowable;
            const item = throwable.item;

            // Oblicz kierunek rzutu
            const dx = gridPos.x - state.player.x;
            const dy = gridPos.y - state.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Stwórz projectile
            state.projectiles.push({
                x: state.player.x,
                y: state.player.y,
                vx: (dx / dist) * 0.2, // Szybszy rzut gracza
                vy: (dy / dist) * 0.2,
                damage: item.damage || 15,
                grade: item.grade || '?',
                owner: 'player',
                lifetime: 2000,
                spawnTime: Date.now()
            });

            sfx.attack();
            console.log(`Rzucasz kartką z oceną ${item.grade}!`);

            // Zmniejsz uses lub usuń przedmiot
            if (item.uses && item.uses > 1) {
                item.uses--;
            } else {
                state.player.inventory.splice(throwable.index, 1);
            }

            state.player.selectedThrowable = null;
            if (window.refreshInventoryUI) window.refreshInventoryUI();
            return;
        }

        // 1. Sprawdź kliknięcie we WROGA
        const enemy = state.enemies.find(e => Math.round(e.x) === tX && Math.round(e.y) === tY);
        if (enemy) {
            const now = Date.now();
            if (now - state.player.lastAttackTime < state.player.attackCooldown) {
                console.log("Attack cooldown!");
                return;
            }
            state.player.lastAttackTime = now;

            sfx.attack();
            // Calculate Damage based on STR + Equipment
            let dmg = Math.floor(state.player.stats.str / 2);
            if (state.player.equipment.mainhand && state.player.equipment.mainhand.stats) {
                // Check if mainhand has stats (some might not have str explicitly in future)
                if (state.player.equipment.mainhand.stats.str) dmg += state.player.equipment.mainhand.stats.str;
            }
            // Basic randomization
            dmg = Math.floor(dmg * (0.8 + Math.random() * 0.4));

            enemy.hp -= dmg;
            console.log(`Atak za ${dmg} obrażeń! HP Wroga: ${enemy.hp}`);

            enemy.x += 0.1;
            setTimeout(() => enemy.x -= 0.1, 100);

            if (enemy.hp <= 0) {
                sfx.kill();
                state.enemies = state.enemies.filter(e => e !== enemy);

                let drops = [];
                // Boss Drop Logic
                if (enemy.type === 'uytek' || enemy.type === 'eloryba3000') {
                    const bossLoot = generateBossItem(enemy.type);
                    // Obsługa tablicy lub pojedynczego przedmiotu
                    if (Array.isArray(bossLoot)) {
                        drops.push(...bossLoot); // Spread array (np. Uytek dropuje 3 przedmioty)
                    } else {
                        drops.push(bossLoot);
                    }
                    // Bonus Large Potion
                    drops.push({
                        name: "Wielka Mikstura",
                        type: 'potion',
                        icon: 'assets/items/micsture.jpg',
                        description: "Odnawia 100 HP",
                        healAmount: 100
                    });
                } else if (enemy.type === 'fireLord') {
                    // Fire Lord też jest bossem
                    const bossLoot = generateBossItem(enemy.type);
                    if (Array.isArray(bossLoot)) {
                        drops.push(...bossLoot);
                    } else {
                        drops.push(bossLoot);
                    }
                } else {
                    drops.push(generateRandomItem());
                }

                state.lootBags.push({
                    x: enemy.x, y: enemy.y,
                    items: drops
                });
                console.log("Wróg zabity!");
            }
            return;
        }

        // 2. Sprawdź kliknięcie w LOOT BAG
        const bag = state.lootBags.find(b => Math.round(b.x) === tX && Math.round(b.y) === tY);
        if (bag) {
            sfx.ui();
            state.currentLootBag = bag;
            // Eksport dla HTML/Global
            // window.currentLootBag = bag; // Już niepotrzebne, UI bierze ze state
            document.getElementById('loot-window').style.display = 'block';
            refreshLootUI();
            console.log("Otwarto worek.");
            return;
        }

        // 3. Ruch
        if (tX >= 0 && tX < config.mapSize && tY >= 0 && tY < config.mapSize) {
            // Ruch dozwolony na trawę (0) LUB schody (5)
            if (state.mapData[tX][tY] === 0 || state.mapData[tX][tY] === 5) {
                state.player.targetX = tX;
                state.player.targetY = tY;
            }
        }
    });
}
