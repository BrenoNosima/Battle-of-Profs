import Phaser from 'phaser';
// Import other necessary modules later (e.g., Player, Enemy, UI utils)
// import { createAnimations } from '@/game/config/animations';
// import { setupControls } from '@/game/config/controls';
// import { createHitParticles, createCodeExplosion, createDustParticles } from '@/game/utils/particles';
// import { createHealthBars, updateHealthBars, showGameMessage, showLogicTip, showCountdown, showStartScreen, showEndScreen, showPauseMenu, hidePauseMenu } from '@/game/utils/uiElements';

export default class FightScene extends Phaser.Scene {
    constructor() {
        super('FightScene');
        // --- Game Objects ---
        this.player = null;
        this.enemy = null;
        this.ground = null;
        this.playerHealthGraphics = null;
        this.enemyHealthGraphics = null;
        this.playerIcon = null;
        this.enemyIcon = null;
        this.playerNameText = null;
        this.enemyNameText = null;
        this.playerMedals = [];
        this.enemyMedals = [];
        this.timerText = null;
        this.dustParticles = null;
        this.startScreenElements = {}; // Container for start screen objects
        this.pauseMenuElements = {}; // Container for pause menu objects
        this.endScreenElements = {}; // Container for end screen objects

        // --- Controls ---
        this.keys = null; // Player 1 keys
        this.keysP2 = null; // Player 2 keys

        // --- State ---
        this.playerHealth = 100;
        this.enemyHealth = 100;
        this.currentRound = 1;
        this.totalRounds = 3;
        this.playerWins = 0;
        this.enemyWins = 0;
        this.timeLeft = 90;
        this.roundOver = false;
        this.waitingStart = true; // Start in waiting state
        this.isPaused = false;
        this.is2P = false; // 2 Player mode flag

        // --- Cooldowns & Timers ---
        this.playerAttackCooldown = false;
        this.enemyAttackCooldown = false;
        this.specialCooldown = false;
        this.player2AttackCooldown = false;
        this.player2SpecialCooldown = false;
        this.timerEvent = null;
        this.lastDustTime = 0;
        this.lastDustTime2 = 0;
    }

    // --- Phaser Scene Methods ---

    init(data) {
        // Receive data from previous scene or game restart
        this.currentRound = data.currentRound || 1;
        this.playerWins = data.playerWins || 0;
        this.enemyWins = data.enemyWins || 0;
        console.log(`FightScene init: Round ${this.currentRound}, P1 Wins: ${this.playerWins}, P2 Wins: ${this.enemyWins}`);
    }

    create() {
        console.log('FightScene: create');
        this.waitingStart = true; // Ensure waiting state on create
        this.roundOver = false;
        this.isPaused = false;
        this.playerHealth = 100;
        this.enemyHealth = 100;
        this.timeLeft = 90;

        // Reset cooldowns
        this.playerAttackCooldown = false;
        this.enemyAttackCooldown = false;
        this.specialCooldown = false;
        this.player2AttackCooldown = false;
        this.player2SpecialCooldown = false;

        // Add background
        this.setupBackground();

        // Setup physics
        this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
        // Gravity is set in phaserConfig.js

        // Create ground
        this.createGround();

        // Create characters
        this.createCharacters();

        // Setup collisions
        this.setupCollisions();

        // Create animations (consider moving to a separate file)
        this.createAnimations();

        // Setup input controls (consider moving to a separate file)
        this.setupControls();

        // Create UI elements (health bars, timer, etc. - consider moving to uiElements.js)
        this.createUI();

        // Initialize particles (consider moving to particles.js)
        this.createDustParticles();

        // Setup pause listener
        this.input.keyboard.on('keydown-ESC', this.togglePause, this);
        this.input.keyboard.on('keydown-P', this.togglePause, this);

        // Start logic: Show start screen or round entry animation
        if (this.currentRound === 1 && this.playerWins === 0 && this.enemyWins === 0) {
            this.showStartScreen();
        } else {
            this.startRoundEntryAnimation();
        }
    }

    update(time, delta) {
        if (this.isPaused || this.waitingStart || this.roundOver) {
            // Stop character movement if paused or waiting
            if (this.player) this.player.setVelocityX(0);
            if (this.enemy) this.enemy.setVelocityX(0);
            // Optionally stop animations
            if (this.isPaused || this.waitingStart) {
                if (this.player && this.player.anims) this.player.anims.stop();
                if (this.enemy && this.enemy.anims) this.enemy.anims.stop();
            }
            return; // Do nothing else if paused, waiting, or round is over
        }

        const speed = 160;

        // Handle Player 1 Input
        this.handlePlayerInput(speed, time);

        // Handle Enemy AI or Player 2 Input
        if (this.is2P) {
            this.handlePlayer2Input(speed, time);
        } else {
            this.updateEnemyAI(speed);
        }

        // Update UI (e.g., health bars if they aren't automatically updated by graphics)
        // this.updateHealthBars(); // Already called within damage methods

        // Check for round end conditions
        this.checkRoundEnd();
    }

    // --- Creation Methods ---

    setupBackground() {
        if (this.textures.exists('background')) {
            const bg = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background');
            const scaleX = this.cameras.main.width / bg.width;
            const scaleY = this.cameras.main.height / bg.height;
            const scale = Math.max(scaleX, scaleY);
            bg.setScale(scale).setScrollFactor(0); // Set scroll factor if camera moves
            console.log('Background added.');
        } else {
            console.warn('Background texture not found!');
            // Optional: Add a fallback color
            this.cameras.main.setBackgroundColor('#333333');
        }
    }

    createGround() {
        this.ground = this.physics.add.staticGroup();
        const groundY = this.cameras.main.height * 0.85; // Position based on visual estimate
        // Create an invisible static body for the ground
        const groundPlatform = this.ground.create(this.cameras.main.width / 2, groundY, null)
            .setSize(this.cameras.main.width, 20) // Width of screen, small height
            .setOrigin(0.5, 0)
            .setVisible(false) // Make it invisible
            .refreshBody(); // Apply changes to the static body
        console.log('Ground created at Y:', groundY);
    }

