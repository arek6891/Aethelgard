export const images = {
    grass: new Image(), wall: new Image(),
    player: new Image(), skeleton: new Image(), spider: new Image(),
    uytek: new Image(), eloryba3000: new Image(),
    potion: new Image(), sack: new Image(),
    tree: new Image(), rock: new Image(), water: new Image(),
    stairs: new Image(),
    // Items
    itemHelmet: new Image(), itemBoots: new Image(), itemAxe: new Image(),
    itemDagger: new Image(), itemShield: new Image(), itemRing: new Image(),
    gemPurple: new Image(), kartka: new Image()
};

export const sprites = {
    grass: null, wall: null,
    player: null, skeleton: null, spider: null,
    uytek: null, eloryba3000: null,
    potion: null, sack: null,
    tree: null, rock: null, water: null,
    stairs: null,
    // Uytek Biome Variants
    grassUytek: null,
    treeUytek: null,
    rockUytek: null,
    // Inferno Biome Variants
    grassInferno: null,
    treeInferno: null,
    rockInferno: null,
    waterInferno: null, // Lawa
    // Inferno Mobs
    demon: null,
    fireLord: null,
    fireSkeleton: null,
    // Items
    itemHelmet: null, itemBoots: null, itemAxe: null,
    itemDagger: null, itemShield: null, itemRing: null,
    gemPurple: null, kartka: null
};

function prerenderImage(img, width, height, filter = null, removeBackground = false) {
    const buffer = document.createElement('canvas');
    buffer.width = width;
    buffer.height = height;
    const bCtx = buffer.getContext('2d');

    if (filter) {
        bCtx.filter = filter;
    }

    bCtx.drawImage(img, 0, 0, width, height);

    if (removeBackground) {
        try {
            const imageData = bCtx.getImageData(0, 0, width, height);
            const data = imageData.data;
            // Loop through pixels
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // If pixel is light enough (white paper), make it transparent
                if (r > 200 && g > 200 && b > 200) {
                    data[i + 3] = 0; // Alpha = 0
                }
            }
            bCtx.putImageData(imageData, 0, 0);
        } catch (e) {
            console.warn("Chroma Key failed (CORS? Use local server):", e);
        }
    }

    return buffer;
}

export function loadAssets() {
    return new Promise((resolve, reject) => {
        const totalAssets = 21;
        let assetsLoaded = 0;

        function checkLoad() {
            assetsLoaded++;
            if (assetsLoaded === totalAssets) {
                console.log("Wszystkie zasoby załadowane.");
                processSprites();
                resolve();
            }
        }

        function onError(e) {
            console.error("Błąd ładowania grafiki:", e.target.src);
            checkLoad();
        }

        // Ścieżki do grafik
        images.grass.src = 'assets/tile_grass.svg';
        images.grass.onload = checkLoad; images.grass.onerror = onError;

        images.wall.src = 'assets/tile_wall.svg';
        images.wall.onload = checkLoad; images.wall.onerror = onError;

        images.player.src = 'assets/char_knight.svg';
        images.player.onload = checkLoad; images.player.onerror = onError;

        // MOBS
        images.skeleton.src = 'assets/mobs/skeleton.svg';
        images.skeleton.onload = checkLoad; images.skeleton.onerror = onError;

        images.spider.src = 'assets/mobs/spider.svg';
        images.spider.onload = checkLoad; images.spider.onerror = onError;

        images.uytek.src = 'assets/mobs/Uytek.jpg';
        images.uytek.onload = checkLoad; images.uytek.onerror = onError;

        images.eloryba3000.src = 'assets/mobs/EloRyba3000.jpg';
        images.eloryba3000.onload = checkLoad; images.eloryba3000.onerror = onError;

        images.potion.src = 'assets/items/micsture.jpg';
        images.potion.onload = checkLoad; images.potion.onerror = onError;

        images.sack.src = 'assets/item_sack.svg';
        images.sack.onload = checkLoad; images.sack.onerror = onError;

        images.tree.src = 'assets/tile_tree.svg';
        images.tree.onload = checkLoad; images.tree.onerror = onError;

        images.rock.src = 'assets/tile_rock.svg';
        images.rock.onload = checkLoad; images.rock.onerror = onError;

        images.water.src = 'assets/tile_water.svg';
        images.water.onload = checkLoad; images.water.onerror = onError;

        images.stairs.src = 'assets/tile_stairs.svg';
        images.stairs.onload = checkLoad; images.stairs.onerror = onError;

        // ITEMS
        images.itemHelmet.src = 'assets/items/item_helmet.svg';
        images.itemHelmet.onload = checkLoad; images.itemHelmet.onerror = onError;

        images.itemBoots.src = 'assets/items/item_boots.svg';
        images.itemBoots.onload = checkLoad; images.itemBoots.onerror = onError;

        images.itemAxe.src = 'assets/items/item_axe.svg';
        images.itemAxe.onload = checkLoad; images.itemAxe.onerror = onError;

        images.itemDagger.src = 'assets/items/item_dagger.svg';
        images.itemDagger.onload = checkLoad; images.itemDagger.onerror = onError;

        images.itemShield.src = 'assets/items/item_shield.svg';
        images.itemShield.onload = checkLoad; images.itemShield.onerror = onError;

        images.itemRing.src = 'assets/items/item_ring.svg';
        images.itemRing.onload = checkLoad; images.itemRing.onerror = onError;

        images.gemPurple.src = 'assets/items/gem_purple.svg';
        images.gemPurple.onload = checkLoad; images.gemPurple.onerror = onError;

        images.kartka.src = 'assets/items/kartka.svg';
        images.kartka.onload = checkLoad; images.kartka.onerror = onError;
    });
}

