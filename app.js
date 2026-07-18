// ==============================================================
// GLOBAL: AUDIO & NAVIGATION
// ==============================================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playTone(freq, type, duration, vol = 0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const sfx = {
    click: () => playTone(800, 'sine', 0.05, 0.05),
    flip: () => playTone(600, 'sine', 0.1, 0.05),
    match: () => {
        playTone(400, 'square', 0.1, 0.05);
        setTimeout(() => playTone(600, 'square', 0.15, 0.05), 100);
    },
    error: () => playTone(150, 'sawtooth', 0.3, 0.1),
    glitch: () => playTone(100, 'sawtooth', 0.1, 0.15),
    winLevel: () => {
        playTone(300, 'square', 0.1, 0.1);
        setTimeout(() => playTone(500, 'square', 0.1, 0.1), 100);
        setTimeout(() => playTone(700, 'square', 0.2, 0.1), 200);
    },
    gameOver: () => {
        playTone(200, 'sawtooth', 0.3, 0.1);
        setTimeout(() => playTone(150, 'sawtooth', 0.5, 0.1), 250);
    }
};

// Handle Navigation
let fwAnimFrame;
function openGame(gameId) {
    sfx.click();
    document.querySelectorAll('.screen').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    
    // Stop any active games
    if(memTimer) clearInterval(memTimer);
    if(glitchInterval) clearInterval(glitchInterval);
    if(logTimer) clearInterval(logTimer);
    if(typeof shtLoopId !== 'undefined' && shtLoopId) cancelAnimationFrame(shtLoopId);
    if(fwAnimFrame) cancelAnimationFrame(fwAnimFrame);
    if(typeof shtStarted !== 'undefined') shtStarted = false;
    
    document.getElementById(`screen-${gameId}`).classList.remove('hidden');
    document.getElementById(`screen-${gameId}`).classList.add('active');
}

// Global Glitch Effect
let glitchInterval = null;
function triggerRandomGlitch(logElement) {
    document.body.classList.add('screen-glitch');
    sfx.glitch();
    if(logElement) addTerminalLog(logElement, 'ANOMALY DETECTED IN VISUAL FEED!', 'warning');
    setTimeout(() => document.body.classList.remove('screen-glitch'), 200);
}

function addTerminalLog(logElement, msg, type = 'info') {
    const entry = document.createElement('div');
    entry.classList.add('log-entry', type);
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    entry.innerHTML = `[${timeStr}] > ${msg}`;
    logElement.appendChild(entry);
    logElement.scrollTop = logElement.scrollHeight;
}

// Flash text on screen center
function showFlashMessage(text, className) {
    const currentFlash = document.getElementById('flash-msg');
    currentFlash.innerText = text;
    currentFlash.className = `flash-msg ${className}`;
    const newFlash = currentFlash.cloneNode(true);
    newFlash.id = 'flash-msg';
    currentFlash.parentNode.replaceChild(newFlash, currentFlash);
}

// Initialize Audio Context Overlay
document.getElementById('btn-init-audio').addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    document.getElementById('init-audio-overlay').style.display = 'none';
    openGame('menu');
});


// ==============================================================
// MODULE 01: MEMORY BREACH
// ==============================================================
const SYMBOLS = [
    '<i class="fa-solid fa-microchip"></i>',
    '<i class="fa-solid fa-network-wired"></i>',
    '<i class="fa-solid fa-server"></i>',
    '<i class="fa-solid fa-satellite-dish"></i>',
    '<i class="fa-solid fa-shield-halved"></i>',
    '<i class="fa-solid fa-bug"></i>',
    '<i class="fa-solid fa-user-secret"></i>',
    '<i class="fa-solid fa-code-branch"></i>'
];

let memLevel = 1;
let memCards = [];
let memFlipped = [];
let memMatches = 0;
let memTimer = null;
let memTimeLeft = 60;
let memStarted = false;
let memLock = false;

function initMemoryGame() {
    sfx.click();
    const board = document.getElementById('mem-board');
    board.innerHTML = '';
    memFlipped = [];
    memMatches = 0;
    memTimeLeft = Math.max(20, 70 - (memLevel * 10)); 
    memLock = false;
    memStarted = true;
    
    document.getElementById('mem-level').innerText = memLevel;
    document.getElementById('mem-time').innerText = `${memTimeLeft}s`;
    document.getElementById('mem-time').style.color = 'var(--neon-magenta)';
    document.getElementById('mem-matches').innerText = `0 / 8`;
    
    document.getElementById('mem-overlay').classList.add('hidden');
    document.getElementById('mem-log').innerHTML = '';
    
    addTerminalLog(document.getElementById('mem-log'), `INITIATING LEVEL ${memLevel} BYPASS...`, 'warning');
    if (memLevel > 1) showFlashMessage(`LEVEL ${memLevel}`, 'show-level');

    let deck = [...SYMBOLS, ...SYMBOLS];
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    deck.forEach((sym, idx) => {
        const card = document.createElement('div');
        card.className = 'cyber-card';
        card.setAttribute('data-symbol', sym);
        card.innerHTML = `<div class="card-face card-front">${sym}</div><div class="card-face card-back"></div>`;
        card.onclick = function() {
            if (!memStarted || memLock || this.classList.contains('flipped') || this.classList.contains('matched')) return;
            sfx.flip();
            this.classList.add('flipped');
            memFlipped.push(this);
            addTerminalLog(document.getElementById('mem-log'), `READING SECTOR [${idx}]...`, 'info');
            if (memFlipped.length === 2) checkMemoryMatch();
        };
        board.appendChild(card);
    });

    clearInterval(memTimer);
    memTimer = setInterval(() => {
        memTimeLeft--;
        document.getElementById('mem-time').innerText = `${memTimeLeft}s`;
        if (memTimeLeft <= 10 && memTimeLeft > 0) {
            document.getElementById('mem-time').style.color = 'var(--neon-red)';
            addTerminalLog(document.getElementById('mem-log'), `WARNING: TRACE COMPLETING IN ${memTimeLeft}s!`, 'critical');
            sfx.flip();
        }
        if (memTimeLeft <= 0) endMemoryGame(false);
    }, 1000);
    
    clearInterval(glitchInterval);
    // Increase glitch frequency and chance based on level
    const glitchDelay = Math.max(2000, 8000 - (memLevel * 1000));
    const glitchChance = Math.min(0.9, 0.5 + (memLevel * 0.05));
    glitchInterval = setInterval(() => {
        if (Math.random() < glitchChance) triggerRandomGlitch(document.getElementById('mem-log'));
    }, glitchDelay);
}