    createCharacters() {
        const groundY = this.cameras.main.height * 0.85;
        const playerInitialY = groundY - 100; // Adjust based on sprite size/origin
        const enemyInitialY = groundY - 100;  // Adjust based on sprite size/origin

        // Player 1
        this.player = this.physics.add.sprite(this.cameras.main.width * 0.3, playerInitialY, 'player');
        this.player.setScale(0.7);
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.1);
        this.player.setSize(100, 200); // Adjust hitbox if needed
        this.player.setOrigin(0.5, 1); // Set origin to bottom center
        this.player.body.setGravityY(300); // Optional: Custom gravity per body
        // this.player.health = 100; // Managed by scene state

        // Enemy (Player 2 or AI)
        this.enemy = this.physics.add.sprite(this.cameras.main.width * 0.7, enemyInitialY, 'enemy');
        this.enemy.setScale(0.7);
        this.enemy.setCollideWorldBounds(true);
        this.enemy.setBounce(0.1);
        this.enemy.setSize(100, 200); // Adjust hitbox if needed
        this.enemy.setOrigin(0.5, 1); // Set origin to bottom center
        this.enemy.setTint(0x00ffff); // Distinguish enemy
        this.enemy.body.setGravityY(300);
        // this.enemy.health = 100; // Managed by scene state
        this.enemy.direction = -1; // Initial direction for AI

