import Enemy from './Enemy.js';

/**
 * Classe do inimigo Hugo
 * @extends Enemy
 */
export default class Hugo extends Enemy {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture, {
            animPrefix: 'hugo',
            health: 150,
            speed: 300,
            attackDamage: 15
        });
        
        // Ajustes específicos de física - Hugo é o boss final
        this.attackRange = 90;
        this.attackCooldownTime = 1300;
        this.pursuitRange = 900;
        this.jumpPower = -1000; // Pula mais alto
    }
    
    /**
     * Ataque especial do Hugo
     */
    specialAttack(player) {
        if (this.cannotAttack()) return;
        
        this.startAttack();
        this.play(`${this.animPrefix}-special`, true);

        // Toca o áudio do super ataque
        if (this.scene.sound) {
            this.scene.sound.play('super');
        }
        
        // Efeito especial do Hugo - ataque devastador
        const attackRange = 100;
        const distance = this.calculateDistanceTo(player);
        
        if (distance < attackRange) {
            this.applyAttackEffects(player);
            // Dano alto do ataque especial do boss
            this.scene.damagePlayer(this.attackDamage + 8);
            
            // Efeito de knockback mais forte
            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            player.setVelocity(
                Math.cos(angle) * 500,
                Math.sin(angle) * 200 - 150
            );
        }
        
        this.createSpecialAttackEffect();
        this.startAttackCooldown();
    }
    
    /**
     * Cria efeito visual do ataque especial
     */
    createSpecialAttackEffect() {
        // Efeito de explosão para o boss
        const effect = this.scene.add.circle(
            this.x,
            this.y - 30,
            80,
            0xff0000,
            0.6
        ).setDepth(5);

        // Efeito de onda de choque
        const shockwave = this.scene.add.circle(
            this.x,
            this.y,
            20,
            0xffff00,
            0.4
        ).setDepth(4);

        this.scene.tweens.add({
            targets: effect,
            scale: { from: 0.1, to: 2.5 },
            alpha: { from: 0.8, to: 0 },
            duration: 600,
            ease: 'Power3',
            onComplete: () => effect.destroy()
        });

        this.scene.tweens.add({
            targets: shockwave,
            scale: { from: 0.5, to: 4 },
            alpha: { from: 0.6, to: 0 },
            duration: 800,
            ease: 'Power2',
            onComplete: () => shockwave.destroy()
        });
    }
    
    /**
     * Lógica de IA específica do Hugo (mais agressiva)
     */
    handleAIBehavior(player, distance) {
        // 20% de chance de usar ataque especial quando próximo (boss é mais agressivo)
        if (distance < this.attackRange && Phaser.Math.Between(0, 100) < 20) {
            this.specialAttack(player);
            return;
        }
        
        // 5% de chance de pular agressivamente
        if (distance < 300 && Phaser.Math.Between(0, 1000) < 50) {
            this.jump();
        }
        
        // Comportamento padrão
        super.handleAIBehavior(player, distance);
    }
    
    /**
     * Comportamento de ataque mais agressivo
     */
    handleAttackBehavior(player) {
        this.setVelocityX(0);
        
        if (!this.attackCooldown) {
            // Hugo tem chance de fazer combo de ataques
            if (Phaser.Math.Between(0, 100) < 30) {
                this.attack(player);
                // Segundo ataque após um delay
                this.scene.time.delayedCall(400, () => {
                    if (!this.scene.roundOver && this.health > 0) {
                        this.attack(player);
                    }
                });
            } else {
                this.attack(player);
            }
        } else if (!this.isPlayingAnimation(`${this.animPrefix}-attack`)) {
            this.play(`${this.animPrefix}-idle`, true);
        }
    }
    
    /**
     * Hugo recebe menos dano (resistência de boss)
     */
    takeDamage(amount) {
        // Reduz o dano recebido em 20%
        const reducedDamage = Math.floor(amount * 0.8);
        super.takeDamage(reducedDamage);
    }
}

