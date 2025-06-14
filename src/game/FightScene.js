import Phaser from 'phaser';
import Player from './entities/Player.js';
import Moreno from './entities/Moreno.js';
import Cidao from './entities/Cidao.js';
import Hugo from './entities/Hugo.js';
import fights from './config/fights.js';
import HealthBar from './ui/HealthBar.js';
import RoundTransition from './transitions/RoundTransition.js';

/**
 * Mapeamento de classes de personagens
 * @type {Object.<string class>}
 */
const characterClasses = {
  Player,
  Moreno,
  Cidao,
  Hugo
};

export default class FightScene extends Phaser.Scene {
  constructor() {
    super('FightScene');
    
    // Propriedades da cena
    this.vueComponent = null;
    this.fightIndex = 0;
    this.currentFight = null;
    this.currentRound = 1;
    this.totalRounds = 3;
    this.playerWins = 0;
    this.enemyWins = 0;
    this.player = null;
    this.enemy = null;
    this.keys = null;
    this.controls = {
      left: 'A',
      right: 'D',
      jump: 'W',
      block: 'F',
      attack: 'SPACE',
      special: 'E',
      dash: 'SHIFT'
    };
    this.roundOver = false;
    this.controlsShown = false;
    this.ground = null;
    this.background = null;
    this.healthBars = {
      player: null,
      enemy: null
    };
    this.roundDots = {
      player: [],
      enemy: []
    };
    this.roundTransition = null;
  }

  init(data) {
    if (data?.vueComponentRef) {
      this.vueComponent = data.vueComponentRef;
      this.currentRound = this.vueComponent.currentRound || 1;
      this.playerWins = this.vueComponent.playerWins || 0;
      this.enemyWins = this.vueComponent.enemyWins || 0;
    }
    
    this.fightIndex = data?.fightIndex || 0;
    this.currentFight = fights[this.fightIndex];
    
    if (!this.currentFight) {
      console.error('Luta atual não definida!');
      this.scene.start('MenuScene');
      return;
    }
    
    console.log(`Iniciando luta ${this.fightIndex}: ${this.currentFight.name}`);
  }

  preload() {
    const loadSprite = (key, config) => {
      if (!config?.path) {
        console.error(`Sprite ${key} não configurada!`);
        return;
      }
      
      this.load.spritesheet(key, config.path, {
        frameWidth: config.frameWidth || 100,
        frameHeight: config.frameHeight || 350
      });
    };

    // Carrega sprites do jogador
    loadSprite('player-idle', this.currentFight.playerSprites.idle);
    loadSprite('player-walk', this.currentFight.playerSprites.walk);
    loadSprite('player-attack', this.currentFight.playerSprites.attack);
    loadSprite('player-block', this.currentFight.playerSprites.block);
    loadSprite('player-jump', this.currentFight.playerSprites.jump);
    loadSprite('player-dash', this.currentFight.playerSprites.dash);

    // Carrega sprites do inimigo
    loadSprite('enemy-idle', this.currentFight.enemySprites.idle);
    loadSprite('enemy-walk', this.currentFight.enemySprites.walk);
    loadSprite('enemy-attack', this.currentFight.enemySprites.attack);
    loadSprite('enemy-special', this.currentFight.enemySprites.special);
    loadSprite('enemy-jump', this.currentFight.enemySprites.jump);

    // Carrega background
    if (this.currentFight.background) {
      this.load.image('fight-bg', `/backgrounds/${this.currentFight.background}`);
    } else {
      console.error('Background não definido para a luta atual');
    }
    
    // Sons
    this.load.audio('punch', '/sounds/soco.mp3');
    this.load.audio('jump', '/sounds/jump.mp3');
    this.load.audio('block', '/sounds/block.mp3');
    this.load.audio('dash', '/sounds/dash.mp3');
  }

