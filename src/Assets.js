export const images = {
    grass: new Image(), wall: new Image(),
    player: new Image(), skeleton: new Image(),
    potion: new Image(), sack: new Image()
};

export const sprites = {
    grass: null, wall: null,
    player: null, skeleton: null,
    potion: null, sack: null
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
        const totalAssets = 6;
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
    });
}

function processSprites() {
    try { sprites.grass = prerenderImage(images.grass, 64, 32); } catch(e) { console.warn("Grass error", e); }
    try { sprites.wall = prerenderImage(images.wall, 64, 82); } catch(e) { console.warn("Wall error", e); }
    try { sprites.player = prerenderImage(images.player, 40, 60); } catch(e) { console.warn("Player error", e); }
    try { sprites.skeleton = prerenderImage(images.skeleton, 40, 60); } catch(e) { console.warn("Skeleton error", e); }
    try { sprites.potion = prerenderImage(images.potion, 32, 32); } catch(e) { console.warn("Potion error", e); }
    try { sprites.sack = prerenderImage(images.sack, 32, 32); } catch(e) { console.warn("Sack error", e); }
}
