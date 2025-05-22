<!--
  phaser-vue-ajustado.vue
  
  Versão com ajustes visuais:
  - Sem plataformas pretas
  - Personagens alinhados ao chão
  - Sprites em tamanho proporcional ao cenário
-->

<template>
  <div class="fullscreen-container">
    <div id="game-container"></div>
  </div>
</template>

<script>
import Phaser from 'phaser';

export default {
  name: 'PhaserVueAjustado',
  
  data() {
    return {
      game: null,
      playerHealth: 100,
      enemyHealth: 100,
      currentRound: 1,
      totalRounds: 3,
      playerWins: 0,
      enemyWins: 0
    };
  },
  
  mounted() {
    this.initGame();
    // Adicionar listener para redimensionar o jogo quando a janela mudar de tamanho
    window.addEventListener('resize', this.resizeGame);
    // Inicializar o tamanho
    this.resizeGame();
  },
  
  beforeDestroy() {
    if (this.game) {
      this.game.destroy(true);
    }
    window.removeEventListener('resize', this.resizeGame);
  },
  
  methods: {
    initGame() {
      // Referência ao componente Vue
      const vueComponent = this;
      
      // Classe de cena personalizada
      class FightScene extends Phaser.Scene {
        constructor() {
          super('FightScene');
          this.player = null;
          this.enemy = null;
          this.keys = null;
          this.playerAttackCooldown = false;
          this.enemyAttackCooldown = false;
          this.roundOver = false;
          this.ground = null;
        }
        
        preload() {
          console.log('Preload iniciado');
          
          // Carregar sprites do jogador
          this.load.spritesheet('player', 'sprite/sprite.png', { frameWidth: 235, frameHeight: 350 });
          
          // Carregar sprites do inimigo (usando o mesmo sprite mas com tint diferente)
          this.load.spritesheet('enemy', 'sprite/sprite.png', { frameWidth: 235, frameHeight: 350 });
          
          // Carregar background
          try {
            this.load.image('background', 'backgrounds/menu.png');
            console.log('Tentando carregar background');
          } catch (e) {
            console.log('Background não encontrado, usando cor padrão');
          }
          
          // Carregar plataforma invisível
          this.load.image('platform', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAUCAYAAAB7wJiVAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAnSURBVHgB7cxBDQAADMOwkb/RpYfYgQT2tgEAAAAAAAAAAADwwAB9pgABKZ/t3QAAAABJRU5ErkJggg==');
        }
        
        create() {
          console.log('Método create chamado!');
          
          // Adicionar background se existir
          if (this.textures.exists('background')) {
            console.log('Background encontrado, adicionando à cena');
            // Usar o tamanho do jogo para o background
            const bg = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background');
            
            // Ajustar o tamanho do background para cobrir toda a tela
            const scaleX = this.cameras.main.width / bg.width;
            const scaleY = this.cameras.main.height / bg.height;
            const scale = Math.max(scaleX, scaleY);
            bg.setScale(scale);
          } else {
            console.log('Background não disponível, usando cor padrão');
          }
          
          // Configurar física com gravidade
          this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
          this.physics.world.gravity.y = 600; // Adicionar gravidade
          
          // Criar apenas o chão (sem plataformas pretas)
          this.createGround();
          
          // Determinar a posição Y do chão (ajustado para o cenário)
          // Baseado na imagem, o chão parece estar a cerca de 85% da altura da tela
          const groundY = this.cameras.main.height * 0.8;
          
          // Criar o jogador
          this.player = this.physics.add.sprite(this.cameras.main.width * 0.3, groundY - 50, 'player');
          this.player.setScale(0.7); // Aumentar escala para ficar proporcional ao cenário
          this.player.setCollideWorldBounds(true);
          this.player.setBounce(0.1);
          this.player.setSize(100, 200); // Ajustar hitbox
          this.player.health = 100;
          
          // Criar o inimigo
          this.enemy = this.physics.add.sprite(this.cameras.main.width * 0.7, groundY - 50, 'enemy');
          this.enemy.setScale(0.7); // Aumentar escala para ficar proporcional ao cenário
          this.enemy.setCollideWorldBounds(true);
          this.enemy.setBounce(0.1);
          this.enemy.setSize(100, 200); // Ajustar hitbox
          this.enemy.setTint(0x00ffff); // Cor diferente para distinguir
          this.enemy.health = 100;
          this.enemy.direction = -1; // Direção para IA
          
          // Configurar colisões
          this.physics.add.collider(this.player, this.ground);
          this.physics.add.collider(this.enemy, this.ground);
          this.physics.add.collider(this.player, this.enemy);
          
          // Criar animações para o jogador e inimigo
          this.createAnimations();
          
          // Iniciar animações idle
          this.player.play('player-idle');
          this.enemy.play('enemy-idle');
          
          // Adicionar teclas A, D e espaço (removendo W)
          this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
          });
          
          // Resetar estado do jogo
          this.roundOver = false;
          vueComponent.playerHealth = 100;
          vueComponent.enemyHealth = 100;
          
          // Adicionar barras de vida diretamente na cena
          this.createHealthBars();
        }
        
        createGround() {
          // Grupo de plataformas estáticas
          this.ground = this.physics.add.staticGroup();
          
          // Determinar a posição Y do chão (ajustado para o cenário)
          // Baseado na imagem, o chão parece estar a cerca de 85% da altura da tela
          const groundY = this.cameras.main.height * 0.85;
          
          // Criar uma plataforma invisível para o chão (sem cor preta)
          const ground = this.ground.create(this.cameras.main.width / 2, groundY, 'platform');
          ground.setScale(this.cameras.main.width / ground.width, 1).refreshBody();
          ground.setAlpha(0); // Tornar a plataforma invisível
        }
        
        createHealthBars() {
          // Container para as barras de vida
          this.healthBarsContainer = this.add.container(0, 20);
          
          // Barra de vida do jogador
          const playerBarBg = this.add.rectangle(this.cameras.main.width * 0.25, 0, 200, 20, 0x333333);
          const playerBar = this.add.rectangle(this.cameras.main.width * 0.25, 0, 200, 20, 0x4CAF50);
          playerBar.setOrigin(0.5, 0.5);
          this.playerHealthBar = playerBar;
          
          // Barra de vida do inimigo
          const enemyBarBg = this.add.rectangle(this.cameras.main.width * 0.75, 0, 200, 20, 0x333333);
          const enemyBar = this.add.rectangle(this.cameras.main.width * 0.75, 0, 200, 20, 0xf44336);
          enemyBar.setOrigin(0.5, 0.5);
          this.enemyHealthBar = enemyBar;
          
          // Adicionar ao container
          this.healthBarsContainer.add([playerBarBg, playerBar, enemyBarBg, enemyBar]);
        }
        
        updateHealthBars() {
          // Atualizar largura das barras de vida
          if (this.playerHealthBar) {
            this.playerHealthBar.width = (this.player.health / 100) * 200;
          }
          
          if (this.enemyHealthBar) {
            this.enemyHealthBar.width = (this.enemy.health / 100) * 200;
          }
        }
        
        createAnimations() {
          // Animações do jogador - usando apenas os 3 frames disponíveis
          this.anims.create({
            key: 'player-idle',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
            frameRate: 8,
            repeat: -1
          });
          
          this.anims.create({
            key: 'player-walk',
            frames: this.anims.generateFrameNumbers('player', { start: 1, end: 1 }),
            frameRate: 8,
            repeat: -1
          });
          
          this.anims.create({
            key: 'player-attack',
            frames: this.anims.generateFrameNumbers('player', { start: 2, end: 2 }),
            frameRate: 8,
            repeat: 0
          });
          
          // Animações do inimigo (mesmas frames, chaves diferentes)
          this.anims.create({
            key: 'enemy-idle',
            frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 0 }),
            frameRate: 8,
            repeat: -1
          });
          
          this.anims.create({
            key: 'enemy-walk',
            frames: this.anims.generateFrameNumbers('enemy', { start: 1, end: 1 }),
            frameRate: 8,
            repeat: -1
          });
          
          this.anims.create({
            key: 'enemy-attack',
            frames: this.anims.generateFrameNumbers('enemy', { start: 2, end: 2 }),
            frameRate: 8,
            repeat: 0
          });
        }
        
        update() {
          // Não atualizar se o round acabou
          if (this.roundOver) return;
          
          // Velocidade de movimento
          const speed = 360;
          
          // Resetar velocidade horizontal do jogador (mantendo a vertical para gravidade)
          this.player.setVelocityX(0);
          
          // Movimento com A e D (apenas lateral)
          if (this.keys.a.isDown) {
            this.player.setVelocityX(-speed);
            this.player.flipX = true; // Virar para a esquerda
            this.player.play('player-walk', true);
          } else if (this.keys.d.isDown) {
            this.player.setVelocityX(speed);
            this.player.flipX = false; // Virar para a direita
            this.player.play('player-walk', true);
          } else if (!this.playerAttackCooldown) {
            // Se não estiver se movendo nem atacando, voltar para idle
            this.player.play('player-idle', true);
          }
          
          // Ataque com espaço
          if (Phaser.Input.Keyboard.JustDown(this.keys.space) && !this.playerAttackCooldown) {
            this.playerAttack();
          }
          
          // IA simples para o inimigo
          this.updateEnemyAI();
          
          // Atualizar barras de vida
          this.updateHealthBars();
          
          // Verificar fim do round
          this.checkRoundEnd();
        }
        
        playerAttack() {
          // Iniciar ataque
          this.playerAttackCooldown = true;
          
          // Reproduzir animação de ataque
          this.player.play('player-attack', true);
          
          // Verificar se o inimigo está no alcance do ataque
          const attackRange = 100;
          const distance = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.enemy.x, this.enemy.y
          );
          
          if (distance < attackRange) {
            // Causar dano ao inimigo
            this.damageEnemy(20);
            
            // Empurrar o inimigo
            const angle = Phaser.Math.Angle.Between(
              this.player.x, this.player.y,
              this.enemy.x, this.enemy.y
            );
            
            this.enemy.setVelocity(
              Math.cos(angle) * 300,
              Math.sin(angle) * 150 // Reduzir o impulso vertical devido à gravidade
            );
          }
          
          // Criar efeito visual de ataque
          const attackDirection = this.player.flipX ? -1 : 1;
          const attackEffect = this.add.circle(
            this.player.x + (attackDirection * 50), 
            this.player.y,
            25, 
            0xffff00, 
            0.7
          );
          
          // Animar o efeito de ataque
          this.tweens.add({
            targets: attackEffect,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              attackEffect.destroy();
            }
          });
          
          // Terminar ataque após um tempo
          this.time.delayedCall(500, () => {
            // Voltar para animação idle
            if (!this.keys.a.isDown && !this.keys.d.isDown) {
              this.player.play('player-idle', true);
            }
            
            // Cooldown de ataque
            this.time.delayedCall(300, () => {
              this.playerAttackCooldown = false;
            });
          });
        }
        
        enemyAttack() {
          // Iniciar ataque
          this.enemyAttackCooldown = true;
          
          // Reproduzir animação de ataque
          this.enemy.play('enemy-attack', true);
          
          // Verificar se o jogador está no alcance do ataque
          const attackRange = 100;
          const distance = Phaser.Math.Distance.Between(
            this.enemy.x, this.enemy.y,
            this.player.x, this.player.y
          );
          
          if (distance < attackRange) {
            // Causar dano ao jogador
            this.damagePlayer(15);
            
            // Empurrar o jogador
            const angle = Phaser.Math.Angle.Between(
              this.enemy.x, this.enemy.y,
              this.player.x, this.player.y
            );
            
            this.player.setVelocity(
              Math.cos(angle) * 300,
              Math.sin(angle) * 150 // Reduzir o impulso vertical devido à gravidade
            );
          }
          
          // Criar efeito visual de ataque
          const attackDirection = this.enemy.flipX ? -1 : 1;
          const attackEffect = this.add.circle(
            this.enemy.x + (attackDirection * 50), 
            this.enemy.y,
            25, 
            0x00ffff, 
            0.7
          );
          
          // Animar o efeito de ataque
          this.tweens.add({
            targets: attackEffect,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              attackEffect.destroy();
            }
          });
          
          // Terminar ataque após um tempo
          this.time.delayedCall(500, () => {
            // Voltar para animação idle
            this.enemy.play('enemy-idle', true);
            
            // Cooldown de ataque
            this.time.delayedCall(800, () => {
              this.enemyAttackCooldown = false;
            });
          });
        }
        
        updateEnemyAI() {
          // Não atualizar IA se estiver em cooldown de ataque
          if (this.enemyAttackCooldown) return;
          
          // Calcular distância até o jogador
          const distance = Phaser.Math.Distance.Between(
            this.enemy.x, this.enemy.y,
            this.player.x, this.player.y
          );
          
          // Velocidade de movimento do inimigo
          const speed = 120;
          
          // Atualizar direção do inimigo
          if (this.player.x < this.enemy.x) {
            this.enemy.flipX = true;
          } else {
            this.enemy.flipX = false;
          }
          
          // Comportamento baseado na distância
          if (distance < 80) {
            // Atacar se estiver perto
            this.enemyAttack();
          } else if (distance < 300) {
            // Perseguir o jogador (apenas horizontalmente devido à gravidade)
            if (this.player.x < this.enemy.x) {
              this.enemy.setVelocityX(-speed);
            } else {
              this.enemy.setVelocityX(speed);
            }
            
            // Animação de andar
            this.enemy.play('enemy-walk', true);
          } else {
            // Movimento aleatório quando longe
            if (Math.random() < 0.02) {
              this.enemy.direction = Math.random() < 0.5 ? -1 : 1;
            }
            
            this.enemy.setVelocityX(speed * this.enemy.direction);
            
            // Animação de andar
            this.enemy.play('enemy-walk', true);
          }
        }
        
        damagePlayer(amount) {
          // Reduzir vida do jogador
          this.player.health -= amount;
          if (this.player.health < 0) this.player.health = 0;
          
          // Atualizar barra de vida no Vue
          vueComponent.playerHealth = this.player.health;
        }
        
        damageEnemy(amount) {
          // Reduzir vida do inimigo
          this.enemy.health -= amount;
          if (this.enemy.health < 0) this.enemy.health = 0;
          
          // Atualizar barra de vida no Vue
          vueComponent.enemyHealth = this.enemy.health;
        }
        
        checkRoundEnd() {
          // Verificar se algum lutador está sem vida
          if (this.player.health <= 0 || this.enemy.health <= 0) {
            // Marcar round como terminado
            this.roundOver = true;
            
            // Determinar vencedor
            if (this.player.health <= 0 && this.enemy.health <= 0) {
              // Empate
              this.showGameMessage('Empate!');
            } else if (this.player.health <= 0) {
              // Inimigo venceu
              vueComponent.enemyWins++;
              this.showGameMessage('Você perdeu!');
            } else {
              // Jogador venceu
              vueComponent.playerWins++;
              this.showGameMessage('Você venceu!');
            }
            
            // Verificar fim do jogo
            if (vueComponent.currentRound >= vueComponent.totalRounds || 
                vueComponent.playerWins > vueComponent.totalRounds / 2 || 
                vueComponent.enemyWins > vueComponent.totalRounds / 2) {
              // Jogo terminou
              if (vueComponent.playerWins > vueComponent.enemyWins) {
                this.showGameMessage('Vitória!', true);
              } else if (vueComponent.enemyWins > vueComponent.playerWins) {
                this.showGameMessage('Game Over', true);
              } else {
                this.showGameMessage('Empate Final!', true);
              }
              
              // Adicionar texto para reiniciar
              const restartText = this.add.text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2 + 50,
                'Pressione ESPAÇO para reiniciar',
                { fontSize: '24px', fill: '#fff' }
              ).setOrigin(0.5);
              
              // Adicionar evento para reiniciar com espaço
              this.input.keyboard.once('keydown-SPACE', () => {
                vueComponent.restartGame();
              });
            } else {
              // Preparar próximo round
              this.time.delayedCall(2000, () => {
                vueComponent.currentRound++;
                this.scene.restart();
              });
            }
          }
        }
        
        showGameMessage(message, isFinal = false) {
          // Adicionar texto com a mensagem
          const textStyle = {
            fontSize: isFinal ? '48px' : '32px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
          };
          
          const messageText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            message,
            textStyle
          ).setOrigin(0.5);
          
          // Animar o texto
          this.tweens.add({
            targets: messageText,
            scale: 1.2,
            duration: 200,
            yoyo: true,
            repeat: 2
          });
          
          // Se não for mensagem final, remover após um tempo
          if (!isFinal) {
            this.time.delayedCall(1800, () => {
              messageText.destroy();
            });
          }
        }
      }
      
      // Configuração do jogo Phaser
      const config = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: 'game-container',
        backgroundColor: '#2d2d2d',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 600 }, // Gravidade significativa
            debug: false
          }
        },
        scene: FightScene,
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH
        }
      };
      
      // Criar instância do jogo
      this.game = new Phaser.Game(config);
    },
    
    resizeGame() {
      if (this.game) {
        // Atualizar tamanho do jogo para preencher a tela
        this.game.scale.resize(window.innerWidth, window.innerHeight);
      }
    },
    
    restartGame() {
      // Resetar estado do jogo
      this.playerHealth = 100;
      this.enemyHealth = 100;
      this.currentRound = 1;
      this.playerWins = 0;
      this.enemyWins = 0;
      
      // Reiniciar a cena
      if (this.game) {
        this.game.scene.getScene('FightScene').scene.restart();
      }
    }
  }
};
</script>

<style>
/* Reset CSS para garantir que o jogo ocupe toda a tela */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fullscreen-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
}

#game-container {
  width: 100%;
  height: 100%;
}
</style>
