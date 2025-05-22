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
          this.specialCooldown = false;
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
          
          // Adicionar teclas A, D, espaço e especial (L)
          this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            special: Phaser.Input.Keyboard.KeyCodes.L
          });
          
          // Resetar estado do jogo
          this.roundOver = false;
          vueComponent.playerHealth = 100;
          vueComponent.enemyHealth = 100;
          
          // Adicionar barras de vida diretamente na cena
          this.createHealthBars();

          // Cronômetro
          this.timeLeft = 90;
          this.timerText = this.add.text(
            this.cameras.main.width / 2,
            10,
            '90',
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
          ).setOrigin(0.5, 0);

          this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
              if (!this.roundOver && this.timeLeft > 0) {
                this.timeLeft--;
                this.timerText.setText(this.timeLeft);
                // Pulse nos últimos 10 segundos
                if (this.timeLeft <= 10) {
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
                      if (this.timeLeft > 0) {
                        this.timerText.setColor('#fff');
                        this.timerText.setStroke('#000', 6);
                      }
                    }
                  });
                }
                if (this.timeLeft === 0) {
                  this.roundOver = true;
                  this.showGameMessage('Tempo esgotado!');
                  // Decide vencedor por vida
                  if (this.player.health > this.enemy.health) {
                    vueComponent.playerWins++;
                    this.showGameMessage('Você venceu!');
                  } else if (this.enemy.health > this.player.health) {
                    vueComponent.enemyWins++;
                    this.showGameMessage('Você perdeu!');
                  } else {
                    this.showGameMessage('Empate!');
                  }
                  this.time.delayedCall(2000, () => {
                    vueComponent.currentRound++;
                    this.scene.restart();
                  });
                }
              }
            },
            callbackScope: this,
            loop: true
          });

          // Só mostra a tela de início no primeiro round
          if (vueComponent.currentRound === 1 && vueComponent.playerWins === 0 && vueComponent.enemyWins === 0) {
            this.waitingStart = true;
            this.showStartScreen();
          } else {
            this.waitingStart = false;
            this.startRoundEntryAnimation();
          }

          // Grupo de partículas de poeira
          this.dustParticles = this.add.particles(0, 0, null, {
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

          // Controle de pausa
          this.isPaused = false;
          this.pauseMenu = null;
          this.input.keyboard.on('keydown-ESC', this.togglePause, this);
          this.input.keyboard.on('keydown-P', this.togglePause, this);
        }

        togglePause() {
          if (this.roundOver || this.waitingStart) return;
          this.isPaused = !this.isPaused;
          if (this.isPaused) {
            this.showPauseMenu();
          } else {
            this.hidePauseMenu();
          }
        }

        showPauseMenu() {
          if (this.pauseMenu) return;
          const w = this.cameras.main.width, h = this.cameras.main.height;
          this.pauseMenuBg = this.add.rectangle(w/2, h/2, w, h, 0x181c24, 0.85).setDepth(100);
          this.pauseMenu = this.add.text(w/2, h/2-30, 'PAUSADO', {
            fontFamily: 'Orbitron, Arial, sans-serif', fontSize: '44px', color: '#00fff7', align: 'center', stroke: '#fff', strokeThickness: 4
          }).setOrigin(0.5).setDepth(101);
          this.pauseMenuOpt = this.add.text(w/2, h/2+30, 'Pressione ESC/P para continuar\nPressione R para reiniciar', {
            fontFamily: 'Orbitron, Arial, sans-serif', fontSize: '22px', color: '#fff', align: 'center', stroke: '#00fff7', strokeThickness: 2
          }).setOrigin(0.5).setDepth(101);
          // Listeners de teclado para pause
          this.pauseEscListener = this.input.keyboard.on('keydown-ESC', () => this.togglePause(), this);
          this.pausePListener = this.input.keyboard.on('keydown-P', () => this.togglePause(), this);
          this.pauseRListener = this.input.keyboard.on('keydown-R', () => {
            this.hidePauseMenu();
            if (typeof this.scene.scene.settings.data.vueComponent.restartGame === 'function') {
              this.scene.scene.settings.data.vueComponent.restartGame();
            }
          }, this);
        }

        hidePauseMenu() {
          if (this.pauseMenuBg) this.pauseMenuBg.destroy();
          if (this.pauseMenu) this.pauseMenu.destroy();
          if (this.pauseMenuOpt) this.pauseMenuOpt.destroy();
          this.pauseMenu = null;
          // Remove listeners de teclado do pause
          if (this.pauseEscListener) this.input.keyboard.off('keydown-ESC', this.togglePause, this);
          if (this.pausePListener) this.input.keyboard.off('keydown-P', this.togglePause, this);
          if (this.pauseRListener) this.input.keyboard.off('keydown-R', undefined, this);
        }

        showStartScreen() {
          const w = this.cameras.main.width, h = this.cameras.main.height;
          this.startScreen = this.add.rectangle(w/2, h/2, w, h, 0x181c24, 0.98);
          this.startGradient = this.add.graphics()
            .fillGradientStyle(0x00fff7, 0x232526, 0x232526, 0x00fff7, 0.22)
            .fillRect(0, 0, w, h*0.45);
          this.startTitle = this.add.text(w/2, h/2 - 120, 'BATTLE FIGHTER', {
            fontFamily: 'Orbitron, Arial, sans-serif',
            fontSize: '64px',
            color: '#00fff7',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#fff',
            strokeThickness: 8,
            shadow: { offsetX: 0, offsetY: 0, color: '#00fff7', blur: 32, fill: true }
          }).setOrigin(0.5);
          this.tweens.add({
            targets: this.startTitle,
            alpha: { from: 0.7, to: 1 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
          this.startSlogan = this.add.text(w/2, h/2 - 50, 'Mostre suas habilidades e vença todos os rounds!', {
            fontFamily: 'Orbitron, Arial, sans-serif',
            fontSize: '26px',
            color: '#fff',
            align: 'center',
            stroke: '#00fff7',
            strokeThickness: 2,
            shadow: { offsetX: 0, offsetY: 0, color: '#00fff7', blur: 12, fill: true }
          }).setOrigin(0.5);
          this.startText = this.add.text(w/2, h/2 + 60, 'APERTE ESPAÇO PARA COMEÇAR', {
            fontFamily: 'Orbitron, Arial, sans-serif',
            fontSize: '32px',
            color: '#ff006a',
            align: 'center',
            stroke: '#fff',
            strokeThickness: 4,
            shadow: { offsetX: 0, offsetY: 0, color: '#ff006a', blur: 16, fill: true }
          }).setOrigin(0.5);
          this.tweens.add({
            targets: this.startText,
            scale: { from: 1, to: 1.13 },
            alpha: { from: 0.7, to: 1 },
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
          this.input.keyboard.once('keydown-SPACE', () => {
            this.tweens.add({
              targets: [this.startScreen, this.startGradient, this.startTitle, this.startSlogan, this.startText],
              alpha: 0,
              duration: 600,
              onComplete: () => {
                if (this.startScreen) this.startScreen.destroy();
                if (this.startGradient) this.startGradient.destroy();
                if (this.startTitle) this.startTitle.destroy();
                if (this.startSlogan) this.startSlogan.destroy();
                if (this.startText) this.startText.destroy();
                this.startRoundEntryAnimation();
              }
            });
          });
        }

        startRoundEntryAnimation() {
          // Zoom out no início do round
          this.cameras.main.setZoom(1.3);
          this.tweens.add({
            targets: this.cameras.main,
            zoom: 1,
            duration: 700,
            ease: 'Cubic.easeOut',
          });
          // Posição inicial fora da tela
          const playerTargetX = this.player.x;
          const enemyTargetX = this.enemy.x;
          this.player.x = -150;
          this.enemy.x = this.cameras.main.width + 150;
          this.player.setAlpha(1);
          this.enemy.setAlpha(1);
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
              this.waitingStart = false;
            }
          });
        }

        showEndScreen(vencedor) {
          this.endScreen = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x181c24,
            0.95
          );
          this.endText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 40,
            vencedor + '\nAPERTE ESPAÇO PARA REINICIAR',
            {
              fontFamily: 'Orbitron, Arial, sans-serif',
              fontSize: '38px',
              color: '#fff',
              align: 'center',
              stroke: '#00fff7',
              strokeThickness: 4
            }
          ).setOrigin(0.5);
          this.input.keyboard.once('keydown-SPACE', () => {
            this.tweens.add({
              targets: [this.endScreen, this.endText],
              alpha: 0,
              duration: 600,
              onComplete: () => {
                this.endScreen.destroy();
                this.endText.destroy();
                // Chama o método Vue para resetar tudo
                if (typeof vueComponent.restartGame === 'function') {
                  vueComponent.restartGame();
                }
              }
            });
          });
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
          // Usar Graphics para desenhar barras de vida customizadas
          this.playerHealthGraphics = this.add.graphics();
          this.enemyHealthGraphics = this.add.graphics();
          this.drawHealthBars();
        }

        drawHealthBars() {
          // Limpar gráficos
          this.playerHealthGraphics.clear();
          this.enemyHealthGraphics.clear();

          // Parâmetros visuais
          const barWidth = 220;
          const barHeight = 22;
          const radius = 12;
          const xPlayer = this.cameras.main.width * 0.25 - barWidth/2;
          const xEnemy = this.cameras.main.width * 0.75 - barWidth/2;
          const y = 24;

          // Barra do jogador
          // Fundo
          this.playerHealthGraphics.fillStyle(0x232526, 1);
          this.playerHealthGraphics.fillRoundedRect(xPlayer, y, barWidth, barHeight, radius);
          // Borda
          this.playerHealthGraphics.lineStyle(3, 0x00fff7, 0.7);
          this.playerHealthGraphics.strokeRoundedRect(xPlayer, y, barWidth, barHeight, radius);
          // Vida (cor sólida)
          const playerPercent = Phaser.Math.Clamp(this.player.health / 100, 0, 1);
          if (playerPercent > 0) {
            this.playerHealthGraphics.fillStyle(0x00cfff, 1);
            this.playerHealthGraphics.fillRoundedRect(xPlayer, y, barWidth * playerPercent, barHeight, radius);
          }

          // Barra do inimigo
          this.enemyHealthGraphics.fillStyle(0x232526, 1);
          this.enemyHealthGraphics.fillRoundedRect(xEnemy, y, barWidth, barHeight, radius);
          this.enemyHealthGraphics.lineStyle(3, 0xff006a, 0.7);
          this.enemyHealthGraphics.strokeRoundedRect(xEnemy, y, barWidth, barHeight, radius);
          const enemyPercent = Phaser.Math.Clamp(this.enemy.health / 100, 0, 1);
          if (enemyPercent > 0) {
            this.enemyHealthGraphics.fillStyle(0xff006a, 1);
            this.enemyHealthGraphics.fillRoundedRect(xEnemy, y, barWidth * enemyPercent, barHeight, radius);
          }

          // Ícones dos personagens
          if (this.playerIcon) {
            this.playerIcon.destroy();
          }
          if (this.enemyIcon) {
            this.enemyIcon.destroy();
          }
          this.playerIcon = this.add.image(xPlayer - 32, y + barHeight / 2, 'player').setScale(0.13).setOrigin(0.5);
          this.enemyIcon = this.add.image(xEnemy + barWidth + 32, y + barHeight / 2, 'enemy').setScale(0.13).setOrigin(0.5);
          this.enemyIcon.setTint(0x00ffff);

          // Medalhas/círculos de rounds vencidos
          // Parâmetros
          const totalMedals = Math.ceil(vueComponent.totalRounds / 2); // Ex: melhor de 3 = 2
          const medalRadius = 9;
          const medalSpacing = 28;
          const medalY = y + barHeight + 18;
          // Player
          if (this.playerMedals) this.playerMedals.forEach(m => m.destroy());
          this.playerMedals = [];
          for (let i = 0; i < totalMedals; i++) {
            const filled = i < vueComponent.playerWins;
            const medal = this.add.circle(
              xPlayer + 18 + i * medalSpacing,
              medalY,
              medalRadius,
              filled ? 0x00fff7 : 0x232526,
              filled ? 1 : 0.5
            ).setStrokeStyle(2, 0x00fff7, 0.7);
            this.playerMedals.push(medal);
          }
          // Enemy
          if (this.enemyMedals) this.enemyMedals.forEach(m => m.destroy());
          this.enemyMedals = [];
          for (let i = 0; i < totalMedals; i++) {
            const filled = i < vueComponent.enemyWins;
            const medal = this.add.circle(
              xEnemy + 18 + i * medalSpacing,
              medalY,
              filled ? medalRadius : medalRadius,
              filled ? 0xff006a : 0x232526,
              filled ? 1 : 0.5
            ).setStrokeStyle(2, 0xff006a, 0.7);
            this.enemyMedals.push(medal);
          }

          // Nomes acima das barras de vida
          if (this.playerNameText) {
            this.playerNameText.destroy();
            this.playerNameText = null;
          }
          if (this.enemyNameText) {
            this.enemyNameText.destroy();
            this.enemyNameText = null;
          }
          this.playerNameText = this.add.text(
            xPlayer + barWidth / 2,
            y -1, // Subiu de -10 para -22
            'MORENO',
            {
              fontFamily: 'Orbitron, Arial, sans-serif',
              fontSize: '15px', // Reduziu de 18px para 15px
              color: '#00fff7',
              fontStyle: 'bold',
              align: 'center',
              stroke: '#000',
              strokeThickness: 4,
              shadow: { offsetX: 0, offsetY: 2, color: '#00fff7', blur: 6, fill: true }
            }
          ).setOrigin(0.5, 1);
          this.enemyNameText = this.add.text(
            xEnemy + barWidth / 2,
            y - 1,
            'INIMIGO',
            {
              fontFamily: 'Orbitron, Arial, sans-serif',
              fontSize: '15px',
              color: '#ff006a',
              fontStyle: 'bold',
              align: 'center',
              stroke: '#000',
              strokeThickness: 4,
              shadow: { offsetX: 0, offsetY: 2, color: '#ff006a', blur: 6, fill: true }
            }
          ).setOrigin(0.5, 1);
        }

        updateHealthBars() {
          this.drawHealthBars();
          // Força atualização dos nomes
          if (this.playerNameText) this.playerNameText.setDepth(10);
          if (this.enemyNameText) this.enemyNameText.setDepth(10);
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
          if (this.isPaused) return;
          if (this.waitingStart) return;

          // Não atualizar se o round acabou
          if (this.roundOver) return;
          
          // Velocidade de movimento
          const speed = 160;
          
          // Resetar velocidade horizontal do jogador (mantendo a vertical para gravidade)
          this.player.setVelocityX(0);

          let isWalking = false;
          
          // Movimento com A e D (apenas lateral)
          if (this.keys.a.isDown) {
            this.player.setVelocityX(-speed);
            this.player.flipX = true; // Virar para a esquerda
            this.player.play('player-walk', true);
            isWalking = true;
          } else if (this.keys.d.isDown) {
            this.player.setVelocityX(speed);
            this.player.flipX = false; // Virar para a direita
            this.player.play('player-walk', true);
            isWalking = true;
          } else if (!this.playerAttackCooldown) {
            // Se não estiver se movendo nem atacando, voltar para idle
            this.player.play('player-idle', true);
          }

          // Efeito de pulo/oscilar ao andar
          if (isWalking && !this.playerAttackCooldown) {
            this.player.y += Math.sin(this.time.now / 80) * 1.5;
            // Poeira nos pés
            if (!this.lastDustTime || this.time.now - this.lastDustTime > 110) {
              this.dustParticles.emitParticleAt(this.player.x, this.player.y + 90, 1);
              this.lastDustTime = this.time.now;
            }
          }
          
          // Ataque com espaço
          if (Phaser.Input.Keyboard.JustDown(this.keys.space) && !this.playerAttackCooldown) {
            this.playerAttack();
          }

          // Ataque especial com L
          if (Phaser.Input.Keyboard.JustDown(this.keys.special) && !this.playerAttackCooldown && !this.specialCooldown) {
            this.playerSpecialAttack();
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
            // Efeito de partículas ao acertar
            this.createHitParticles(this.enemy.x, this.enemy.y, 0xffff00);
          }
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

        playerSpecialAttack() {
          this.playerAttackCooldown = true;
          this.specialCooldown = true;
          // Frase de efeito
          const phrase = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 80,
            'AOOWWWWW!',
            {
              fontFamily: 'Orbitron, Arial, sans-serif',
              fontSize: '44px',
              color: '#00fff7',
              align: 'center',
              stroke: '#fff',
              strokeThickness: 6,
              shadow: { offsetX: 0, offsetY: 0, color: '#00fff7', blur: 24, fill: true }
            }
          ).setOrigin(0.5);
          this.tweens.add({
            targets: phrase,
            scale: 1.2,
            duration: 180,
            yoyo: true,
            repeat: 2,
            onComplete: () => phrase.destroy()
          });
          // Efeito visual: símbolos de lógica flutuando
          const logicSymbols = ['&&', '||', '!', 'if', 'else', '{', '}', '==', '!=', '>=', '<='];
          for (let i = 0; i < 7; i++) {
            const symbol = this.add.text(
              this.player.x + Phaser.Math.Between(-40, 40),
              this.player.y - 80 + Phaser.Math.Between(-20, 20),
              Phaser.Utils.Array.GetRandom(logicSymbols),
              {
                fontFamily: 'monospace',
                fontSize: '22px',
                color: '#fff',
                stroke: '#00fff7',
                strokeThickness: 3
              }
            ).setOrigin(0.5);
            this.tweens.add({
              targets: symbol,
              y: symbol.y - Phaser.Math.Between(30, 60),
              alpha: 0,
              duration: 700,
              delay: i * 60,
              onComplete: () => symbol.destroy()
            });
          }
          // Lançar bloco de código (projetil)
          const codeBlock = this.add.text(
            this.player.x + 30 * (this.player.flipX ? -1 : 1),
            this.player.y - 30,
            '{ if (x > 0) x--; }',
            {
              fontFamily: 'monospace',
              fontSize: '20px',
              color: '#00fff7',
              stroke: '#fff',
              strokeThickness: 3
            }
          ).setOrigin(0.5);
          this.physics.add.existing(codeBlock);
          codeBlock.body.setAllowGravity(false);
          codeBlock.body.setVelocityX(420 * (this.player.flipX ? -1 : 1));
          // Colisão com inimigo
          const checkHit = this.time.addEvent({
            delay: 16,
            callback: () => {
              if (Phaser.Geom.Intersects.RectangleToRectangle(codeBlock.getBounds(), this.enemy.getBounds())) {
                // Dano extra
                this.damageEnemy(35);
                // Efeito de explosão de código
                this.createCodeExplosion(this.enemy.x, this.enemy.y);
                codeBlock.destroy();
                checkHit.remove();
              }
            },
            callbackScope: this,
            loop: true
          });
          // Duração do projetil
          this.time.delayedCall(1200, () => {
            if (codeBlock && codeBlock.active) codeBlock.destroy();
            checkHit.remove();
          });
          // Cooldown do especial
          this.time.delayedCall(2000, () => {
            this.specialCooldown = false;
          });
          // Fim do ataque
          this.time.delayedCall(700, () => {
            this.playerAttackCooldown = false;
          });
        }

        createCodeExplosion(x, y) {
          // Partículas de código binário e símbolos
          const symbols = ['1010', '1101', '&&', '||', '!', '{', '}', '=='];
          for (let i = 0; i < 12; i++) {
            const t = this.add.text(x, y, Phaser.Utils.Array.GetRandom(symbols), {
              fontFamily: 'monospace',
              fontSize: '18px',
              color: '#00fff7',
              stroke: '#fff',
              strokeThickness: 2
            }).setOrigin(0.5);
            this.tweens.add({
              targets: t,
              x: x + Phaser.Math.Between(-60, 60),
              y: y + Phaser.Math.Between(-60, 60),
              alpha: 0,
              duration: 700,
              onComplete: () => t.destroy()
            });
          }
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
            // Efeito de partículas ao acertar
            this.createHitParticles(this.player.x, this.player.y, 0x00ffff);
          }
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

        createHitParticles(x, y, color) {
          // Faíscas realistas: amarelo, laranja e branco
          const colors = [0xffff00, 0xffa500, 0xffffff];
          const emitter = this.add.particles(x, y, null, {
            lifespan: { min: 280, max: 480 },
            speed: { min: 220, max: 420 },
            angle: { min: 0, max: 360 },
            gravityY: 400,
            scale: { start: 0.32, end: 0 },
            alpha: { start: 1, end: 0 },
            quantity: 14,
            blendMode: 'ADD',
            tint: colors
          });
          emitter.emitParticle(14);
          this.time.delayedCall(480, () => emitter.destroy());
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
          if (this.player.health <= 0 || this.enemy.health <= 0) {
            this.cameras.main.shake(400, 0.022);
            this.roundOver = true;
            let endMsg = '';
            if (this.player.health <= 0 && this.enemy.health <= 0) {
              endMsg = 'Empate!';
            } else if (this.player.health <= 0) {
              vueComponent.enemyWins++;
              endMsg = 'Você perdeu!';
            } else {
              vueComponent.playerWins++;
              endMsg = 'Você venceu!';
            }
            if (vueComponent.currentRound >= vueComponent.totalRounds || 
                vueComponent.playerWins > vueComponent.totalRounds / 2 || 
                vueComponent.enemyWins > vueComponent.totalRounds / 2) {
              if (vueComponent.playerWins > vueComponent.enemyWins) {
                this.showEndScreen('Vitória!');
              } else if (vueComponent.enemyWins > vueComponent.playerWins) {
                this.showEndScreen('Game Over');
              } else {
                this.showEndScreen('Empate Final!');
              }
            } else {
              // Exibe mensagem de fim de round, depois dica, depois próximo round
              this.showGameMessage(endMsg);
              this.time.delayedCall(1200, () => {
                this.showLogicTip(() => {
                  this.time.delayedCall(1200, () => {
                    vueComponent.currentRound++;
                    this.scene.restart();
                  });
                });
              });
            }
          }
        }

        showLogicTip(callback) {
          const tips = [
            'Dica de lógica: Se não entrou no if, entrou no else!',
            'Dica: O erro está entre a cadeira e o teclado.',
            'Dica: && é diferente de ||, mas ambos dão bug se usados errado.',
            'Dica: O compilador nunca erra, só você.',
            'Dica: A lógica é implacável, igual ao professor!',
            'Dica: if (vida <= 0) { descanso(); }',
            'Dica: else não é desculpa pra não estudar!',
            'Dica: O while(true) só acaba quando o professor manda.',
            'Dica: O bug só aparece na apresentação.',
            'Dica: return sempre encerra a função... e a paciência.'
          ];
          const tip = Phaser.Utils.Array.GetRandom(tips);
          const tipText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 80,
            tip,
            {
              fontFamily: 'Orbitron, Arial, sans-serif',
              fontSize: '26px',
              color: '#ffeb3b',
              align: 'center',
              stroke: '#000',
              strokeThickness: 4,
              shadow: { offsetX: 0, offsetY: 0, color: '#000', blur: 12, fill: true }
            }
          ).setOrigin(0.5);
          this.tweens.add({
            targets: tipText,
            alpha: { from: 0, to: 1 },
            duration: 300,
            yoyo: true,
            hold: 1200,
            onComplete: () => {
              tipText.destroy();
              if (typeof callback === 'function') callback();
            }
          });
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
          this.tweens.add({
            targets: messageText,
            scale: 1.2,
            duration: 200,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
              if (!isFinal) messageText.destroy();
            }
          });
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
      // Resetar estado do jogo Vue
      this.playerHealth = 100;
      this.enemyHealth = 100;
      this.currentRound = 1;
      this.playerWins = 0;
      this.enemyWins = 0;

      // Destruir Phaser completamente e criar de novo
      if (this.game) {
        this.game.destroy(true);
        this.game = null;
      }
      // Criar nova instância Phaser
      this.initGame();
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

