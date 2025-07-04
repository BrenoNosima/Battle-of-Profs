import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);

        this.scene = scene; // Guardar referência da cena
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.health = 250;
        this.attackCooldown = false;
        this.blockCooldown = false; // Inicializa blockCooldown como false
        this.dashCooldown = false;  // Inicializa dashCooldown como false
        this.isBlocking = false;    // Inicializa isBlocking como false
        this.speed = 400;
        this.attackRange = 100;
        this.attackDamage = 20
        0;

        // Player.js (construtor) - versão limpa
        scene.physics.add.existing(this);
        this.body.setGravityY(2000);
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(0.1);
        this.body.setSize(60, 100); // Ajuste para valor menor que a sprite
        this.body.setOffset(40, 70);

        this.setScale(2);


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

        // Dash com X
        if (Phaser.Input.Keyboard.JustDown(keys.dash) && !this.dashCooldown) {
            console.log("Player: Executando dash");
            this.dash();
            return; // Retorna para evitar outras ações durante o dash
        }

        // BLOQUEIO COM SHIFT
        if (keys.block.isDown && !this.blockCooldown) {
            this.startBlock();
            return;
        } else if (this.isBlocking && !keys.block.isDown) {
            this.stopBlock();
            // Deixa seguir para idle ou outras animações
        } else if (this.isBlocking) {
            // Se ainda está bloqueando (ex: cooldown), não faz mais nada
            return;
        }

        // Movimento com A e D
        if (keys.left.isDown) {
            this.setVelocityX(-this.speed); //move o jogador para esquerda(velocidade negativa)
            this.flipX = true; // Virar para a esquerda
            if (!this.anims.isPlaying || this.anims.currentAnim.key !== 'player-walk') { // nesse caso se nao esiver atacando, ou trocando de animação faz a troca de sprite de andar
                 if (!this.attackCooldown) this.play('player-walk', true);
            }
        } else if (keys.right.isDown) {
            this.setVelocityX(this.speed); // move o jogador para direita(velocidade positiva)
            this.flipX = false; // Virar para a direita
             if (!this.anims.isPlaying || this.anims.currentAnim.key !== 'player-walk') { // se nesse caso não estiver atacando, ou trocando de animação faz a troca de sprite de andar
                 if (!this.attackCooldown) this.play('player-walk', true);
            }
        } else {
            // Se não estiver se movendo nem atacando, voltar para idle(sprite parado)
            if (!this.attackCooldown && (!this.anims.isPlaying || this.anims.currentAnim.key !== 'player-idle')) {
                 if (this.anims.currentAnim?.key !== 'player-attack') { // Evitar interromper ataque
                    this.play('player-idle', true);
                 }
            }
        }


        this.isGrounded = this.body.onFloor();

        if (keys.jump.isDown && this.isGrounded && !this.isBlocking) {
            this.setVelocityY(-1100); // Mantenha apenas um valor de pulo
            this.isGrounded = false;
            this.play('player-jump', true);
            // Remova o setGravityY duplicado (já está no construtor)
        }
        // Se estiver no ar, garante que está na animação de pulo
        if (!this.body.onFloor() && this.anims.currentAnim?.key !== 'player-jump') { // se o personagem não está tocando o chão e a animação não é a de pulo
            this.play('player-jump', true);
        }
        // Volta para idle ao aterrissar
        if (this.body.onFloor() && this.anims.currentAnim?.key === 'player-jump') { // se o personagem estiver no chão e animação for de pulo
            this.play('player-idle', true);
        }

        // Ataque com espaço
        if (Phaser.Input.Keyboard.JustDown(keys.attack) && !this.attackCooldown) { // só vai ocorrer se for clicado espaço e se nao estiver em cooldown
            this.attack();
        }
    }

    attack() {
        if (this.attackCooldown || this.scene.roundOver || this.isBlocking || !this.body.onFloor()) return; // se caso alguma dessas condições for verdadeira ele não ataca
        //se estiver em cooldown    round acabou            o jogador está bloqueando     estiver fora do chão

        console.log("Player: Atacando");
        this.attackCooldown = true;
        this.play('player-attack', true);

        this.scene.sound.play('punch'); // Toca o som do ataque

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

        this.scene.time.delayedCall(800, () => { // Cooldown total
            this.attackCooldown = false;
            console.log("Player: Cooldown de ataque finalizado");
        });
    }

    createAttackEffect() {
        const attackDirection = this.flipX ? -1 : 1;// basicamente ve para onde o personagem está apontado e solta na direção
        const effectX = this.x + (attackDirection * 60); // Ajustar posição do efeito
        const effectY = this.y - 30; // Ajustar altura do efeito

        const attackEffect = this.scene.add.circle(effectX, effectY, 15, 0xffff00, 0.7);//aquela animação de bolinha quando bate
        attackEffect.setDepth(5); // Garantir que fique visível

        this.scene.tweens.add({ // aqui basicamente é animação do efeito criado 
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

    takeDamage(amount) { // é chamada lá no FightScene.js

        // 1. Se estiver bloqueando, ignora o dano
        if (this.isBlocking) {
            console.log("Ataque bloqueado! Sem dano recebido.");
            return; // Sai da função, não toma dano
        }

        // 2. Se já está com vida zero ou menor, não faz nada
        if (this.health <= 0) return; // Já derrotado

        // 3. Subtrai o valor do dano da vida atual
        this.health -= amount;

        // 4. Se a vida ficou menor que zero, ajusta para zero
        if (this.health < 0) {
            this.health = 0;
        }

        // 5. Mostra no console quanto de dano foi recebido e a vida atual
        console.log(`Player: Recebeu ${amount} de dano. Vida: ${this.health}`);

        // 6. Efeito visual: faz o personagem piscar em vermelho
        this.setTintFill(0xff0000);

        // 7. Após 150ms, remove o efeito visual (volta ao normal)
        this.scene.time.delayedCall(150, () => {
            this.clearTint();
        });
    }

    startBlock() {  // metodo que ativa a defesa do jogador
        if (this.blockCooldown) return;
        
        console.log("Player: Iniciando bloqueio");
        this.isBlocking = true;
        
        this.play('player-block', true); // Sempre força a animação de defesa
    }

    stopBlock() {
        if (this.isBlocking) {
            console.log("Player: Parando bloqueio");
            this.isBlocking = false;
            this.blockSprite.setVisible(false);
            this.clearTint();
            this.play('player-idle', true);

            this.scene.sound.play('block'); // Toca o som do bloqueio

            // Inicia cooldown de bloqueio
            this.blockCooldown = true;

            // Cria barra de cooldown se não existir
            if (!this.blockBar) {
                this.blockBarBg = this.scene.add.rectangle(this.x, this.y - 140, 60, 10, 0x222222, 0.7).setDepth(20);
                this.blockBar = this.scene.add.rectangle(this.x, this.y - 140, 60, 10, 0x00ff00, 1).setDepth(21);
            }
            this.blockBarBg.setVisible(true);
            this.blockBar.setVisible(true);
            this.blockBar.width = 0;
            this.blockBar.x = this.x;
            this.blockBarBg.x = this.x;
            this.blockBar.y = this.y - 140;
            this.blockBarBg.y = this.y - 140;

            // Tween para animar a barra durante o cooldown
            this.scene.tweens.add({
                targets: this.blockBar,
                width: 60,
                duration: 500,
                onUpdate: () => {
                    this.blockBar.x = this.x - 30 + this.blockBar.width / 2;
                    this.blockBarBg.x = this.x;
                    this.blockBar.y = this.y - 140;
                    this.blockBarBg.y = this.y - 140;
                },
                onComplete: () => {
                    this.blockBar.setVisible(false);
                    this.blockBarBg.setVisible(false);
                }
            });

            this.scene.time.delayedCall(500, () => {
                this.blockCooldown = false;
                console.log("Player: Cooldown de bloqueio finalizado");
                // Se o jogador ainda estiver segurando SHIFT, volta a bloquear automaticamente
                if (this.scene.keys && this.scene.keys.block && this.scene.keys.block.isDown) {
                    this.startBlock();
                }
            });
        }
    }
    
    // Função de dash: agora com cooldown de 1000ms e indicador de carregamento na tela
    dash() {
        // Se estiver em cooldown, não permite novo dash
        if (this.dashCooldown) return;

        console.log("Player: Executando dash");
        
        // Direção do dash: para onde o player está olhando
        const dashDirection = this.flipX ? -1 : 1;
        const dashSpeed = 300; // 5x mais rápido que o normal
        const dashDuration = 1000; // duração do dash em ms
        const dashCooldownTime = 1000; // cooldown de 1000ms

        // Não altera a gravidade durante o dash (mantém a gravidade normal)

        // Torna o jogador invulnerável durante o dash
        this.isInvulnerable = true;

        this.scene.sound.play('dash'); // Toca o som do dash

        // Animação de dash (opcional)
        this.play('player-dash', true);

        // Aplica a distância do dash instantaneamente
        this.x += dashDirection * dashSpeed * (dashDuration / 1000);

        // Efeito visual (opcional)
        this.setAlpha(0.7);

        // Exibe barra de carregamento na tela
        if (!this.dashBar) {
            // Cria a barra uma vez
            this.dashBarBg = this.scene.add.rectangle(this.x, this.y - 120, 60, 10, 0x222222, 0.7).setDepth(20);
            this.dashBar = this.scene.add.rectangle(this.x, this.y - 120, 60, 10, 0x00ffff, 1).setDepth(21);
        }
        this.dashBarBg.setVisible(true);
        this.dashBar.setVisible(true);
        this.dashBar.width = 0;
        this.dashBar.x = this.x;
        this.dashBarBg.x = this.x;
        this.dashBar.y = this.y - 120;
        this.dashBarBg.y = this.y - 120;

        // Atualiza barra durante o cooldown
        this.scene.tweens.add({
            targets: this.dashBar,
            width: 60,
            duration: dashCooldownTime,
            onUpdate: () => {
                this.dashBar.x = this.x - 30 + this.dashBar.width / 2;
                this.dashBarBg.x = this.x;
                this.dashBar.y = this.y - 120;
                this.dashBarBg.y = this.y - 120;
            },
            onComplete: () => {
                this.dashBar.setVisible(false);
                this.dashBarBg.setVisible(false);
            }
        });

        // Cooldown do dash
        this.dashCooldown = true;
        this.scene.time.delayedCall(dashCooldownTime, () => {
            this.dashCooldown = false;
            console.log("Player: Cooldown de dash finalizado");
        });

        // Mantém a invulnerabilidade durante todo o cooldown do dash
        this.scene.time.delayedCall(dashCooldownTime, () => {
            this.isInvulnerable = false;
            this.setAlpha(1);
            // Volta para idle se não estiver se movendo
            if (
                !this.attackCooldown &&
                this.scene.keys &&
                !this.scene.keys.left.isDown &&
                !this.scene.keys.right.isDown
            ) {
                this.play('player-idle', true);
            }
        });
    }

    reset(x, y, health) {
        this.setPosition(x, y);
        if (health !== undefined) this.health = health;
        this.setVelocity(0, 0);
        this.attackCooldown = false;
        this.blockCooldown = false;
        this.dashCooldown = false;
        this.isBlocking = false;
        this.setAlpha(1);
        this.clearTint();
        // Reseta barra de bloqueio/dash se necessário
        if (this.blockBar) this.blockBar.setVisible(false);
        if (this.blockBarBg) this.blockBarBg.setVisible(false);
        if (this.dashBar) this.dashBar.setVisible(false);
        if (this.dashBarBg) this.dashBarBg.setVisible(false);
        this.blockSprite.setVisible(false);
        this.play('player-idle', true);
    }

}
