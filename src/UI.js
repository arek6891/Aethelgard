import { state } from './GameState.js';
import { sfx } from './Audio.js';
import { SKILLS, getSkillCooldownPercent } from './Skills.js';

// Aktualizacja UI skill bar (cooldowny, mana, aktywny skill)
window.updateSkillBarUI = function () {
    const skillBtns = document.querySelectorAll('.skill-btn[data-skill]');

    skillBtns.forEach(btn => {
        const skillId = btn.dataset.skill;
        const skill = SKILLS[skillId];
        if (!skill) return;

        const cooldownOverlay = btn.querySelector('.skill-cooldown-overlay');
        const cooldownPercent = getSkillCooldownPercent(skillId);

        // Update cooldown overlay (height from top = cooldown remaining)
        if (cooldownOverlay) {
            cooldownOverlay.style.height = `${cooldownPercent * 100}%`;
        }

        // Toggle classes
        btn.classList.toggle('on-cooldown', cooldownPercent > 0);
        btn.classList.toggle('no-mana', state.player.mp < skill.mpCost);
        btn.classList.toggle('active', state.player.selectedSkill === skillId);
    });
};

function updateStats() {
    const sStr = document.getElementById('stat-str');
    if (sStr) sStr.innerText = state.player.stats.str;
    const sDex = document.getElementById('stat-dex');
    if (sDex) sDex.innerText = state.player.stats.dex;
    const sInt = document.getElementById('stat-int');
    if (sInt) sInt.innerText = state.player.stats.int;
}

export function refreshInventoryUI() {
    const backpackSlots = document.querySelectorAll('#backpack-grid .item-slot');
    backpackSlots.forEach(s => {
        s.innerHTML = '';
        s.onclick = () => window.useItem(parseInt(s.dataset.index));
    });

    // Rysowanie plecaka
    state.player.inventory.forEach((item, index) => {
        if (index < backpackSlots.length) {
            const img = document.createElement('img');
            img.src = item.icon;
            img.className = 'item-icon';
            img.title = item.name + (item.description ? `
${item.description}` : '');
            backpackSlots[index].appendChild(img);
        }
    });

    // Rysowanie ekwipunku
    const equipSlots = document.querySelectorAll('.equip-slot');
    equipSlots.forEach(slot => {
        const slotType = slot.dataset.slot;
        slot.innerHTML = ''; // Wyczyść
        slot.onclick = () => window.unequipItem(slotType); // Bind unequip

        const item = state.player.equipment[slotType];
        if (item) {
            const img = document.createElement('img');
            img.src = item.icon;
            img.className = 'item-icon';
            img.title = item.name + (item.description ? `
${item.description}` : '');
            slot.appendChild(img);
        }
    });

    updateStats();
}

export function refreshLootUI() {
    const grid = document.getElementById('loot-grid');
    grid.innerHTML = '';
    if (!state.currentLootBag) return;

    state.currentLootBag.items.forEach(item => {
        const slot = document.createElement('div');
        slot.className = 'item-slot';
        const img = document.createElement('img');
        img.src = item.icon;
        img.className = 'item-icon';
        slot.appendChild(img);

        slot.onclick = () => {
            if (state.player.inventory.length < state.player.backpackSize) {
                sfx.loot();
                state.player.inventory.push(item);
                const idx = state.currentLootBag.items.indexOf(item);
                if (idx > -1) state.currentLootBag.items.splice(idx, 1);

                refreshLootUI();
                refreshInventoryUI();

                if (state.currentLootBag.items.length === 0) {
                    state.lootBags = state.lootBags.filter(b => b !== state.currentLootBag);
                    document.getElementById('loot-window').style.display = 'none';
                    state.currentLootBag = null;
                }
            }
        };
        grid.appendChild(slot);
    });
}

// Global functions for HTML access
window.refreshInventoryUI = refreshInventoryUI;

window.toggleInventory = function () {
    console.log("Toggle Inventory Clicked!");
    const panel = document.getElementById('inventory-panel');
    if (!panel) {
        console.error("Inventory panel not found!");
        return;
    }
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
        refreshInventoryUI();
    }
};