function checkMemoryMatch() {
    memLock = true;
    const [c1, c2] = memFlipped;
    if (c1.getAttribute('data-symbol') === c2.getAttribute('data-symbol')) {
        memMatches++;
        document.getElementById('mem-matches').innerText = `${memMatches} / 8`;
        sfx.match();
        showFlashMessage('ACCESS GRANTED', 'show-match');
        addTerminalLog(document.getElementById('mem-log'), `DATA KEY VERIFIED.`, 'success');
        setTimeout(() => {
            c1.classList.add('matched'); c2.classList.add('matched');
            memFlipped = []; memLock = false;
            if (memMatches === 8) endMemoryGame(true);
        }, 500);
    } else {
        sfx.error();
        showFlashMessage('ACCESS DENIED', 'show-error');
        addTerminalLog(document.getElementById('mem-log'), `KEY MISMATCH.`, 'error');
        memTimeLeft = Math.max(0, memTimeLeft - 2);
        document.getElementById('mem-time').innerText = `${memTimeLeft}s`;
        document.body.classList.add('screen-glitch');
        setTimeout(() => document.body.classList.remove('screen-glitch'), 200);
        const hideDelay = Math.max(300, 1000 - (memLevel * 100));
        setTimeout(() => {
            c1.classList.remove('flipped'); c2.classList.remove('flipped');
            memFlipped = []; memLock = false;
        }, hideDelay);
    }
}

function endMemoryGame(win) {
    clearInterval(memTimer);
    clearInterval(glitchInterval);
    memStarted = false; memLock = true;
    document.getElementById('mem-overlay').classList.remove('hidden');
    
    const title = document.getElementById('mem-overlay-title');
    const msg = document.getElementById('mem-overlay-msg');
    const btn = document.getElementById('mem-start-btn');
    
    if (win) {
        sfx.winLevel();
        title.innerText = "MAINFRAME BYPASSED"; title.setAttribute('data-text', "MAINFRAME BYPASSED");
        title.style.color = "var(--neon-green)"; title.style.textShadow = "0 0 15px var(--neon-green)";
        msg.innerText = `Level ${memLevel} cleared! Sisa waktu: ${memTimeLeft}s.`;
        addTerminalLog(document.getElementById('mem-log'), `LEVEL ${memLevel} SECURED.`, 'success');
        btn.innerText = "[ NEXT_LEVEL.EXE ]";
        btn.onclick = () => { memLevel++; initMemoryGame(); };
    } else {
        sfx.gameOver();
        title.innerText = "SYSTEM TRACED"; title.setAttribute('data-text', "SYSTEM TRACED");
        title.style.color = "var(--neon-red)"; title.style.textShadow = "0 0 15px var(--neon-red)";
        msg.innerText = `Waktu habis. Koneksi terputus.`;
        addTerminalLog(document.getElementById('mem-log'), `CRITICAL: TRACED.`, 'error');
        btn.innerText = "[ REBOOT.EXE ]";
        btn.onclick = () => { memLevel = 1; initMemoryGame(); };
    }
}
document.getElementById('mem-start-btn').onclick = initMemoryGame;


// ==============================================================
// MODULE 02: LOGIC OVERRIDE
// ==============================================================
let logLevel = 1;
let logStage = 1;
let logTimeLeft = 60;
let logTimer = null;
let logStarted = false;
let currentLogic = { a: 0, b: 0, target: 0 };

const GATES = {
    'AND': (a,b) => (a && b) ? 1 : 0,
    'OR':  (a,b) => (a || b) ? 1 : 0,
    'XOR': (a,b) => (a !== b) ? 1 : 0,
    'NAND':(a,b) => !(a && b) ? 1 : 0,
    'NOR': (a,b) => !(a || b) ? 1 : 0
};

function generateLogicPuzzle() {
    let numGates = logLevel; // Dynamic length
    let inputs = Array.from({length: numGates + 1}, () => Math.random() > 0.5 ? 1 : 0);
    
    let gateKeys = Object.keys(GATES);
    let currentVal = inputs[0];
    
    for(let i=0; i<numGates; i++) {
        let randGate = gateKeys[Math.floor(Math.random() * gateKeys.length)];
        currentVal = GATES[randGate](currentVal, inputs[i+1]);
    }
    
    return { 
        inputs: inputs, 
        target: currentVal, 
        userGates: Array(numGates).fill(null),
        activeSlot: 0,
        numGates: numGates
    };
}

function initLogicGame() {
    sfx.click();
    logStage = 1;
    logTimeLeft = Math.max(20, 70 - (logLevel * 10));
    logStarted = true;
    
    document.getElementById('log-overlay').classList.add('hidden');
    document.getElementById('log-log').innerHTML = '';
    
    addTerminalLog(document.getElementById('log-log'), `INITIATING LOGIC OVERRIDE PROTOCOL...`, 'warning');
    
    clearInterval(logTimer);
    logTimer = setInterval(() => {
        logTimeLeft--;
        document.getElementById('log-time').innerText = `${logTimeLeft}s`;
        if (logTimeLeft <= 10 && logTimeLeft > 0) {
            document.getElementById('log-time').style.color = 'var(--neon-red)';
            addTerminalLog(document.getElementById('log-log'), `WARNING: POWER DEPLETING IN ${logTimeLeft}s!`, 'critical');
            sfx.flip();
        }
        if (logTimeLeft <= 0) endLogicGame(false);
    }, 1000);
    
    loadLogicStage();
}

function loadLogicStage() {
    const maxStages = 4 + logLevel;
    document.getElementById('log-stage').innerText = `${logStage}/${maxStages}`;
    document.getElementById('log-time').style.color = 'var(--neon-magenta)';
    
    currentLogic = generateLogicPuzzle();
    renderLinearCircuit();
    
    if (logLevel >= 3) {
        setTimeout(() => {
            if(!logStarted) return;
            document.querySelectorAll('.input-val').forEach(el => {
                el.innerText = '?'; 
                el.className = 'logic-node input-val';
            });
            sfx.glitch();
            addTerminalLog(document.getElementById('log-log'), `INPUT SCRAMBLED BY FIREWALL!`, 'warning');
        }, Math.max(500, 2500 - (logLevel * 300)));
    }
    
    addTerminalLog(document.getElementById('log-log'), `STAGE ${logStage}: ANALYZING MULTI-GATE CIRCUIT...`, 'info');
}

