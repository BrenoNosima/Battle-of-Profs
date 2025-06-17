import Enemy from './Enemy.js';

/**
 * Classe do inimigo Cidão
 * @extends Enemy
 */
export default class Cidao extends Enemy {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture, {
            animPrefix: 'cidao',
            health: 120,
            speed: 250,
            attackDamage: 15
        });
        
        // Ajustes específicos de física
        this.attackRange = 85;
        this.attackCooldownTime = 1100;
        this.pursuitRange = 800;
    }
    
    /**
     * Ataque especial do Cidão
     */
    specialAttack(player) {
        if (this.cannotAttack()) return;
        
        this.startAttack();
        this.play(`${this.animPrefix}-special`, true);

        // Toca o áudio do super ataque
        if (this.scene.sound) {
            this.scene.sound.play('super');
        }
        
        // Efeito especial do Cidão - ataque de longo alcance
        const attackRange = 200;
        const distance = this.calculateDistanceTo(player);
        
        if (distance < attackRange) {
            this.applyAttackEffects(player);
            // Dano do ataque especial
            this.scene.damagePlayer(this.attackDamage + 3);
        }
        
        this.createSpecialAttackEffect();
        this.startAttackCooldown();
    }
    
    /**
     * Cria efeito visual do ataque especial
     */
    createSpecialAttackEffect() {
        const attackDirection = this.flipX ? -1 : 1;
        
        // Cria múltiplos projéteis visuais
        for (let i = 0; i < 3; i++) {
            const effect = this.scene.add.circle(
                this.x + (attackDirection * (80 + i * 40)),
                this.y - 30 + (i * 10),
                8,
                0x00ff00,
                0.8
            ).setDepth(5);

            this.scene.tweens.add({
                targets: effect,
                scale: { from: 0.5, to: 1.5 },
                alpha: { from: 1, to: 0 },
                duration: 400 + (i * 100),
                ease: 'Power2',
                onComplete: () => effect.destroy()
            });
        }
    }
    
    /**
     * Lógica de IA específica do Cidão
     */
    handleAIBehavior(player, distance) {
        // 15% de chance de usar ataque especial quando em alcance médio
        if (distance < 150 && distance > 80 && Phaser.Math.Between(0, 100) < 15) {
            this.specialAttack(player);
            return;
        }
        
        // Comportamento padrão
        super.handleAIBehavior(player, distance);
    }
    
    /**
     * Comportamento de perseguição mais agressivo
     */
    handlePursuitBehavior(player) {
        const direction = player.x < this.x ? -1 : 1;
        // Cidão é mais rápido na perseguição
        this.setVelocityX(this.speed * direction * 1.2);
        
        if (!this.isPlayingAnimation(`${this.animPrefix}-walk`)) {
            this.play(`${this.animPrefix}-walk`, true);
        }
    }
}

