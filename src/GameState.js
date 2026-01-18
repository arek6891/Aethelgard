export const state = {
    mapData: [],
    enemies: [],
    lootBags: [],
    currentLootBag: null, // Który worek jest otwarty?
    
    player: {
        x: 20, y: 20,
        targetX: 20, targetY: 20,
        speed: 0.1,
        attackCooldown: 500, // ms
        lastAttackTime: 0,
        stats: { str: 15, dex: 12, int: 8 },
        hp: 100, maxHp: 120,
        mp: 40, maxMp: 60,
        inventory: [], // Tablica przedmiotów [ {id, type, icon} ]
        equipment: {
            head: null,
            shoulders: null,
            amulet: null,
            chest: null,
            gloves: null,
            belt: null,
            legs: null,
            boots: null,
            ring1: null,
            ring2: null,
            talisman: null,
            mainhand: null,
            offhand: null
        },
        backpackSize: 20
    }
};
