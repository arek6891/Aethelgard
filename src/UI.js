import { state } from './GameState.js';
import { sfx } from './Audio.js';

function updateStats() {
    // Prosta aktualizacja wyświetlania
    const sStr = document.getElementById('stat-str');
    if(sStr) sStr.innerText = state.player.stats.str;
    const sDex = document.getElementById('stat-dex');
    if(sDex) sDex.innerText = state.player.stats.dex;
    const sInt = document.getElementById('stat-int');
    if(sInt) sInt.innerText = state.player.stats.int;
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
    const equipSlots = document.querySelectorAll('.equip-slots .item-slot');
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
                sfx.loot(); // Dźwięk lootu
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

window.takeAllLootLogic = function() {
    if (!state.currentLootBag) return;
    
    if (state.currentLootBag.items.length > 0) sfx.loot(); // Dźwięk przy "Weź wszystko"

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

window.unequipItem = function(slotName) {
    const item = state.player.equipment[slotName];
    if (!item) return;

    if (state.player.inventory.length >= state.player.backpackSize) {
        console.log("Brak miejsca w plecaku!");
        return;
    }

    sfx.equip(); // Dźwięk zdjęcia
    // Zdejmij
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

window.useItem = function(index) {
    const item = state.player.inventory[index];
    if (!item) return;
    
    if (item.type === 'potion') {
        sfx.potion(); // Dźwięk mikstury
        state.player.hp = Math.min(state.player.hp + 20, state.player.maxHp);
        state.player.inventory.splice(index, 1);
        refreshInventoryUI();
        console.log("Wypito miksturę!");
    }
    else if (item.type === 'equipment') {
        sfx.equip(); // Dźwięk założenia
        const slot = item.slot;
        const currentEquip = state.player.equipment[slot];

        // Zdejmij obecny (jeśli jest)
        if (currentEquip) {
            state.player.inventory[index] = currentEquip; // Podmień w plecaku
            // Odejmij staty starego
            if (currentEquip.stats) {
                if (currentEquip.stats.str) state.player.stats.str -= currentEquip.stats.str;
                if (currentEquip.stats.dex) state.player.stats.dex -= currentEquip.stats.dex;
                if (currentEquip.stats.int) state.player.stats.int -= currentEquip.stats.int;
                if (currentEquip.stats.hp) state.player.maxHp -= currentEquip.stats.hp;
            }
        } else {
            // Po prostu usuń z plecaka
            state.player.inventory.splice(index, 1);
        }

        // Załóż nowy
        state.player.equipment[slot] = item;
        
        // Dodaj staty nowego
        if (item.stats) {
            if (item.stats.str) state.player.stats.str += item.stats.str;
            if (item.stats.dex) state.player.stats.dex += item.stats.dex;
            if (item.stats.int) state.player.stats.int += item.stats.int;
            if (item.stats.hp) state.player.maxHp += item.stats.hp;
        }

        refreshInventoryUI();
    }
};