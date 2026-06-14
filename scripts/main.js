import { state } from './state.js';
import { Firefly } from './firefly.js';
import { audioManager } from './audio.js';

const jungleCanvas = document.getElementById('firefly-canvas');
const jarCanvas = document.getElementById('jar-canvas');
const carCanvas = document.getElementById('car-canvas');
const jungleCtx = jungleCanvas.getContext('2d');
const jarCtx = jarCanvas.getContext('2d');
const carCtx = carCanvas.getContext('2d');
const netCursor = document.getElementById('net-cursor');
const caughtDisplay = document.getElementById('caught-count');

// Car View Simulation State
let carRoadOffset = 0;
let carRoadSpeed = 7;
let carTrees = [];

class RoadsideTree {
    constructor(side) {
        this.side = side; // -1 for left, 1 for right
        this.z = 1000; // Distance from camera
        this.reset();
    }
    reset() {
        this.z = 1000;
        // Pushed trees MUCH further out (x) to clear the wide road
        this.x = this.side * (600 + Math.random() * 800);
        this.type = Math.floor(Math.random() * 3);
        this.scale = 1.5 + Math.random() * 1.0;
    }
    update(speed) {
        this.z -= speed;
        if (this.z < 1) this.reset();
    }
    draw(ctx, w, h) {
        const factor = 400 / this.z;
        const screenX = w / 2 + this.x * factor;
        const screenY = h / 2 + 150 * factor;
        const size = 400 * factor * this.scale;

        if (size < 2 || Math.abs(screenX - w/2) < 200 * factor) return; // Ensure they stay away from center

        // Trunk
        ctx.fillStyle = '#050b10';
        ctx.fillRect(screenX - size/20, screenY, size/10, size);

        // Realistic organic foliage clusters
        ctx.fillStyle = this.type === 0 ? '#0a1a15' : (this.type === 1 ? '#05100d' : '#081412');
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(screenX - size/3, screenY + size/6, size/3, 0, Math.PI * 2);
        ctx.arc(screenX + size/3, screenY + size/6, size/3, 0, Math.PI * 2);
        ctx.arc(screenX, screenY - size/3, size/2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.beginPath();
        ctx.arc(screenX, screenY - size/4, size/2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function init() {
    resize();
    window.addEventListener('resize', resize);
    audioManager.init();

    // Initial jungle fireflies
    for (let i = 0; i < 50; i++) {
        jungleFireflies.push(new Firefly(jungleCanvas.width, jungleCanvas.height));
    }

    // Initial car trees
    for (let i = 0; i < 40; i++) {
        carTrees.push(new RoadsideTree(i % 2 === 0 ? -1 : 1));
        carTrees[i].z = Math.random() * 1000;
    }

    setupEventListeners();
    animate();
}

function resize() {
    jungleCanvas.width = window.innerWidth;
    jungleCanvas.height = window.innerHeight;
    
    carCanvas.width = window.innerWidth;
    carCanvas.height = window.innerHeight;
    
    const jarRect = jarCanvas.parentElement.getBoundingClientRect();
    if (jarRect) {
        jarCanvas.width = jarRect.width;
        jarCanvas.height = jarRect.height;
    }
}

function setupEventListeners() {
    // View switching
    document.getElementById('to-terrarium').onclick = () => {
        state.setView('terrarium');
        audioManager.play('viewChange');
    };
    document.getElementById('to-jungle-from-jar').onclick = () => {
        state.setView('jungle');
        audioManager.play('viewChange');
    };
    document.getElementById('to-car').onclick = () => {
        state.setView('car');
        audioManager.play('viewChange');
    };
    document.getElementById('exit-car').onclick = () => {
        state.setView('jungle');
        audioManager.play('viewChange');
    };

    // State subscription
    state.subscribe((s) => {
        caughtDisplay.textContent = s.caughtFireflies;
        
        const jungleView = document.getElementById('jungle-view');
        const terrariumView = document.getElementById('terrarium-view');
        const carView = document.getElementById('car-view');
        
        jungleView.classList.add('hidden');
        terrariumView.classList.add('hidden');
        carView.classList.add('hidden');
        netCursor.style.display = 'none';

        if (s.currentView === 'jungle') {
            jungleView.classList.remove('hidden');
            netCursor.style.display = 'block';
        } else if (s.currentView === 'terrarium') {
            terrariumView.classList.remove('hidden');
            syncJarFireflies();
        } else if (s.currentView === 'car') {
            carView.classList.remove('hidden');
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

let jungleFireflies = [];
let jarFireflies = [];
let mouseX = 0;
let mouseY = 0;

function animate() {
    requestAnimationFrame(animate);

    if (state.currentView === 'jungle') {
        jungleCtx.clearRect(0, 0, jungleCanvas.width, jungleCanvas.height);
        jungleFireflies.forEach(f => {
            f.update();
            f.draw(jungleCtx);
        });
    } else if (state.currentView === 'terrarium') {
        jarCtx.clearRect(0, 0, jarCanvas.width, jarCanvas.height);
        jarFireflies.forEach(f => {
            f.update();
            f.draw(jarCtx);
        });
    } else if (state.currentView === 'car') {
        renderCarView();
    }
}

function renderCarView() {
    const w = carCanvas.width;
    const h = carCanvas.height;
    carCtx.clearRect(0, 0, w, h);

    // Distant Mountain
    carCtx.fillStyle = '#04080c';
    carCtx.beginPath();
    carCtx.moveTo(-w*0.5, h/2);
    carCtx.lineTo(w/2, h/3);
    carCtx.lineTo(w*1.5, h/2);
    carCtx.fill();

    // Road (Very Wide Perspective)
    carRoadOffset = (carRoadOffset + carRoadSpeed) % 400;
    
    carCtx.fillStyle = '#0a0a0a';
    carCtx.beginPath();
    carCtx.moveTo(w/2 - 100, h/2); // Vanishing point wider
    carCtx.lineTo(w/2 + 100, h/2);
    carCtx.lineTo(w/2 + 1500, h); // Extremely wide bottom
    carCtx.lineTo(w/2 - 1500, h);
    carCtx.fill();

    // Side grass edges for road
    carCtx.fillStyle = '#050b10';
    carCtx.beginPath();
    carCtx.moveTo(w/2 - 100, h/2);
    carCtx.lineTo(0, h);
    carCtx.lineTo(w/2 - 1500, h);
    carCtx.fill();
    carCtx.beginPath();
    carCtx.moveTo(w/2 + 100, h/2);
    carCtx.lineTo(w, h);
    carCtx.lineTo(w/2 + 1500, h);
    carCtx.fill();

    // Center Road Lines
    carCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    carCtx.setLineDash([100, 100]);
    carCtx.lineDashOffset = -carRoadOffset;
    carCtx.lineWidth = 15;
    carCtx.beginPath();
    carCtx.moveTo(w/2, h/2);
    carCtx.lineTo(w/2, h);
    carCtx.stroke();
    carCtx.setLineDash([]);

    // Trees (sorted and drawn)
    carTrees.sort((a, b) => b.z - a.z);
    carTrees.forEach(t => {
        t.update(carRoadSpeed);
        t.draw(carCtx, w, h);
    });

    // Atmospheric blend
    const grad = carCtx.createLinearGradient(0, h/2 - 50, 0, h/2 + 50);
    grad.addColorStop(0, 'rgba(2, 4, 10, 0)');
    grad.addColorStop(0.5, 'rgba(2, 4, 10, 1)');
    grad.addColorStop(1, 'rgba(2, 4, 10, 0)');
    carCtx.fillStyle = grad;
    carCtx.fillRect(0, h/2 - 50, w, 100);
}

init();