function processSprites() {
    try {
        sprites.grass = prerenderImage(images.grass, 64, 32);
        // Pre-render Uytek Variants (Filters from Game Design)
        sprites.grassUytek = prerenderImage(images.grass, 64, 32, 'hue-rotate(180deg) saturate(1.5) brightness(0.8)');
        // Pre-render Inferno Variants - czerwonawo-brązowa trawa
        sprites.grassInferno = prerenderImage(images.grass, 64, 32, 'sepia(1) saturate(2) hue-rotate(-30deg) brightness(0.6)');
    } catch (e) { console.warn("Grass error", e); }

    try { sprites.wall = prerenderImage(images.wall, 64, 82); } catch (e) { console.warn("Wall error", e); }
    try { sprites.player = prerenderImage(images.player, 40, 60); } catch (e) { console.warn("Player error", e); }
    try { sprites.skeleton = prerenderImage(images.skeleton, 40, 60); } catch (e) { console.warn("Skeleton error", e); }
    try { sprites.spider = prerenderImage(images.spider, 40, 40); } catch (e) { console.warn("Spider error", e); }
    try { sprites.uytek = prerenderImage(images.uytek, 40, 40, null, true); } catch (e) { console.warn("Uytek error", e); }
    try { sprites.eloryba3000 = prerenderImage(images.eloryba3000, 60, 40, null, true); } catch (e) { console.warn("Eloryba error", e); }
    try { sprites.potion = prerenderImage(images.potion, 32, 32); } catch (e) { console.warn("Potion error", e); }
    try { sprites.sack = prerenderImage(images.sack, 32, 32); } catch (e) { console.warn("Sack error", e); }

    try {
        sprites.tree = prerenderImage(images.tree, 64, 96);
        sprites.treeUytek = prerenderImage(images.tree, 64, 96, 'hue-rotate(40deg) brightness(1.2) saturate(1.5)');
        // Inferno - spalone drzewo (ciemne, czerwonawe)
        sprites.treeInferno = prerenderImage(images.tree, 64, 96, 'sepia(1) saturate(0.5) brightness(0.4) contrast(1.2)');
    } catch (e) { console.warn("Tree error", e); }

    try {
        sprites.rock = prerenderImage(images.rock, 64, 64);
        sprites.rockUytek = prerenderImage(images.rock, 64, 64, 'sepia(1) saturate(3) hue-rotate(-30deg)');
        // Inferno - rozżarzona skała
        sprites.rockInferno = prerenderImage(images.rock, 64, 64, 'sepia(1) saturate(2) hue-rotate(-20deg) brightness(0.8)');
    } catch (e) { console.warn("Rock error", e); }

    try {
        sprites.water = prerenderImage(images.water, 64, 32);
        // Inferno - lawa (czerwono-pomarańczowa)
        sprites.waterInferno = prerenderImage(images.water, 64, 32, 'sepia(1) saturate(3) hue-rotate(-50deg) brightness(1.2)');
    } catch (e) { console.warn("Water error", e); }

    try { sprites.stairs = prerenderImage(images.stairs, 64, 32); } catch (e) { console.warn("Stairs error", e); }

    // Inferno Mobs - generowane z istniejących
    try {
        // Demon - czerwony szkielet z płomieniami
        sprites.demon = prerenderImage(images.skeleton, 40, 60, 'sepia(1) saturate(3) hue-rotate(-30deg) brightness(1.1)');
        // Fire Lord - duży czerwony boss
        sprites.fireLord = prerenderImage(images.skeleton, 60, 80, 'sepia(1) saturate(4) hue-rotate(-40deg) brightness(1.3)');
        // Fire Skeleton - płomienny szkielet (pomarańczowo-czerwony)
        sprites.fireSkeleton = prerenderImage(images.skeleton, 40, 60, 'sepia(1) saturate(2) hue-rotate(-10deg) brightness(1.2)');
    } catch (e) { console.warn("Inferno mobs error", e); }

    // Items - przedmioty
    try { sprites.itemHelmet = prerenderImage(images.itemHelmet, 32, 32); } catch (e) { console.warn("Item helmet error", e); }
    try { sprites.itemBoots = prerenderImage(images.itemBoots, 32, 32); } catch (e) { console.warn("Item boots error", e); }
    try { sprites.itemAxe = prerenderImage(images.itemAxe, 32, 32); } catch (e) { console.warn("Item axe error", e); }
    try { sprites.itemDagger = prerenderImage(images.itemDagger, 32, 32); } catch (e) { console.warn("Item dagger error", e); }
    try { sprites.itemShield = prerenderImage(images.itemShield, 32, 32); } catch (e) { console.warn("Item shield error", e); }
    try { sprites.itemRing = prerenderImage(images.itemRing, 32, 32); } catch (e) { console.warn("Item ring error", e); }
    try { sprites.gemPurple = prerenderImage(images.gemPurple, 32, 32); } catch (e) { console.warn("Gem purple error", e); }
    try { sprites.kartka = prerenderImage(images.kartka, 32, 32); } catch (e) { console.warn("Kartka error", e); }
}