export function initUI() {
    console.log("Attaching UI listeners...");
    const btnChar = document.getElementById('btn-character');
    if (btnChar) {
        btnChar.addEventListener('click', window.toggleInventory);
        console.log("Listener attached to btn-character");
    } else {
        console.error("btn-character not found in DOM");
    }

    const btnClose = document.getElementById('btn-close-inv');
    if (btnClose) btnClose.addEventListener('click', window.toggleInventory);
}

window.takeAllLootLogic = function () {
    if (!state.currentLootBag) return;

    if (state.currentLootBag.items.length > 0) sfx.loot();

    while (state.currentLootBag.items.length > 0) {
        if (state.player.inventory.length < state.player.backpackSize) {
            const item = state.currentLootBag.items.shift();
            state.player.inventory.push(item);
        } else {
            console.log("Plecak pełny!");
            break;
        }
    }

    if (state.currentLootBag.items.length === 0) {
        state.lootBags = state.lootBags.filter(b => b !== state.currentLootBag);
        document.getElementById('loot-window').style.display = 'none';
        state.currentLootBag = null;
    } else {
        refreshLootUI();
    }
    refreshInventoryUI();
};

window.unequipItem = function (slotName) {
    const item = state.player.equipment[slotName];
    if (!item) return;

    if (state.player.inventory.length >= state.player.backpackSize) {
        console.log("Brak miejsca w plecaku!");
        return;
    }

    sfx.equip();
    state.player.equipment[slotName] = null;
    state.player.inventory.push(item);

    // Odejmij statystyki
    if (item.stats) {
        if (item.stats.str) state.player.stats.str -= item.stats.str;
        if (item.stats.dex) state.player.stats.dex -= item.stats.dex;
        if (item.stats.int) state.player.stats.int -= item.stats.int;
        if (item.stats.hp) state.player.maxHp -= item.stats.hp;
    }

    refreshInventoryUI();
};

window.useItem = function (index) {
    const item = state.player.inventory[index];
    if (!item) return;

    if (item.type === 'potion') {
        sfx.potion();
        const heal = item.healAmount || 20;
        state.player.hp = Math.min(state.player.hp + heal, state.player.maxHp);
        state.player.inventory.splice(index, 1);
        refreshInventoryUI();
    }
    else if (item.type === 'throwable') {
        // Wybierz kartkę do rzucenia
        sfx.ui();
        state.player.selectedThrowable = { item, index };
        console.log(`Wybrano kartkę do rzucenia: ${item.name} (${item.grade || '?'})`);
        // Kliknięcie na mapie rzuci kartkę
    }
    else if (item.type === 'equipment') {
        sfx.equip();
        let slot = item.slot;

        // Specjalna logika dla pierścieni (ring1/ring2)
        if (slot === 'ring') {
            // Jeśli ring1 pusty, załóż tam. Jak zajęty, sprawdź ring2. Jak oba zajęte, podmień ring1. 
            if (!state.player.equipment.ring1) slot = 'ring1';
            else if (!state.player.equipment.ring2) slot = 'ring2';
            else slot = 'ring1';
        }

        const currentEquip = state.player.equipment[slot];

        // Zdejmij obecny (jeśli jest)
        if (currentEquip) {
            state.player.inventory[index] = currentEquip;
            if (currentEquip.stats) {
                if (currentEquip.stats.str) state.player.stats.str -= currentEquip.stats.str;
                if (currentEquip.stats.dex) state.player.stats.dex -= currentEquip.stats.dex;
                if (currentEquip.stats.int) state.player.stats.int -= currentEquip.stats.int;
                if (currentEquip.stats.hp) state.player.maxHp -= currentEquip.stats.hp;
            }
        } else {
            state.player.inventory.splice(index, 1);
        }

        // Załóż nowy
        state.player.equipment[slot] = item;
        item.slot = slot; // Przypisz konkretny slot (np. 'ring1' zamiast ogólnego 'ring')

        if (item.stats) {
            if (item.stats.str) state.player.stats.str += item.stats.str;
            if (item.stats.dex) state.player.stats.dex += item.stats.dex;
            if (item.stats.int) state.player.stats.int += item.stats.int;
            if (item.stats.hp) state.player.maxHp += item.stats.hp;
        }

        refreshInventoryUI();
    }
};