  async create() {
    console.log('Iniciando criação da cena...');
    
    if (!this.vueComponent) {
      this.showError("Erro: Componente Vue não encontrado!");
      return;
    }

    if (!this.currentFight) {
      this.showError("Erro: Luta atual não configurada!");
      return;
    }

    // Configuração da cena
    this.background = this.add.image(0, 0, 'fight-bg')
      .setOrigin(0)
      .setDisplaySize(this.cameras.main.width, this.cameras.main.height)
      .setDepth(-1);

    // Configuração física
    this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
    
    // Cria o chão primeiro
    this.createGround();

    // Criação de personagens
    const groundY = this.cameras.main.height * 0.85;
    const playerAltura = 155;
    const pisoY = groundY - (playerAltura / 2);

    // Verifica classes disponíveis
    console.log('Classes disponíveis:', characterClasses);
    
    // Cria jogador
    const PlayerClass = characterClasses[this.currentFight.player];
    if (!PlayerClass) {
      console.error('Classe do jogador não encontrada:', this.currentFight.player);
      return;
    }
    
    this.player = new PlayerClass(
      this, 
      this.cameras.main.width * 0.3, 
      pisoY,
      'player-idle'
    );
    
    if (!this.player) {
      console.error('Falha ao criar jogador');
      return;
    }

    // Cria inimigo
    const EnemyClass = characterClasses[this.currentFight.enemy];
    if (!EnemyClass) {
      console.error('Classe do inimigo não encontrada:', this.currentFight.enemy);
      return;
    }
    
    this.enemy = new EnemyClass(
      this,
      this.cameras.main.width * 0.7,
      pisoY,
      'enemy-idle'
    );
    
    if (!this.enemy) {
      console.error('Falha ao criar inimigo');
      return;
    }

    // Configura colisões
    this.setupCollisions();

    // Cria animações
    this.createAnimations();
    
    if (this.player.play) {
      this.player.play('player-idle');
    }
    
    if (this.enemy.play) {
      this.enemy.play('enemy-idle');
    }
    
    this.setupControls();
    this.createHealthBars();
    this.createRoundDots();
    
    // Inicializa transição de round
    this.roundTransition = new RoundTransition(this);
    if (!this.roundTransition) {
      console.error('Falha ao criar RoundTransition');
      return;
    }
    
    this.resetFightState();
    
    // Mostra instruções iniciais
    if (this.currentRound === 1 && !this.controlsShown) {
      await this.showInitialInstructions();
    }
    
    console.log('Cena criada com sucesso!');
  }

  update() {
    if (this.roundOver) return;

    try {
      if (this.player && typeof this.player.update === 'function') {
        this.player.update(this.keys);
      }
      
      if (this.enemy && typeof this.enemy.update === 'function') {
        this.enemy.update(this.player);
      }
      
      this.checkAttacks();
      this.updateHealthBars();
      this.checkRoundEnd();
    } catch (error) {
      console.error('Erro no update:', error);
    }
  }

  createGround() {
    const groundY = this.cameras.main.height * 0.85;
    this.ground = this.physics.add.staticGroup();
    
    const ground = this.ground.create(
      this.cameras.main.width / 2,
      groundY,
      'platform'
    ).setVisible(false);

    ground.setScale(this.cameras.main.width / ground.width, 1)
      .refreshBody()
      .setAlpha(0);
      
    console.log('Chão criado na posição Y:', groundY);
  }

