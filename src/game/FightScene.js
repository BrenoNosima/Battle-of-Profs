import Phaser from 'phaser';
import Player from './entities/Player.js'; // Relative path from src/game/
import Enemy from './entities/Enemy.js';   // Relative path from src/game/
import HealthBar from './ui/HealthBar.js'; // Relative path from src/game/
import RoundTransition from './transitions/RoundTransition.js'; // Importação da classe de transição

// Classe de cena personalizada
export default class FightScene extends Phaser.Scene {
  constructor() { // No vueComponent parameter here
    super('FightScene');
    this.vueComponent = null; // Initialize as null
    this.player = null;
    this.enemy = null;
    this.keys = null;
    this.playerAttackCooldown = false;
    this.enemyAttackCooldown = false;
    this.roundOver = false;
    this.ground = null;
    this.playerHealthBar = null;
    this.enemyHealthBar = null;
    this.healthBarsContainer = null;

    // Round state managed by the scene
    this.currentRound = 1;
    this.totalRounds = 3;
    this.playerWins = 0;
    this.enemyWins = 0;
    
    // Objeto de transição
    this.roundTransition = null;
    
    // Flag para controlar se já mostrou os controles
    this.controlsShown = false;
  }

  // Receive data when the scene starts
  init(data) {
    console.log("FightScene: Init com dados", data);
    if (data && data.vueComponentRef) {
        this.vueComponent = data.vueComponentRef; // Get the reference passed from GameContainer
    }
    if (data && data.backgroundKey) {
        this.initialBackgroundKey = data.backgroundKey;
    } else {
        this.initialBackgroundKey = 'background'; // Default background
    }
    // Reset round state if restarting
    this.currentRound = this.vueComponent ? this.vueComponent.currentRound : 1;
    this.playerWins = this.vueComponent ? this.vueComponent.playerWins : 0;
    this.enemyWins = this.vueComponent ? this.vueComponent.enemyWins : 0;
  }

  preload() {
    console.log('FightScene: Preload iniciado');
    this.load.spritesheet('brenoAndando', '/sprite/breno/brenoAndando.png', { frameWidth: 90, frameHeight: 350 }); // Assuming served from public root
    this.load.spritesheet('brenoAtaque', 'sprite/breno/brenoAtacando.png', { frameWidth: 89.9, frameHeight: 350 });
    this.load.spritesheet('brenoDefendendo', '/sprite/breno/BrenoDefendendo.png', { frameWidth: 138, frameHeight: 350 }); // Assuming served from public root
    this.load.spritesheet('brenoPulando', 'sprite/breno/brenoPulando.png', { frameWidth: 200, frameHeight: 350 });

    this.load.spritesheet('morenoAtaque', '/sprite/Moreno/morenoAtaque.png', { frameWidth: 130, frameHeight: 350 });
    this.load.spritesheet('morenoAndando', '/sprite/Moreno/morenoAndando.png', { frameWidth: 130, frameHeight: 350 });
    this.load.spritesheet('morenoPulando', '/sprite/Moreno/morenoPulando.png', { frameWidth: 130, frameHeight: 350 });

    try {
      this.load.image('background', '/backgrounds/menu.png'); // Assuming served from public root
      this.load.image('background2', '/backgrounds/cenario2.png'); // Segundo cenário para transição
      console.log('FightScene: Tentando carregar backgrounds');
    } catch (e) {
      console.log('FightScene: Background não encontrado, usando cor padrão');
    }
    // Platform image (using data URI, no path needed)
    this.load.image('platform', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAUCAYAAAB7wJiVAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAnSURBVHgB7cxBDQAADMOwkb/RpYfYgQT2tgEAAAAAAAAAAADwwAB9pgABKZ/t3QAAAABJRU5ErkJggg==');

    this.load.audio('punchSound', 'public/sounds/soco.mp3');
    this.load.audio('dashSound', 'public/sounds/dash.mp3');
    this.load.audio('blockSound', 'public/sounds/block.mp3');
    this.load.audio('puloSound', 'public/sounds/pulo.mp3');
  }

  async create() {
     // Check if vueComponent reference was received
    if (!this.vueComponent) {
        console.error("FightScene: create() chamado sem referência do vueComponent!");
        // Optionally, display an error message on screen
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Erro: Falha ao carregar componente Vue.', { color: '#ff0000', fontSize: '20px' }).setOrigin(0.5);
        return; // Stop execution if the reference is missing
    }
    console.log('FightScene: Método create chamado!');

    if (this.textures.exists(this.initialBackgroundKey)) {
      const bg = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, this.initialBackgroundKey);
      const scaleX = this.cameras.main.width / bg.width;
      const scaleY = this.cameras.main.height / bg.height;
      const scale = Math.max(scaleX, scaleY);
      bg.setScale(scale).setDepth(-1);
    } else {
       this.cameras.main.setBackgroundColor('#2d2d2d');
    }

    this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);

