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
    
    for (let x = 0; x < config.mapSize; x++) {
        state.mapData[x] = [];
        for (let y = 0; y < config.mapSize; y++) {
            if (x === 0 || x === config.mapSize - 1 || y === 0 || y === config.mapSize - 1) {
                state.mapData[x][y] = 1;
            } else {
                const isCenter = (x > 15 && x < 25 && y > 15 && y < 25);
                if (!isCenter && Math.random() < 0.1) state.mapData[x][y] = 1;
                else state.mapData[x][y] = 0;
                
                // Spawn Wrogów
                if (state.mapData[x][y] === 0 && !isCenter && Math.random() < 0.03) {
                    state.enemies.push({
                        x: x, y: y,
                        hp: 30, maxHp: 30,
                        name: "Szkielet"
                    });
                }
            }
        }
    }
    
    // Inicjalizacja UI Plecaka (puste sloty - listenery)
    const backpackGrid = document.getElementById('backpack-grid');
    backpackGrid.innerHTML = '';
    for(let i=0; i<state.player.backpackSize; i++) {
        const slot = document.createElement('div');
        slot.className = 'item-slot';
        slot.dataset.index = i;
        // Global function defined in UI.js (attached to window)
        slot.onclick = () => window.useItem(i); 
        backpackGrid.appendChild(slot);
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
