import { state } from './GameState.js';
import { refreshInventoryUI } from './UI.js';

const KEY_PREFIX = 'aethelgard_save_';

export function getSaveSlots() {
    const slots = [
        { id: 'auto', name: 'Auto Save' },
        { id: 'slot1', name: 'Slot 1' },
        { id: 'slot2', name: 'Slot 2' },
        { id: 'slot3', name: 'Slot 3' }
    ];

    return slots.map(slot => {
        const key = KEY_PREFIX + slot.id;
        const json = localStorage.getItem(key);
        let info = null;
        if (json) {
            try {
                const data = JSON.parse(json);
                info = {
                    date: new Date(data.timestamp).toLocaleString(),
                    hp: Math.floor(data.player.hp),
                    level: 1 // Placeholder if we add levels later
                };
            } catch (e) {
                info = { date: 'Corrupted', hp: 0 };
            }
        }
        return { ...slot, info };
    });
}

export function saveGame(slotId, silent = false) {
    try {
        const dataToSave = {
            timestamp: Date.now(),
            mapData: state.mapData,
            enemies: state.enemies,
            lootBags: state.lootBags,
            player: state.player
        };
        const json = JSON.stringify(dataToSave);
        localStorage.setItem(KEY_PREFIX + slotId, json);
        console.log(`Game saved to ${slotId}.`);
        if (!silent) alert("Gra zapisana!");
        
        // Odśwież UI jeśli okno jest otwarte
        if (window.refreshSaveUI) window.refreshSaveUI();
        
    } catch (e) {
        console.error("Failed to save game:", e);
        if (!silent) alert("Błąd zapisu gry!");
    }
}

export function loadGame(slotId) {
    try {
        const key = KEY_PREFIX + slotId;
        const json = localStorage.getItem(key);
        if (!json) {
            console.log("No save game found for " + slotId);
            alert("Brak zapisu w tym slocie.");
            return;
        }

        const loadedData = JSON.parse(json);

        if (!loadedData.player || !loadedData.mapData) {
            throw new Error("Invalid save data structure");
        }

        state.mapData = loadedData.mapData;
        state.enemies = loadedData.enemies || [];
        state.lootBags = loadedData.lootBags || [];
        state.player = loadedData.player;
        
        state.currentLootBag = null;
        document.getElementById('loot-window').style.display = 'none';

        refreshInventoryUI();
        
        const hpPercent = (state.player.hp / state.player.maxHp) * 100;
        const hpBar = document.querySelector('#hp-bar .bar-fill');
        if(hpBar) hpBar.style.width = `${hpPercent}%`;
        const hpText = document.getElementById('hp-text');
        if(hpText) hpText.innerText = `${Math.floor(state.player.hp)}/${state.player.maxHp}`;

        console.log("Game loaded from " + slotId);
        alert("Gra wczytana!");
        
        // Zamknij okno zapisu jeśli jest otwarte
        const win = document.getElementById('save-load-window');
        if (win) win.style.display = 'none';

    } catch (e) {
        console.error("Failed to load game:", e);
        alert("Błąd wczytywania gry (uszkodzony zapis?)");
    }
}

let autoSaveInterval = null;

export function initAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    
    // Auto save co 60 sekund
    autoSaveInterval = setInterval(() => {
        saveGame('auto', true);
        showAutoSaveIndicator();
    }, 60000); 
    console.log("Auto-save initialized (60s).");
}

function showAutoSaveIndicator() {
    const ind = document.getElementById('autosave-indicator');
    if (ind) {
        ind.style.opacity = 1;
        setTimeout(() => ind.style.opacity = 0, 2000);
    }
}