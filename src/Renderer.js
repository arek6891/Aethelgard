import { config } from './Config.js';
import { state } from './GameState.js';
import { sprites } from './Assets.js';
import { cartesianToIso } from './Utils.js';
import { renderEffects } from './SkillEffects.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

export function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function drawTile(screenX, screenY) {
    let sprite = sprites.grass;
    if (state.biome === 'uytek' && sprites.grassUytek) {
        sprite = sprites.grassUytek;
    } else if (state.biome === 'inferno' && sprites.grassInferno) {
        sprite = sprites.grassInferno;
    }
    if (sprite) ctx.drawImage(sprite, Math.floor(screenX - 32), Math.floor(screenY));
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
        Math.floor(screenX - sprite.width / 2),
        Math.floor(screenY + 16 - sprite.height - bounce)
    );

    // Weapon Animation (ONLY FOR PLAYER)
    const now = Date.now();
    const attackDuration = 300; // ms animation time
    if (entity.type === 'player' && state.player.lastAttackTime && (now - state.player.lastAttackTime < attackDuration)) {
        const progress = (now - state.player.lastAttackTime) / attackDuration; // 0 to 1

        ctx.save();
        // Pivot point at player's hand (approximate)
        ctx.translate(screenX + 5, screenY - 25 - bounce);

        // Rotation: Start high, swing down
        // 0 -> -45deg, 1 -> +45deg
        const rotation = -Math.PI / 4 + (Math.PI / 2 * progress);
        ctx.rotate(rotation);

        // Draw Sword (Simple Rectangle or Line for now if no sprite, or use existing asset if feasible)
        // We will assume a default sword look if we can't easily access the equip sprite here effectively
        // Actually, let's try to draw a simple blade

        ctx.fillStyle = '#C0C0C0';
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;

        // Blade
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(4, -30);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, 0);
        ctx.fill();
        ctx.stroke();

        // Crossguard
        ctx.fillStyle = '#8a6d3b';
        ctx.fillRect(-6, 0, 20, 4);

        // Hilt
        ctx.fillStyle = '#5c4033';
        ctx.fillRect(2, 4, 4, 10);

        ctx.restore();
    }

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

    // 1. Rysuj PODŁOGĘ i zbieraj obiekty statyczne
    for (let x = 0; x < config.mapSize; x++) {
        for (let y = 0; y < config.mapSize; y++) {
            const isoPos = cartesianToIso(x, y);
            const screenX = config.offsetX + isoPos.x;
            const screenY = config.offsetY + isoPos.y;

            if (screenX < -margin || screenX > canvas.width + margin ||
                screenY < -margin || screenY > canvas.height + margin) continue;

            const tileType = state.mapData[x][y];

            // A. Rysowanie Podłogi
            if (tileType === 2) {
                // Woda lub Lawa (w Inferno)
                let waterSprite = sprites.water;
                if (state.biome === 'inferno' && sprites.waterInferno) {
                    waterSprite = sprites.waterInferno;
                }
                if (waterSprite) ctx.drawImage(waterSprite, Math.floor(screenX - 32), Math.floor(screenY));
            } else if (tileType === 5) {
                // Schody - Rysuj czarną dziurę pod spodem
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX + 32, screenY + 16);
                ctx.lineTo(screenX, screenY + 32);
                ctx.lineTo(screenX - 32, screenY + 16);
                ctx.fill();

                if (sprites.stairs) ctx.drawImage(sprites.stairs, Math.floor(screenX - 32), Math.floor(screenY));
            } else {
                // Trawa (pod drzewami i ścianami też rysujemy trawę)
                drawTile(screenX, screenY);
            }

            // B. Zbieranie Obiektów Statycznych do Z-Sortingu
            // 1=Wall, 3=Tree, 4=Rock
            if (tileType === 1 || tileType === 3 || tileType === 4) {
                let sprite = null;
                let yOffset = 0;

                if (tileType === 1) {
                    sprite = sprites.wall;
                    yOffset = 50;
                }
                else if (tileType === 3) {
                    // Drzewo - różne dla biomów
                    if (state.biome === 'uytek' && sprites.treeUytek) {
                        sprite = sprites.treeUytek;
                    } else if (state.biome === 'inferno' && sprites.treeInferno) {
                        sprite = sprites.treeInferno;
                    } else {
                        sprite = sprites.tree;
                    }
                    yOffset = 64;
                }
                else if (tileType === 4) {
                    // Skała - różne dla biomów
                    if (state.biome === 'uytek' && sprites.rockUytek) {
                        sprite = sprites.rockUytek;
                    } else if (state.biome === 'inferno' && sprites.rockInferno) {
                        sprite = sprites.rockInferno;
                    } else {
                        sprite = sprites.rock;
                    }
                    yOffset = 32;
                }

                if (sprite) {
                    renderList.push({
                        sx: screenX,
                        sy: screenY,
                        ySort: screenY,
                        sprite: sprite,
                        type: 'static',
                        yOffset: yOffset
                    });
                }
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
        let sprite = sprites.skeleton;
        if (e.type === 'spider') sprite = sprites.spider;
        else if (e.type === 'uytek') sprite = sprites.uytek;
        else if (e.type === 'eloryba3000') sprite = sprites.eloryba3000;
        // Inferno mobs
        else if (e.type === 'demon') sprite = sprites.demon;
        else if (e.type === 'fireSkeleton') sprite = sprites.demon; // Używa tego samego sprite
        else if (e.type === 'fireLord') sprite = sprites.fireLord;

        renderList.push({
            sx: config.offsetX + pos.x,
            sy: config.offsetY + pos.y,
            ySort: config.offsetY + pos.y,
            sprite: sprite,
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

    renderList.forEach(entity => {
        if (entity.type === 'static') {
            // Rysowanie statyczne (wycentrowane X, offset Y)
            ctx.drawImage(entity.sprite,
                Math.floor(entity.sx - entity.sprite.width / 2),
                Math.floor(entity.sy - entity.yOffset)
            );
        } else {
            drawEntitySprite(entity);
        }
    });

    // 4. Render Projectiles (Kartki z ocenami)
    state.projectiles.forEach(proj => {
        const pos = cartesianToIso(proj.x, proj.y);
        const sx = config.offsetX + pos.x;
        const sy = config.offsetY + pos.y;

        // Rysuj kartkę jako obracający się prostokąt
        ctx.save();
        ctx.translate(sx, sy);

        // Rotacja w locie
        const rotation = (Date.now() / 100) % (Math.PI * 2);
        ctx.rotate(rotation);

        // Kartka papieru
        ctx.fillStyle = proj.owner === 'enemy' ? '#ffeeee' : '#eeffee';
        ctx.strokeStyle = proj.owner === 'enemy' ? '#cc0000' : '#00cc00';
        ctx.lineWidth = 1;

        // Prostokąt kartki
        ctx.fillRect(-8, -10, 16, 20);
        ctx.strokeRect(-8, -10, 16, 20);

        // Zagięty róg
        ctx.fillStyle = '#cccccc';
        ctx.beginPath();
        ctx.moveTo(4, -10);
        ctx.lineTo(8, -6);
        ctx.lineTo(4, -6);
        ctx.closePath();
        ctx.fill();

        // Ocena
        ctx.rotate(-rotation); // Ocena zawsze czytelna
        ctx.fillStyle = '#cc0000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(proj.grade || '?', 0, 5);

        ctx.restore();
    });

    // 4.5. Render Rally Effects (Uytek's rally wave)
    if (state.rallyEffects) {
        const now = Date.now();
        for (let i = state.rallyEffects.length - 1; i >= 0; i--) {
            const effect = state.rallyEffects[i];
            const age = now - effect.spawnTime;

            // Animacja trwa 500ms
            if (age > 500) {
                state.rallyEffects.splice(i, 1);
                continue;
            }

            const progress = age / 500;
            const radius = effect.maxRadius * progress;
            const alpha = 1 - progress;

            const pos = cartesianToIso(effect.x, effect.y);
            const sx = config.offsetX + pos.x;
            const sy = config.offsetY + pos.y;

            // Rysuj fioletowy okrąg (w izometrii to elipsa)
            ctx.save();
            ctx.strokeStyle = `rgba(153, 51, 255, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(sx, sy, radius * config.tileW / 2, radius * config.tileH / 2, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Druga mniejsza fala
            ctx.strokeStyle = `rgba(230, 102, 255, ${alpha * 0.5})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(sx, sy, radius * config.tileW / 2 * 0.7, radius * config.tileH / 2 * 0.7, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }
    }

    // 5. Render Skill Effects (above entities, below vignette)
    renderEffects(ctx);

    // Vignette
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 200,
        canvas.width / 2, canvas.height / 2, canvas.width
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
