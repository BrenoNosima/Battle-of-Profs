import Phaser from 'phaser';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);

        this.scene = scene;
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.health = 350;
        this.attackCooldown = false;
        this.speed = 450; // Slower speed for the enemy
        this.attackRange = 80; // Range to initiate attack
        this.pursuitRange = 1000; // Range to start chasing
        this.attackDamage = 10;

        this.setScale(0.7);
        this.setCollideWorldBounds(true);
        this.setBounce(0.1);
        this.setSize(60, 200); // Adjust hitbox
        this.setOffset(70, 10); // Adjust offset
        this.setTint(0x00ffff); // Distinguishing color

        console.log("Enemy: Entidade criada");
    }

    update(player) { // Receive player reference for AI
        if (this.scene.roundOver || this.attackCooldown || this.health <= 0) {
            // Stop moving if round is over, attacking, or defeated
            if (this.body.velocity.x !== 0) this.setVelocityX(0);
            // Ensure idle animation if not attacking
            if (!this.attackCooldown && this.anims.currentAnim?.key !== 'enemy-idle' && this.anims.currentAnim?.key !== 'enemy-attack') {
                this.play('enemy-idle', true);
            }
            return;
        }

        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        

        // Update direction based on player position
        if (player.x < this.x) {
            this.flipX = true;
        } else {
            this.flipX = false;
        }

        if (distance < 200 && Phaser.Math.Between(0, 1000) < 5) {
            this.jump();
        }

        // AI Behavior
        if (distance < this.attackRange) {
            // Close enough to attack
            this.setVelocityX(0); // Stop moving to attack
            if (!this.attackCooldown) {
                this.attack(player);
            }
             // Play idle animation if not attacking (attack method handles attack anim)
             else if (this.anims.currentAnim?.key !== 'enemy-attack') {
                 this.play('enemy-idle', true);
             }

        } else if (distance < this.pursuitRange) {
            // Within pursuit range, move towards player
            const direction = (player.x < this.x) ? -1 : 1;
            this.setVelocityX(this.speed * direction);
            if (this.anims.currentAnim?.key !== 'enemy-walk') {
                 this.play('enemy-walk', true);
            }
        } else {
            // Too far, stand idle
            this.setVelocityX(0);
             if (this.anims.currentAnim?.key !== 'enemy-idle') {
                 this.play('enemy-idle', true);
            }
        }
        if (!this.body.onFloor() && this.anims.currentAnim?.key !== 'enemy-jump') {
            this.play('enemy-jump', true);
        }
    }

    attack(player) {
        if (this.attackCooldown || this.scene.roundOver || this.health <= 0) return;

        console.log("Enemy: Atacando");
        this.attackCooldown = true;
        this.play('enemy-attack', true);

        // Check distance again just before dealing damage
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        if (distance < this.attackRange + 20) { // Slightly larger check range for attack hit
            // Call scene method to damage player
            this.scene.damagePlayer(this.attackDamage);

            // Apply knockback to player
            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            player.setVelocity(
                Math.cos(angle) * 300,
                Math.sin(angle) * 150 - 100 // Add slight upward impulse
            );
        }

        // Create visual effect
        this.createAttackEffect();

        // Cooldown timers
        this.scene.time.delayedCall(500, () => { // Duration of attack animation/action
            // Can return to idle/walk animation after this, handled by update
        });

        this.scene.time.delayedCall(1200, () => { // Total cooldown period
            this.attackCooldown = false;
            console.log("Enemy: Cooldown de ataque finalizado");
        });
    }

    createAttackEffect() {
        const attackDirection = this.flipX ? -1 : 1;
        const effectX = this.x + (attackDirection * 60);
        const effectY = this.y - 30;

        const attackEffect = this.scene.add.circle(effectX, effectY, 15, 0x00ffff, 0.7);
        attackEffect.setDepth(5);

        this.scene.tweens.add({
            targets: attackEffect,
            scale: { from: 0.5, to: 2.5 },
            alpha: { from: 0.8, to: 0 },
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                attackEffect.destroy();
            }
        });
    }

    takeDamage(amount) {
        if (this.health <= 0) return; // Already defeated

        this.health -= amount;
        if (this.health < 0) {
            this.health = 0;
        }
        console.log(`Enemy: Recebeu ${amount} de dano. Vida: ${this.health}`);

        // Visual effect
        this.setTintFill(0xff0000); // Flash red
        this.scene.time.delayedCall(150, () => {
            this.clearTint();
            this.setTint(0x00ffff); // Reapply original tint
        });

        // Stop current attack if damaged
        // if (this.attackCooldown) {
        //     this.attackCooldown = false; // Allow interruption? Optional.
        // }

        // Death logic is checked in the scene (checkRoundEnd)
    }

    jump() {
        if (this.body.onFloor()) {
            this.setVelocityY(-900); // Ajustar altura do salto
            console.log("Enemy: Saltando");
            this.setGravityY(2000); // Aumenta a gravidade para cair mais rápido
        }
    }
}