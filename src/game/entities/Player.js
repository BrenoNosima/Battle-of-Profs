import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);

        this.scene = scene; // Guardar referência da cena
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.health = 250;
        this.attackCooldown = false;
        this.speed = 360;
        this.attackRange = 100;
        this.attackDamage = 20;

        this.setScale(0.7);
        this.setCollideWorldBounds(true);
        this.setBounce(0.1);
        this.setSize(100, 200); // Ajustar hitbox
        this.setOffset(70, 80); // Ajustar offset da hitbox se necessário

        console.log("Player: Entidade criada");

        this.blockSprite = scene.add.sprite(this.x, this.y, 'moreno_escudo');
        this.blockSprite.setVisible(false);
        this.blockSprite.setDepth(10); // Ficar acima do jogador
        this.blockSprite.setScale(1.2);
        this.blockSprite.setOrigin(0.5);
    }

    update(keys) {
        // Resetar velocidade horizontal (manter vertical para gravidade)
        this.setVelocityX(0);
        this.blockSprite.setPosition(this.x, this.y);


        // Movimento com A e D
        if (keys.a.isDown) {
            this.setVelocityX(-this.speed);
            this.flipX = true; // Virar para a esquerda
            if (!this.anims.isPlaying || this.anims.currentAnim.key !== 'player-walk') {
                 if (!this.attackCooldown) this.play('player-walk', true);
            }
        } else if (keys.d.isDown) {
            this.setVelocityX(this.speed);
            this.flipX = false; // Virar para a direita
             if (!this.anims.isPlaying || this.anims.currentAnim.key !== 'player-walk') {
                 if (!this.attackCooldown) this.play('player-walk', true);
            }
        } else {
            // Se não estiver se movendo nem atacando, voltar para idle
            if (!this.attackCooldown && (!this.anims.isPlaying || this.anims.currentAnim.key !== 'player-idle')) {
                 if (this.anims.currentAnim?.key !== 'player-attack') { // Evitar interromper ataque
                    this.play('player-idle', true);
                 }
            }
        }

        // Pulo com W
        if (keys.w.isDown && this.body.onFloor()) {
            this.setVelocityY(-500); // Ajustar altura do pulo
            console.log("Player: Pulando");
        }

        // Ataque com espaço
        if (Phaser.Input.Keyboard.JustDown(keys.space) && !this.attackCooldown) {
            this.attack();
        }

         if (keys.shift.isDown) {
        this.startBlock();
        } else {
            this.stopBlock();
        }
    }

    attack() {
        if (this.attackCooldown || this.scene.roundOver) return;

        console.log("Player: Atacando");
        this.attackCooldown = true;
        this.play('player-attack', true);

        // Referência ao inimigo (obtida da cena)
        const enemy = this.scene.enemy;

        // Verificar se o inimigo está no alcance
        const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);

        if (distance < this.attackRange) {
            // Chamar método da cena para causar dano e empurrar
            this.scene.damageEnemy(this.attackDamage);

            // Empurrar o inimigo (a cena pode lidar com isso ou a entidade)
            const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
            enemy.setVelocity(
                Math.cos(angle) * 300,
                Math.sin(angle) * 150 - 100 // Adicionar um leve impulso para cima
            );
        }

        // Criar efeito visual de ataque (pode ser um método separado)
        this.createAttackEffect();

        // Terminar ataque após animação e cooldown
        this.scene.time.delayedCall(300, () => { // Duração da animação/ataque
             // Voltar para idle se não estiver se movendo
             // A verificação já existe no update, mas podemos forçar aqui se necessário
             // if (!this.scene.keys.a.isDown && !this.scene.keys.d.isDown) {
             //    this.play('player-idle', true);
             // }
        });

        this.scene.time.delayedCall(800, () => { // Cooldown total
            this.attackCooldown = false;
            console.log("Player: Cooldown de ataque finalizado");
        });
    }

    createAttackEffect() {
        const attackDirection = this.flipX ? -1 : 1;
        const effectX = this.x + (attackDirection * 60); // Ajustar posição do efeito
        const effectY = this.y - 30; // Ajustar altura do efeito

        const attackEffect = this.scene.add.circle(effectX, effectY, 15, 0xffff00, 0.7);
        attackEffect.setDepth(5); // Garantir que fique visível

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

         if (this.isBlocking) {
            console.log("Ataque bloqueado! Sem dano recebido.");
            return; // bloqueia o dano
        }

        if (this.health <= 0) return; // Já derrotado

        this.health -= amount;
        if (this.health < 0) {
            this.health = 0;
        }
        console.log(`Player: Recebeu ${amount} de dano. Vida: ${this.health}`);

        // Efeito visual de dano (piscar em vermelho)
        this.setTintFill(0xff0000);
        this.scene.time.delayedCall(150, () => {
            this.clearTint();
        });

    }

    startBlock() {
    if (!this.isBlocking) {
        this.isBlocking = true;
        this.blockSprite.setVisible(true);
        this.setTint(0x00ffff); // Visual extra
        this.play('player-block', true); // <-- Troca para animação de bloqueio
        console.log("Player está bloqueando");
    }
}

    stopBlock() {
        if (this.isBlocking) {
            this.isBlocking = false;
            this.blockSprite.setVisible(false);
            this.clearTint();
            this.play('player-idle', true); // <-- Volta para idle
            console.log("Player parou de bloquear");
        }
    }

}