function renderLinearCircuit() {
    const container = document.getElementById('dynamic-circuit-container');
    container.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'linear-circuit';
    
    // Initial Input
    wrapper.innerHTML += `<div class="logic-node input-val active-${currentLogic.inputs[0]}">${currentLogic.inputs[0]}</div>`;
    
    for (let i = 0; i < currentLogic.numGates; i++) {
        // Gate slot
        const slot = document.createElement('div');
        slot.className = `gate-slot ${i === currentLogic.activeSlot ? 'active-slot' : ''} ${currentLogic.userGates[i] ? 'filled' : ''}`;
        slot.innerText = currentLogic.userGates[i] ? currentLogic.userGates[i] : '[ ? ]';
        slot.onclick = () => {
            currentLogic.activeSlot = i;
            renderLinearCircuit(); // re-render to update active styling
            sfx.click();
        };
        wrapper.appendChild(slot);
        
        // Next Input
        wrapper.innerHTML += `<div class="logic-node input-val active-${currentLogic.inputs[i+1]}">${currentLogic.inputs[i+1]}</div>`;
        
        // Arrow (if not the last input before target)
        wrapper.innerHTML += `<i class="fa-solid fa-arrow-right wire-arrow"></i>`;
    }
    
    // Target
    wrapper.innerHTML += `<div class="logic-node output-node active-${currentLogic.target}">T: ${currentLogic.target}</div>`;
    container.appendChild(wrapper);
}

// Gate Selection Event
document.querySelectorAll('.gate-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        if (!logStarted) return;
        const selectedGate = this.getAttribute('data-gate');
        
        // Assign gate to active slot
        currentLogic.userGates[currentLogic.activeSlot] = selectedGate;
        sfx.click();
        
        // Find next empty slot
        let nextEmpty = currentLogic.userGates.indexOf(null);
        if (nextEmpty !== -1) {
            currentLogic.activeSlot = nextEmpty;
            renderLinearCircuit();
            return;
        }
        
        // All slots filled, evaluate circuit
        renderLinearCircuit();
        let val = currentLogic.inputs[0];
        for(let i=0; i<currentLogic.numGates; i++) {
            val = GATES[currentLogic.userGates[i]](val, currentLogic.inputs[i+1]);
        }
        
        if (val === currentLogic.target) {
            // Success
            sfx.match();
            showFlashMessage('CIRCUIT COMPLETE', 'show-match');
            addTerminalLog(document.getElementById('log-log'), `LOGIC ACCEPTED. ROUTING POWER...`, 'success');
            
            setTimeout(() => {
                const maxStages = 4 + logLevel;
                if (logStage >= maxStages) {
                    endLogicGame(true);
                } else {
                    logStage++;
                    loadLogicStage();
                }
            }, 1000);
            
        } else {
            // Fail
            sfx.error();
            showFlashMessage('SHORT CIRCUIT', 'show-error');
            addTerminalLog(document.getElementById('log-log'), `LOGIC FAILED. OUTPUT IS ${val}.`, 'error');
            
            logTimeLeft = Math.max(0, logTimeLeft - 5); // 5s penalty
            document.getElementById('log-time').innerText = `${logTimeLeft}s`;
            
            document.body.classList.add('screen-glitch');
            setTimeout(() => document.body.classList.remove('screen-glitch'), 200);
            
            setTimeout(() => {
                currentLogic.userGates.fill(null);
                currentLogic.activeSlot = 0;
                renderLinearCircuit();
            }, 600);
        }
    });
});

function endLogicGame(win) {
    clearInterval(logTimer);
    logStarted = false;
    document.getElementById('log-overlay').classList.remove('hidden');
    
    const title = document.getElementById('log-overlay-title');
    const msg = document.getElementById('log-overlay-msg');
    const btn = document.getElementById('log-start-btn');
    
    if (win) {
        sfx.winLevel();
        title.innerText = "OVERRIDE SUCCESS"; title.setAttribute('data-text', "OVERRIDE SUCCESS");
        title.style.color = "var(--neon-green)"; title.style.textShadow = "0 0 15px var(--neon-green)";
        msg.innerText = `Sirkuit Level ${logLevel} berhasil diretas! Sisa waktu: ${logTimeLeft}s. Bersiap menuju layer keamanan berikutnya.`;
        addTerminalLog(document.getElementById('log-log'), `LEVEL ${logLevel} CIRCUITS BRIDGED.`, 'success');
        btn.innerText = "[ NEXT_LEVEL.EXE ]";
        btn.onclick = () => { logLevel++; initLogicGame(); };
    } else {
        sfx.gameOver();
        title.innerText = "CIRCUIT FRIED"; title.setAttribute('data-text', "CIRCUIT FRIED");
        title.style.color = "var(--neon-red)"; title.style.textShadow = "0 0 15px var(--neon-red)";
        msg.innerText = `Sistem kehabisan tenaga di Level ${logLevel}. Firewall telah menggagalkan peretasan.`;
        addTerminalLog(document.getElementById('log-log'), `CRITICAL: POWER FAILURE.`, 'error');
        btn.innerText = "[ REBOOT_CIRCUIT.EXE ]";
        btn.onclick = () => { logLevel = 1; initLogicGame(); };
    }
}

document.getElementById('log-start-btn').onclick = initLogicGame;

// ==============================================================
// MODULE 03: VIRUS PURGE
// ==============================================================
sfx.shoot = () => playTone(1200, 'square', 0.05, 0.03);
sfx.explode = () => playTone(150, 'sawtooth', 0.15, 0.1);

const shtCanvas = document.getElementById('sht-canvas');
const shtCtx = shtCanvas.getContext('2d');

let shtLevel = 1;
let shtScore = 0;
let shtLives = 3;
let shtStarted = false;
let shtLoopId = null;

let shtShip = { x: 0, y: 0, w: 30, h: 30, speed: 5, dx: 0 };
let shtBullets = [];
let shtViruses = [];
let shtParticles = [];
let shtPowerUps = [];
let shtKeys = {};
let shtWeaponLevel = 1;

