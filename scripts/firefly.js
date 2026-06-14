export class Firefly {
    constructor(width, height, isCaptive = false) {
        this.width = width;
        this.height = height;
        this.isCaptive = isCaptive; // true if in terrarium jar
        
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.width;
        this.y = Math.random() * this.height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.radius = Math.random() * 2 + 1;
        this.alpha = Math.random();
        this.alphaStep = Math.random() * 0.02 + 0.01;
        this.isCaught = false;
        
        // Jar specific constraints
        if (this.isCaptive) {
            this.vx *= 0.5;
            this.vy *= 0.5;
        }
    }

    update() {
        if (this.isCaught) return;

        this.x += this.vx;
        this.y += this.vy;

        // Subtle direction change (Brownian-ish motion)
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;

        // Max speed limit
        const limit = this.isCaptive ? 1 : 2;
        this.vx = Math.max(-limit, Math.min(limit, this.vx));
        this.vy = Math.max(-limit, Math.min(limit, this.vy));

        // Bounce off walls
        if (this.x < 0 || this.x > this.width) this.vx *= -1;
        if (this.y < 0 || this.y > this.height) this.vy *= -1;

        // Pulsing glow
        this.alpha += this.alphaStep;
        if (this.alpha > 1 || this.alpha < 0.2) this.alphaStep *= -1;
    }

    draw(ctx) {
        if (this.isCaught) return;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 150, ${this.alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 255, 100, 0.8)';
        ctx.fill();
        ctx.closePath();
    }
}
