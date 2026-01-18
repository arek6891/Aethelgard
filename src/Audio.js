// Prosty system audio oparty na Web Audio API
// Nie wymaga zewnętrznych plików

let audioCtx = null;
let isMuted = false;

export function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playTone(freq, type, duration, vol = 0.1) {
    if (!audioCtx || isMuted) return;
    
    // Resume context if suspended (browser policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration, vol = 0.1) {
    if (!audioCtx || isMuted) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    noise.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
}

export const sfx = {
    attack: () => {
        // Krótki szum (uderzenie)
        playNoise(0.1, 0.2);
    },
    hit: () => {
        // Wyższy ton uderzenia
        playTone(150, 'sawtooth', 0.1, 0.1);
    },
    kill: () => {
        // Opadający ton
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    },
    loot: () => {
        // Wysoki dźwięk (coin)
        playTone(1200, 'sine', 0.1, 0.05);
        setTimeout(() => playTone(1600, 'sine', 0.2, 0.05), 50);
    },
    potion: () => {
        // Bulgotanie
        playTone(400, 'sine', 0.1, 0.1);
        setTimeout(() => playTone(500, 'sine', 0.1, 0.1), 100);
        setTimeout(() => playTone(300, 'sine', 0.2, 0.1), 200);
    },
    equip: () => {
        // Skrzypienie / metal
        playTone(100, 'square', 0.1, 0.05);
    },
    ui: () => {
        playTone(800, 'triangle', 0.05, 0.02);
    }
};

// Globalny dostęp do inicjalizacji (kliknięcie usera musi to odpalić raz)
window.initAudioContext = initAudio;
