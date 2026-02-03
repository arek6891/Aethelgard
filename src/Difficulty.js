export function calculateEnemyStats(type, level, isBoss = false) {
    let baseHp = 20;
    let baseDmg = 5;

    // Base stats definition
    switch (type) {
        case 'spider':
            baseHp = 25;
            baseDmg = 4;
            break;
        case 'skeleton':
            baseHp = 40;
            baseDmg = 6;
            break;
        case 'uytek':
            if (isBoss) {
                baseHp = 120; // Boss Uytek (Rare Spawn)
                baseDmg = 8;
            } else {
                baseHp = 20; // Minion Uytek
                baseDmg = 4;
            }
            break;
        case 'fireSkeleton':
            baseHp = 50;
            baseDmg = 9;
            break;
        case 'demon':
            baseHp = 80;
            baseDmg = 12;
            break;

        // Bosses
        case 'eloryba3000':
            baseHp = 250;
            baseDmg = 12;
            break;
        case 'fireLord':
            baseHp = 400;
            baseDmg = 18;
            break;

        default:
            baseHp = 20;
            baseDmg = 5;
            break;
    }

    // Scaling Formula
    // HP scales by 25% per level + flat 5 per level
    const hp = Math.floor(baseHp * (1 + 0.25 * (level - 1)) + ((level - 1) * 5));

    // Damage scales by 10% per level + flat 1 per level
    const damage = Math.floor(baseDmg * (1 + 0.10 * (level - 1)) + ((level - 1) * 1));

    return {
        hp: hp,
        maxHp: hp,
        damage: damage
    };
}