// Handle Input
window.addEventListener('keydown', (e) => {
    shtKeys[e.code] = true;
    if (shtStarted && e.code === 'Space') {
        e.preventDefault(); // Mencegah tombol Start tertekan lagi secara tidak sengaja oleh Spasi
        
        if (shtWeaponLevel === 1) {
            shtBullets.push({ x: shtShip.x, y: shtShip.y - 15, w: 4, h: 10, speed: 10, dx: 0 });
        } else if (shtWeaponLevel === 2) {
            shtBullets.push({ x: shtShip.x - 8, y: shtShip.y - 15, w: 4, h: 10, speed: 10, dx: 0 });
            shtBullets.push({ x: shtShip.x + 8, y: shtShip.y - 15, w: 4, h: 10, speed: 10, dx: 0 });
        } else {
            shtBullets.push({ x: shtShip.x - 12, y: shtShip.y - 10, w: 4, h: 10, speed: 10, dx: -2 });
            shtBullets.push({ x: shtShip.x, y: shtShip.y - 15, w: 4, h: 10, speed: 10, dx: 0 });
            shtBullets.push({ x: shtShip.x + 12, y: shtShip.y - 10, w: 4, h: 10, speed: 10, dx: 2 });
        }
        
        sfx.shoot();
    }
});
window.addEventListener('keyup', (e) => {
    shtKeys[e.code] = false;
});

function initShooterGame() {
    if (document.activeElement) document.activeElement.blur();
    sfx.click();
    shtCanvas.width = document.querySelector('.shooter-board').clientWidth;
    shtCanvas.height = document.querySelector('.shooter-board').clientHeight;
    
    shtLevel = 1;
    shtScore = 0;
    shtLives = 3;
    shtStarted = true;
    shtBullets = [];
    shtViruses = [];
    shtParticles = [];
    shtPowerUps = [];
    shtWeaponLevel = 1;
    
    shtShip.x = shtCanvas.width / 2;
    shtShip.y = shtCanvas.height - 40;
    
    document.getElementById('sht-level').innerText = shtLevel;
    document.getElementById('sht-score').innerText = shtScore;
    document.getElementById('sht-lives').innerText = shtLives;
    
    document.getElementById('sht-overlay').classList.add('hidden');
    document.getElementById('sht-log').innerHTML = '';
    
    addTerminalLog(document.getElementById('sht-log'), 'DEFENSE SYSTEM ENGAGED.', 'success');
    
    if(shtLoopId) cancelAnimationFrame(shtLoopId);
    shtLoopId = requestAnimationFrame(shooterLoop);
}

function spawnVirus() {
    if (Math.random() < 0.02 + (shtLevel * 0.005)) {
        let types = ['VIRUS', 'WORM', 'TROJAN'];
        let t = types[Math.floor(Math.random() * types.length)];
        
        let hp = 1;
        let speed = 1 + (shtLevel * 0.5);
        if (t === 'WORM') speed *= 1.3;
        if (t === 'TROJAN') { speed *= 0.6; hp = 2; }
        
        shtViruses.push({
            x: Math.random() * (shtCanvas.width - 40) + 20,
            y: -20,
            r: 15,
            speed: speed,
            wobble: Math.random() * Math.PI * 2,
            type: t,
            hp: hp
        });
    }
}

function drawShip() {
    shtCtx.fillStyle = '#00f3ff';
    shtCtx.shadowBlur = 15;
    shtCtx.shadowColor = '#00f3ff';
    
    // Draw Sleek Fighter
    shtCtx.beginPath();
    shtCtx.moveTo(shtShip.x, shtShip.y - 20); // Nose
    shtCtx.lineTo(shtShip.x + 15, shtShip.y + 10); // Right Wing
    shtCtx.lineTo(shtShip.x + 8, shtShip.y + 15); // Right Engine
    shtCtx.lineTo(shtShip.x, shtShip.y + 5); // Center Bottom
    shtCtx.lineTo(shtShip.x - 8, shtShip.y + 15); // Left Engine
    shtCtx.lineTo(shtShip.x - 15, shtShip.y + 10); // Left Wing
    shtCtx.closePath();
    shtCtx.fill();
    
    // Core Cockpit
    shtCtx.fillStyle = '#ffffff';
    shtCtx.shadowColor = '#ffffff';
    shtCtx.beginPath();
    shtCtx.moveTo(shtShip.x, shtShip.y - 5);
    shtCtx.lineTo(shtShip.x + 4, shtShip.y + 2);
    shtCtx.lineTo(shtShip.x - 4, shtShip.y + 2);
    shtCtx.closePath();
    shtCtx.fill();
    
    shtCtx.shadowBlur = 0;
}

function createExplosion(x, y, color) {
    sfx.explode();
    for(let i=0; i<15; i++) {
        shtParticles.push({
            x: x, y: y,
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6,
            life: 30,
            color: color
        });
    }
}

