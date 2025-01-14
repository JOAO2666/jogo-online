// Constantes do jogo
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const PLAYER_SPEED = 5;
const PLATFORM_HEIGHT = 20;

// Sons do jogo
const sounds = {
    jump: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'] }),
    coin: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3'] }),
    hit: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'] })
};

class Sprite {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
    }
}

class Player extends Sprite {
    constructor(x, y) {
        super(x, y, 40, 60, '#3498db');
        this.health = 100;
        this.coins = 0;
        this.isJumping = false;
        this.direction = 1; // 1 direita, -1 esquerda
        this.jumpCount = 0;
        this.maxJumps = 2;
    }

    update(platforms) {
        // Aplica gravidade
        if (!this.onGround) {
            this.velocityY += GRAVITY;
        }

        // Atualiza posição
        super.update();

        // Colisão com plataformas
        this.onGround = false;
        platforms.forEach(platform => {
            if (this.checkCollision(platform)) {
                this.handlePlatformCollision(platform);
            }
        });

        // Atualiza HUD
        document.getElementById('health').textContent = this.health;
        document.getElementById('coins').textContent = this.coins;

        // Limites da tela
        this.x = Math.max(0, Math.min(this.x, 800 - this.width));
        this.y = Math.max(0, Math.min(this.y, 600 - this.height));
    }

    jump() {
        if (this.jumpCount < this.maxJumps) {
            this.velocityY = JUMP_FORCE;
            this.jumpCount++;
            this.onGround = false;
            sounds.jump.play();
        }
    }

    checkCollision(sprite) {
        return this.x < sprite.x + sprite.width &&
               this.x + this.width > sprite.x &&
               this.y < sprite.y + sprite.height &&
               this.y + this.height > sprite.y;
    }

    handlePlatformCollision(platform) {
        const fromTop = this.y + this.height - platform.y;
        const fromBottom = platform.y + platform.height - this.y;
        const fromLeft = this.x + this.width - platform.x;
        const fromRight = platform.x + platform.width - this.x;

        const min = Math.min(fromTop, fromBottom, fromLeft, fromRight);

        if (min === fromTop && this.velocityY > 0) {
            this.y = platform.y - this.height;
            this.velocityY = 0;
            this.onGround = true;
            this.jumpCount = 0;
        }
    }

    draw(ctx) {
        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(this.x - 2, this.y - 2, this.width, this.height);
        
        // Corpo
        super.draw(ctx);
        
        // Olhos
        ctx.fillStyle = 'white';
        const eyeSize = 8;
        const eyeY = this.y + 15;
        const leftEyeX = this.direction === 1 ? this.x + 25 : this.x + 5;
        const rightEyeX = this.direction === 1 ? this.x + 10 : this.x + 20;
        
        ctx.fillRect(leftEyeX, eyeY, eyeSize, eyeSize);
        ctx.fillRect(rightEyeX, eyeY, eyeSize, eyeSize);
    }
}

class Platform extends Sprite {
    constructor(x, y, width) {
        super(x, y, width, PLATFORM_HEIGHT, '#27ae60');
    }
}

class Coin extends Sprite {
    constructor(x, y) {
        super(x, y, 20, 20, 'gold');
        this.collected = false;
        this.bobOffset = 0;
        this.bobSpeed = 0.05;
    }

    update() {
        this.bobOffset += this.bobSpeed;
        this.y += Math.sin(this.bobOffset) * 0.5;
    }

    draw(ctx) {
        if (!this.collected) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x + 10, this.y + 10, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Brilho
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(this.x + 7, this.y + 7, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.player = new Player(100, 300);
        this.platforms = [
            new Platform(0, 500, 800),  // Base
            new Platform(300, 400, 200), // Plataforma flutuante
            new Platform(100, 300, 200), // Plataforma flutuante
            new Platform(500, 200, 200)  // Plataforma flutuante
        ];
        this.coins = [
            new Coin(350, 350),
            new Coin(150, 250),
            new Coin(550, 150)
        ];
        this.keys = {};
        this.isMultiplayer = false;
        this.menu = document.getElementById('menu');
        this.setupEventListeners();
        this.particles = [];
    }

    setupEventListeners() {
        document.getElementById('singlePlayerBtn').addEventListener('click', () => this.startSinglePlayer());
        document.getElementById('multiPlayerBtn').addEventListener('click', () => this.startMultiPlayer());
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if ((e.key === 'w' || e.key === 'ArrowUp') && !e.repeat) {
                this.player.jump();
            }
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
        this.gameLoop();
    }

    createParticle(x, y, color) {
        return {
            x, y,
            color,
            size: Math.random() * 4 + 2,
            speedX: (Math.random() - 0.5) * 6,
            speedY: (Math.random() - 0.5) * 6,
            life: 1
        };
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.life -= 0.02;
            particle.speedY += 0.1; // Gravidade
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.fillStyle = `rgba(${particle.color}, ${particle.life})`;
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        });
    }

    handleInput() {
        // Movimento horizontal
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.player.velocityX = -PLAYER_SPEED;
            this.player.direction = -1;
        } else if (this.keys['ArrowRight'] || this.keys['d']) {
            this.player.velocityX = PLAYER_SPEED;
            this.player.direction = 1;
        } else {
            this.player.velocityX = 0;
        }
    }

    checkCollisions() {
        // Coleta de moedas
        this.coins.forEach(coin => {
            if (!coin.collected && this.player.checkCollision(coin)) {
                coin.collected = true;
                this.player.coins++;
                sounds.coin.play();
                
                // Efeito de partículas
                for (let i = 0; i < 10; i++) {
                    this.particles.push(this.createParticle(
                        coin.x + coin.width/2,
                        coin.y + coin.height/2,
                        '255, 215, 0'
                    ));
                }
            }
        });
    }

    draw() {
        // Limpa o canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Desenha o fundo
        this.ctx.fillStyle = '#87CEEB'; // Céu
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Desenha nuvens (simplificadas)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(100, 100, 30, 0, Math.PI * 2);
        this.ctx.arc(130, 100, 40, 0, Math.PI * 2);
        this.ctx.arc(160, 100, 30, 0, Math.PI * 2);
        this.ctx.fill();

        // Desenha elementos do jogo
        this.platforms.forEach(platform => platform.draw(this.ctx));
        this.coins.forEach(coin => {
            if (!coin.collected) coin.draw(this.ctx);
        });
        this.drawParticles();
        this.player.draw(this.ctx);
    }

    gameLoop() {
        this.handleInput();
        this.player.update(this.platforms);
        this.coins.forEach(coin => coin.update());
        this.checkCollisions();
        this.updateParticles();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Inicializa o jogo quando a janela carregar
window.onload = () => {
    new Game();
};
