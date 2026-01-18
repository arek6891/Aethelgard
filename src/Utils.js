import { config } from './Config.js';

export function cartesianToIso(gridX, gridY) {
    return { 
        x: (gridX - gridY) * (config.tileW / 2), 
        y: (gridX + gridY) * (config.tileH / 2) 
    };
}

export function isoToCartesian(screenX, screenY) {
    const adjX = screenX - config.offsetX;
    const adjY = screenY - config.offsetY;
    const gridX = (adjY / (config.tileH / 2) + adjX / (config.tileW / 2)) / 2;
    const gridY = (adjY / (config.tileH / 2) - adjX / (config.tileW / 2)) / 2;
    return { x: gridX, y: gridY };
}

export function generateRandomItem() {
    const rand = Math.random();
    
    // 50% na Miksturę
    if (rand < 0.5) {
        return { 
            name: "Mikstura Zdrowia", 
            type: 'potion', 
            icon: 'assets/item_potion.svg',
            description: "Odnawia 20 HP"
        };
    }
    // 30% na Miecz
    else if (rand < 0.8) {
        return {
            name: "Stary Miecz",
            type: 'equipment',
            slot: 'mainhand',
            icon: 'assets/item_sword.svg',
            stats: { str: 2 },
            description: "+2 Siły"
        };
    }
    // 20% na Zbroję
    else {
        return {
            name: "Skórzana Zbroja",
            type: 'equipment',
            slot: 'chest',
            icon: 'assets/item_armor.svg',
            stats: { hp: 10 },
            description: "+10 HP"
        };
    }
}