function updateShooter() {
    // Ship movement
    if (shtKeys['ArrowLeft'] || shtKeys['KeyA']) shtShip.x -= shtShip.speed;
    if (shtKeys['ArrowRight'] || shtKeys['KeyD']) shtShip.x += shtShip.speed;
    if (shtShip.x < 15) shtShip.x = 15;
    if (shtShip.x > shtCanvas.width - 15) shtShip.x = shtCanvas.width - 15;
    
    spawnVirus();
    
    // Bullets
    for (let i = shtBullets.length - 1; i >= 0; i--) {
        let b = shtBullets[i];
        b.y -= b.speed;
        b.x += b.dx;
        if (b.y < -10 || b.x < -10 || b.x > shtCanvas.width + 10) shtBullets.splice(i, 1);
    }
    
    // Viruses
    for (let i = shtViruses.length - 1; i >= 0; i--) {
        let v = shtViruses[i];
        v.y += v.speed;
        v.x += Math.sin(v.wobble) * (v.type === 'WORM' ? 4 : 2);
        v.wobble += (v.type === 'WORM' ? 0.15 : 0.05);
        
        // Hit Ship?
        let dist = Math.hypot(shtShip.x - v.x, shtShip.y - v.y);
        if (dist < 20) {
            shtViruses.splice(i, 1);
            createExplosion(shtShip.x, shtShip.y, '#ff0055');
            shtLives--;
            document.getElementById('sht-lives').innerText = shtLives;
            addTerminalLog(document.getElementById('sht-log'), 'WARNING: SYSTEM INTEGRITY COMPROMISED!', 'error');
            document.body.classList.add('screen-glitch');
            setTimeout(() => document.body.classList.remove('screen-glitch'), 200);
            
            if (shtLives <= 0) {
                endShooterGame(false);
                return;
            }
        }
        else if (v.y > shtCanvas.height + 20) {
            shtViruses.splice(i, 1);
        }
    }
    
    // Collisions
    for (let i = shtBullets.length - 1; i >= 0; i--) {
        let b = shtBullets[i];
        let hit = false;
        for (let j = shtViruses.length - 1; j >= 0; j--) {
            let v = shtViruses[j];
            let hitRadius = (v.type === 'TROJAN') ? v.r * 1.5 : v.r;
            if (b.x > v.x - hitRadius && b.x < v.x + hitRadius && b.y > v.y - hitRadius && b.y < v.y + hitRadius) {
                createExplosion(b.x, b.y, v.type === 'TROJAN' ? '#9900ff' : '#ff00ff');
                hit = true;
                v.hp--;
                
                if (v.hp <= 0) {
                    shtViruses.splice(j, 1);
                    shtScore += (v.type === 'TROJAN' ? 20 : 10);
                    document.getElementById('sht-score').innerText = shtScore;
                    
                    let newLevel = Math.floor(shtScore / 200) + 1;
                    if (newLevel > shtLevel) {
                        shtLevel = newLevel;
                        document.getElementById('sht-level').innerText = shtLevel;
                        sfx.winLevel();
                        addTerminalLog(document.getElementById('sht-log'), `MALWARE MUTATED. LEVEL ${shtLevel} REACHED.`, 'warning');
                    }
                    
                    // Drop power-up (8% chance)
                    if (Math.random() < 0.08) {
                        shtPowerUps.push({
                            x: v.x,
                            y: v.y,
                            type: Math.random() > 0.5 ? 'HEAL' : 'UPGRADE',
                            w: 15, h: 15,
                            speed: 2
                        });
                    }
                }
                break;
            }
        }
        if (hit) shtBullets.splice(i, 1);
    }
    
    // Powerups
    for (let i = shtPowerUps.length - 1; i >= 0; i--) {
        let p = shtPowerUps[i];
        p.y += p.speed;
        
        let dist = Math.hypot(shtShip.x - p.x, shtShip.y - p.y);
        if (dist < 25) {
            sfx.match();
            if (p.type === 'HEAL') {
                shtLives++;
                document.getElementById('sht-lives').innerText = shtLives;
                addTerminalLog(document.getElementById('sht-log'), 'INTEGRITY RESTORED.', 'success');
            } else if (p.type === 'UPGRADE') {
                shtWeaponLevel++;
                addTerminalLog(document.getElementById('sht-log'), 'WEAPON UPGRADED!', 'success');
            }
            shtPowerUps.splice(i, 1);
        } else if (p.y > shtCanvas.height + 20) {
            shtPowerUps.splice(i, 1);
        }
    }
    
    // Particles
    for (let i = shtParticles.length - 1; i >= 0; i--) {
        let p = shtParticles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        if (p.life <= 0) shtParticles.splice(i, 1);
    }
}

function drawShooter() {
    shtCtx.clearRect(0, 0, shtCanvas.width, shtCanvas.height);
    
    drawShip();
    
    // Draw Bullets
    shtCtx.fillStyle = '#f3ff00';
    shtCtx.shadowBlur = 10;
    shtCtx.shadowColor = '#f3ff00';
    for (let b of shtBullets) {
        shtCtx.fillRect(b.x - b.w/2, b.y, b.w, b.h);
    }
    shtCtx.shadowBlur = 0;
    
    // Draw Viruses (Various Malware Types)
    for (let v of shtViruses) {
        if (v.type === 'VIRUS') {
            shtCtx.strokeStyle = '#ff00ff';
            shtCtx.shadowBlur = 12;
            shtCtx.shadowColor = '#ff00ff';
            shtCtx.lineWidth = 2;
            
            let numSpikes = 8;
            for(let i = 0; i < numSpikes; i++) {
                let a = v.wobble + (i * Math.PI * 2 / numSpikes);
                let outerX = v.x + Math.cos(a) * (v.r * 1.2);
                let outerY = v.y + Math.sin(a) * (v.r * 1.2);
                shtCtx.beginPath();
                shtCtx.moveTo(v.x, v.y);
                shtCtx.lineTo(outerX, outerY);
                shtCtx.stroke();
                
                shtCtx.fillStyle = '#ff00ff';
                shtCtx.beginPath();
                shtCtx.arc(outerX, outerY, 3, 0, Math.PI*2);
                shtCtx.fill();
            }
            
            shtCtx.fillStyle = '#220022';
            shtCtx.strokeStyle = '#ff0055';
            shtCtx.lineWidth = 3;
            shtCtx.beginPath();
            shtCtx.arc(v.x, v.y, v.r * 0.7, 0, Math.PI*2);
            shtCtx.fill();
            shtCtx.stroke();
            
            shtCtx.fillStyle = '#ff0055';
            shtCtx.shadowColor = '#ff0055';
            shtCtx.beginPath();
            let pulse = Math.abs(Math.sin(v.wobble * 3)) * 3;
            shtCtx.arc(v.x, v.y, 2 + pulse, 0, Math.PI*2);
            shtCtx.fill();
        } 
        else if (v.type === 'WORM') {
            shtCtx.shadowBlur = 10;
            shtCtx.shadowColor = '#ff6600';
            for (let s = 0; s < 3; s++) {
                let offsetA = v.wobble - (s * 0.5);
                let sx = v.x + Math.sin(offsetA) * 15 * s;
                let sy = v.y - (s * 12);
                
                shtCtx.fillStyle = '#221100';
                shtCtx.strokeStyle = '#ff6600';
                shtCtx.lineWidth = 2;
                shtCtx.beginPath();
                shtCtx.arc(sx, sy, v.r - (s * 3), 0, Math.PI*2);
                shtCtx.fill();
                shtCtx.stroke();
                
                shtCtx.fillStyle = '#ffff00';
                shtCtx.shadowColor = '#ffff00';
                shtCtx.beginPath();
                shtCtx.arc(sx, sy, 3, 0, Math.PI*2);
                shtCtx.fill();
            }
        }
        else if (v.type === 'TROJAN') {
            shtCtx.fillStyle = '#110022';
            shtCtx.strokeStyle = '#9900ff';
            shtCtx.shadowBlur = 15;
            shtCtx.shadowColor = '#9900ff';
            shtCtx.lineWidth = 3;
            
            shtCtx.beginPath();
            shtCtx.moveTo(v.x, v.y - v.r * 1.5);
            shtCtx.lineTo(v.x + v.r * 1.2, v.y);
            shtCtx.lineTo(v.x, v.y + v.r * 1.5);
            shtCtx.lineTo(v.x - v.r * 1.2, v.y);
            shtCtx.closePath();
            shtCtx.fill();
            shtCtx.stroke();
            
            shtCtx.fillStyle = v.hp === 2 ? '#00f3ff' : '#ff0000';
            shtCtx.shadowColor = shtCtx.fillStyle;
            shtCtx.beginPath();
            shtCtx.moveTo(v.x - 5, v.y);
            shtCtx.lineTo(v.x, v.y - 8);
            shtCtx.lineTo(v.x + 5, v.y);
            shtCtx.lineTo(v.x, v.y + 8);
            shtCtx.closePath();
            shtCtx.fill();
        }
    }
    shtCtx.shadowBlur = 0;
    
    // Draw Powerups
    for (let p of shtPowerUps) {
        shtCtx.shadowBlur = 10;
        if (p.type === 'HEAL') {
            shtCtx.fillStyle = '#00ff66';
            shtCtx.shadowColor = '#00ff66';
            shtCtx.fillRect(p.x - p.w/2, p.y - p.h/2, p.w, p.h);
            shtCtx.fillStyle = '#000';
            shtCtx.font = '14px "Share Tech Mono"';
            shtCtx.fillText('+', p.x - 4, p.y + 4);
        } else {
            shtCtx.fillStyle = '#00f3ff';
            shtCtx.shadowColor = '#00f3ff';
            shtCtx.beginPath();
            shtCtx.moveTo(p.x, p.y - p.h/2);
            shtCtx.lineTo(p.x + p.w/2, p.y + p.h/2);
            shtCtx.lineTo(p.x - p.w/2, p.y + p.h/2);
            shtCtx.closePath();
            shtCtx.fill();
        }
    }
    shtCtx.shadowBlur = 0;
    
    // Draw Particles
    for (let p of shtParticles) {
        shtCtx.fillStyle = p.color;
        shtCtx.globalAlpha = p.life / 30;
        shtCtx.beginPath();
        shtCtx.arc(p.x, p.y, 2, 0, Math.PI*2);
        shtCtx.fill();
    }
    shtCtx.globalAlpha = 1;
}

