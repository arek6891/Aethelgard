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
            icon: 'assets/items/micsture.jpg',
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
