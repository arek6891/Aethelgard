import { config } from './Config.js';
import { state } from './GameState.js';
import { isoToCartesian, generateRandomItem } from './Utils.js';
import { refreshLootUI } from './UI.js';
import { initAudio, sfx } from './Audio.js';

const canvas = document.getElementById('gameCanvas');

export function initInput() {
    canvas.addEventListener('mousedown', (e) => {
        initAudio(); // Upewnij się, że audio działa

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        const gridPos = isoToCartesian(clickX, clickY);
        const tX = Math.floor(gridPos.x);
        const tY = Math.floor(gridPos.y);
        
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
                 if(state.player.equipment.mainhand.stats.str) dmg += state.player.equipment.mainhand.stats.str;
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
                state.lootBags.push({
                    x: enemy.x, y: enemy.y,
                    items: [ generateRandomItem() ]
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
            if (state.mapData[tX][tY] === 0) {
                state.player.targetX = tX;
                state.player.targetY = tY;
                // Opcjonalnie dźwięk kroku, ale w pętli update lepiej
            }
        }
    });
}