function shooterLoop() {
    if (!shtStarted) return;
    updateShooter();
    drawShooter();
    shtLoopId = requestAnimationFrame(shooterLoop);
}

function endShooterGame(win) {
    shtStarted = false;
    document.getElementById('sht-overlay').classList.remove('hidden');
    
    const title = document.getElementById('sht-overlay-title');
    const msg = document.getElementById('sht-overlay-msg');
    const btn = document.getElementById('sht-start-btn');
    
    sfx.gameOver();
    title.innerText = "SYSTEM CORRUPTED"; title.setAttribute('data-text', "SYSTEM CORRUPTED");
    title.style.color = "var(--neon-red)"; title.style.textShadow = "0 0 15px var(--neon-red)";
    msg.innerText = `Malware berhasil menembus pertahanan. Skor Akhir: ${shtScore} (Level ${shtLevel}).`;
    addTerminalLog(document.getElementById('sht-log'), `CRITICAL: DEFENSE FAILED.`, 'error');
    btn.innerText = "[ REBOOT_DEFENSE.EXE ]";
    btn.onclick = initShooterGame;
}

document.getElementById('sht-start-btn').onclick = initShooterGame;

// ==============================================================
// MODULE 04: DATABANK HEIST
// ==============================================================
let vltLevel = 1;
let vltPin = "";
let vltAttempts = 5;
let vltCurrentGuess = "";
let vltPinLength = 3;

function generateNumpad() {
    const pad = document.getElementById('vlt-numpad');
    pad.innerHTML = '';
    
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = 'hack-btn';
        btn.innerText = i;
        btn.onclick = () => vltType(i.toString());
        pad.appendChild(btn);
    }
    
    const btnDel = document.createElement('button');
    btnDel.className = 'hack-btn';
    btnDel.innerText = 'DEL';
    btnDel.style.color = 'var(--neon-red)';
    btnDel.onclick = vltDel;
    pad.appendChild(btnDel);
    
    const btn0 = document.createElement('button');
    btn0.className = 'hack-btn';
    btn0.innerText = '0';
    btn0.onclick = () => vltType('0');
    pad.appendChild(btn0);
    
    const btnEnter = document.createElement('button');
    btnEnter.className = 'hack-btn';
    btnEnter.innerText = 'ENT';
    btnEnter.style.color = 'var(--neon-green)';
    btnEnter.onclick = vltSubmit;
    pad.appendChild(btnEnter);
}

function vltType(num) {
    if (vltCurrentGuess.length < vltPinLength) {
        vltCurrentGuess += num;
        document.getElementById('vlt-current-guess').innerText = vltCurrentGuess;
        sfx.click();
    }
}

function vltDel() {
    if (vltCurrentGuess.length > 0) {
        vltCurrentGuess = vltCurrentGuess.slice(0, -1);
        document.getElementById('vlt-current-guess').innerText = vltCurrentGuess;
        sfx.click();
    }
}

function generateVaultPin() {
    vltPinLength = 2 + vltLevel; // Lvl 1 -> 3, Lvl 2 -> 4, dll
    vltPin = "";
    for (let i=0; i<vltPinLength; i++) {
        vltPin += Math.floor(Math.random() * 10).toString();
    }
}

function initVaultGame() {
    if(document.activeElement) document.activeElement.blur();
    sfx.click();
    
    document.getElementById('vlt-overlay').classList.add('hidden');
    document.getElementById('vlt-log').innerHTML = '';
    
    vltLevel = 1;
    document.getElementById('vlt-level').innerText = vltLevel;
    
    startVaultLevel();
}

function startVaultLevel() {
    vltAttempts = 4 + vltLevel;
    document.getElementById('vlt-attempts').innerText = vltAttempts;
    document.getElementById('vlt-history').innerHTML = '';
    vltCurrentGuess = "";
    document.getElementById('vlt-current-guess').innerText = vltCurrentGuess;
    
    generateVaultPin();
    generateNumpad();
    
    addTerminalLog(document.getElementById('vlt-log'), `INITIATING BRUTE FORCE ON TIER ${vltLevel} DATABANK...`, 'warning');
    addTerminalLog(document.getElementById('vlt-log'), `PIN LENGTH: ${vltPinLength} DIGITS.`, 'info');
}

