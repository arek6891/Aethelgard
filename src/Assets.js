export const images = {
    grass: new Image(), wall: new Image(),
    player: new Image(), skeleton: new Image(), spider: new Image(),
    uytek: new Image(), eloryba3000: new Image(),
    potion: new Image(), sack: new Image(),
    tree: new Image(), rock: new Image(), water: new Image(),
    stairs: new Image()
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
    rockUytek: null
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
        const totalAssets = 13;
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

        images.potion.src = 'assets/item_potion.svg';
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
    });
}

function processSprites() {
    try { 
        sprites.grass = prerenderImage(images.grass, 64, 32); 
        // Pre-render Uytek Variants (Filters from Game Design)
        sprites.grassUytek = prerenderImage(images.grass, 64, 32, 'hue-rotate(180deg) saturate(1.5) brightness(0.8)');
    } catch(e) { console.warn("Grass error", e); }

    try { sprites.wall = prerenderImage(images.wall, 64, 82); } catch(e) { console.warn("Wall error", e); }
    try { sprites.player = prerenderImage(images.player, 40, 60); } catch(e) { console.warn("Player error", e); }
    try { sprites.skeleton = prerenderImage(images.skeleton, 40, 60); } catch(e) { console.warn("Skeleton error", e); }
    try { sprites.spider = prerenderImage(images.spider, 40, 40); } catch(e) { console.warn("Spider error", e); }
    try { sprites.uytek = prerenderImage(images.uytek, 40, 40, null, true); } catch(e) { console.warn("Uytek error", e); }
    try { sprites.eloryba3000 = prerenderImage(images.eloryba3000, 60, 40, null, true); } catch(e) { console.warn("Eloryba error", e); }
    try { sprites.potion = prerenderImage(images.potion, 32, 32); } catch(e) { console.warn("Potion error", e); }
    try { sprites.sack = prerenderImage(images.sack, 32, 32); } catch(e) { console.warn("Sack error", e); }
    
    try { 
        sprites.tree = prerenderImage(images.tree, 64, 96); 
        sprites.treeUytek = prerenderImage(images.tree, 64, 96, 'hue-rotate(40deg) brightness(1.2) saturate(1.5)');
    } catch(e) { console.warn("Tree error", e); }

    try { 
        sprites.rock = prerenderImage(images.rock, 64, 64); 
        sprites.rockUytek = prerenderImage(images.rock, 64, 64, 'sepia(1) saturate(3) hue-rotate(-30deg)');
    } catch(e) { console.warn("Rock error", e); }

    try { sprites.water = prerenderImage(images.water, 64, 32); } catch(e) { console.warn("Water error", e); }
    try { sprites.stairs = prerenderImage(images.stairs, 64, 32); } catch(e) { console.warn("Stairs error", e); }
}
