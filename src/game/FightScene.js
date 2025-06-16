import Phaser from 'phaser';
import Player from './entities/Player.js';
import Moreno from './entities/Moreno.js';
import Cidao from './entities/Cidao.js';
import Hugo from './entities/Hugo.js';
import fights from './config/fights.js';
import HealthBar from './ui/HealthBar.js';
import RoundTransition from './transitions/RoundTransition.js';
import PhaseTransition from './transitions/PhaseTransition.js';
import CutsceneManager from './cutscene/CutsceneManager.js';

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
    
    // Propriedades para sistema de fases
    this.phaseWins = 0;
    this.currentPhase = 1;
    this.totalPhases = 3;
    this.showingPhaseTransition = false;
    this.phaseTransition = null;
    this.cutsceneManager = null;
  }

  init(data) {
    if (data?.vueComponentRef) {
        this.vueComponent = data.vueComponentRef;
        // Sincroniza os valores iniciais
        this.currentRound = this.vueComponent.currentRound = data.currentRound || 1;
        this.playerWins = this.vueComponent.playerWins = data.playerWins || 0;
        this.enemyWins = this.vueComponent.enemyWins = data.enemyWins || 0;
    } else {
        this.currentRound = 1;
        this.playerWins = 0;
        this.enemyWins = 0;
    }
    
    this.fightIndex = data?.fightIndex || 0;
    this.currentPhase = this.fightIndex + 1;
    this.currentFight = fights[this.fightIndex];
    
    if (!this.currentFight) {
        console.error('Luta atual não definida!');
        this.scene.start('MenuScene');
        return;
    }
    
    console.log(`Iniciando Fase ${this.currentPhase}: ${this.currentFight.name}`);
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

    // 1. Primeiro carrega TODOS os backgrounds das fases antecipadamente
    fights.forEach((fight, index) => {
        this.load.image(`bg-phase-${index+1}`, `backgrounds/${fight.background}`);
    });

    // 2. Carrega a imagem de transição
    this.load.image('transition-bg', 'backgrounds/transition-bg.png');

    // 3. Carrega sprites do jogador
    loadSprite('player-idle', this.currentFight.playerSprites.idle);
    loadSprite('player-walk', this.currentFight.playerSprites.walk);
    loadSprite('player-attack', this.currentFight.playerSprites.attack);
    loadSprite('player-block', this.currentFight.playerSprites.block);
    loadSprite('player-jump', this.currentFight.playerSprites.jump);
    loadSprite('player-dash', this.currentFight.playerSprites.dash);

    // 4. Carrega sprites do inimigo com chaves únicas baseadas no nome do inimig
    const enemyName = this.currentFight.enemy.toLowerCase();
    loadSprite(`${enemyName}-idle`, this.currentFight.enemySprites.idle);
    loadSprite(`${enemyName}-walk`, this.currentFight.enemySprites.walk);
    loadSprite(`${enemyName}-attack`, this.currentFight.enemySprites.attack);
    loadSprite(`${enemyName}-special`, this.currentFight.enemySprites.special);
    loadSprite(`${enemyName}-jump`, this.currentFight.enemySprites.jump);
    
    // 5. Sons
    this.load.audio('punch', '/sounds/soco.mp3');
    this.load.audio('jump', '/sounds/jump.mp3');
    this.load.audio('block', '/sounds/block.mp3');
    this.load.audio('dash', '/sounds/dash.mp3');

    // Remove os carregamentos duplicados de background que estavam aqui antes
}

  async create() {
    // Configuração do AudioContext
    const handleAudioContext = () => {
        if (!this.sound || !this.sound.context) {
            console.warn('Sistema de áudio não disponível');
            return;
        }

        const unlockAudio = () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
            
            try {
                if (this.sound.context.state === 'suspended') {
                    this.sound.context.resume().then(() => {
                        console.log('Áudio desbloqueado');
                    });
                }
            } catch (error) {
                console.error('Erro ao retomar áudio:', error);
            }
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);

        if (this.game.hasUserInteraction) {
            unlockAudio();
        }
    };


    // Verificações iniciais
    if (!this.vueComponent) {
        this.showError("Erro: Componente Vue não encontrado!");
        return;
    }

    if (!this.currentFight) {
        this.showError("Erro: Luta atual não configurada!");
        return;
    }

    // Configuração do background usando o sistema de pré-carregamento
    const bgKey = `bg-phase-${this.fightIndex+1}`;
    
    if (this.textures.exists(bgKey)) {
        this.background = this.add.image(0, 0, bgKey)
            .setOrigin(0)
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height)
            .setDepth(-1);
    } else {
        console.error(`Background "${bgKey}" não encontrado!`);
        // Fallback - fundo cinza
        this.background = this.add.rectangle(0, 0, 
            this.cameras.main.width, 
            this.cameras.main.height, 
            0x333333)
            .setOrigin(0)
            .setDepth(-1);
    }

    // Configuração física
    this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
    this.createGround();

    // Criação dos personagens
    const groundY = this.cameras.main.height * 0.85;
    const pisoY = groundY - (155 / 2);
    
    // Player
    const PlayerClass = characterClasses[this.currentFight.player];
    if (!PlayerClass) {
        console.error('Classe do jogador não encontrada:', this.currentFight.player);
        return;
    }
    this.player = new PlayerClass(this, this.cameras.main.width * 0.3, pisoY, 'player-idle');
    
    // Inimigo
    const enemyName = this.currentFight.enemy.toLowerCase();
    const EnemyClass = characterClasses[this.currentFight.enemy];
    if (!EnemyClass) {
        console.error('Classe do inimigo não encontrada:', this.currentFight.enemy);
        return;
    }
    this.enemy = new EnemyClass(this, this.cameras.main.width * 0.7, pisoY, `${enemyName}-idle`);

    // Configurações básicas
    this.setupCollisions();
    this.createAnimations();
    if (this.player.play) this.player.play('player-idle');
    if (this.enemy.play) this.enemy.play(`${enemyName}-idle`);
    this.setupControls();
    this.createHealthBars();
    this.createRoundDots();

    // Inicializa transições
    this.roundTransition = new RoundTransition(this);
    this.phaseTransition = new PhaseTransition(this);

    // Configuração das teclas (em create())
    this.input.keyboard.on('keydown', (event) => {
      if (this.roundOver && !this.showingPhaseTransition) {
        switch (event.key.toUpperCase()) {
          case 'R': // Reiniciar fase atual
            this.scene.restart({
              fightIndex: this.fightIndex,
              vueComponentRef: this.vueComponent
            });
          break;
                    
          case 'B': // Voltar para fase anterior
            if (this.fightIndex > 0) {
              this.scene.start('FightScene', {
                fightIndex: this.fightIndex - 1,
                vueComponentRef: this.vueComponent,
                currentRound: 1,
                playerWins: 0,
                enemyWins: 0
              });
            } else {
              this.scene.start('MenuScene');
            }
          break;
        }
      }
    });

    // Inicialização do CutsceneManager
    try {
        this.cutsceneManager = new CutsceneManager(this);
        if (!this.cutsceneManager || 
            typeof this.cutsceneManager.showVictoryCutscene !== 'function' ||
            typeof this.cutsceneManager.showDefeatCutscene !== 'function') {
            throw new Error('CutsceneManager inválido');
        }
    } catch (error) {
        console.error('Falha ao inicializar CutsceneManager:', error);
        this.cutsceneManager = {
            showVictoryCutscene: async () => {
                await new Promise(resolve => this.time.delayedCall(2000, resolve));
            },
            showDefeatCutscene: async () => {
                await new Promise(resolve => this.time.delayedCall(2000, resolve));
            }
        };
    }
    
    this.resetFightState();
    
    // Instruções iniciais
    if (this.currentRound === 1 && !this.controlsShown) {
        await this.showInitialInstructions();
    }
  }

  update() {
    if (this.roundOver || this.showingPhaseTransition) return;

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
    const groundY = this.cameras.main.height * 0.01;
    this.ground = this.physics.add.staticGroup();
    
    const ground = this.ground.create(
      this.cameras.main.width / 2,
      groundY,
      'platform'
    ).setVisible(false);

    ground.setScale(this.cameras.main.width / ground.width, 1)
      .refreshBody()
      .setAlpha(0);
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

    // Colisão com o chão (mantém padrão)
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.enemy, this.ground);

    // Substitui o collider player-enemy por um overlap condicional
    this.physics.add.overlap(
        this.player,
        this.enemy,
        (player, enemy) => {
            // Se o player está vindo de cima (caindo no inimigo)
            if (player.body.velocity.y > 0 && player.y < enemy.y) {
                // Permite atravessar (ignora colisão)
                return;
            }

            // Se for colisão lateral ou por baixo, aplica um pequeno empurrão
            const direction = player.x < enemy.x ? -1 : 1;
            player.setVelocityX(direction * 100);
            enemy.setVelocityX(-direction * 100);
        }
    );
  }

  createHealthBars() {
    const healthBarsContainer = this.add.container(0, 20).setDepth(10);
    
    // Barra do jogador (verde)
    this.healthBars.player = new HealthBar(
        this,
        this.cameras.main.width * 0.25,
        0,
        300, // Largura reduzida
        25,
        0x4CAF50, // Verde
        true // É o player
    );
    
    // Barra do inimigo (vermelha)
    this.healthBars.enemy = new HealthBar(
        this,
        this.cameras.main.width * 0.75,
        0,
        300, // Largura reduzida
        25,
        0xF44336, // Vermelho
        false // É o inimigo
    );
    
    // Adiciona texto "VS" no centro
    const vsText = this.add.text(
        this.cameras.main.width / 2,
        0,
        'VS',
        {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 5,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 2 }
        }
    ).setOrigin(0.5).setDepth(11);

    // Adiciona texto da fase
    const phaseText = this.add.text(
        this.cameras.main.width / 2,
        40,
        `FASE ${this.currentPhase}`,
        {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3,
            shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 1 }
        }
    ).setOrigin(0.5).setDepth(11);

    healthBarsContainer.add([
        ...this.healthBars.player.getGraphics(),
        ...this.healthBars.enemy.getGraphics(),
        vsText,
        phaseText
    ]);
  }

  createRoundDots() {
    const dotSize = 20;
    const spacing = 40;
    const startX = this.cameras.main.width * 0.1 - spacing;
    const yPos = 60;
    
    for (let i = 0; i < 2; i++) {
      const dot = this.add.circle(
        startX + (i * spacing * 2),
        yPos,
        dotSize,
        i < this.playerWins ? 0x4CAF50 : 0x888888
      ).setStrokeStyle(2, 0x333333);
      this.roundDots.player.push(dot);
    }
    
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
    createAnim('player-dash', 'player-dash', { start: 0, end: 0 }, 15, 0);

    // Animações do inimigo com chaves únicas
    const enemyName = this.currentFight.enemy.toLowerCase();
    createAnim(`${enemyName}-idle`, `${enemyName}-idle`, { start: 0, end: 0 });
    createAnim(`${enemyName}-walk`, `${enemyName}-walk`, { start: 0, end: this.currentFight.enemySprites.walk.frames - 1 });
    createAnim(`${enemyName}-attack`, `${enemyName}-attack`, { start: 0, end: this.currentFight.enemySprites.attack.frames - 1 }, 15, 0);
    createAnim(`${enemyName}-special`, `${enemyName}-special`, { start: 0, end: this.currentFight.enemySprites.special.frames - 1 }, 15, 0);
    createAnim(`${enemyName}-jump`, `${enemyName}-jump`, { start: 0, end: 0 });
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
    if (this.player?.isAttacking && this.checkHit(this.player, this.enemy)) {
      this.enemy.takeDamage(10);
      this.sound.play('punch');
    }
    
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

  async checkRoundEnd() {
    if (this.roundOver || !this.roundTransition || this.showingPhaseTransition) return;
    
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
        // Verificação adicional antes de usar roundTransition
        if (this.roundTransition && typeof this.roundTransition.show === 'function') {
            await this.roundTransition.show(
                winner === 'player' ? 'Você venceu!' : 'Você perdeu!'
            );
        }
        await this.handleFightOutcome();
    } catch (error) {
        console.error('Erro na transição de round:', error);
        this.scene.restart();
    }
  }

  async handleFightOutcome() {
    const safeDelay = (ms) => {
        return new Promise(resolve => {
            this.time.delayedCall(ms, resolve);
        });
    };

    try {
        if (this.playerWins >= 2) {
            this.phaseWins++;
            
            if (this.currentPhase >= this.totalPhases) {
                await this.endGame(true);
            } else {
                // Atualiza o VueComponent antes da transição
                if (this.vueComponent) {
                    this.vueComponent.currentRound = 1;
                    this.vueComponent.playerWins = 0;
                    this.vueComponent.enemyWins = 0;
                }
                
                await safeDelay(1000); // Pequena pausa antes da transição
                await this.advanceToNextPhase();
            }
        } else if (this.enemyWins >= 2) {
            await this.endGame(false);
        } else {
            this.currentRound++;
            this.resetFightState();
            
            if (this.vueComponent) {
                this.vueComponent.updateRoundInfo(
                    this.currentRound,
                    this.playerWins,
                    this.enemyWins
                );
            }
            
            if (this.roundTransition) {
                await this.roundTransition.show(`Round ${this.currentRound}!`, 1500);
            }
        }
    } catch (error) {
        console.error('Erro no handleFightOutcome:', error);
        this.scene.restart({
            vueComponentRef: this.vueComponent,
            fightIndex: this.fightIndex
        });
    }
  }

  async showPhaseVictory() {
    this.showingPhaseTransition = true;
    
    try {
        // Executa a animação de transição
        await this.phaseTransition.executePhaseTransition(
            this.currentPhase,
            this.currentPhase + 1,
            this.currentFight.background // Usa o background da próxima fase
        );
        
        // Espera 2 segundos para o jogador ver a mensagem
        await new Promise(resolve => {
            this.time.delayedCall(2000, resolve);
        });
        
        // Avança automaticamente
        this.advanceToNextPhase();
        
    } catch (error) {
        console.error('Erro na transição de fase:', error);
        this.showingPhaseTransition = false;
    }
  }

  async advanceToNextPhase() {
    if (this.showingPhaseTransition) return;
    this.showingPhaseTransition = true;
    
    try {
        const nextFightIndex = this.fightIndex + 1;
        const nextFight = fights[nextFightIndex];
        
        if (!nextFight) {
            await this.endGame(true);
            return;
        }

        // Mostra a transição de fase com o novo background
        await this.phaseTransition.showPhaseTransition(
            this.currentPhase,
            this.currentPhase + 1,
            nextFight.background // Passa o background da próxima fase
        );

        // Limpa o estado atual
        if (this.roundTransition?.cleanup) {
            this.roundTransition.cleanup();
        }
        
        // Atualiza o VueComponent antes de mudar de cena
        if (this.vueComponent) {
            this.vueComponent.currentRound = 1;
            this.vueComponent.playerWins = 0;
            this.vueComponent.enemyWins = 0;
            this.vueComponent.currentPhase = nextFightIndex + 1;
        }
        
        // Inicia a próxima fase
        this.scene.start('FightScene', {
            fightIndex: nextFightIndex,
            vueComponentRef: this.vueComponent,
            currentRound: 1,
            playerWins: 0,
            enemyWins: 0
        });
        
    } catch (error) {
        console.error('Falha ao avançar fase:', error);
        this.scene.restart();
    } finally {
        this.showingPhaseTransition = false;
    }
  }

  async endGame(playerWon) {
    try {
        this.showingPhaseTransition = true;
        
        if (playerWon) {
            await this.cutsceneManager.showVictoryCutscene();
            this.scene.start('MenuScene');
        } else {
            await this.cutsceneManager.showDefeatCutscene();
            // A cena será reiniciada ou mudada pela própria cutscene
        }
    } catch (error) {
        console.error('Erro na cutscene final:', error);
        this.scene.start('MenuScene');
    } finally {
        this.showingPhaseTransition = false;
    }
  }

  updateRoundDots() {
    // Atualiza dots do jogador
    this.roundDots.player.forEach((dot, index) => {
      dot.setFillStyle(index < this.playerWins ? 0x4CAF50 : 0x888888);
    });
    
    // Atualiza dots do inimigo
    this.roundDots.enemy.forEach((dot, index) => {
      dot.setFillStyle(index < this.enemyWins ? 0xF44336 : 0x888888);
    });
  }

  showError(message) {
    console.error(message);
    
    if (this.vueComponent) {
      this.vueComponent.showError(message);
    }
    
    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      message,
      {
        fontSize: '32px',
        fill: '#ff0000',
        fontFamily: 'Arial'
      }
    ).setOrigin(0.5);
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

  handleResize(width, height) {
    this.cameras.main.setSize(width, height);
    this.physics.world.setBounds(0, 0, width, height);
    
    if (this.background) {
      this.background.setDisplaySize(width, height);
    }
    
    if (this.ground) {
      const ground = this.ground.getChildren()[0];
      if (ground) {
        ground.setPosition(width / 2, height * 0.01);
        ground.setScale(width / ground.width, 1);
        ground.refreshBody();
      }
    }
    
    if (this.healthBars.player) {
      this.healthBars.player.setPosition(width * 0.25, 20);
    }
    
    if (this.healthBars.enemy) {
      this.healthBars.enemy.setPosition(width * 0.75, 20);
    }
    
    // Atualiza posição dos pontos de round
    const dotSpacing = 40;
    const startX = width * 0.1 - dotSpacing;
    
    this.roundDots.player.forEach((dot, i) => {
      dot.setPosition(startX + (i * dotSpacing * 2), 60);
    });
    
    this.roundDots.enemy.forEach((dot, i) => {
      dot.setPosition(width * 0.9 + (i * dotSpacing * 2), 60);
    });
  }

  destroy() {
    // Limpeza de recursos
    if (this.roundTransition) {
      this.roundTransition.cleanup();
    }
    
    if (this.phaseTransition) {
      this.phaseTransition.cleanup();
    }
    
    super.destroy();
  }
}