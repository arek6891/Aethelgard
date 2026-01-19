export const images = {
    grass: new Image(), wall: new Image(),
    player: new Image(), skeleton: new Image(),
    potion: new Image(), sack: new Image(),
    tree: new Image(), rock: new Image(), water: new Image(),
    stairs: new Image()
};

export const sprites = {
    grass: null, wall: null,
    player: null, skeleton: null,
    potion: null, sack: null,
    tree: null, rock: null, water: null,
    stairs: null
};

function prerenderImage(img, width, height) {
    const buffer = document.createElement('canvas');
    buffer.width = width;
    buffer.height = height;
    const bCtx = buffer.getContext('2d');
    bCtx.drawImage(img, 0, 0, width, height);
    return buffer;
}

export function loadAssets() {
    return new Promise((resolve, reject) => {
        const totalAssets = 10;
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
            // Mimo błędu, liczmy to jako załadowane, żeby gra ruszyła
            checkLoad();
        }

        // Ścieżki do grafik
        images.grass.src = 'assets/tile_grass.svg';
        images.grass.onload = checkLoad; images.grass.onerror = onError;

        images.wall.src = 'assets/tile_wall.svg';
        images.wall.onload = checkLoad; images.wall.onerror = onError;

        images.player.src = 'assets/char_knight.svg';
        images.player.onload = checkLoad; images.player.onerror = onError;

        images.skeleton.src = 'assets/char_skeleton.svg';
        images.skeleton.onload = checkLoad; images.skeleton.onerror = onError;

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
    try { sprites.grass = prerenderImage(images.grass, 64, 32); } catch(e) { console.warn("Grass error", e); }
    try { sprites.wall = prerenderImage(images.wall, 64, 82); } catch(e) { console.warn("Wall error", e); }
    try { sprites.player = prerenderImage(images.player, 40, 60); } catch(e) { console.warn("Player error", e); }
    try { sprites.skeleton = prerenderImage(images.skeleton, 40, 60); } catch(e) { console.warn("Skeleton error", e); }
    try { sprites.potion = prerenderImage(images.potion, 32, 32); } catch(e) { console.warn("Potion error", e); }
    try { sprites.sack = prerenderImage(images.sack, 32, 32); } catch(e) { console.warn("Sack error", e); }
    try { sprites.tree = prerenderImage(images.tree, 64, 96); } catch(e) { console.warn("Tree error", e); }
    try { sprites.rock = prerenderImage(images.rock, 64, 64); } catch(e) { console.warn("Rock error", e); }
    try { sprites.water = prerenderImage(images.water, 64, 32); } catch(e) { console.warn("Water error", e); }
    try { sprites.stairs = prerenderImage(images.stairs, 64, 32); } catch(e) { console.warn("Stairs error", e); }
}
