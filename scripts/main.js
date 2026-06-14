import { state } from './state.js';
import { Firefly } from './firefly.js';
import { audioManager } from './audio.js';

const jungleCanvas = document.getElementById('firefly-canvas');
const jarCanvas = document.getElementById('jar-canvas');
const jungleCtx = jungleCanvas.getContext('2d');
const jarCtx = jarCanvas.getContext('2d');
const netCursor = document.getElementById('net-cursor');
const caughtDisplay = document.getElementById('caught-count');

// Parallax Layers
const layers = [
    { el: document.querySelector('.sky'), speed: 0.02 },
    { el: document.querySelector('.forest-back'), speed: 0.05 },
    { el: document.querySelector('.forest-mid'), speed: 0.1 },
    { el: document.querySelector('.forest-front'), speed: 0.2 }
];

let jungleFireflies = [];
let jarFireflies = [];
let mouseX = 0;
let mouseY = 0;

function init() {
    resize();
    window.addEventListener('resize', resize);
    audioManager.init();

    // Initial jungle fireflies
    for (let i = 0; i < 50; i++) {
        jungleFireflies.push(new Firefly(jungleCanvas.width, jungleCanvas.height));
    }

    setupEventListeners();
    animate();
}

function resize() {
    jungleCanvas.width = window.innerWidth;
    jungleCanvas.height = window.innerHeight;
    
    const jarRect = jarCanvas.parentElement.getBoundingClientRect();
    jarCanvas.width = jarRect.width;
    jarCanvas.height = jarRect.height;
}

function setupEventListeners() {
    // View switching
    document.getElementById('to-terrarium').onclick = () => {
        state.setView('terrarium');
        audioManager.play('viewChange');
    };
    document.getElementById('to-jungle').onclick = () => {
        state.setView('jungle');
        audioManager.play('viewChange');
    };

    // State subscription
    state.subscribe((s) => {
        caughtDisplay.textContent = s.caughtFireflies;
        
        const jungleView = document.getElementById('jungle-view');
        const terrariumView = document.getElementById('terrarium-view');
        
        if (s.currentView === 'jungle') {
            jungleView.classList.remove('hidden');
            terrariumView.classList.add('hidden');
            netCursor.style.display = 'block';
        } else {
            jungleView.classList.add('hidden');
            terrariumView.classList.remove('hidden');
            netCursor.style.display = 'none';
            syncJarFireflies();
        }
    });

    // Mouse Tracking (Cursor)
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (state.currentView === 'jungle') {
            netCursor.style.left = mouseX + 'px';
            netCursor.style.top = mouseY + 'px';
        }
    });

    // Catching Logic
    jungleCanvas.addEventListener('click', (e) => {
        const catchRadius = 40;
        let caughtAny = false;
        
        jungleFireflies.forEach(f => {
            if (!f.isCaught) {
                const dx = f.x - e.clientX;
                const dy = f.y - e.clientY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < catchRadius) {
                    f.isCaught = true;
                    state.incrementCaught();
                    caughtAny = true;
                }
            }
        });

        if (caughtAny) {
            audioManager.play('catch');
        }
    });

    state.notify();
}

function syncJarFireflies() {
    while (jarFireflies.length < state.caughtFireflies) {
        jarFireflies.push(new Firefly(jarCanvas.width, jarCanvas.height, true));
    }
}

function animate() {
    requestAnimationFrame(animate);

    if (state.currentView === 'jungle') {
        jungleCtx.clearRect(0, 0, jungleCanvas.width, jungleCanvas.height);
        jungleFireflies.forEach(f => {
            f.update();
            f.draw(jungleCtx);
        });
    } else {
        jarCtx.clearRect(0, 0, jarCanvas.width, jarCanvas.height);
        jarFireflies.forEach(f => {
            f.update();
            f.draw(jarCtx);
        });
    }
}

init();
