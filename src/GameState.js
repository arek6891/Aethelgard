export const state = {
    player: {
        x: 20,
        y: 20,
        targetX: 20,
        targetY: 20,
        speed: 0.1,
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        lastAttackTime: 0,
        attackCooldown: 600,
        inventory: [], // Looted items in bag
        backpackSize: 20,
        equipment: {
            head: null,
            chest: null,
            mainhand: null,
            offhand: null,
            legs: null
        },
        stats: {
            str: 10,
            dex: 10,
            int: 10
        }
    },
    mapData: [], // 2D array [x][y]
    enemies: [],
    lootBags: [],
    currentLootBag: null,
    level: 1
};
