import { state } from "./GameState.js";
import { config } from "./Config.js";
import { calculateEnemyStats } from "./Difficulty.js";

function generateLevel(levelNum) {
  console.log(`Generowanie Poziomu ${levelNum}...`);
  state.mapData = [];
  state.enemies = [];
  state.lootBags = [];
  state.currentLootBag = null;
  document.getElementById("loot-window").style.display = "none";

  // 0. Ustal Biom
  // 30% Uytek, 25% Inferno, 45% Normal
  const biomeRoll = Math.random();
  if (biomeRoll < 0.3) {
    state.biome = "uytek";
  } else if (biomeRoll < 0.55) {
    state.biome = "inferno";
  } else {
    state.biome = "normal";
  }
  console.log(`Generowanie Poziomu ${levelNum} [Biom: ${state.biome}]`);

  // 1. Inicjalizacja pustej mapy (Trawa)
  for (let x = 0; x < config.mapSize; x++) {
    state.mapData[x] = [];
    for (let y = 0; y < config.mapSize; y++) {
      state.mapData[x][y] = 0;
    }
  }

  // 2. Granice mapy (Ściany)
  for (let i = 0; i < config.mapSize; i++) {
    state.mapData[i][0] = 1;
    state.mapData[i][config.mapSize - 1] = 1;
    state.mapData[0][i] = 1;
    state.mapData[config.mapSize - 1][i] = 1;
  }

  // Helper: Generowanie klastrów (dla lasów i jezior)
  function spawnCluster(type, count, minRad, maxRad, density) {
    for (let i = 0; i < count; i++) {
      const cx = Math.floor(Math.random() * (config.mapSize - 6)) + 3;
      const cy = Math.floor(Math.random() * (config.mapSize - 6)) + 3;
      const rad = Math.floor(Math.random() * (maxRad - minRad)) + minRad;

      for (let x = cx - rad; x <= cx + rad; x++) {
        for (let y = cy - rad; y <= cy + rad; y++) {
          if (
            x > 1 &&
            x < config.mapSize - 1 &&
            y > 1 &&
            y < config.mapSize - 1
          ) {
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            if (dist <= rad && Math.random() < density) {
              if (state.mapData[x][y] === 0) state.mapData[x][y] = type;
            }
          }
        }
      }
    }
  }

  // 3. Generowanie Terenu
  spawnCluster(2, 4, 2, 5, 1.0); // Woda
  spawnCluster(3, 10, 3, 6, 0.7); // Las

  // 4. Detale (Skały i Ruiny)
  for (let i = 0; i < 50; i++) {
    const rx = Math.floor(Math.random() * config.mapSize);
    const ry = Math.floor(Math.random() * config.mapSize);
    if (state.mapData[rx][ry] === 0) state.mapData[rx][ry] = 4;
  }
  for (let i = 0; i < 30; i++) {
    const wx = Math.floor(Math.random() * config.mapSize);
    const wy = Math.floor(Math.random() * config.mapSize);
    if (state.mapData[wx][wy] === 0) state.mapData[wx][wy] = 1;
  }

  // 5. Strefa bezpieczna (Spawn)
  for (let x = 16; x < 24; x++) {
    for (let y = 16; y < 24; y++) {
      state.mapData[x][y] = 0;
    }
  }
  // Reset Gracza
  state.player.x = 20;
  state.player.y = 20;
  state.player.targetX = 20;
  state.player.targetY = 20;

  // 6. Wyjście (Schody - Typ 5)
  // Wymuszona pozycja w rogu mapy (koniec poziomu)
  const sx = config.mapSize - 4;
  const sy = config.mapSize - 4;

  // Wyczyść teren wokół schodów, żeby były widoczne i dostępne
  for (let i = sx - 1; i <= sx + 1; i++) {
    for (let j = sy - 1; j <= sy + 1; j++) {
      if (state.mapData[i] && state.mapData[i][j] !== undefined) {
        state.mapData[i][j] = 0; // Trawa
      }
    }
  }

  state.mapData[sx][sy] = 5; // Schody
  console.log(`Schody umieszczone na stałe: [${sx}, ${sy}]`);

  // 7a. Spawn Unikatowych Mobów (Bosses/Rares)
  // Uytek (30% szansy)
  if (Math.random() < 0.3) {
    let placed = false;
    while (!placed) {
      const ux = Math.floor(Math.random() * config.mapSize);
      const uy = Math.floor(Math.random() * config.mapSize);
      if (
        state.mapData[ux][uy] === 0 &&
        (ux < 15 || ux > 25 || uy < 15 || uy > 25)
      ) {
        const stats = calculateEnemyStats("uytek", levelNum, true); // true = isBoss
        state.enemies.push({
          x: ux,
          y: uy,
          type: "uytek",
          hp: stats.hp,
          maxHp: stats.maxHp,
          damage: stats.damage,
          name: "Uytek",
        });
        placed = true;
        console.log("Uytek pojawił się na mapie!");
      }
    }
  }
  // Eloryba3000 (40% szansy) - SPAWN W WODZIE LUB OBOK!
  if (Math.random() < 0.4) {
    // Znajdź tile wody do spawnu
    let waterTiles = [];
    for (let x = 2; x < config.mapSize - 2; x++) {
      for (let y = 2; y < config.mapSize - 2; y++) {
        if (state.mapData[x][y] === 2) {
          // Woda
          waterTiles.push({ x, y });
        }
      }
    }

    let spawnX, spawnY;

    if (waterTiles.length > 0) {
      // Spawnuj NA wodzie
      const spawnTile =
        waterTiles[Math.floor(Math.random() * waterTiles.length)];
      spawnX = spawnTile.x;
      spawnY = spawnTile.y;
      console.log(`Eloryba3000 wyskakuje z wody na (${spawnX}, ${spawnY})!`);
    } else {
      // Fallback - znajdź losowe miejsce daleko od gracza
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        const ex = Math.floor(Math.random() * config.mapSize);
        const ey = Math.floor(Math.random() * config.mapSize);
        if (
          state.mapData[ex][ey] === 0 &&
          (ex < 10 || ex > 30 || ey < 10 || ey > 30)
        ) {
          spawnX = ex;
          spawnY = ey;
          placed = true;
        }
        attempts++;
      }
      if (!placed) {
        spawnX = 5;
        spawnY = 5;
      }
      console.log(
        `Eloryba3000 pojawia się na lądzie (${spawnX}, ${spawnY}) - brak wody!`,
      );
    }

    const stats = calculateEnemyStats("eloryba3000", levelNum, true);
    state.enemies.push({
      x: spawnX,
      y: spawnY,
      type: "eloryba3000",
      hp: stats.hp,
      maxHp: stats.maxHp,
      damage: stats.damage,
      name: "Eloryba3000",
      isWaterBoss: true,
      throwCooldown: 0,
      jumpAnimation: 0,
      lastAttackTime: 0,
      speed: 0.02,
    });
  }

  // Fire Lord (Boss Biomu Inferno) - 40% szansy w biomie inferno
  if (state.biome === "inferno" && Math.random() < 0.4) {
    // Znajdź lawę (water w inferno) lub losowe miejsce
    let lavaTiles = [];
    for (let x = 2; x < config.mapSize - 2; x++) {
      for (let y = 2; y < config.mapSize - 2; y++) {
        if (state.mapData[x][y] === 2) {
          // Lawa (water tile)
          // Sprawdź sąsiednie tile lądu
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              if (
                state.mapData[x + dx] &&
                state.mapData[x + dx][y + dy] === 0
              ) {
                lavaTiles.push({ x: x + dx, y: y + dy });
              }
            }
          }
        }
      }
    }

    let spawnX, spawnY;
    if (lavaTiles.length > 0) {
      const tile = lavaTiles[Math.floor(Math.random() * lavaTiles.length)];
      spawnX = tile.x;
      spawnY = tile.y;
    } else {
      spawnX = 5 + Math.floor(Math.random() * 5);
      spawnY = 5 + Math.floor(Math.random() * 5);
    }

    const stats = calculateEnemyStats("fireLord", levelNum, true);
    state.enemies.push({
      x: spawnX,
      y: spawnY,
      type: "fireLord",
      hp: stats.hp,
      maxHp: stats.maxHp,
      damage: stats.damage,
      name: "Władca Ognia",
      isBoss: true,
      fireAttackCooldown: 0,
      lastAttackTime: 0,
      speed: 0.025,
    });
    console.log(`Władca Ognia pojawia się w Piekle!`);
  }

  // 7. Spawn Wrogów (Skalowanie z poziomem)
  let enemiesCount = 0;
  // Formuła: 2 + (Level * 3). Level 1 = 5, Level 10 = 32.
  const maxEnemies = 2 + levelNum * 3;
  console.log(`Cel spawnu wrogów: ${maxEnemies}`);

  while (enemiesCount < maxEnemies) {
    const ex = Math.floor(Math.random() * config.mapSize);
    const ey = Math.floor(Math.random() * config.mapSize);
    const isSafeZone = ex > 15 && ex < 25 && ey > 15 && ey < 25;

    if (state.mapData[ex][ey] === 0 && !isSafeZone) {
      let enemyType, baseHp, enemyName;

      if (state.biome === "uytek") {
        // W Biomie Uytek 90% szans na Uyteka, 10% na Pająka
        const isRare = Math.random() < 0.1;
        enemyType = isRare ? "spider" : "uytek";
        enemyName = isRare ? "Pająk" : "Minion Uytek";
        baseHp = isRare ? 20 : 15;
      } else if (state.biome === "inferno") {
        // W Biomie Inferno - Demony i Płomienne Szkielety
        const isDemon = Math.random() < 0.6;
        enemyType = isDemon ? "demon" : "fireSkeleton";
        enemyName = isDemon ? "Demon" : "Płomienny Szkielet";
        baseHp = isDemon ? 35 : 40; // Silniejsze moby w Inferno
      } else {
        // Normalny Biom
        const isSpider = Math.random() < 0.4;
        baseHp = isSpider ? 20 : 30;
        enemyType = isSpider ? "spider" : "skeleton";
        enemyName = isSpider ? "Pająk" : "Szkielet";
      }

      const stats = calculateEnemyStats(enemyType, levelNum, false);

      state.enemies.push({
        x: ex,
        y: ey,
        type: enemyType,
        hp: stats.hp,
        maxHp: stats.maxHp,
        damage: stats.damage,
        name: enemyName,
      });
      enemiesCount++;
    }
  }
}

// Inicjalizacja świata
export { generateLevel };