    this.createGround();

    const groundY = this.cameras.main.height * 0.85;
    const playerStartX = this.cameras.main.width * 0.3;
    const enemyStartX = this.cameras.main.width * 0.7;

    this.player = new Player(this, playerStartX, groundY - 100, 'player');
    this.enemy = new Enemy(this, enemyStartX, groundY - 100, 'enemy');

    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.enemy, this.ground);
    this.physics.add.collider(
      this.player,
      this.enemy,
      null,
      (player, enemy) => {
        const verticalThreshold = 15;
        // Só permite colisão se não estiverem pulando/caindo um sobre o outro
        if (player.body.velocity.y >= 0 && player.body.bottom <= enemy.body.top + verticalThreshold) {
          return false;
        }
        if (enemy.body.velocity.y >= 0 && enemy.body.bottom <= player.body.top + verticalThreshold) {
          return false;
        }
        return true;
      },
      this
    );

    this.createAnimations();

    this.player.play('player-idle');
    this.enemy.play('enemy-idle');

    this.keys = this.input.keyboard.addKeys({
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      x: Phaser.Input.Keyboard.KeyCodes.X,
      e: Phaser.Input.Keyboard.KeyCodes.E
    });

    this.roundOver = false;
    this.player.health = 100;
    this.enemy.health = 100;
    
    // Communicate initial state to Vue
    this.vueComponent.updateHealth(this.player.health, this.enemy.health);
    this.vueComponent.updateRoundInfo(this.currentRound, this.playerWins, this.enemyWins);

    this.createHealthBars();
    // Round dots for player and enemy (2 each, below each health bar, no background)
    const dotRadius = 20;
    const dotSpacing = 60;
    const totalDots = 2;
    const healthBarHeight = 20;
    const healthBarY = 20;
    const gap = 60;

    // Player dots: below player health bar
    const playerDotsY = healthBarY + healthBarHeight + gap;
    this.playerRoundDots = [];
    this.playerRoundDotsContainer = this.add.container(this.cameras.main.width * 0.10, playerDotsY).setDepth(11);
    for (let i = 0; i < totalDots; i++) {
      const x = -dotSpacing / 2 + i * dotSpacing;
      const dot = this.add.circle(x, 0, dotRadius, i < this.playerWins ? 0x4CAF50 : 0x888888).setStrokeStyle(2, 0x222222);
      this.playerRoundDotsContainer.add(dot);
      this.playerRoundDots.push(dot);
    }

    // Enemy dots: below enemy health bar
    const enemyDotsY = healthBarY + healthBarHeight + gap;
    this.enemyRoundDots = [];
    this.enemyRoundDotsContainer = this.add.container(this.cameras.main.width * 0.90, enemyDotsY).setDepth(11);
    for (let i = 0; i < totalDots; i++) {
      const x = -dotSpacing / 2 + i * dotSpacing;
      const dot = this.add.circle(x, 0, dotRadius, i < this.enemyWins ? 0xf44336 : 0x888888).setStrokeStyle(2, 0x222222);
      this.enemyRoundDotsContainer.add(dot);
      this.enemyRoundDots.push(dot);
    }

    // Helper to update round dots when round info changes
    this.updateRoundDots = () => {
      for (let i = 0; i < totalDots; i++) {
      this.playerRoundDots[i].setFillStyle(i < this.playerWins ? 0x4CAF50 : 0x888888);
      this.enemyRoundDots[i].setFillStyle(i < this.enemyWins ? 0xf44336 : 0x888888);
      }
    };

    // Patch into Vue updateRoundInfo
    const originalUpdateRoundInfo = this.vueComponent.updateRoundInfo;
    this.vueComponent.updateRoundInfo = (currentRound, playerWins, enemyWins) => {
      originalUpdateRoundInfo.call(this.vueComponent, currentRound, playerWins, enemyWins);
      this.playerWins = playerWins;
      this.enemyWins = enemyWins;
      this.updateRoundDots();
    };
    this.updateRoundDots();
    
    // Inicializa o objeto de transição
    this.roundTransition = new RoundTransition(this);
    
    // Mostra a tela de controles antes de iniciar o jogo
    // Apenas no primeiro round ou se ainda não tiver mostrado
    if (this.currentRound === 1 && !this.controlsShown) {
      this.roundOver = true; // Impede o jogo de começar enquanto mostra os controles
      await this.roundTransition.showControlsScreen(5000);
      this.roundOver = false; // Libera o jogo para começar
      this.controlsShown = true; // Marca que já mostrou os controles
      
      // Mostra uma mensagem de "Fight!" após os controles
      await this.roundTransition.show('FIGHT!', 1000);
    }
  }

  createGround() {
    this.ground = this.physics.add.staticGroup();
    const groundY = this.cameras.main.height * 0.85;
    const groundPlatform = this.ground.create(this.cameras.main.width / 2, groundY, 'platform');
    groundPlatform.setScale(this.cameras.main.width / groundPlatform.width, 1).refreshBody();
    groundPlatform.setAlpha(0);
  }

  createHealthBars() {
      this.healthBarsContainer = this.add.container(0, 20).setDepth(10);
      this.playerHealthBar = new HealthBar(this, this.cameras.main.width * 0.25, 0, 200, 20, 0x4CAF50, 0x333333);
      this.enemyHealthBar = new HealthBar(this, this.cameras.main.width * 0.75, 0, 200, 20, 0xf44336, 0x333333);
      this.healthBarsContainer.add(this.playerHealthBar.getGraphics());
      this.healthBarsContainer.add(this.enemyHealthBar.getGraphics());
      this.updateHealthBars();

      const vsText = this.add.text(
        this.cameras.main.width * 0.5,
        20 + 10, // 10 é a metade da altura da barra, para centralizar verticalmente
        'VS',
        {
          fontSize: '90px',
          fill: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
          fontStyle: 'bold'
        }
      ).setOrigin(0.5).setDepth(10);
  }

  updateHealthBars() {
      if (this.playerHealthBar) {
          this.playerHealthBar.setValue(this.player.health);
      }
      if (this.enemyHealthBar) {
          this.enemyHealthBar.setValue(this.enemy.health);
      }
      // Communicate to Vue only if vueComponent exists
      if (this.vueComponent) {
        this.vueComponent.updateHealth(this.player.health, this.enemy.health);
      }
  }

  createAnimations() {
    this.anims.create({ key: 'player-idle', frames: this.anims.generateFrameNumbers('brenoAndando', { start: 1, end: 1 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'player-walk', frames: this.anims.generateFrameNumbers('brenoAndando', { start: 2, end: 4}), frameRate: 8, repeat: -1 }); 
    this.anims.create({ key: 'player-attack', frames: this.anims.generateFrameNumbers('brenoAtaque', { start: 1, end: 4 }), frameRate: 15, repeat: 0 });
    this.anims.create({ key: 'player-jump', frames: this.anims.generateFrameNumbers('brenoPulando', { start: 1, end: 1 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'player-block', frames: this.anims.generateFrameNumbers('brenoDefendendo', { start: 2, end: 2 }), frameRate: 8 , repeat: -1 });

    this.anims.create({ key: 'enemy-idle', frames: this.anims.generateFrameNumbers('morenoAndando', { start: 0, end: 0 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'enemy-walk', frames: this.anims.generateFrameNumbers('morenoAndando', { start: 1, end: 4 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'enemy-attack', frames: this.anims.generateFrameNumbers('morenoAtaque', { start: 0, end: 4 }), frameRate: 15, repeat: 0 });
    this.anims.create({ key: 'enemy-jump', frames: this.anims.generateFrameNumbers('morenoPulando', { start: 2, end: 2 }), frameRate: 8, repeat: -1 });
  }

  update() {
    if (this.roundOver || !this.player || !this.enemy) return; // Add checks for entities

    this.player.update(this.keys);
    this.enemy.update(this.player);

    this.updateHealthBars();
    this.checkRoundEnd();
  }

  damagePlayer(amount) {
    if (this.roundOver || !this.player) return;
    this.player.takeDamage(amount);// essa função takeDaage vem do player.js
    this.updateHealthBars();
    console.log(`FightScene: Player damaged, health: ${this.player.health}`);
  }

  damageEnemy(amount) {
    if (this.roundOver || !this.enemy) return;
    this.enemy.takeDamage(amount); // essa função takeDaage vem do player.js
    this.updateHealthBars();
    console.log(`FightScene: Enemy damaged, health: ${this.enemy.health}`);
  }

  async checkRoundEnd() {
    if (this.roundOver || !this.player || !this.enemy) return;

    let roundWinner = null;
    if (this.enemy.health <= 0) {
      roundWinner = 'player';
      this.playerWins++;
      console.log("FightScene: Player wins round");
    } else if (this.player.health <= 0) {
      roundWinner = 'enemy';
      this.enemyWins++;
      console.log("FightScene: Enemy wins round");
    }

    if (roundWinner) {
      this.roundOver = true;
      this.player.setVelocityX(0);
      this.enemy.setVelocityX(0);
      this.player.play('player-idle');
      this.enemy.play('enemy-idle');

      // Communicate round result to Vue
      if (this.vueComponent) {
        this.vueComponent.updateRoundInfo(this.currentRound, this.playerWins, this.enemyWins);
      }

      // Usa a classe RoundTransition para mostrar mensagem de fim de round
      if (roundWinner === 'player') {
        await this.roundTransition.show('Você venceu o Round!');
      } else {
        await this.roundTransition.show('Você perdeu o Round!');
      }

      const playerHasMajority = this.playerWins >= 2; // Ganhou 2 rounds
      const enemyHasMajority = this.enemyWins >= 2;   // Perdeu 2 rounds
      const isLastRound = this.currentRound >= this.totalRounds;

      if (playerHasMajority) {
        // Jogador ganhou 2 rounds - transição para novo cenário
        await this.roundTransition.transitionToNewScene("background2");
        const nextFightText = this.add.text(
          this.cameras.main.width / 2,
          this.cameras.main.height / 2 + 60,
          'Pressione E para ir para a próxima luta',
          { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 2 }
        ).setOrigin(0.5).setDepth(10);

        this.input.keyboard.once('keydown-E', async () => {
          nextFightText.destroy();
          // Here you would transition to the next "island" or game level
          // For now, we'll just restart the scene with the new background
          this.scene.restart({ vueComponentRef: this.vueComponent });
        });
      } else if (enemyHasMajority) {
        // Jogador perdeu 2 rounds - mostra tela de jogar novamente
        await this.roundTransition.showGameOverScreen();
        const restartText = this.add.text(
          this.cameras.main.width / 2,
          this.cameras.main.height / 2 + 60,
          'Pressione ESPAÇO para reiniciar',
          { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 2 }
        ).setOrigin(0.5).setDepth(10);

        this.input.keyboard.once('keydown-SPACE', () => {
          if (this.vueComponent) {
            this.vueComponent.restartGame();
          }
        });
      } else if (isLastRound) {
        // Caso de empate ou outro resultado no último round
        let finalMessage = '';
        if (this.playerWins > this.enemyWins) {
          finalMessage = 'Vitória!';
        } else if (this.enemyWins > this.playerWins) {
          finalMessage = 'Game Over';
        } else {
          finalMessage = 'Empate Final!';
        }
        await this.roundTransition.show(finalMessage, 3000);
      } else {
        // Próximo round (não é o último e ninguém ganhou 2 rounds ainda)
        this.currentRound++;
        await this.roundTransition.show(`Próximo Round: ${this.currentRound}`);
        this.scene.restart({ vueComponentRef: this.vueComponent });
      }
    }
  }

  handleResize(width, height) {
      this.cameras.main.setSize(width, height);
      this.physics.world.setBounds(0, 0, width, height);

      if (this.ground) {
          this.ground.clear(true, true);
          this.createGround(); 
          // Re-add colliders after recreating ground
          if (this.player && this.enemy) {
              this.physics.world.colliders.destroy(); // Remove old ones first
              this.physics.add.collider(this.player, this.ground);
              this.physics.add.collider(this.enemy, this.ground);
              this.physics.add.collider(this.player, this.enemy);
          }
      }

      if (this.healthBarsContainer) {
          this.healthBarsContainer.setPosition(0, 20);
          if(this.playerHealthBar) this.playerHealthBar.setPosition(width * 0.25, 0);
          if(this.enemyHealthBar) this.enemyHealthBar.setPosition(width * 0.75, 0);
      }

      // Reposition background
      const bg = this.children.list.find(child => child.texture && 
        (child.texture.key === 'background' || child.texture.key === 'background2'));
      if (bg) {
          bg.setPosition(width / 2, height / 2);
          const scaleX = width / bg.width;
          const scaleY = height / bg.height;
          const scale = Math.max(scaleX, scaleY);
          bg.setScale(scale);
      }
  }
}
