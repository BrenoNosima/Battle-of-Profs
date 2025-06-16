import Enemy from './Enemy.js';

/**
 * Classe do inimigo Moreno
 * @extends Enemy
 */
export default class Moreno extends Enemy {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture, {
            animPrefix: 'moreno',
            health: 100,
            speed: 200,
            attackDamage: 8
        });
        
        // Configurações específicas do Moreno
        this.baseTint = 0xffa500; // Laranja
        this.setTint(this.baseTint);
        
        // Ajustes específicos de física se necessário
        this.attackRange = 75;
        this.attackCooldownTime = 1000;
    }
    
    /**
     * Ataque especial do Moreno
     */
    specialAttack(player) {
        if (this.cannotAttack()) return;
        
        this.startAttack();
        this.play(`${this.animPrefix}-special`, true);
        
        // Efeito especial do Moreno - ataque em área
        const attackRadius = 120;
        const distance = this.calculateDistanceTo(player);
        
        if (distance < attackRadius) {
            this.applyAttackEffects(player);
            // Dano extra do ataque especial
            this.scene.damagePlayer(this.attackDamage + 5);
        }
        
        this.createSpecialAttackEffect();
        this.startAttackCooldown();
    }
    
    /**
     * Cria efeito visual do ataque especial
     */
    createSpecialAttackEffect() {
        const effect = this.scene.add.circle(
            this.x,
            this.y - 30,
            60,
            0xffa500,
            0.5
        ).setDepth(5);

        this.scene.tweens.add({
            targets: effect,
            scale: { from: 0.2, to: 2 },
            alpha: { from: 0.8, to: 0 },
            duration: 500,
            ease: 'Power2',
            onComplete: () => effect.destroy()
        });
    }
    
    /**
     * Lógica de IA específica do Moreno
     */
    handleAIBehavior(player, distance) {
        // 10% de chance de usar ataque especial quando próximo
        if (distance < this.attackRange && Phaser.Math.Between(0, 100) < 10) {
            this.specialAttack(player);
            return;
        }
        
        // Comportamento padrão
        super.handleAIBehavior(player, distance);
    }
}