/* Barra de vida estilizada */
.health-bar-container {
  width: 220px;
  height: 22px;
  background: linear-gradient(90deg, #232526 0%, #414345 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px #000a, 0 0 0 2px #222 inset;
  overflow: hidden;
  margin: 0 auto 10px auto;
  border: 2px solid #222;
  position: relative;
}

.health-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff99 0%, #00cfff 50%, #ffeb3b 100%);
  box-shadow: 0 0 16px 2px #00fff7, 0 0 32px 4px #00cfff;
  border-radius: 12px 0 0 12px;
  transition: width 0.5s cubic-bezier(.4,2,.6,1), background 0.3s;
  position: absolute;
  left: 0;
  top: 0;
}

.health-bar-fill.enemy {
  background: linear-gradient(90deg, #ff006a 0%, #ffb300 100%);
  box-shadow: 0 0 16px 2px #ff006a, 0 0 32px 4px #ffb300;
  border-radius: 0 12px 12px 0;
}

.health-label {
  font-family: 'Orbitron', Arial, sans-serif;
  color: #fff;
  font-size: 1rem;
  text-shadow: 0 1px 4px #000a;
  margin-bottom: 2px;
}

.health-value {
  font-family: 'Orbitron', Arial, sans-serif;
  color: #fff;
  font-size: 1rem;
  text-shadow: 0 1px 4px #000a;
  margin-left: 8px;
}
</style>
