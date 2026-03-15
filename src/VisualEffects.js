// Visual Effects System - Damage Numbers & Screen Shake
import { cartesianToIso } from "./Utils.js";
import { config } from "./Config.js";

// Floating damage/heal numbers
export let floatingTexts = [];

// Screen shake state
export let screenShake = {
  intensity: 0,
  duration: 0,
  startTime: 0,
};

/**
 * Spawn a floating damage/heal number
 * @param {number} x - Grid X position
 * @param {number} y - Grid Y position
 * @param {number} amount - Damage/heal amount
 * @param {string} type - 'damage' | 'heal' | 'crit' | 'text'
 * @param {string} text - Optional custom text (for 'text' type)
 */
export function spawnFloatingText(x, y, amount, type = "damage", text = null) {
  let color,
    fontSize,
    isCrit = false;

  switch (type) {
    case "damage":
      color = "#ffffff";
      fontSize = 18;
      break;
    case "heal":
      color = "#00ff00";
      fontSize = 18;
      break;
    case "crit":
      color = "#ffcc00";
      fontSize = 28;
      isCrit = true;
      break;
    case "text":
      color = "#ffcc00";
      fontSize = 16;
      break;
    default:
      color = "#ffffff";
      fontSize = 18;
  }

  floatingTexts.push({
    gridX: x,
    gridY: y,
    offsetY: 0,
    text: text || amount.toString(),
    amount: amount,
    type: type,
    color: color,
    fontSize: fontSize,
    isCrit: isCrit,
    spawnTime: Date.now(),
    lifetime: 1200,
    alpha: 1,
  });
}

/**
 * Trigger screen shake effect
 * @param {number} intensity - How strong the shake is (2-10 recommended)
 * @param {number} duration - How long the shake lasts in ms
 */
export function triggerScreenShake(intensity = 5, duration = 200) {
  screenShake.intensity = intensity;
  screenShake.duration = duration;
  screenShake.startTime = Date.now();
}

/**
 * Get current screen shake offset
 * @returns {{x: number, y: number}} Offset to apply to rendering
 */
export function getScreenShakeOffset() {
  if (screenShake.intensity <= 0) {
    return { x: 0, y: 0 };
  }

  const now = Date.now();
  const elapsed = now - screenShake.startTime;

  if (elapsed >= screenShake.duration) {
    screenShake.intensity = 0;
    return { x: 0, y: 0 };
  }

  const decay = 1 - elapsed / screenShake.duration;
  const currentIntensity = screenShake.intensity * decay;
  const angle = (elapsed / screenShake.duration) * Math.PI * 4;

  return {
    x:
      Math.sin(angle) * currentIntensity +
      (Math.random() - 0.5) * currentIntensity,
    y:
      Math.cos(angle) * currentIntensity +
      (Math.random() - 0.5) * currentIntensity,
  };
}

/**
 * Update and clean up floating texts
 */
export function updateFloatingTexts() {
  const now = Date.now();

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    const age = now - ft.spawnTime;

    if (age >= ft.lifetime) {
      floatingTexts.splice(i, 1);
      continue;
    }

    const progress = age / ft.lifetime;
    ft.offsetY = -(progress * 50);

    if (age > ft.lifetime - 300) {
      ft.alpha = 1 - (age - (ft.lifetime - 300)) / 300;
    }
  }
}

/**
 * Render all floating texts
 * @param {CanvasRenderingContext2D} ctx
 */
export function renderFloatingTexts(ctx) {
  ctx.save();

  floatingTexts.forEach((ft) => {
    const isoPos = cartesianToIso(ft.gridX, ft.gridY);
    const screenX = config.offsetX + isoPos.x;
    const screenY = config.offsetY + isoPos.y - 30 + ft.offsetY;

    ctx.globalAlpha = ft.alpha;
    ctx.fillStyle = ft.color;
    ctx.font = `${ft.isCrit ? "bold " : ""}${ft.fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.lineWidth = 4;
    ctx.strokeText(ft.text, screenX, screenY);

    ctx.fillText(ft.text, screenX, screenY);
  });

  ctx.restore();
}

/**
 * Clear all floating texts (e.g., on level change)
 */
export function clearFloatingTexts() {
  floatingTexts = [];
}
