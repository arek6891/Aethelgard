import { config } from "./Config.js";
import { state } from "./GameState.js";
import { cartesianToIso } from "./Utils.js";
import { drawScene, resize } from "./Renderer.js";
import { initInput } from "./Input.js";
import { updateSlowEffects } from "./Skills.js";
import { updateEffects } from "./SkillEffects.js";
import { calculateEnemyStats } from "./Difficulty.js";
import { generateLevel } from "./LevelGenerator.js";
import {
  spawnFloatingText,
  triggerScreenShake,
  updateFloatingTexts,
} from "./VisualEffects.js";

const canvas = document.getElementById("gameCanvas");

export function initGame() {
  state.level = 1;
  generateLevel(state.level);

  // Inicjalizacja UI Plecaka (puste sloty - listenery)
  const backpackGrid = document.getElementById("backpack-grid");
  if (backpackGrid) {
    backpackGrid.innerHTML = "";
    for (let i = 0; i < state.player.backpackSize; i++) {
      const slot = document.createElement("div");
      slot.className = "item-slot";
      slot.dataset.index = i;
      slot.onclick = () => window.useItem(i);
      backpackGrid.appendChild(slot);
    }
  }

  initInput();
  window.addEventListener("resize", resize);
  resize();
}

function update() {
  // Ruch gracza
  const dx = state.player.targetX - state.player.x;
  const dy = state.player.targetY - state.player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > state.player.speed) {
    state.player.x += (dx / dist) * state.player.speed;
    state.player.y += (dy / dist) * state.player.speed;
  } else {
    state.player.x = state.player.targetX;
    state.player.y = state.player.targetY;

    // Sprawdź czy stoimy na schodach (Tile 5)
    const pX = Math.round(state.player.x);
    const pY = Math.round(state.player.y);

    if (state.mapData[pX] && state.mapData[pX][pY] === 5) {
      console.log("Wejście na schody!");
      state.level++;
      // Mały delay dla efektu
      state.player.targetX = state.player.x; // Stop movement
      state.player.targetY = state.player.y;

      // Opcjonalnie: alert lub UI
      // alert(`Schodzisz głębiej... Poziom ${state.level}`);
      generateLevel(state.level);
    }
  }

  // --- ENEMY AI ---
  const now = Date.now();
  state.enemies.forEach((enemy) => {
    // Init properties if missing
    if (!enemy.lastAttackTime) enemy.lastAttackTime = 0;
    if (!enemy.speed) enemy.speed = 0.03 + Math.random() * 0.02; // Slight variation

    // Simple Patrol Logic
    if (!enemy.patrolTarget) enemy.patrolTarget = null;

    const distToPlayer = Math.sqrt(
      (state.player.x - enemy.x) ** 2 + (state.player.y - enemy.y) ** 2,
    );

    if (distToPlayer < 8) {
      // AGGRO RANGE
      enemy.patrolTarget = null; // Forget patrol

      // UYTEK SPECIAL: Wołanie pobliskich mobów!
      if (enemy.type === "uytek") {
        // Woła moby co 3 sekundy
        if (!enemy.lastRallyTime) enemy.lastRallyTime = 0;
        if (now - enemy.lastRallyTime > 3000) {
          enemy.lastRallyTime = now;

          // Znajdź wszystkie moby w promieniu 10 tile
          let ralliedCount = 0;
          state.enemies.forEach((ally) => {
            if (ally === enemy) return; // Nie siebie

            const dx = ally.x - enemy.x;
            const dy = ally.y - enemy.y;
            const allyDist = Math.sqrt(dx * dx + dy * dy);

            if (allyDist < 10) {
              // "Przyciągnij" moba do gracza - ustaw patrol target na gracza
              ally.patrolTarget = { x: state.player.x, y: state.player.y };
              ally.rallied = true; // Oznacz jako zwołanego
              ralliedCount++;
            }
          });

          if (ralliedCount > 0) {
            console.log(`Uytek woła ${ralliedCount} sojuszników do ataku!`);
            // Efekt wizualny - fioletowa fala (będzie renderowana)
            if (!state.rallyEffects) state.rallyEffects = [];
            state.rallyEffects.push({
              x: enemy.x,
              y: enemy.y,
              radius: 0,
              maxRadius: 10,
              spawnTime: now,
            });
          }
        }
      }

      // ELORYBA SPECIAL: Rzucanie kartkami z dystansu!
      if (enemy.type === "eloryba3000") {
        // Animacja wyskoku z wody
        if (enemy.jumpAnimation < 1) {
          enemy.jumpAnimation += 0.02;
        }

        // Eloryba rzuca kartkami z dystansu (range 6), nie goni gracza
        if (distToPlayer > 2 && distToPlayer < 7) {
          // Rzuć kartkę co 1.5 sekundy
          if (!enemy.throwCooldown || now - enemy.throwCooldown > 1500) {
            enemy.throwCooldown = now;

            // Losowa ocena na kartce
            const grades = ["1", "2", "3", "4", "5", "6", "1-", "2+", "nb"];
            const grade = grades[Math.floor(Math.random() * grades.length)];

            // Stwórz projectile (kartkę)
            const dx = state.player.x - enemy.x;
            const dy = state.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            state.projectiles.push({
              x: enemy.x,
              y: enemy.y,
              vx: (dx / dist) * 0.15, // Prędkość kartki
              vy: (dy / dist) * 0.15,
              damage: enemy.damage, // Use calculated stats

              grade: grade,
              owner: "enemy",
              lifetime: 3000,
              spawnTime: now,
            });

            console.log(`Eloryba rzuca kartką z oceną ${grade}!`);
          }
        } else if (distToPlayer <= 2) {
          // Bliska walka - skok i uderzenie
          if (now - enemy.lastAttackTime > 1000) {
            enemy.lastAttackTime = now;
            let dmg = enemy.damage * 1.5; // Tail slap is stronger
            state.player.hp -= Math.floor(dmg);
            console.log(
              `${enemy.name} uderza ogonem! Obrażenia: ${Math.floor(dmg)}. HP: ${state.player.hp}`,
            );
          }
        }
        // Eloryba nie goni - stoi w miejscu i rzuca
        return;
      }

      if (distToPlayer > 1.2) {
        // CHASE
        const edx = state.player.x - enemy.x;
        const edy = state.player.y - enemy.y;
        enemy.x += (edx / distToPlayer) * enemy.speed;
        enemy.y += (edy / distToPlayer) * enemy.speed;
      } else {
        // ATTACK
        if (now - enemy.lastAttackTime > 1000) {
          // 1 sec cooldown
          enemy.lastAttackTime = now;
          // Calc damage
          let dmg = enemy.damage || 5 + state.level; // Fallback if missing
          const finalDmg = Math.floor(dmg);
          state.player.hp -= finalDmg;
          console.log(
            `${enemy.name || "Wróg"} atakuje! Obrażenia: ${finalDmg}. HP: ${state.player.hp}`,
          );

          // Spawn damage number on player
          spawnFloatingText(state.player.x, state.player.y, finalDmg, "damage");

          // Screen shake when player is hit
          triggerScreenShake(5, 200);
        }
      }
    } else {
      // PATROL (Random Wander)
      if (!enemy.patrolTarget && Math.random() < 0.02) {
        // Pick random point nearby
        const rx = enemy.x + (Math.random() * 6 - 3);
        const ry = enemy.y + (Math.random() * 6 - 3);
        // Basic bounds check
        if (
          rx > 1 &&
          rx < config.mapSize - 1 &&
          ry > 1 &&
          ry < config.mapSize - 1
        ) {
          enemy.patrolTarget = { x: rx, y: ry };
        }
      }

      if (enemy.patrolTarget) {
        const pdx = enemy.patrolTarget.x - enemy.x;
        const pdy = enemy.patrolTarget.y - enemy.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

        if (pdist > enemy.speed) {
          enemy.x += (pdx / pdist) * (enemy.speed * 0.5); // Walk slower when patrolling
          enemy.y += (pdy / pdist) * (enemy.speed * 0.5);
        } else {
          enemy.patrolTarget = null; // Arrived
        }
      }
    }
  });

  // --- UPDATE PROJECTILES (Kartki z ocenami) ---
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const proj = state.projectiles[i];

    // Ruch
    proj.x += proj.vx;
    proj.y += proj.vy;

    // Sprawdź lifetime
    if (now - proj.spawnTime > proj.lifetime) {
      state.projectiles.splice(i, 1);
      continue;
    }

    // Kolizja z graczem (jeśli projektyl wroga)
    if (proj.owner === "enemy") {
      const dx = state.player.x - proj.x;
      const dy = state.player.y - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.8) {
        // Trafienie
        state.player.hp -= proj.damage;
        console.log(
          `Kartka z oceną ${proj.grade} trafia gracza! -${proj.damage} HP`,
        );

        // Spawn damage number
        spawnFloatingText(
          state.player.x,
          state.player.y,
          proj.damage,
          "damage",
        );

        // Screen shake
        triggerScreenShake(3, 150);

        state.projectiles.splice(i, 1);
        continue;
      }
    }

    // Kolizja z wrogiem (jeśli projektyl gracza)
    if (proj.owner === "player") {
      for (let j = state.enemies.length - 1; j >= 0; j--) {
        const enemy = state.enemies[j];
        const dx = enemy.x - proj.x;
        const dy = enemy.y - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.8) {
          enemy.hp -= proj.damage;
          console.log(`Gracz rzuca kartką! ${enemy.name} -${proj.damage} HP`);

          // Spawn damage number
          spawnFloatingText(enemy.x, enemy.y, proj.damage, "damage");

          // Screen shake
          triggerScreenShake(3, 150);

          state.projectiles.splice(i, 1);

          // Sprawdź śmierć wroga
          if (enemy.hp <= 0) {
            state.enemies.splice(j, 1);
            // Drop loot
            state.lootBags.push({
              x: enemy.x,
              y: enemy.y,
              items: [
                {
                  name: "Kartka z Oceną",
                  type: "throwable",
                  icon: "assets/items/kartka.svg",
                  damage: 15,
                  grade: ["1", "2", "3", "4", "5"][
                    Math.floor(Math.random() * 5)
                  ],
                  description: "Można rzucić w wroga (PPM)",
                },
              ],
            });
          }
          break;
        }
      }
    }

    // Sprawdź czy wyleciał poza mapę
    if (
      proj.x < 0 ||
      proj.x > config.mapSize ||
      proj.y < 0 ||
      proj.y > config.mapSize
    ) {
      state.projectiles.splice(i, 1);
    }
  }

  // Check Game Over
  if (state.player.hp <= 0) {
    state.player.hp = 0;
    // Simple Game Over handling
    // For now, just a console log or maybe a reload if we want to be harsh
    // console.log("GAME OVER");
    // alert("GAME OVER!");
    // window.location.reload();
    // Commented out alert to avoid loop, but let's reset to safe spawn
    state.player.x = 20;
    state.player.y = 20;
    state.player.hp = state.player.maxHp;
    state.projectiles = []; // Wyczyść kartki przy respawn
    console.log("GAME OVER - RESPAWN");
  }

  // Kamera
  const playerIso = cartesianToIso(state.player.x, state.player.y);
  config.offsetX = canvas.width / 2 - playerIso.x;
  config.offsetY = canvas.height / 2 - playerIso.y;

  // Update skill effects
  updateEffects();
  updateSlowEffects();
  updateFloatingTexts();

  // MP Regeneration (1 MP per second)
  if (now - state.player.lastMpRegen >= 1000) {
    state.player.lastMpRegen = now;
    state.player.mp = Math.min(state.player.mp + 1, state.player.maxMp);
  }

  // UI Pasków (HP/MP)
  const hpPercent = (state.player.hp / state.player.maxHp) * 100;
  const hpBar = document.querySelector("#hp-bar .bar-fill");
  if (hpBar) hpBar.style.width = `${hpPercent}%`;
  const hpText = document.getElementById("hp-text");
  if (hpText)
    hpText.innerText = `${Math.floor(state.player.hp)}/${state.player.maxHp}`;

  const mpPercent = (state.player.mp / state.player.maxMp) * 100;
  const mpBar = document.querySelector("#mp-bar .bar-fill");
  if (mpBar) mpBar.style.width = `${mpPercent}%`;
  const mpText = document.getElementById("mp-text");
  if (mpText)
    mpText.innerText = `${Math.floor(state.player.mp)}/${state.player.maxMp}`;

  // Update Skill Bar UI
  if (window.updateSkillBarUI) window.updateSkillBarUI();

  // Update Level Badge
  const levelBadge = document.getElementById("level-badge");
  if (levelBadge) levelBadge.innerText = state.level;
}

export function gameLoop() {
  update();
  drawScene();
  requestAnimationFrame(gameLoop);
}
