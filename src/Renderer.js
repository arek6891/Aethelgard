import { config } from './Config.js';
import { state } from './GameState.js';
import { sprites } from './Assets.js';
import { cartesianToIso } from './Utils.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

export function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function drawTile(screenX, screenY) {
    if (sprites.grass) ctx.drawImage(sprites.grass, Math.floor(screenX - 32), Math.floor(screenY));
}
function drawBlock(screenX, screenY) {
    if (sprites.wall) ctx.drawImage(sprites.wall, Math.floor(screenX - 32), Math.floor(screenY - 50));
}

function drawEntitySprite(entity) {
    const screenX = entity.sx;
    const screenY = entity.sy;
    const sprite = entity.sprite;
    if (!sprite) return;

    // Cień
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(screenX, screenY + 16, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    let bounce = 0;
    if (entity.isMoving) {
        bounce = Math.abs(Math.sin(Date.now() / 150)) * 5;
    }
    
    if (entity.type === 'loot') {
        bounce = Math.sin(Date.now() / 300) * 5; 
        ctx.drawImage(sprite, Math.floor(screenX - 16), Math.floor(screenY - 10 + bounce));
        return;
    }

    ctx.drawImage(sprite, 
        Math.floor(screenX - 20), 
        Math.floor(screenY + 16 - 55 - bounce)
    );
    
    if (entity.hpBar) {
        const hpPct = entity.hp / entity.maxHp;
        ctx.fillStyle = 'red';
        ctx.fillRect(screenX - 15, screenY - 50, 30, 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(screenX - 15, screenY - 50, 30 * hpPct, 4); 
    }
}

export function drawScene() {
    // Clear background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const margin = 200;
    const renderList = [];

    // 1. Rysuj PODŁOGĘ
    for (let x = 0; x < config.mapSize; x++) {
        for (let y = 0; y < config.mapSize; y++) {
            const isoPos = cartesianToIso(x, y);
            const screenX = config.offsetX + isoPos.x;
            const screenY = config.offsetY + isoPos.y;

            if (screenX < -margin || screenX > canvas.width + margin ||
                screenY < -margin || screenY > canvas.height + margin) continue;

            if (state.mapData[x][y] === 0) {
                drawTile(screenX, screenY);
            } else {
                drawBlock(screenX, screenY);
            }
        }
    }

    // 2. Zbierz obiekty ruchome
    const pPos = cartesianToIso(state.player.x, state.player.y);
    renderList.push({
        sx: config.offsetX + pPos.x,
        sy: config.offsetY + pPos.y,
        ySort: config.offsetY + pPos.y,
        sprite: sprites.player,
        isMoving: (Math.abs(state.player.x - state.player.targetX) > 0.01 || Math.abs(state.player.y - state.player.targetY) > 0.01),
        type: 'player'
    });

    state.enemies.forEach(e => {
        const pos = cartesianToIso(e.x, e.y);
        renderList.push({
            sx: config.offsetX + pos.x,
            sy: config.offsetY + pos.y,
            ySort: config.offsetY + pos.y,
            sprite: sprites.skeleton,
            isMoving: false,
            type: 'enemy',
            hp: e.hp, maxHp: e.maxHp, hpBar: true
        });
    });

    state.lootBags.forEach(b => {
        const pos = cartesianToIso(b.x, b.y);
        renderList.push({
            sx: config.offsetX + pos.x,
            sy: config.offsetY + pos.y,
            ySort: config.offsetY + pos.y,
            sprite: sprites.sack,
            isMoving: false,
            type: 'loot'
        });
    });

    // 3. Sortuj i rysuj
    renderList.sort((a, b) => a.ySort - b.ySort);
    renderList.forEach(entity => drawEntitySprite(entity));
    
    // Vignette
    const gradient = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 200, 
        canvas.width/2, canvas.height/2, canvas.width
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,canvas.width, canvas.height);
}
