// System efektów wizualnych dla umiejętności
import { state } from './GameState.js';
import { cartesianToIso } from './Utils.js';
import { config } from './Config.js';

// Aktywne efekty do renderowania
export const activeEffects = [];

// Spawn nowego efektu
export function spawnSkillEffect(type, x, y, extraData = null) {
    const effect = {
        type,
        x,
        y,
        startTime: Date.now(),
        lifetime: getEffectLifetime(type),
        extraData // np. cele dla lightning chain
    };

    activeEffects.push(effect);
}

function getEffectLifetime(type) {
    switch (type) {
        case 'fireball': return 600;
        case 'frostNova': return 800;
        case 'lightning': return 400;
        default: return 500;
    }
}

// Aktualizuj efekty (usuń wygasłe)
export function updateEffects() {
    const now = Date.now();

    for (let i = activeEffects.length - 1; i >= 0; i--) {
        const effect = activeEffects[i];
        if (now - effect.startTime >= effect.lifetime) {
            activeEffects.splice(i, 1);
        }
    }
}

// Renderuj wszystkie efekty (wywoływane z Renderer.js)
export function renderEffects(ctx) {
    const now = Date.now();

    activeEffects.forEach(effect => {
        const progress = (now - effect.startTime) / effect.lifetime; // 0 to 1
        const isoPos = cartesianToIso(effect.x, effect.y);
        const screenX = config.offsetX + isoPos.x;
        const screenY = config.offsetY + isoPos.y;

        switch (effect.type) {
            case 'fireball':
                renderFireballEffect(ctx, screenX, screenY, progress);
                break;
            case 'frostNova':
                renderFrostNovaEffect(ctx, screenX, screenY, progress);
                break;
            case 'lightning':
                renderLightningEffect(ctx, screenX, screenY, progress, effect.extraData);
                break;
        }
    });
}

// FIREBALL - Expanding explosion with particles
function renderFireballEffect(ctx, x, y, progress) {
    const maxRadius = 80;
    const radius = maxRadius * progress;
    const alpha = 1 - progress;

    // Outer glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255, 200, 50, ${alpha * 0.8})`);
    gradient.addColorStop(0.3, `rgba(255, 100, 0, ${alpha * 0.6})`);
    gradient.addColorStop(0.7, `rgba(200, 50, 0, ${alpha * 0.3})`);
    gradient.addColorStop(1, `rgba(100, 0, 0, 0)`);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Inner core
    if (progress < 0.5) {
        const coreRadius = 20 * (1 - progress * 2);
        ctx.beginPath();
        ctx.arc(x, y, coreRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
        ctx.fill();
    }

    // Particles
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 / particleCount) * i + progress * 2;
        const dist = radius * 0.8;
        const px = x + Math.cos(angle) * dist;
        const py = y + Math.sin(angle) * dist;
        const pSize = 5 * (1 - progress);

        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 150, 50, ${alpha * 0.8})`;
        ctx.fill();
    }
}

// FROST NOVA - Expanding ice ring
function renderFrostNovaEffect(ctx, x, y, progress) {
    const maxRadius = 120;
    const radius = maxRadius * Math.min(progress * 1.5, 1);
    const alpha = 1 - progress;

    // Ice ring
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(150, 220, 255, ${alpha})`;
    ctx.lineWidth = 8 * (1 - progress);
    ctx.stroke();

    // Inner glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(200, 240, 255, ${alpha * 0.3})`);
    gradient.addColorStop(0.5, `rgba(100, 200, 255, ${alpha * 0.15})`);
    gradient.addColorStop(1, `rgba(50, 150, 255, 0)`);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Ice crystals
    const crystalCount = 12;
    for (let i = 0; i < crystalCount; i++) {
        const angle = (Math.PI * 2 / crystalCount) * i;
        const dist = radius * 0.9;
        const cx = x + Math.cos(angle) * dist;
        const cy = y + Math.sin(angle) * dist;

        // Diamond shape
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(0, -8 * (1 - progress));
        ctx.lineTo(4, 0);
        ctx.lineTo(0, 8 * (1 - progress));
        ctx.lineTo(-4, 0);
        ctx.closePath();

        ctx.fillStyle = `rgba(200, 240, 255, ${alpha})`;
        ctx.fill();

        ctx.restore();
    }
}

// LIGHTNING - Electric arcs
function renderLightningEffect(ctx, x, y, progress, targets) {
    const alpha = 1 - progress;

    // Flash effect at impact point
    if (progress < 0.3) {
        const flashAlpha = (0.3 - progress) / 0.3;
        ctx.beginPath();
        ctx.arc(x, y, 30 + progress * 50, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 200, 255, ${flashAlpha * 0.5})`;
        ctx.fill();
    }

    // Draw chain lightning between targets
    if (targets && targets.length > 0) {
        ctx.strokeStyle = `rgba(150, 150, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(100, 100, 255, 0.8)';
        ctx.shadowBlur = 10;

        let lastPos = { x, y };

        targets.forEach(target => {
            const targetIso = cartesianToIso(target.x, target.y);
            const targetX = config.offsetX + targetIso.x;
            const targetY = config.offsetY + targetIso.y;

            // Draw jagged lightning line
            drawLightningBolt(ctx, lastPos.x, lastPos.y, targetX, targetY, alpha);

            // Impact spark at target
            ctx.beginPath();
            ctx.arc(targetX, targetY, 15 * (1 - progress), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();

            lastPos = { x: targetX, y: targetY };
        });

        ctx.shadowBlur = 0;
    }

    // If no targets, draw a fizzle effect
    if (!targets || targets.length === 0) {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 30;
            const ex = x + Math.cos(angle) * dist;
            const ey = y + Math.sin(angle) * dist;

            ctx.beginPath();
            ctx.arc(ex, ey, 3 * (1 - progress), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(150, 150, 255, ${alpha})`;
            ctx.fill();
        }
    }
}

// Helper: Draw jagged lightning bolt between two points
function drawLightningBolt(ctx, x1, y1, x2, y2, alpha) {
    const segments = 5;
    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;

    ctx.beginPath();
    ctx.moveTo(x1, y1);

    for (let i = 1; i < segments; i++) {
        const jitterX = (Math.random() - 0.5) * 30;
        const jitterY = (Math.random() - 0.5) * 20;
        ctx.lineTo(x1 + dx * i + jitterX, y1 + dy * i + jitterY);
    }

    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `rgba(200, 200, 255, ${alpha})`;
    ctx.stroke();

    // Glow line
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
    ctx.stroke();
    ctx.lineWidth = 3;
}