function vltSubmit() {
    if (vltCurrentGuess.length !== vltPinLength) {
        showFlashMessage('INCOMPLETE PIN', 'show-error');
        sfx.error();
        return;
    }
    
    // Evaluasi Guess
    let targetArr = vltPin.split('');
    let guessArr = vltCurrentGuess.split('');
    let result = new Array(vltPinLength).fill('red');
    
    // Cek hijau (Tepat angka dan posisi)
    for (let i=0; i<vltPinLength; i++) {
        if (guessArr[i] === targetArr[i]) {
            result[i] = 'green';
            targetArr[i] = null; // Tandai sudah dipakai
            guessArr[i] = null;
        }
    }
    
    // Cek kuning (Angka ada tapi posisi salah)
    for (let i=0; i<vltPinLength; i++) {
        if (guessArr[i] !== null) {
            let idx = targetArr.indexOf(guessArr[i]);
            if (idx !== -1) {
                result[i] = 'yellow';
                targetArr[idx] = null;
            }
        }
    }
    
    // Render History
    const entry = document.createElement('div');
    entry.style.display = 'flex';
    entry.style.justifyContent = 'center';
    entry.style.gap = '0.5rem';
    
    let isWin = true;
    for (let i=0; i<vltPinLength; i++) {
        const span = document.createElement('span');
        span.innerText = vltCurrentGuess[i];
        span.style.padding = '0.5rem 1rem';
        span.style.border = '1px solid';
        span.style.fontWeight = 'bold';
        
        if (result[i] === 'green') {
            span.style.color = 'var(--neon-green)';
            span.style.borderColor = 'var(--neon-green)';
        } else if (result[i] === 'yellow') {
            span.style.color = 'var(--neon-yellow)';
            span.style.borderColor = 'var(--neon-yellow)';
            isWin = false;
        } else {
            span.style.color = 'var(--neon-red)';
            span.style.borderColor = 'var(--neon-red)';
            isWin = false;
        }
        entry.appendChild(span);
    }
    
    document.getElementById('vlt-history').appendChild(entry);
    document.getElementById('vlt-history').scrollTop = document.getElementById('vlt-history').scrollHeight;
    
    vltCurrentGuess = "";
    document.getElementById('vlt-current-guess').innerText = vltCurrentGuess;
    
    if (isWin) {
        sfx.match();
        sfx.winLevel();
        addTerminalLog(document.getElementById('vlt-log'), `DATABANK TIER ${vltLevel} CRACKED.`, 'success');
        showFlashMessage('ACCESS GRANTED', 'show-match');
        
        setTimeout(() => {
            vltLevel++;
            document.getElementById('vlt-level').innerText = vltLevel;
            startVaultLevel();
        }, 2000);
    } else {
        sfx.error();
        vltAttempts--;
        document.getElementById('vlt-attempts').innerText = vltAttempts;
        
        if (vltAttempts <= 0) {
            endVaultGame(false);
        } else {
            document.body.classList.add('screen-glitch');
            setTimeout(() => document.body.classList.remove('screen-glitch'), 200);
            addTerminalLog(document.getElementById('vlt-log'), `PIN INCORRECT. ${vltAttempts} ATTEMPTS REMAINING.`, 'error');
        }
    }
}

function endVaultGame(win) {
    document.getElementById('vlt-overlay').classList.remove('hidden');
    
    const title = document.getElementById('vlt-overlay-title');
    const msg = document.getElementById('vlt-overlay-msg');
    const btn = document.getElementById('vlt-start-btn');
    
    sfx.gameOver();
    title.innerText = "SECURITY LOCKDOWN"; title.setAttribute('data-text', "SECURITY LOCKDOWN");
    title.style.color = "var(--neon-red)"; title.style.textShadow = "0 0 15px var(--neon-red)";
    msg.innerText = `Sistem mengunci brankas! Anda kehabisan percobaan.\nPIN yang benar adalah: ${vltPin}`;
    addTerminalLog(document.getElementById('vlt-log'), `CRITICAL: SECURITY LOCKDOWN INITIATED.`, 'error');
    btn.innerText = "[ RETRY_HACK.EXE ]";
    btn.onclick = initVaultGame;
}

document.getElementById('vlt-start-btn').onclick = initVaultGame;

// Handle Keyboard Input for Vault
window.addEventListener('keydown', (e) => {
    // Only process if Vault screen is active and not on overlay
    const vaultScreen = document.getElementById('screen-vault');
    const overlay = document.getElementById('vlt-overlay');
    if (vaultScreen && vaultScreen.classList.contains('active') && overlay && overlay.classList.contains('hidden')) {
        if (e.key >= '0' && e.key <= '9') {
            vltType(e.key);
        } else if (e.key === 'Backspace') {
            vltDel();
        } else if (e.key === 'Enter') {
            vltSubmit();
        }
    }
});

// ==============================================================
// MODULE 05: FIREWALL BREACH
// ==============================================================
const fwWordsList = [
    "root", "admin", "sudo", "hack", "bypass", "proxy", "server", "ping", "null", "void",
    "botnet", "malware", "virus", "trojan", "worm", "phishing", "exploit", "payload",
    "decrypt", "encrypt", "hash", "cipher", "token", "socket", "port", "ipconfig",
    "nmap", "ssh", "ftp", "http", "https", "tcp", "udp", "packet", "firewall",
    "kernel", "shell", "bash", "linux", "unix", "windows", "mac", "system", "data",
    "cyber", "punk", "neon", "matrix", "grid", "node", "link", "network", "router",
    "switch", "hub", "bridge", "gateway", "dns", "dhcp", "arp", "icmp", "snmp"
];

let fwLevel = 1;
let fwIntegrity = 100;
let fwScore = 0;
let fwWords = []; 
let fwTyped = "";
let fwCanvas, fwCtx;
let fwStarted = false;
let fwLastSpawn = 0;

