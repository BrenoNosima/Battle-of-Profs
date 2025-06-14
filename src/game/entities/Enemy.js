import Phaser from 'phaser';

/**
 * Classe base para todos os inimigos do jogo
 * @extends Phaser.Physics.Arcade.Sprite
 */
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    /**
     * Cria uma nova instância de inimigo
     * @param {Phaser.Scene} scene - Cena Phaser onde o inimigo será adicionado
     * @param {number} x - Posição horizontal inicial
     * @param {number} y - Posição vertical inicial
     * @param {string} texture - Chave da textura do sprite
     * @param {Object} [config] - Configurações opcionais para o inimigo
     * @param {string} [config.animPrefix='enemy'] - Prefixo para as animações
     * @param {number} [config.health=350] - Vida máxima do inimigo
     * @param {number} [config.speed=450] - Velocidade de movimento
     * @param {number} [config.attackDamage=10] - Dano do ataque
     */
    constructor(scene, x, y, texture, config = {}) {
        super(scene, x, y, texture);

        // ======================
        // CONFIGURAÇÃO INICIAL
        // ======================
        
        // Adiciona à cena e física
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // ======================
        // CONFIGURAÇÕES PADRÃO
        // ======================
        
        // Prefixo para animações (pode ser sobrescrito)
        this.animPrefix = config.animPrefix || 'enemy';
        
        // Sistema de vida
        this.maxHealth = config.health || 350;
        this.health = this.maxHealth;
        
        // Sistema de combate
        this.attackCooldown = false;
        this.attackDamage = config.attackDamage || 10;
        this.attackRange = 80;
        this.attackCooldownTime = 1200;
        
        // Movimentação
        this.speed = config.speed || 450;
        this.pursuitRange = 1000;
        this.jumpPower = -900;
        this.gravity = 2000;
        
        // ======================
        // CONFIGURAÇÃO FÍSICA
        // ======================
        
        this.setScale(1);
        this.setCollideWorldBounds(true);
        this.setBounce(0.1);
        this.setSize(60, 140);
        this.setOffset(47, 15);
        this.setGravityY(this.gravity);
        
        // ======================
        // APARÊNCIA
        // ======================
        
        this.baseTint = 0x00ffff; // Cor base (cian)
        this.setTint(this.baseTint);
    }

    // ======================
    // MÉTODOS PRINCIPAIS
    // ======================

    /**
     * Atualiza o estado do inimigo a cada frame
     * @param {Phaser.Physics.Arcade.Sprite} player - Referência ao jogador
     */
    update(player) {
        if (this.shouldSkipUpdate()) {
            this.handleInactiveState();
            return;
        }

        const distance = this.calculateDistanceTo(player);
        this.updateDirection(player);
        
        if (this.shouldJump(distance)) {
            this.jump();
        }

        this.handleAIBehavior(player, distance);
        this.updateAirAnimation();
    }

    /**
     * Lógica principal de IA
     * @param {Phaser.Physics.Arcade.Sprite} player 
     * @param {number} distance 
     */
    handleAIBehavior(player, distance) {
        if (distance < this.attackRange) {
            this.handleAttackBehavior(player);
        } else if (distance < this.pursuitRange) {
            this.handlePursuitBehavior(player);
        } else {
            this.handleIdleBehavior();
        }
    }


    /**
     * Executa um ataque contra o jogador
     * @param {Phaser.Physics.Arcade.Sprite} player - Alvo do ataque
     */
    attack(player) {
        if (this.cannotAttack()) return;

        this.startAttack();
        this.play(`${this.animPrefix}-attack`, true);

        if (this.isPlayerInAttackRange(player)) {
            this.applyAttackEffects(player);
        }

        this.createAttackEffect();
        this.startAttackCooldown();
    }

    /**
     * Aplica dano ao inimigo
     * @param {number} amount - Quantidade de dano
     */
    takeDamage(amount) {
        if (this.isDefeated()) return;

        this.health = Phaser.Math.Clamp(this.health - amount, 0, this.maxHealth);
        this.showDamageFeedback();
    }

    // ======================
    // MÉTODOS AUXILIARES
    // ======================

    /**
     * Verifica se o update deve ser ignorado
     * @returns {boolean}
     */
    shouldSkipUpdate() {
        return this.scene.roundOver || this.attackCooldown || this.health <= 0;
    }

    /**
     * Calcula distância para o jogador
     * @param {Phaser.Physics.Arcade.Sprite} player 
     * @returns {number}
     */
    calculateDistanceTo(player) {
        return Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    }

    /**
     * Atualiza direção do sprite baseado na posição do jogador
     * @param {Phaser.Physics.Arcade.Sprite} player 
     */
    updateDirection(player) {
        this.flipX = player.x < this.x;
    }

    /**
     * Verifica se deve pular
     * @param {number} distance 
     * @returns {boolean}
     */
    shouldJump(distance) {
        return distance < 200 && Phaser.Math.Between(0, 1000) < 5;
    }

    /**
     * Lida com o estado inativo
     */
    handleInactiveState() {
        if (this.body.velocity.x !== 0) {
            this.setVelocityX(0);
        }
        
        if (!this.attackCooldown && 
            !this.isPlayingAnimation(`${this.animPrefix}-idle`) && 
            !this.isPlayingAnimation(`${this.animPrefix}-attack`)) {
            this.play(`${this.animPrefix}-idle`, true);
        }
    }

    /**
     * Atualiza animação quando no ar
     */
    updateAirAnimation() {
        if (!this.body.onFloor() && !this.isPlayingAnimation(`${this.animPrefix}-jump`)) {
            this.play(`${this.animPrefix}-jump`, true);
        }
    }


    /**
     * Comportamento de ataque
     * @param {Phaser.Physics.Arcade.Sprite} player 
     */
    handleAttackBehavior(player) {
        this.setVelocityX(0);
        
        if (!this.attackCooldown) {
            this.attack(player);
        } else if (!this.isPlayingAnimation(`${this.animPrefix}-attack`)) {
            this.play(`${this.animPrefix}-idle`, true);
        }
    }

    /**
     * Comportamento de perseguição
     * @param {Phaser.Physics.Arcade.Sprite} player 
     */
    handlePursuitBehavior(player) {
        const direction = player.x < this.x ? -1 : 1;
        this.setVelocityX(this.speed * direction);
        
        if (!this.isPlayingAnimation(`${this.animPrefix}-walk`)) {
            this.play(`${this.animPrefix}-walk`, true);
        }
    }

    /**
     * Comportamento idle
     */
    handleIdleBehavior() {
        this.setVelocityX(0);
        if (!this.isPlayingAnimation(`${this.animPrefix}-idle`)) {
            this.play(`${this.animPrefix}-idle`, true);
        }
    }

    /**
     * Verifica se está reproduzindo uma animação específica
     * @param {string} animKey 
     * @returns {boolean}
     */
    isPlayingAnimation(animKey) {
        return this.anims.currentAnim?.key === animKey;
    }

    /**
     * Verifica se pode atacar
     * @returns {boolean}
     */
    cannotAttack() {
        return this.attackCooldown || this.scene.roundOver || this.health <= 0;
    }

    /**
     * Inicia o ataque
     */
    startAttack() {
        this.attackCooldown = true;
    }

    /**
     * Verifica se jogador está no alcance
     * @param {Phaser.Physics.Arcade.Sprite} player 
     * @returns {boolean}
     */
    isPlayerInAttackRange(player) {
        return this.calculateDistanceTo(player) < this.attackRange + 20;
    }

    /**
     * Aplica efeitos do ataque
     * @param {Phaser.Physics.Arcade.Sprite} player 
     */
    applyAttackEffects(player) {
        this.scene.damagePlayer(this.attackDamage);
        
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        player.setVelocity(
            Math.cos(angle) * 300,
            Math.sin(angle) * 150 - 100
        );
    }

    /**
     * Cria efeito visual de ataque
     */
    createAttackEffect() {
        const attackDirection = this.flipX ? -1 : 1;
        const effect = this.scene.add.circle(
            this.x + (attackDirection * 60),
            this.y - 30,
            15,
            0x00ffff,
            0.7
        ).setDepth(5);

        this.scene.tweens.add({
            targets: effect,
            scale: { from: 0.5, to: 2.5 },
            alpha: { from: 0.8, to: 0 },
            duration: 300,
            ease: 'Power2',
            onComplete: () => effect.destroy()
        });
    }

    /**
     * Inicia cooldown do ataque
     */
    startAttackCooldown() {
        this.scene.time.delayedCall(this.attackCooldownTime, () => {
            this.attackCooldown = false;
        });
    }

    /**
     * Mostra feedback visual de dano
     */
    showDamageFeedback() {
        this.setTintFill(0xff0000);
        this.scene.time.delayedCall(150, () => {
            this.clearTint();
            this.setTint(this.baseTint);
        });
    }

    /**
     * Verifica se está derrotado
     * @returns {boolean}
     */
    isDefeated() {
        return this.health <= 0;
    }

    /**
     * Reseta a vida do inimigo
     */
    resetHealth() {
        this.health = this.maxHealth;
    }

    /**
     * Executa um pulo
     */
    jump() {
        if (this.body.onFloor()) {
            this.setVelocityY(this.jumpPower);
        }
    }
    reset(x, y, health) {
        this.setPosition(x, y);
        if (health !== undefined) this.health = health;
        this.setVelocity(0, 0);
        this.attackCooldown = false;
        this.clearTint();
        this.setTint(this.baseTint);
        this.play(`${this.animPrefix}-idle`, true);
    }
}