        console.log('Characters created.');
    }

    setupCollisions() {
        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.enemy, this.ground);
        this.physics.add.collider(this.player, this.enemy);
        console.log('Collisions setup.');
    }

    createAnimations() {
        // This could be moved to a separate animations.js file and imported
        console.log('Creating animations...');
        // Player Animations
        if (!this.anims.exists('player-idle')) {
            this.anims.create({
                key: 'player-idle',
                frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
                frameRate: 8,
                repeat: -1
            });
        }
        if (!this.anims.exists('player-walk')) {
            this.anims.create({
                key: 'player-walk',
                frames: this.anims.generateFrameNumbers('player', { start: 1, end: 1 }),
                frameRate: 8,
                repeat: -1
            });
        }
        if (!this.anims.exists('player-attack')) {
            this.anims.create({
                key: 'player-attack',
                frames: this.anims.generateFrameNumbers('player', { start: 2, end: 2 }),
                frameRate: 8,
                repeat: 0
            });
        }

        // Enemy Animations
        if (!this.anims.exists('enemy-idle')) {
            this.anims.create({
                key: 'enemy-idle',
                frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 0 }),
                frameRate: 8,
                repeat: -1
            });
        }
        if (!this.anims.exists('enemy-walk')) {
            this.anims.create({
                key: 'enemy-walk',
                frames: this.anims.generateFrameNumbers('enemy', { start: 1, end: 1 }),
                frameRate: 8,
                repeat: -1
            });
        }
        if (!this.anims.exists('enemy-attack')) {
            this.anims.create({
                key: 'enemy-attack',
                frames: this.anims.generateFrameNumbers('enemy', { start: 2, end: 2 }),
                frameRate: 8,
                repeat: 0
            });
        }

        // Play initial animations
        this.player.play('player-idle');
        this.enemy.play('enemy-idle');
    }

    setupControls() {
        // This could be moved to controls.js
        console.log('Setting up controls...');
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            special: Phaser.Input.Keyboard.KeyCodes.L // Player 1 Special
        });

        this.keysP2 = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER, // Player 2 Attack
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT // Player 2 Special
        });

        // Toggle 2P mode
        this.input.keyboard.on('keydown-M', () => {
            this.is2P = !this.is2P;
            this.showGameMessage(this.is2P ? 'Modo 2 Jogadores!' : 'Modo 1 Jogador!');
            // Reset enemy state if switching modes mid-game
            if (!this.is2P) {
                this.enemy.setVelocityX(0);
                this.enemy.play('enemy-idle');
                this.enemy.direction = (this.player.x < this.enemy.x) ? -1 : 1;
            }
        });
    }

    createUI() {
        // Health Bars, Timer, Round Wins - Consider moving drawing logic to uiElements.js
        console.log('Creating UI...');
        this.playerHealthGraphics = this.add.graphics().setScrollFactor(0);
        this.enemyHealthGraphics = this.add.graphics().setScrollFactor(0);
        this.drawHealthBars(); // Initial draw

        // Timer Text
        this.timerText = this.add.text(
            this.cameras.main.width / 2,
            10,
            String(this.timeLeft),
            {
                fontFamily: 'Orbitron, Arial, sans-serif',
                fontSize: '40px',
                color: '#fff',
                stroke: '#000',
                strokeThickness: 6,
                align: 'center',
                fontStyle: 'bold',
                shadow: { offsetX: 0, offsetY: 2, color: '#00fff7', blur: 8, fill: true }
            }
        ).setOrigin(0.5, 0).setScrollFactor(0);

        // Timer Event
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    createDustParticles() {
        // Consider moving to particles.js
        this.dustParticles = this.add.particles(0, 0, null, { // Texture key is null, we'll use graphics or a simple shape
            frame: { frames: ['__WHITE'], cycle: true }, // Use a built-in white pixel if no texture loaded
            lifespan: 320,
            speed: { min: 60, max: 120 },
            angle: { min: 240, max: 300 },
            gravityY: 600,
            scale: { start: 0.18, end: 0 },
            alpha: { start: 0.7, end: 0 },
            quantity: 1,
            blendMode: 'NORMAL',
            tint: 0xaaaaaa
        });
        this.dustParticles.stop(); // Don't emit initially
        console.log('Dust particles created.');
    }

    // --- Update Methods ---

    handlePlayerInput(speed, time) {
        if (!this.player || !this.player.body) return;

        let isWalking = false;
        if (this.keys.a.isDown) {
            this.player.setVelocityX(-speed);
            this.player.flipX = true;
            if (!this.playerAttackCooldown) this.player.play('player-walk', true);
            isWalking = true;
        } else if (this.keys.d.isDown) {
            this.player.setVelocityX(speed);
            this.player.flipX = false;
            if (!this.playerAttackCooldown) this.player.play('player-walk', true);
            isWalking = true;
        } else {
            this.player.setVelocityX(0);
            if (!this.playerAttackCooldown) this.player.play('player-idle', true);
        }

        // Walking effects
        if (isWalking && this.player.body.touching.down) {
            // Bobbing effect
            this.player.y += Math.sin(time / 80) * 0.5; // Subtle bob
            // Dust particles
            if (!this.lastDustTime || time - this.lastDustTime > 110) {
                if (this.dustParticles) {
                    this.dustParticles.emitParticleAt(this.player.x, this.player.body.bottom, 1);
                }
                this.lastDustTime = time;
            }
        }

        // Attack Input
        if (Phaser.Input.Keyboard.JustDown(this.keys.space) && !this.playerAttackCooldown) {
            this.playerAttack();
        }

        // Special Attack Input
        if (Phaser.Input.Keyboard.JustDown(this.keys.special) && !this.playerAttackCooldown && !this.specialCooldown) {
            this.playerSpecialAttack();
        }
    }

    handlePlayer2Input(speed, time) {
        if (!this.enemy || !this.enemy.body) return;

        let isWalking2 = false;
        if (this.keysP2.left.isDown) {
            this.enemy.setVelocityX(-speed);
            this.enemy.flipX = true;
            if (!this.player2AttackCooldown) this.enemy.play('enemy-walk', true);
            isWalking2 = true;
        } else if (this.keysP2.right.isDown) {
            this.enemy.setVelocityX(speed);
            this.enemy.flipX = false;
            if (!this.player2AttackCooldown) this.enemy.play('enemy-walk', true);
            isWalking2 = true;
        } else {
            this.enemy.setVelocityX(0);
            if (!this.player2AttackCooldown) this.enemy.play('enemy-idle', true);
        }

        // Walking effects for Player 2
        if (isWalking2 && this.enemy.body.touching.down) {
            this.enemy.y += Math.sin(time / 80) * 0.5;
            if (!this.lastDustTime2 || time - this.lastDustTime2 > 110) {
                if (this.dustParticles) {
                    this.dustParticles.emitParticleAt(this.enemy.x, this.enemy.body.bottom, 1);
                }
                this.lastDustTime2 = time;
            }
        }

        // Attack Input P2
        if (Phaser.Input.Keyboard.JustDown(this.keysP2.enter) && !this.player2AttackCooldown) {
            this.player2Attack();
        }

        // Special Attack Input P2
        if (Phaser.Input.Keyboard.JustDown(this.keysP2.shift) && !this.player2AttackCooldown && !this.player2SpecialCooldown) {
            this.player2SpecialAttack();
        }
    }

    updateEnemyAI(speed) {
        if (this.enemyAttackCooldown || !this.enemy || !this.enemy.body || !this.player || !this.player.body) return;

        const distance = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, this.player.x, this.player.y);
        const sightRange = 400; // How far the enemy can "see" the player
        const attackRange = 80; // How close the enemy needs to be to attack
        const moveSpeed = speed * 0.75; // AI moves slightly slower

        // Update direction based on player position
        if (this.player.x < this.enemy.x) {
            this.enemy.flipX = true;
            this.enemy.direction = -1;
        } else {
            this.enemy.flipX = false;
            this.enemy.direction = 1;
        }

        // AI Behavior
        if (distance < attackRange) {
            // Close enough to attack
            this.enemy.setVelocityX(0);
            this.enemy.play('enemy-idle', true);
            this.enemyAttack(); // Trigger attack (will check cooldown inside)
        } else if (distance < sightRange) {
            // Player is visible, move towards them
            this.enemy.setVelocityX(moveSpeed * this.enemy.direction);
            this.enemy.play('enemy-walk', true);
        } else {
            // Player is far away or out of sight, patrol randomly (simple)
            if (Math.random() < 0.01) { // Low chance to change direction
                this.enemy.direction *= -1;
            }
            this.enemy.setVelocityX(moveSpeed * 0.5 * this.enemy.direction); // Patrol slower
            this.enemy.play('enemy-walk', true);
            // Prevent walking off edges (simple boundary check)
            if ((this.enemy.x < 50 && this.enemy.direction === -1) || (this.enemy.x > this.cameras.main.width - 50 && this.enemy.direction === 1)) {
                this.enemy.direction *= -1;
                this.enemy.setVelocityX(moveSpeed * 0.5 * this.enemy.direction);
            }
        }
    }

    updateTimer() {
        if (!this.roundOver && !this.isPaused && !this.waitingStart && this.timeLeft > 0) {
            this.timeLeft--;
            this.timerText.setText(String(this.timeLeft));

            // Pulse effect for last 10 seconds
            if (this.timeLeft <= 10 && this.timeLeft > 0) {
                this.tweens.add({
                    targets: this.timerText,
                    scale: 1.3,
                    duration: 120,
                    yoyo: true,
                    repeat: 1,
                    ease: 'Quad.easeInOut',
                    onStart: () => {
                        this.timerText.setColor('#ff006a');
                        this.timerText.setStroke('#fff', 8);
                    },
                    onComplete: () => {
                        // Restore style only if timer hasn't hit 0
                        if (this.timeLeft > 0) {
                            this.timerText.setColor('#fff');
                            this.timerText.setStroke('#000', 6);
                            this.timerText.setScale(1.0); // Ensure scale resets
                        }
                    }
                });
            }

            // Time's up
            if (this.timeLeft === 0) {
                this.roundOver = true;
                this.showGameMessage('Tempo Esgotado!'); // Time's Up!
                this.time.delayedCall(500, () => { // Short delay before deciding winner
                    if (this.playerHealth > this.enemyHealth) {
                        this.playerWins++;
                        this.finalizeRound('Você Venceu!'); // You Win!
                    } else if (this.enemyHealth > this.playerHealth) {
                        this.enemyWins++;
                        this.finalizeRound('Você Perdeu!'); // You Lose!
                    } else {
                        this.finalizeRound('Empate!'); // Draw!
                    }
                });
            }
        }
    }

    checkRoundEnd() {
        if (this.roundOver) return; // Already handled

        if (this.playerHealth <= 0 || this.enemyHealth <= 0) {
            this.roundOver = true;
            this.cameras.main.shake(400, 0.022);

            let endMsg = '';
            if (this.playerHealth <= 0 && this.enemyHealth <= 0) {
                endMsg = 'Empate!'; // Draw!
            } else if (this.playerHealth <= 0) {
                this.enemyWins++;
                endMsg = 'Você Perdeu!'; // You Lose!
            } else { // enemyHealth <= 0
                this.playerWins++;
                endMsg = 'Você Venceu!'; // You Win!
            }
            this.finalizeRound(endMsg);
        }
    }

    finalizeRound(message) {
        console.log(`Round ${this.currentRound} ended. ${message}`);
        this.player.setVelocity(0, 0); // Stop movement
        this.enemy.setVelocity(0, 0);
        this.player.play('player-idle');
        this.enemy.play('enemy-idle');

        // Check if game is over (best of N rounds)
        const maxWinsNeeded = Math.ceil(this.totalRounds / 2);
        if (this.playerWins >= maxWinsNeeded || this.enemyWins >= maxWinsNeeded || this.currentRound >= this.totalRounds) {
            // Game Over
            let finalMessage = '';
            if (this.playerWins > this.enemyWins) {
                finalMessage = 'Vitória Final!'; // Final Victory!
            } else if (this.enemyWins > this.playerWins) {
                finalMessage = 'Derrota Final!'; // Final Defeat!
            } else {
                finalMessage = 'Empate Final!'; // Final Draw!
            }
            this.showGameMessage(message); // Show round result first
            this.time.delayedCall(1500, () => {
                this.showEndScreen(finalMessage);
            });
        } else {
            // Proceed to next round
            this.showGameMessage(message);
            this.time.delayedCall(1500, () => {
                this.showLogicTip(() => {
                    this.time.delayedCall(2000, () => {
                        this.currentRound++;
                        // Restart scene with updated round/win data
                        this.scene.restart({ 
                            currentRound: this.currentRound, 
                            playerWins: this.playerWins, 
                            enemyWins: this.enemyWins 
                        });
                    });
                });
            });
        }
    }

    // --- Attack & Damage Methods ---

    playerAttack() {
        if (this.roundOver || this.isPaused || this.waitingStart) return;
        this.playerAttackCooldown = true;
        this.player.play('player-attack', true);

        const attackRange = 100;
        const distance = Phaser.Math.Distance.BetweenPoints(this.player, this.enemy);
        const isFacingEnemy = (this.player.flipX && this.enemy.x < this.player.x) || (!this.player.flipX && this.enemy.x > this.player.x);

        if (distance < attackRange && isFacingEnemy) {
            this.damageEnemy(20);
            this.applyKnockback(this.enemy, this.player, 300, 150);
            this.createHitParticles(this.enemy.x, this.enemy.y - 50, 0xffff00); // Hit near center
        }

        // Reset cooldown after animation + delay
        this.player.once('animationcomplete', () => {
             if (!this.keys.a.isDown && !this.keys.d.isDown) {
                 this.player.play('player-idle', true);
             }
             this.time.delayedCall(300, () => { this.playerAttackCooldown = false; });
        });
        // Failsafe if animation doesn't complete
        this.time.delayedCall(500, () => { if(this.playerAttackCooldown) this.playerAttackCooldown = false; });
    }

    playerSpecialAttack() {
        if (this.roundOver || this.isPaused || this.waitingStart) return;
        this.playerAttackCooldown = true;
        this.specialCooldown = true;

        // Visual/Audio Cue (Text + Effects)
        this.showSpecialAttackCue(this.player, 'AOOWWWWW!', '#00fff7');
        this.createFloatingSymbols(this.player, ['&&', '||', '!', 'if', 'else', '{', '}', '==', '!=', '>=', '<='], '#00fff7');

        // Create Projectile
        const projectileText = '{ if (x > 0) x--; }';
        const projectileColor = '#00fff7';
        const projectile = this.createCodeProjectile(this.player, projectileText, projectileColor, 420);

        // Setup collision check for projectile
        this.physics.add.overlap(projectile, this.enemy, (proj, target) => {
            this.damageEnemy(35);
            this.createCodeExplosion(target.x, target.y - 50, '#00fff7');
            proj.destroy(); // Destroy projectile on hit
        }, null, this);

        // Cooldowns
        this.time.delayedCall(700, () => { this.playerAttackCooldown = false; });
        this.time.delayedCall(3000, () => { this.specialCooldown = false; }); // Longer cooldown for special
    }

    player2Attack() {
        if (this.roundOver || this.isPaused || this.waitingStart) return;
        this.player2AttackCooldown = true;
        this.enemy.play('enemy-attack', true); // Enemy sprite is P2

        const attackRange = 100;
        const distance = Phaser.Math.Distance.BetweenPoints(this.enemy, this.player);
        const isFacingPlayer = (this.enemy.flipX && this.player.x < this.enemy.x) || (!this.enemy.flipX && this.player.x > this.enemy.x);

        if (distance < attackRange && isFacingPlayer) {
            this.damagePlayer(15);
            this.applyKnockback(this.player, this.enemy, 300, 150);
            this.createHitParticles(this.player.x, this.player.y - 50, 0x00ffff); // Hit near center
        }

        this.enemy.once('animationcomplete', () => {
            if (!this.keysP2.left.isDown && !this.keysP2.right.isDown) {
                 this.enemy.play('enemy-idle', true);
            }
            this.time.delayedCall(300, () => { this.player2AttackCooldown = false; });
        });
        this.time.delayedCall(500, () => { if(this.player2AttackCooldown) this.player2AttackCooldown = false; });
    }

    player2SpecialAttack() {
        if (this.roundOver || this.isPaused || this.waitingStart) return;
        this.player2AttackCooldown = true;
        this.player2SpecialCooldown = true;

        this.showSpecialAttackCue(this.enemy, 'TOMA ESSA!', '#ff006a');
        this.createFloatingSymbols(this.enemy, ['for', 'while', '()', ';', '++', '--', '=>', '...', '+=', '-='], '#ff006a');

        const projectileText = '{ while (x > 0) x--; }';
        const projectileColor = '#ff006a';
        const projectile = this.createCodeProjectile(this.enemy, projectileText, projectileColor, 420);

        this.physics.add.overlap(projectile, this.player, (proj, target) => {
            this.damagePlayer(35);
            this.createCodeExplosion(target.x, target.y - 50, '#ff006a');
            proj.destroy();
        }, null, this);

        this.time.delayedCall(700, () => { this.player2AttackCooldown = false; });
        this.time.delayedCall(3000, () => { this.player2SpecialCooldown = false; });
    }

    enemyAttack() {
        // AI Attack
        if (this.roundOver || this.isPaused || this.waitingStart || this.enemyAttackCooldown) return;
        this.enemyAttackCooldown = true;
        this.enemy.play('enemy-attack', true);

        const attackRange = 100;
        const distance = Phaser.Math.Distance.BetweenPoints(this.enemy, this.player);
        const isFacingPlayer = (this.enemy.flipX && this.player.x < this.enemy.x) || (!this.enemy.flipX && this.player.x > this.enemy.x);

        if (distance < attackRange && isFacingPlayer) {
            this.damagePlayer(15);
            this.applyKnockback(this.player, this.enemy, 300, 150);
            this.createHitParticles(this.player.x, this.player.y - 50, 0x00ffff);
        }

        this.enemy.once('animationcomplete', () => {
            this.enemy.play('enemy-idle', true);
            this.time.delayedCall(800, () => { this.enemyAttackCooldown = false; }); // AI has longer cooldown
        });
         this.time.delayedCall(500, () => { if(this.enemyAttackCooldown) this.enemyAttackCooldown = false; });
    }

    damagePlayer(amount) {
        if (this.roundOver) return;
        this.playerHealth -= amount;
        if (this.playerHealth < 0) this.playerHealth = 0;
        console.log(`Player damaged! Health: ${this.playerHealth}`);
        this.cameras.main.shake(100, 0.01); // Small shake on hit
        this.player.setTint(0xff0000); // Flash red
        this.time.delayedCall(100, () => {
            this.player.clearTint();
        });
        this.updateHealthBars();
        // Check end condition immediately after damage
        // this.checkRoundEnd(); // Called in main update loop
    }

    damageEnemy(amount) {
        if (this.roundOver) return;
        this.enemyHealth -= amount;
        if (this.enemyHealth < 0) this.enemyHealth = 0;
        console.log(`Enemy damaged! Health: ${this.enemyHealth}`);
        this.cameras.main.shake(100, 0.01);
        this.enemy.setTint(0xff8888); // Flash different red
        this.time.delayedCall(100, () => {
            this.enemy.clearTint();
            this.enemy.setTint(0x00ffff); // Restore original tint
        });
        this.updateHealthBars();
        // this.checkRoundEnd(); // Called in main update loop
    }

    applyKnockback(target, source, forceX, forceY) {
        if (!target || !target.body || !source) return;
        const angle = Phaser.Math.Angle.BetweenPoints(source, target);
        const velocityX = Math.cos(angle) * forceX;
        const velocityY = Math.sin(angle) * forceY;
        target.setVelocity(velocityX, velocityY - forceY * 0.5); // Add some upward force
    }

    // --- UI & Effects Methods (Candidates for moving to utils) ---

    drawHealthBars() {
        // Clear previous drawings
        this.playerHealthGraphics.clear();
        this.enemyHealthGraphics.clear();

        const barWidth = 220;
        const barHeight = 22;
        const radius = 12;
        const xPlayer = this.cameras.main.width * 0.25 - barWidth / 2;
        const xEnemy = this.cameras.main.width * 0.75 - barWidth / 2;
        const y = 24;
        const nameYOffset = -1; // Position names above bars
        const nameFontSize = '15px';
        const medalYOffset = barHeight + 18;
        const medalRadius = 9;
        const medalSpacing = 28;
        const totalMedals = Math.ceil(this.totalRounds / 2);

        // --- Player Bar ---
        // Background
        this.playerHealthGraphics.fillStyle(0x232526, 1);
        this.playerHealthGraphics.fillRoundedRect(xPlayer, y, barWidth, barHeight, radius);
        // Border
        this.playerHealthGraphics.lineStyle(3, 0x00fff7, 0.7);
        this.playerHealthGraphics.strokeRoundedRect(xPlayer, y, barWidth, barHeight, radius);
        // Health Fill
        const playerPercent = Phaser.Math.Clamp(this.playerHealth / 100, 0, 1);
        if (playerPercent > 0) {
            this.playerHealthGraphics.fillStyle(0x00cfff, 1);
            // Adjust fill rect width slightly to prevent overlap with rounded corners
            this.playerHealthGraphics.fillRoundedRect(xPlayer + 2, y + 2, (barWidth - 4) * playerPercent, barHeight - 4, radius - 2);
        }

        // --- Enemy Bar ---
        this.enemyHealthGraphics.fillStyle(0x232526, 1);
        this.enemyHealthGraphics.fillRoundedRect(xEnemy, y, barWidth, barHeight, radius);
        this.enemyHealthGraphics.lineStyle(3, 0xff006a, 0.7);
        this.enemyHealthGraphics.strokeRoundedRect(xEnemy, y, barWidth, barHeight, radius);
        const enemyPercent = Phaser.Math.Clamp(this.enemyHealth / 100, 0, 1);
        if (enemyPercent > 0) {
            this.enemyHealthGraphics.fillStyle(0xff006a, 1);
            this.enemyHealthGraphics.fillRoundedRect(xEnemy + 2, y + 2, (barWidth - 4) * enemyPercent, barHeight - 4, radius - 2);
        }

        // --- Icons ---
        if (!this.playerIcon) {
            this.playerIcon = this.add.image(xPlayer - 32, y + barHeight / 2, 'player').setScale(0.13).setOrigin(0.5).setScrollFactor(0);
        } else {
            this.playerIcon.setPosition(xPlayer - 32, y + barHeight / 2);
        }
        if (!this.enemyIcon) {
            this.enemyIcon = this.add.image(xEnemy + barWidth + 32, y + barHeight / 2, 'enemy').setScale(0.13).setOrigin(0.5).setScrollFactor(0);
            this.enemyIcon.setTint(0x00ffff);
        } else {
            this.enemyIcon.setPosition(xEnemy + barWidth + 32, y + barHeight / 2);
        }

        // --- Medals ---
        // Clear existing medals before redrawing
        this.playerMedals.forEach(m => m.destroy());
        this.playerMedals = [];
        this.enemyMedals.forEach(m => m.destroy());
        this.enemyMedals = [];

        for (let i = 0; i < totalMedals; i++) {
            // Player Medals
            const pFilled = i < this.playerWins;
            const pMedal = this.add.circle(
                xPlayer + 18 + i * medalSpacing,
                y + medalYOffset,
                medalRadius,
                pFilled ? 0x00fff7 : 0x232526,
                pFilled ? 1 : 0.5
            ).setStrokeStyle(2, 0x00fff7, 0.7).setScrollFactor(0);
            this.playerMedals.push(pMedal);

            // Enemy Medals
            const eFilled = i < this.enemyWins;
            const eMedal = this.add.circle(
                xEnemy + barWidth - 18 - (totalMedals - 1 - i) * medalSpacing, // Align to right
                y + medalYOffset,
                medalRadius,
                eFilled ? 0xff006a : 0x232526,
                eFilled ? 1 : 0.5
            ).setStrokeStyle(2, 0xff006a, 0.7).setScrollFactor(0);
            this.enemyMedals.push(eMedal);
        }

        // --- Names ---
        const nameStyle = {
            fontFamily: 'Orbitron, Arial, sans-serif',
            fontSize: nameFontSize,
            fontStyle: 'bold',
            align: 'center',
            stroke: '#000',
            strokeThickness: 4,
            shadow: { offsetX: 0, offsetY: 2, blur: 6, fill: true }
        };

        if (!this.playerNameText) {
            this.playerNameText = this.add.text(
                xPlayer + barWidth / 2,
                y + nameYOffset,
                'MORENO', // Player Name
                { ...nameStyle, color: '#00fff7', shadow: { ...nameStyle.shadow, color: '#00fff7' } }
            ).setOrigin(0.5, 1).setScrollFactor(0);
        } else {
             this.playerNameText.setPosition(xPlayer + barWidth / 2, y + nameYOffset);
        }

        if (!this.enemyNameText) {
            this.enemyNameText = this.add.text(
                xEnemy + barWidth / 2,
                y + nameYOffset,
                this.is2P ? 'PLAYER 2' : 'INIMIGO', // Enemy Name
                { ...nameStyle, color: '#ff006a', shadow: { ...nameStyle.shadow, color: '#ff006a' } }
            ).setOrigin(0.5, 1).setScrollFactor(0);
        } else {
            this.enemyNameText.setText(this.is2P ? 'PLAYER 2' : 'INIMIGO');
            this.enemyNameText.setPosition(xEnemy + barWidth / 2, y + nameYOffset);
        }
    }

    updateHealthBars() {
        // This function might not be needed if drawHealthBars is efficient enough
        // and called whenever health changes.
        this.drawHealthBars();
    }

    createHitParticles(x, y, color) {
        // Simple spark effect using graphics
        for (let i = 0; i < 14; i++) {
            const angle = Phaser.Math.DegToRad(Phaser.Math.Between(0, 360));
            const dist = Phaser.Math.Between(18, 48);
            const endX = x + Math.cos(angle) * dist;
            const endY = y + Math.sin(angle) * dist;
            const sparkColors = [0xffff00, 0xffa500, 0xffffff];
            const sparkColor = color || Phaser.Utils.Array.GetRandom(sparkColors);
            const spark = this.add.graphics({ lineStyle: { width: Phaser.Math.Between(2, 4), color: sparkColor } });
            spark.beginPath();
            spark.moveTo(x, y);
            spark.lineTo(endX, endY);
            spark.strokePath();
            spark.setAlpha(1).setDepth(300); // Ensure particles are on top

            this.tweens.add({
                targets: spark,
                alpha: 0,
                duration: 340,
                ease: 'Cubic.easeOut',
                onComplete: () => spark.destroy()
            });
        }
    }

    createCodeExplosion(x, y, color) {
        const symbols = ['1010', '1101', '&&', '||', '!', '{', '}', '==', '()', ';', '=>'];
        for (let i = 0; i < 12; i++) {
            const particle = this.add.text(x, y, Phaser.Utils.Array.GetRandom(symbols), {
                fontFamily: 'monospace',
                fontSize: '18px',
                color: color || '#00fff7',
                stroke: '#fff',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(300);

            this.tweens.add({
                targets: particle,
                x: x + Phaser.Math.Between(-60, 60),
                y: y + Phaser.Math.Between(-60, 60),
                alpha: 0,
                angle: Phaser.Math.Between(-180, 180),
                duration: 700,
                ease: 'Quad.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }

    createCodeProjectile(source, text, color, speed) {
        const projectile = this.add.text(
            source.x + 30 * (source.flipX ? -1 : 1),
            source.y - 50, // Start slightly above center
            text,
            {
                fontFamily: 'monospace',
                fontSize: '20px',
                color: color,
                stroke: '#fff',
                strokeThickness: 3,
                padding: { x: 5, y: 2 },
                backgroundColor: 'rgba(0,0,0,0.5)'
            }
        ).setOrigin(0.5).setDepth(200);

        this.physics.add.existing(projectile);
        projectile.body.setAllowGravity(false);
        projectile.body.setVelocityX(speed * (source.flipX ? -1 : 1));
        projectile.body.setSize(projectile.width, projectile.height); // Set physics body size

        // Self-destruct after time
        this.time.delayedCall(1500, () => {
            if (projectile.active) {
                projectile.destroy();
            }
        });

        return projectile;
    }

    showSpecialAttackCue(character, text, color) {
        const cueText = this.add.text(
            character.x,
            character.y - 100, // Above the character
            text,
            {
                fontFamily: 'Orbitron, Arial, sans-serif',
                fontSize: '32px',
                color: color,
                align: 'center',
                stroke: '#fff',
                strokeThickness: 5,
                shadow: { offsetX: 0, offsetY: 0, color: color, blur: 15, fill: true }
            }
        ).setOrigin(0.5).setDepth(300);

        this.tweens.add({
            targets: cueText,
            y: cueText.y - 20,
            scale: 1.1,
            alpha: { from: 1, to: 0 },
            duration: 800,
            ease: 'Quad.easeOut',
            onComplete: () => cueText.destroy()
        });
    }

    createFloatingSymbols(character, symbols, color) {
        for (let i = 0; i < 7; i++) {
            const symbol = this.add.text(
                character.x + Phaser.Math.Between(-50, 50),
                character.y - 80 + Phaser.Math.Between(-30, 30),
                Phaser.Utils.Array.GetRandom(symbols),
                {
                    fontFamily: 'monospace',
                    fontSize: '22px',
                    color: '#fff',
                    stroke: color,
                    strokeThickness: 3
                }
            ).setOrigin(0.5).setDepth(300);

            this.tweens.add({
                targets: symbol,
                y: symbol.y - Phaser.Math.Between(40, 70),
                alpha: 0,
                angle: Phaser.Math.Between(-90, 90),
                duration: 800,
                delay: i * 70,
                ease: 'Cubic.easeOut',
                onComplete: () => symbol.destroy()
            });
        }
    }

    showGameMessage(message, duration = 1500) {
        // Simple message display
        const msgText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 3,
            message,
            {
                fontFamily: 'Orbitron, Arial, sans-serif',
                fontSize: '48px',
                color: '#fff',
                align: 'center',
                stroke: '#00fff7',
                strokeThickness: 6,
                shadow: { offsetX: 0, offsetY: 3, color: '#000', blur: 10, fill: true }
            }
        ).setOrigin(0.5).setDepth(500).setAlpha(0);

        this.tweens.add({
            targets: msgText,
            alpha: 1,
            scale: { from: 0.8, to: 1 },
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(duration, () => {
                    this.tweens.add({
                        targets: msgText,
                        alpha: 0,
                        scale: 0.8,
                        duration: 300,
                        ease: 'Back.easeIn',
                        onComplete: () => msgText.destroy()
                    });
                });
            }
        });
    }

    showLogicTip(onCompleteCallback) {
        const tips = [
            "Dica: Use '&&' para checar duas condições!",
            "Dica: '||' significa 'ou' em lógica!",
            "Dica: '!' inverte o valor booleano!",
            "Dica: Mantenha seu código limpo!",
            "Dica: Comente partes complexas!",
            "Dica: Teste seus limites!"
        ];
        const tip = Phaser.Utils.Array.GetRandom(tips);
        this.showGameMessage(tip, 1800); // Show tip slightly longer
        if (onCompleteCallback) {
            // Call the callback after the message duration + fade out time
            this.time.delayedCall(1800 + 300, onCompleteCallback);
        }
    }

    // --- Game Flow Methods ---

    togglePause() {
        if (this.roundOver || this.waitingStart) return; // Don't pause if round/game is over or during countdown

        this.isPaused = !this.isPaused;
        console.log('Pause Toggled:', this.isPaused);

        if (this.isPaused) {
            // Pause physics and timers
            this.physics.pause();
            if (this.timerEvent) this.timerEvent.paused = true;
            // Pause animations (optional)
            this.player.anims.pause();
            this.enemy.anims.pause();
            // Show pause menu
            this.showPauseMenu();
        } else {
            // Resume physics and timers
            this.physics.resume();
            if (this.timerEvent) this.timerEvent.paused = false;
            // Resume animations
            this.player.anims.resume();
            this.enemy.anims.resume();
            // Hide pause menu
            this.hidePauseMenu();
        }
    }

    showPauseMenu() {
        // Create overlay and text
        const w = this.cameras.main.width, h = this.cameras.main.height;
        const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x181c24, 0.85).setDepth(100).setScrollFactor(0);
        const title = this.add.text(w / 2, h / 2 - 50, 'PAUSADO', {
            fontFamily: 'Orbitron, Arial, sans-serif', fontSize: '44px', color: '#00fff7', align: 'center', stroke: '#fff', strokeThickness: 4
        }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
        const instructions = this.add.text(w / 2, h / 2 + 30, 'Pressione ESC/P para continuar\nPressione R para reiniciar o Jogo', {
            fontFamily: 'Orbitron, Arial, sans-serif', fontSize: '22px', color: '#fff', align: 'center', stroke: '#00fff7', strokeThickness: 2
        }).setOrigin(0.5).setDepth(101).setScrollFactor(0);

        this.pauseMenuElements = { bg, title, instructions };

        // Add key listener for restarting the game (R)
        this.pauseRListener = this.input.keyboard.once('keydown-R', () => {
            console.log('Restarting game from pause menu...');
            this.isPaused = false; // Ensure unpaused state
            this.physics.resume(); // Ensure physics is running
            if (this.timerEvent) this.timerEvent.paused = false;
            this.hidePauseMenu();
            this.restartGame(); // Call the main restart function
        });
    }

    hidePauseMenu() {
        if (this.pauseMenuElements.bg) this.pauseMenuElements.bg.destroy();
        if (this.pauseMenuElements.title) this.pauseMenuElements.title.destroy();
        if (this.pauseMenuElements.instructions) this.pauseMenuElements.instructions.destroy();
        this.pauseMenuElements = {};

        // Remove the restart listener if it exists
        if (this.pauseRListener) {
            this.input.keyboard.off('keydown-R', this.pauseRListener.callback, this.pauseRListener.context);
            this.pauseRListener = null;
        }
    }

    showStartScreen() {
        this.waitingStart = true;
        const w = this.cameras.main.width, h = this.cameras.main.height;

        // Dim background slightly
        const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6).setDepth(100);

        const title = this.add.text(w / 2, h / 2 - 120, 'BATTLE OF PROFS', {
            fontFamily: 'Orbitron, Arial, sans-serif', fontSize: '64px', color: '#00fff7',
            fontStyle: 'bold', align: 'center', stroke: '#fff', strokeThickness: 8,
            shadow: { offsetX: 0, offsetY: 0, color: '#00fff7', blur: 32, fill: true }
        }).setOrigin(0.5).setDepth(101);

        const slogan = this.add.text(w / 2, h / 2 - 50, 'Mostre suas habilidades e vença!', {
            fontFamily: 'Orbitron, Arial, sans-serif', fontSize: '26px', color: '#fff',
            align: 'center', stroke: '#00fff7', strokeThickness: 2,
            shadow: { offsetX: 0, offsetY: 0, color: '#00fff7', blur: 12, fill: true }
        }).setOrigin(0.5).setDepth(101);

        const startText = this.add.text(w / 2, h / 2 + 60, 'APERTE ESPAÇO PARA COMEÇAR', {
            fontFamily: 'Orbitron, Arial, sans-serif', fontSize: '32px', color: '#ff006a',
            align: 'center', stroke: '#fff', strokeThickness: 4,
            shadow: { offsetX: 0, offsetY: 0, color: '#ff006a', blur: 16, fill: true }
        }).setOrigin(0.5).setDepth(101);

        this.startScreenElements = { overlay, title, slogan, startText };

        // Title animation
        this.tweens.add({
            targets: title,
            alpha: { from: 0.7, to: 1 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Start text animation
        this.tweens.add({
            targets: startText,
            scale: { from: 1, to: 1.13 },
            alpha: { from: 0.7, to: 1 },
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Listener to start game
        this.input.keyboard.once('keydown-SPACE', () => {
            this.tweens.add({
                targets: [overlay, title, slogan, startText],
                alpha: 0,
                duration: 600,
                ease: 'Power1',
                onComplete: () => {
                    Object.values(this.startScreenElements).forEach(el => el.destroy());
                    this.startScreenElements = {};
                    this.startRoundEntryAnimation(); // Proceed to round start
                }
            });
        });
    }

    startRoundEntryAnimation() {
        this.waitingStart = true; // Still waiting until countdown finishes
        console.log('Starting round entry animation...');

        // Initial positions off-screen
        const playerTargetX = this.cameras.main.width * 0.3;
        const enemyTargetX = this.cameras.main.width * 0.7;
        this.player.setPosition(-150, this.player.y).setAlpha(1);
        this.enemy.setPosition(this.cameras.main.width + 150, this.enemy.y).setAlpha(1);

        // Camera zoom effect
        this.cameras.main.setZoom(1.3);
        this.tweens.add({
            targets: this.cameras.main,
            zoom: 1,
            duration: 700,
            ease: 'Cubic.easeOut',
        });

        // Characters slide in
        this.tweens.add({
            targets: this.player,
            x: playerTargetX,
            duration: 700,
            ease: 'Cubic.easeOut',
        });
        this.tweens.add({
            targets: this.enemy,
            x: enemyTargetX,
            duration: 700,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                console.log('Characters in position, starting countdown.');
                this.player.play('player-idle'); // Ensure idle anim
                this.enemy.play('enemy-idle');
                this.showCountdown(() => {
                    console.log('Countdown finished, fight starts!');
                    this.waitingStart = false; // Fight begins!
                });
            }
        });
    }

    showCountdown(onCompleteCallback) {
        const sequence = ['3', '2', '1', 'LUTE!']; // FIGHT!
        let index = 0;
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        const showNextNumber = () => {
            if (index >= sequence.length) {
                if (onCompleteCallback) onCompleteCallback();
                return;
            }

            const isFight = index === sequence.length - 1;
            const text = this.add.text(centerX, centerY, sequence[index], {
                fontFamily: 'Orbitron, Arial, sans-serif',
                fontSize: isFight ? '80px' : '72px',
                color: isFight ? '#ff006a' : '#fff',
                align: 'center',
                stroke: '#00fff7',
                strokeThickness: 8,
                shadow: { offsetX: 0, offsetY: 0, color: '#00fff7', blur: 24, fill: true }
            }).setOrigin(0.5).setScale(0.7).setAlpha(0).setDepth(500);

            this.tweens.add({
                targets: text,
                alpha: 1,
                scale: 1.2,
                duration: 220,
                ease: 'Back.Out',
                onComplete: () => {
                    this.tweens.add({
                        targets: text,
                        alpha: 0,
                        scale: 1.5,
                        duration: 350,
                        delay: isFight ? 600 : 400, // Hold 'FIGHT!' slightly longer
                        ease: 'Power1',
                        onComplete: () => {
                            text.destroy();
                            index++;
                            showNextNumber();
                        }
                    });
                }
            });
        };

        showNextNumber();
    }

    showEndScreen(message) {
        this.roundOver = true; // Ensure game state reflects end
        this.waitingStart = true; // Prevent actions
        const w = this.cameras.main.width, h = this.cameras.main.height;

        const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x181c24, 0.95).setDepth(400).setAlpha(0);
        const endText = this.add.text(w / 2, h / 2 - 40, message + '\nAPERTE ESPAÇO PARA REINICIAR', {
            fontFamily: 'Orbitron, Arial, sans-serif', fontSize: '38px', color: '#fff',
            align: 'center', stroke: '#00fff7', strokeThickness: 4,
            lineSpacing: 15
        }).setOrigin(0.5).setDepth(401).setAlpha(0);

        this.endScreenElements = { overlay, endText };

        // Fade in the end screen
        this.tweens.add({
            targets: [overlay, endText],
            alpha: 1,
            duration: 800,
            ease: 'Power1'
        });

        // Listener to restart the entire game
        this.input.keyboard.once('keydown-SPACE', () => {
            this.tweens.add({
                targets: [overlay, endText],
                alpha: 0,
                duration: 600,
                ease: 'Power1',
                onComplete: () => {
                    Object.values(this.endScreenElements).forEach(el => el.destroy());
                    this.endScreenElements = {};
                    this.restartGame();
                }
            });
        });
    }

    restartGame() {
        console.log('Restarting game...');
        // Reset global game state if needed (e.g., total score across sessions)
        // For now, just restart the scene flow from the beginning
        this.scene.start('PreloadScene', { /* Pass any initial data if needed */ });
        // Or, if just restarting the fight scene with reset stats:
        // this.scene.restart({ currentRound: 1, playerWins: 0, enemyWins: 0 });
    }
}