function initFirewallGame() {
    if(document.activeElement) document.activeElement.blur();
    sfx.click();
    
    fwCanvas = document.getElementById('fw-canvas');
    fwCtx = fwCanvas.getContext('2d');
    
    // Resize canvas
    let rect = fwCanvas.parentElement.getBoundingClientRect();
    fwCanvas.width = rect.width;
    fwCanvas.height = rect.height;
    
    document.getElementById('fw-overlay').classList.add('hidden');
    
    fwLevel = 1;
    fwIntegrity = 100;
    fwScore = 0;
    fwWords = [];
    fwTyped = "";
    fwStarted = true;
    fwLastSpawn = performance.now();
    
    document.getElementById('fw-level').innerText = fwLevel;
    document.getElementById('fw-lives').innerText = fwIntegrity + "%";
    document.getElementById('fw-typed').innerText = "_";
    
    if (fwAnimFrame) cancelAnimationFrame(fwAnimFrame);
    fwAnimFrame = requestAnimationFrame(loopFirewall);
}

function spawnFwWord() {
    let word = fwWordsList[Math.floor(Math.random() * fwWordsList.length)];
    // Coba hindari huruf awal yang sama
    let tries = 0;
    while(fwWords.some(w => w.text.startsWith(word[0])) && tries < 10) {
        word = fwWordsList[Math.floor(Math.random() * fwWordsList.length)];
        tries++;
    }
    
    fwCtx.font = 'bold 22px "Share Tech Mono"';
    let width = fwCtx.measureText(word).width;
    let x = Math.random() * (fwCanvas.width - width - 40) + 20;
    
    let speed = 0.5 + (fwLevel * 0.2);
    let color = fwLevel > 3 ? (Math.random() > 0.5 ? '#ff00ea' : '#00f3ff') : '#00ff41';
    
    fwWords.push({
        text: word,
        x: x,
        y: -30,
        speed: speed,
        color: color
    });
}

function loopFirewall(timestamp) {
    if (!fwStarted) return;
    
    fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
    
    // Spawn logic
    let spawnRate = Math.max(800, 2500 - (fwLevel * 200)); 
    if (timestamp - fwLastSpawn > spawnRate) {
        spawnFwWord();
        fwLastSpawn = timestamp;
    }
    
    fwCtx.font = 'bold 22px "Share Tech Mono"';
    fwCtx.textBaseline = 'top';
    
    for (let i = fwWords.length - 1; i >= 0; i--) {
        let w = fwWords[i];
        w.y += w.speed;
        
        if (w.y > fwCanvas.height - 30) {
            fwIntegrity -= 10;
            document.getElementById('fw-lives').innerText = fwIntegrity + "%";
            sfx.error();
            document.body.classList.add('screen-glitch');
            setTimeout(() => document.body.classList.remove('screen-glitch'), 200);
            
            fwWords.splice(i, 1);
            
            if (fwTyped.length > 0 && w.text.startsWith(fwTyped)) {
                fwTyped = "";
                document.getElementById('fw-typed').innerText = "_";
            }
            
            if (fwIntegrity <= 0) {
                endFirewallGame();
                return; // Stop rendering this frame
            }
            continue;
        }
        
        let isTarget = fwTyped.length > 0 && w.text.startsWith(fwTyped);
        
        if (isTarget) {
            let typedWidth = fwCtx.measureText(fwTyped).width;
            
            fwCtx.fillStyle = '#ffeb3b';
            fwCtx.shadowBlur = 10;
            fwCtx.shadowColor = '#ffeb3b';
            fwCtx.fillText(fwTyped, w.x, w.y);
            
            fwCtx.fillStyle = w.color;
            fwCtx.shadowBlur = 0;
            fwCtx.fillText(w.text.substring(fwTyped.length), w.x + typedWidth, w.y);
            
            fwCtx.strokeStyle = '#ffeb3b';
            fwCtx.lineWidth = 2;
            fwCtx.strokeRect(w.x - 6, w.y - 4, fwCtx.measureText(w.text).width + 12, 30);
        } else {
            fwCtx.fillStyle = w.color;
            fwCtx.shadowBlur = 10;
            fwCtx.shadowColor = w.color;
            fwCtx.fillText(w.text, w.x, w.y);
            fwCtx.shadowBlur = 0;
        }
    }
    
    fwAnimFrame = requestAnimationFrame(loopFirewall);
}

function endFirewallGame() {
    fwStarted = false;
    document.getElementById('fw-overlay').classList.remove('hidden');
    
    const title = document.getElementById('fw-overlay-title');
    const msg = document.getElementById('fw-overlay-msg');
    const btn = document.getElementById('fw-start-btn');
    
    sfx.gameOver();
    title.innerText = "FIREWALL BREACHED"; title.setAttribute('data-text', "FIREWALL BREACHED");
    title.style.color = "var(--neon-red)"; title.style.textShadow = "0 0 15px var(--neon-red)";
    msg.innerText = `Sistem Anda telah disusupi! Integritas mencapai 0%.\nAnda berhasil bertahan hingga Level ${fwLevel}.`;
    btn.innerText = "[ RETRY_DEFENSE.EXE ]";
    btn.onclick = initFirewallGame;
}

document.getElementById('fw-start-btn').onclick = initFirewallGame;

// Keyboard Handling for Firewall
window.addEventListener('keydown', (e) => {
    const fwScreen = document.getElementById('screen-firewall');
    const overlay = document.getElementById('fw-overlay');
    
    if (fwScreen && fwScreen.classList.contains('active') && overlay && overlay.classList.contains('hidden') && fwStarted) {
        if (e.key === 'Backspace') {
            fwTyped = fwTyped.slice(0, -1);
            document.getElementById('fw-typed').innerText = fwTyped || "_";
            sfx.click();
            e.preventDefault();
            return;
        }
        
        if (e.key === 'Escape') {
            fwTyped = "";
            document.getElementById('fw-typed').innerText = "_";
            return;
        }
        
        if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
            let nextChar = e.key.toLowerCase();
            let potentialType = fwTyped + nextChar;
            
            let isValid = fwWords.some(w => w.text.startsWith(potentialType));
            
            if (isValid) {
                fwTyped = potentialType;
                sfx.click();
                
                let completedIdx = fwWords.findIndex(w => w.text === fwTyped);
                if (completedIdx !== -1) {
                    fwWords.splice(completedIdx, 1);
                    fwTyped = "";
                    sfx.match(); 
                    
                    fwScore += 10;
                    if (fwScore % 100 === 0) {
                        fwLevel++;
                        document.getElementById('fw-level').innerText = fwLevel;
                        sfx.winLevel();
                        showFlashMessage(`SPEED INCREASED`, 'show-level');
                    }
                }
            } else {
                sfx.error();
            }
            
            document.getElementById('fw-typed').innerText = fwTyped || "_";
            e.preventDefault();
        }
    }
});
