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

    // 25% na Miksturę (mniej niż wcześniej, bo więcej itemów)
    if (rand < 0.25) {
        return {
            name: "Mikstura Zdrowia",
            type: 'potion',
            icon: 'assets/items/micsture.jpg',
            description: "Odnawia 20 HP"
        };
    }

    // Generowanie Ekwipunku
    const typeRoll = Math.random();

    // HEAD (15%)
    if (typeRoll < 0.15) {
        return Math.random() < 0.5 ? {
            name: "Skórzana Czapka",
            type: 'equipment',
            slot: 'head',
            icon: 'assets/items/item_helmet.svg',
            stats: { hp: 10 },
            description: "+10 HP"
        } : {
            name: "Żelazny Hełm",
            type: 'equipment',
            slot: 'head',
            icon: 'assets/items/item_helmet.svg',
            stats: { hp: 25, str: 1 },
            description: "+25 HP, +1 STR"
        };
    }
    // CHEST (15%)
    else if (typeRoll < 0.30) {
        return Math.random() < 0.5 ? {
            name: "Skórzana Zbroja",
            type: 'equipment',
            slot: 'chest',
            icon: 'assets/item_armor.svg',
            stats: { hp: 20 },
            description: "+20 HP"
        } : {
            name: "Płytowa Zbroja",
            type: 'equipment',
            slot: 'chest',
            icon: 'assets/item_armor.svg',
            stats: { hp: 50, speed: -0.01 },
            description: "+50 HP, -Speed"
        };
    }
    // LEGS (15%)
    else if (typeRoll < 0.45) {
        return Math.random() < 0.5 ? {
            name: "Buty Podróżnika",
            type: 'equipment',
            slot: 'legs',
            icon: 'assets/items/item_boots.svg',
            stats: { speed: 0.02 },
            description: "+Speed"
        } : {
            name: "Ciężkie Buty",
            type: 'equipment',
            slot: 'legs',
            icon: 'assets/items/item_boots.svg',
            stats: { hp: 15, speed: -0.005 },
            description: "+15 HP"
        };
    }
    // MAINHAND (20%)
    else if (typeRoll < 0.65) {
        const weaponRoll = Math.random();
        if (weaponRoll < 0.33) {
            return {
                name: "Stary Miecz",
                type: 'equipment',
                slot: 'mainhand',
                icon: 'assets/item_sword.svg',
                stats: { str: 2 },
                description: "+2 STR"
            };
        } else if (weaponRoll < 0.66) {
            return {
                name: "Topór Wojenny",
                type: 'equipment',
                slot: 'mainhand',
                icon: 'assets/items/item_axe.svg',
                stats: { str: 4, speed: -0.005 },
                description: "+4 STR, Ciężki"
            };
        } else {
            return {
                name: "Sztylet",
                type: 'equipment',
                slot: 'mainhand',
                icon: 'assets/items/item_dagger.svg',
                stats: { dex: 3, speed: 0.01 },
                description: "+3 DEX, Lekki"
            };
        }
    }
    // OFFHAND (15%)
    else if (typeRoll < 0.80) {
        return {
            name: "Drewniana Tarcza",
            type: 'equipment',
            slot: 'offhand',
            icon: 'assets/items/item_shield.svg',
            stats: { hp: 15 },
            description: "+15 HP"
        };
    }
    // RINGS (20%)
    else {
        return Math.random() < 0.5 ? {
            name: "Złoty Pierścień",
            type: 'equipment',
            slot: 'ring', // Generic slot, UI handles placement
            icon: 'assets/items/item_ring.svg',
            stats: { int: 3 },
            description: "+3 INT"
        } : {
            name: "Srebrny Pierścień",
            type: 'equipment',
            slot: 'ring',
            icon: 'assets/items/item_ring.svg',
            stats: { dex: 3 },
            description: "+3 DEX"
        };
    }
}

export function generateBossItem(bossType) {
    if (bossType === 'uytek') {
        // Uytek dropuje Włócznię + 2 Fioletowe Klejnoty
        return [
            {
                name: "Włócznia Uyteka",
                type: 'equipment',
                slot: 'mainhand',
                icon: 'assets/item_sword.svg',
                stats: { str: 15, dex: 5 },
                description: "Broń legendarnego Uyteka. +15 STR, +5 DEX",
                isUnique: true
            },
            {
                name: "Fioletowy Klejnot",
                type: 'gem',
                icon: 'assets/items/gem_purple.svg',
                value: 100,
                description: "Rzadki klejnot z Wymiaru Uytek. Wartość: 100 złota."
            },
            {
                name: "Fioletowy Klejnot",
                type: 'gem',
                icon: 'assets/items/gem_purple.svg',
                value: 100,
                description: "Rzadki klejnot z Wymiaru Uytek. Wartość: 100 złota."
            }
        ];
    } else if (bossType === 'eloryba3000') {
        // Losowy drop z Eloryby
        const rand = Math.random();
        if (rand < 0.4) {
            // 40% szans na Łuskę
            return {
                name: "Łuska EloRyby",
                type: 'equipment',
                slot: 'chest',
                icon: 'assets/item_armor.svg',
                stats: { hp: 100 },
                description: "Lśniąca i twarda. +100 HP",
                isUnique: true
            };
        } else {
            // 60% szans na Stos Kartek
            return {
                name: "Stos Kartek",
                type: 'throwable',
                icon: 'assets/items/kartka.svg',
                damage: 20 + Math.floor(Math.random() * 10),
                uses: 5, // 5 użyć
                grade: '1',
                description: "Rzuć kartką w wroga! 5 użyć.",
                isUnique: true
            };
        }
    } else if (bossType === 'fireLord') {
        // Władca Ognia - drop Piekielny Miecz + Eliksir Ognia
        return [
            {
                name: "Piekielny Miecz",
                type: 'equipment',
                slot: 'mainhand',
                icon: 'assets/item_sword.svg',
                stats: { str: 20, int: 5 },
                description: "Płonie wiecznym ogniem. +20 STR, +5 INT",
                isUnique: true,
                fireDamage: 10 // Dodatkowe obrażenia ogniowe
            },
            {
                name: "Eliksir Ognia",
                type: 'potion',
                icon: 'assets/items/micsture.jpg',
                healAmount: 0,
                mpRestore: 50,
                description: "Odnawia 50 MP"
            }
        ];
    }
    return generateRandomItem();
}

// Generuje pojedynczą kartkę do rzucania
export function generateKartka() {
    const grades = ['1', '2', '3', '4', '5', '6', '1-', '2+', 'nb', '?'];
    return {
        name: "Kartka z Oceną",
        type: 'throwable',
        icon: 'assets/items/kartka.svg',
        damage: 10 + Math.floor(Math.random() * 15),
        uses: 1,
        grade: grades[Math.floor(Math.random() * grades.length)],
        description: "Rzuć kartką w wroga!"
    };
}
