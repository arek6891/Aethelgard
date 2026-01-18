import { loadAssets } from './Assets.js';
import { initGame, gameLoop } from './Game.js';
// Import UI to register global window functions
import './UI.js';
import './SaveUI.js'; // Registers window.refreshSaveUI
import { initAutoSave } from './SaveSystem.js';

window.initAutoSave = initAutoSave; // Optional: debug access

console.log("Initializing Game...");

loadAssets().then(() => {
    console.log("Assets loaded. Starting game.");
    initGame();
    initAutoSave(); // Start auto-save loop
    gameLoop();
}).catch(e => {
    console.error("Fatal error loading assets:", e);
});