  setupControls() {
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes[this.controls.left],
      right: Phaser.Input.Keyboard.KeyCodes[this.controls.right],
      jump: Phaser.Input.Keyboard.KeyCodes[this.controls.jump],
      block: Phaser.Input.Keyboard.KeyCodes[this.controls.block],
      attack: Phaser.Input.Keyboard.KeyCodes[this.controls.attack],
      special: Phaser.Input.Keyboard.KeyCodes[this.controls.special],
      dash: Phaser.Input.Keyboard.KeyCodes[this.controls.dash]
    });
  }

  setupCollisions() {
    if (!this.ground || !this.player || !this.enemy) {
      console.error('Objetos necessários para colisão não criados!');
      return;
    }

    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.enemy, this.ground);

    this.physics.add.collider(
      this.player,
      this.enemy,
      (player, enemy) => {
        if (player.body.velocity.y < 0 && player.body.bottom < enemy.body.top + 20) {
          return false;
        }
        return true;
      }
    );
  }

  createHealthBars() {
    // Container para organização
    const healthBarsContainer = this.add.container(0, 20).setDepth(10);
    
    // Barra do jogador (verde)
    this.healthBars.player = new HealthBar(
      this,
      this.cameras.main.width * 0.25,
      0,
      200,
      20,
      0x4CAF50, // Verde
      0x333333  // Borda
    );
    
    // Barra do inimigo (vermelho)
    this.healthBars.enemy = new HealthBar(
      this,
      this.cameras.main.width * 0.75,
      0,
      200,
      20,
      0xF44336, // Vermelho
      0x333333  // Borda
    );
    
    healthBarsContainer.add([
      ...this.healthBars.player.getGraphics(),
      ...this.healthBars.enemy.getGraphics()
    ]);
        
    // Texto "VS" central
    this.add.text(
      this.cameras.main.width / 2,
      30,
      'VS',
      {
        fontSize: '90px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 5,
        shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 2 }
      }
    ).setOrigin(0.5).setDepth(11);
  }

  createRoundDots() {
    const dotSize = 20;
    const spacing = 40;
    const startX = this.cameras.main.width * 0.1 - spacing;
    const yPos = 60;
    
    // Pontos do jogador
    for (let i = 0; i < 2; i++) {
      const dot = this.add.circle(
        startX + (i * spacing * 2),
        yPos,
        dotSize,
        i < this.playerWins ? 0x4CAF50 : 0x888888
      ).setStrokeStyle(2, 0x333333);
      
      this.roundDots.player.push(dot);
    }
    
    // Pontos do inimigo
    for (let i = 0; i < 2; i++) {
      const dot = this.add.circle(
        this.cameras.main.width * 0.9 + (i * spacing * 2),
        yPos,
        dotSize,
        i < this.enemyWins ? 0xF44336 : 0x888888
      ).setStrokeStyle(2, 0x333333);
      
      this.roundDots.enemy.push(dot);
    }
  }

  createAnimations() {
    const createAnim = (key, spriteKey, frameConfig, frameRate = 8, repeat = -1) => {
      if (!this.textures.exists(spriteKey)) {
        console.error(`SpriteSheet ${spriteKey} não encontrada para animação ${key}`);
        return;
      }

      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(spriteKey, frameConfig),
        frameRate,
        repeat
      });
    };

    // Animações do jogador
    createAnim('player-idle', 'player-idle', { start: 0, end: 0 });
    createAnim('player-walk', 'player-walk', { start: 0, end: this.currentFight.playerSprites.walk.frames - 1 });
    createAnim('player-attack', 'player-attack', { start: 0, end: this.currentFight.playerSprites.attack.frames - 1 }, 15, 0);
    createAnim('player-block', 'player-block', { start: 0, end: 0 });
    createAnim('player-jump', 'player-jump', { start: 0, end: 0 });
    createAnim('player-dash', 'player-dash', { start: 0, end: 0 }, 10, 0);

    // Animações do inimigo
    const prefix = this.enemy.animPrefix;
    createAnim(`${prefix}-idle`, 'enemy-idle', { start: 0, end: 0 });
    createAnim(`${prefix}-walk`, 'enemy-walk', { start: 0, end: this.currentFight.enemySprites.walk.frames - 1 });
    createAnim(`${prefix}-attack`, 'enemy-attack', { start: 0, end: this.currentFight.enemySprites.attack.frames - 1 }, 15, 0);
    createAnim(`${prefix}-special`, 'enemy-special', { start: 0, end: this.currentFight.enemySprites.special.frames - 1 }, 15, 0);
    createAnim(`${prefix}-jump`, 'enemy-jump', { start: 0, end: 0 });
  }

  resetFightState() {
    if (!this.ground || !this.ground.getChildren().length) {
      console.error('Chão não disponível para resetFightState');
      return;
    }

    const groundY = this.ground.getChildren()[0].y;
    
    if (this.player && typeof this.player.reset === 'function') {
      this.player.reset(
        this.cameras.main.width * 0.3,
        groundY - 100,
        100
      );
    }
    
    if (this.enemy && typeof this.enemy.reset === 'function') {
      this.enemy.reset(
        this.cameras.main.width * 0.7,
        groundY - 100,
        100
      );
    }
    
    this.updateHealthBars();
    this.roundOver = false;
  }

  updateHealthBars() {
    if (this.healthBars.player && this.player) {
      this.healthBars.player.setValue(this.player.health);
    }
    if (this.healthBars.enemy && this.enemy) {
      this.healthBars.enemy.setValue(this.enemy.health);
    }
    
    if (this.vueComponent) {
      this.vueComponent.updateHealth(
        this.player?.health || 0,
        this.enemy?.health || 0
      );
    }
  }

  async showInitialInstructions() {
    if (!this.roundTransition) return;
    
    this.roundOver = true;
    
    try {
      await this.roundTransition.showControlsScreen(5000);
      this.roundOver = false;
      this.controlsShown = true;
      await this.roundTransition.show('FIGHT!', 1000);
    } catch (error) {
      console.error('Erro ao mostrar instruções:', error);
      this.roundOver = false;
    }
  }

  checkAttacks() {
    // Jogador atacando
    if (this.player?.isAttacking && this.checkHit(this.player, this.enemy)) {
      this.enemy.takeDamage(10);
      this.sound.play('punch');
    }
    
    // Inimigo atacando
    if (this.enemy?.isAttacking && this.checkHit(this.enemy, this.player)) {
      this.player.takeDamage(8);
      this.sound.play('punch');
    }
  }

  checkHit(attacker, target) {
    if (!attacker || !target) return false;
    
    return Phaser.Geom.Intersects.RectangleToRectangle(
      attacker.getHitBounds(),
      target.getHitBox()
    );
  }

  handleCharacterCollision(player, enemy) {
    if (!player?.body || !enemy?.body) return true;
    
    const verticalThreshold = 15;
    if (player.body.velocity.y > 0 && 
        player.body.bottom <= enemy.body.top + verticalThreshold) {
      return false;
    }
    return true;
  }

  async checkRoundEnd() {
    if (this.roundOver || !this.roundTransition) return;
    
    let winner = null;
    if (this.enemy && this.enemy.health <= 0) {
      winner = 'player';
      this.playerWins++;
    } else if (this.player && this.player.health <= 0) {
      winner = 'enemy';
      this.enemyWins++;
    }
    
    if (!winner) return;
    
    this.roundOver = true;
    this.updateRoundDots();
    
    if (this.vueComponent) {
      this.vueComponent.updateRoundInfo(
        this.currentRound,
        this.playerWins,
        this.enemyWins
      );
    }
    
    try {
      await this.roundTransition.show(
        winner === 'player' ? 'Você venceu!' : 'Você perdeu!'
      );
      await this.handleFightOutcome();
    } catch (error) {
      console.error('Erro na transição de round:', error);
    }
  }

  updateRoundDots() {
    this.roundDots.player.forEach((dot, i) => {
      if (dot) dot.fillColor = i < this.playerWins ? 0x4CAF50 : 0x888888;
    });
    
    this.roundDots.enemy.forEach((dot, i) => {
      if (dot) dot.fillColor = i < this.enemyWins ? 0xF44336 : 0x888888;
    });
  }

  async handleFightOutcome() {
    const isLastFight = this.fightIndex >= fights.length - 1;
    const playerWonFight = this.playerWins >= 2;
    const enemyWonFight = this.enemyWins >= 2;
    const isLastRound = this.currentRound >= this.totalRounds;
    
    if (playerWonFight) {
      if (!isLastFight) {
        await this.nextFight();
      } else {
        await this.victoryScreen();
      }
    } else if (enemyWonFight) {
      await this.gameOverScreen();
    } else if (isLastRound) {
      await this.finalResult();
    } else {
      await this.nextRound();
    }
  }

  async nextFight() {
    if (!this.roundTransition) return;
    
    await this.roundTransition.show('Próxima luta!');
    
    const text = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 60,
      'Pressione E para continuar',
      { fontSize: '24px', fill: '#FFF' }
    ).setOrigin(0.5);
    
    await this.waitForInput('E');
    text.destroy();
    
    this.scene.start('FightScene', {
      vueComponentRef: this.vueComponent,
      fightIndex: this.fightIndex + 1
    });
  }

  async victoryScreen() {
    if (!this.roundTransition) return;
    
    await this.roundTransition.show('Você venceu todas as lutas!');
    await this.waitForInput('SPACE');
    this.vueComponent?.restartGame();
  }

  async gameOverScreen() {
    if (!this.roundTransition) return;
    
    await this.roundTransition.showGameOverScreen();
    await this.waitForInput('SPACE');
    this.vueComponent?.restartGame();
  }

  async finalResult() {
    if (!this.roundTransition) return;
    
    let message = '';
    if (this.playerWins > this.enemyWins) {
      message = 'Vitória!';
    } else if (this.enemyWins > this.playerWins) {
      message = 'Game Over';
    } else {
      message = 'Empate!';
    }
    
    await this.roundTransition.show(message);
    await this.waitForInput('SPACE');
    this.vueComponent?.restartGame();
  }

  async nextRound() {
    if (!this.roundTransition) return;
    
    this.currentRound++;
    await this.roundTransition.show(`Round ${this.currentRound}`);
    this.scene.restart({
      vueComponentRef: this.vueComponent,
      fightIndex: this.fightIndex
    });
  }

  async waitForInput(key) {
    return new Promise(resolve => {
      const keyObj = this.input.keyboard.addKey(key);
      keyObj.once('down', () => {
        this.input.keyboard.removeKey(key);
        resolve();
      });
    });
  }

  showError(message) {
    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      message,
      { 
        fontSize: '24px', 
        color: '#FF0000',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5);
  }

  handleResize(width, height) {
    this.cameras.main.setSize(width, height);
    this.physics.world.setBounds(0, 0, width, height);
    
    if (this.background) {
      this.background.setDisplaySize(width, height);
    }
    
    if (this.ground) {
      const ground = this.ground.getChildren()[0];
      if (ground) {
        ground.setX(width / 2);
        ground.setScale(width / ground.width, 1);
        ground.refreshBody();
        
        if (this.player) this.player.setY(ground.y - 100);
        if (this.enemy) this.enemy.setY(ground.y - 100);
      }
    }
    
    if (this.healthBars.player) {
      this.healthBars.player.setPosition(width * 0.25, 0);
    }
    if (this.healthBars.enemy) {
      this.healthBars.enemy.setPosition(width * 0.75, 0);
    }
    
    const dotSpacing = 40;
    const startX = width * 0.1 - dotSpacing;
    this.roundDots.player.forEach((dot, i) => {
      if (dot) dot.setX(startX + (i * dotSpacing * 2));
    });
    
    this.roundDots.enemy.forEach((dot, i) => {
      if (dot) dot.setX(width * 0.9 + (i * dotSpacing * 2));
    });
  }

  damagePlayer(amount) {
    if (this.player && typeof this.player.takeDamage === 'function') {
      this.player.takeDamage(amount);
    }
  }

  damageEnemy(amount) {
    if (this.enemy && typeof this.enemy.takeDamage === 'function') {
      this.enemy.takeDamage(amount);
    }
  }
}