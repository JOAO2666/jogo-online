class Player {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.speed = 5;
        this.size = 30;
        this.score = 0;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }

    move(direction) {
        switch(direction) {
            case 'up':
                this.y = Math.max(0, this.y - this.speed);
                break;
            case 'down':
                this.y = Math.min(600 - this.size, this.y + this.speed);
                break;
            case 'left':
                this.x = Math.max(0, this.x - this.speed);
                break;
            case 'right':
                this.x = Math.min(800 - this.size, this.x + this.speed);
                break;
        }
    }
}

class Coin {
    constructor() {
        this.size = 15;
        this.respawn();
    }

    respawn() {
        this.x = Math.random() * (800 - this.size);
        this.y = Math.random() * (600 - this.size);
    }

    draw(ctx) {
        ctx.fillStyle = 'gold';
        ctx.beginPath();
        ctx.arc(this.x + this.size/2, this.y + this.size/2, this.size/2, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.player = new Player(100, 100, '#00ff00');
        this.otherPlayers = new Map();
        this.coins = [new Coin()];
        this.keys = {};
        this.isMultiplayer = false;
        this.menu = document.getElementById('menu');
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('singlePlayerBtn').addEventListener('click', () => this.startSinglePlayer());
        document.getElementById('multiPlayerBtn').addEventListener('click', () => this.startMultiPlayer());
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    startSinglePlayer() {
        this.menu.style.display = 'none';
        this.isMultiplayer = false;
        this.gameLoop();
    }

    startMultiPlayer() {
        this.menu.style.display = 'none';
        this.isMultiplayer = true;
        // Aqui você pode adicionar a lógica de conexão multiplayer
        this.gameLoop();
    }

    handleInput() {
        if (this.keys['ArrowUp'] || this.keys['w']) this.player.move('up');
        if (this.keys['ArrowDown'] || this.keys['s']) this.player.move('down');
        if (this.keys['ArrowLeft'] || this.keys['a']) this.player.move('left');
        if (this.keys['ArrowRight'] || this.keys['d']) this.player.move('right');
    }

    checkCollisions() {
        this.coins.forEach(coin => {
            const dx = (this.player.x + this.player.size/2) - (coin.x + coin.size/2);
            const dy = (this.player.y + this.player.size/2) - (coin.y + coin.size/2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < (this.player.size/2 + coin.size/2)) {
                this.player.score += 1;
                coin.respawn();
            }
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw score
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.player.score}`, 10, 30);

        // Draw player and coins
        this.player.draw(this.ctx);
        this.coins.forEach(coin => coin.draw(this.ctx));

        // Draw other players if in multiplayer mode
        if (this.isMultiplayer) {
            this.otherPlayers.forEach(player => player.draw(this.ctx));
        }
    }

    gameLoop() {
        this.handleInput();
        this.checkCollisions();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when window loads
window.onload = () => {
    new Game();
};
