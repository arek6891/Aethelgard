// System Umiejętności (Skills)
import { state } from './GameState.js';
import { sfx } from './Audio.js';
import { spawnSkillEffect } from './SkillEffects.js';

// Definicje skilli
export const SKILLS = {
    fireball: {
        id: 'fireball',
        name: 'Kula Ognia',
        key: 'Q',
        mpCost: 15,
        cooldown: 2000, // ms
        damage: 30,
        radius: 1.5, // tiles
        icon: '🔥',
        description: 'Eksplozja zadająca obrażenia obszarowe'
    },
    frostNova: {
        id: 'frostNova',
        name: 'Mróz',
        key: 'W',
        mpCost: 20,
        cooldown: 4000,
        damage: 15,
        radius: 2.5, // tiles around player
        slowDuration: 3000, // ms
        slowAmount: 0.5, // 50% slower
        icon: '❄️',
        description: 'Zamraża wrogów wokół gracza'
    },
    lightning: {
        id: 'lightning',
        name: 'Błyskawica',
        key: 'E',
        mpCost: 25,
        cooldown: 5000,
        damage: 50,
        chainCount: 3, // hits up to 3 enemies
        chainRadius: 3, // tiles
        icon: '⚡',
        description: 'Potężne uderzenie pioruna'
    }
};

// Sprawdź czy skill może być użyty
export function canUseSkill(skillId) {
    const skill = SKILLS[skillId];
    if (!skill) return false;

    const now = Date.now();
    const lastUsed = state.player.skills[skillId]?.lastUsed || 0;

    // Check cooldown
    if (now - lastUsed < skill.cooldown) {
        return false;
    }

    // Check MP
    if (state.player.mp < skill.mpCost) {
        return false;
    }

    return true;
}

// Pobierz pozostały cooldown (0-1, gdzie 0 = gotowy)
export function getSkillCooldownPercent(skillId) {
    const skill = SKILLS[skillId];
    if (!skill) return 0;

    const now = Date.now();
    const lastUsed = state.player.skills[skillId]?.lastUsed || 0;
    const elapsed = now - lastUsed;

    if (elapsed >= skill.cooldown) return 0;
    return 1 - (elapsed / skill.cooldown);
}

// Użyj skilla
export function useSkill(skillId, targetX, targetY) {
    if (!canUseSkill(skillId)) {
        console.log(`Skill ${skillId} not ready!`);
        return false;
    }

    const skill = SKILLS[skillId];
    const now = Date.now();

    // Consume MP
    state.player.mp -= skill.mpCost;
    state.player.skills[skillId].lastUsed = now;

    // Play sound
    if (sfx[skillId]) sfx[skillId]();

    // Execute skill effect
    switch (skillId) {
        case 'fireball':
            executeFireball(targetX, targetY, skill);
            break;
        case 'frostNova':
            executeFrostNova(skill);
            break;
        case 'lightning':
            executeLightning(targetX, targetY, skill);
            break;
    }

    // Clear selected skill after use
    state.player.selectedSkill = null;

    console.log(`Used ${skill.name}! MP: ${state.player.mp}/${state.player.maxMp}`);
    return true;
}

// FIREBALL - AoE damage at target location
function executeFireball(targetX, targetY, skill) {
    // Spawn visual effect
    spawnSkillEffect('fireball', targetX, targetY);

    // Damage enemies in radius
    state.enemies.forEach(enemy => {
        const dx = enemy.x - targetX;
        const dy = enemy.y - targetY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= skill.radius) {
            // Damage falloff based on distance
            const dmgMultiplier = 1 - (dist / skill.radius) * 0.5;
            const damage = Math.floor(skill.damage * dmgMultiplier);
            enemy.hp -= damage;
            console.log(`Fireball hit ${enemy.type} for ${damage} damage!`);
        }
    });

    // Remove dead enemies
    state.enemies = state.enemies.filter(e => e.hp > 0);
}

// FROST NOVA - AoE around player, slows enemies
function executeFrostNova(skill) {
    const px = state.player.x;
    const py = state.player.y;

    // Spawn visual effect at player position
    spawnSkillEffect('frostNova', px, py);

    // Damage and slow enemies in radius
    state.enemies.forEach(enemy => {
        const dx = enemy.x - px;
        const dy = enemy.y - py;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= skill.radius) {
            enemy.hp -= skill.damage;

            // Apply slow effect
            enemy.slowed = true;
            enemy.slowUntil = Date.now() + skill.slowDuration;
            enemy.originalSpeed = enemy.speed || 0.03;
            enemy.speed = enemy.originalSpeed * skill.slowAmount;

            console.log(`Frost Nova hit ${enemy.type} for ${skill.damage} damage + SLOW!`);
        }
    });

    // Remove dead enemies
    state.enemies = state.enemies.filter(e => e.hp > 0);
}

// LIGHTNING - Chain damage
function executeLightning(targetX, targetY, skill) {
    // Find closest enemy to target point
    let targets = [];
    let lastTarget = { x: targetX, y: targetY };

    for (let i = 0; i < skill.chainCount; i++) {
        let closest = null;
        let closestDist = skill.chainRadius;

        state.enemies.forEach(enemy => {
            if (targets.includes(enemy)) return; // Already hit

            const dx = enemy.x - lastTarget.x;
            const dy = enemy.y - lastTarget.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < closestDist) {
                closest = enemy;
                closestDist = dist;
            }
        });

        if (closest) {
            targets.push(closest);
            lastTarget = { x: closest.x, y: closest.y };
        } else {
            break;
        }
    }

    // Spawn visual effect (first target or click point)
    if (targets.length > 0) {
        spawnSkillEffect('lightning', targets[0].x, targets[0].y, targets);
    } else {
        spawnSkillEffect('lightning', targetX, targetY, []);
    }

    // Apply damage to all targets
    targets.forEach((enemy, index) => {
        // Damage decreases for each chain
        const chainDamage = Math.floor(skill.damage * Math.pow(0.7, index));
        enemy.hp -= chainDamage;
        console.log(`Lightning chain ${index + 1} hit ${enemy.type} for ${chainDamage} damage!`);
    });

    // Remove dead enemies
    state.enemies = state.enemies.filter(e => e.hp > 0);
}

// Update slow effects (call in game loop)
export function updateSlowEffects() {
    const now = Date.now();

    state.enemies.forEach(enemy => {
        if (enemy.slowed && now >= enemy.slowUntil) {
            enemy.slowed = false;
            enemy.speed = enemy.originalSpeed;
            console.log(`${enemy.type} no longer slowed`);
        }
    });
}

// Select skill (called by keyboard input)
export function selectSkill(skillId) {
    if (state.player.selectedSkill === skillId) {
        // Toggle off if already selected
        state.player.selectedSkill = null;
        console.log('Skill deselected');
    } else {
        state.player.selectedSkill = skillId;
        console.log(`Selected skill: ${SKILLS[skillId]?.name}`);
    }
}
