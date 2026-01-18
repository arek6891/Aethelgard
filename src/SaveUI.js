import { state } from './GameState.js';
import { refreshInventoryUI } from './UI.js';
import { getSaveSlots, saveGame, loadGame } from './SaveSystem.js';

export function refreshSaveUI() {
    const list = document.getElementById('save-slots-list');
    list.innerHTML = '';

    const slots = getSaveSlots();

    slots.forEach(slot => {
        const div = document.createElement('div');
        div.className = 'save-slot';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'slot-info';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'slot-name';
        nameSpan.innerText = slot.name;
        
        const detailsSpan = document.createElement('span');
        detailsSpan.className = 'slot-details';
        if (slot.info) {
            detailsSpan.innerText = `${slot.info.date} | HP: ${slot.info.hp}`;
        } else {
            detailsSpan.innerText = "Pusty";
        }

        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(detailsSpan);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'slot-actions';

        // Button Save
        const btnSave = document.createElement('button');
        btnSave.className = 'btn-save';
        btnSave.innerText = "Zapisz";
        btnSave.onclick = () => saveGame(slot.id);

        // Button Load
        const btnLoad = document.createElement('button');
        btnLoad.className = 'btn-load';
        btnLoad.innerText = "Wczytaj";
        if (!slot.info) btnLoad.disabled = true;
        btnLoad.onclick = () => loadGame(slot.id);

        actionsDiv.appendChild(btnSave);
        actionsDiv.appendChild(btnLoad);

        div.appendChild(infoDiv);
        div.appendChild(actionsDiv);
        list.appendChild(div);
    });
}

// Global exposure
window.refreshSaveUI = refreshSaveUI;
