import Phaser from 'phaser';
import Player from './entities/Player.js'; // Relative path from src/game/
import Enemy from './entities/Enemy.js';   // Relative path from src/game/
import HealthBar from './ui/HealthBar.js'; // Relative path from src/game/
import RoundTransition from './transitions/RoundTransition.js'; // <<< Importação adicionada

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
    this.roundOver = true; // <<< Inicia como true
    this.ground = null;
    this.playerHealthBar = null;
    this.enemyHealthBar = null;
    this.healthBarsContainer = null;
    this.roundTransition = null; // <<< Propriedade adicionada

    // Round state managed by the scene
    this.currentRound = 1;
    this.totalRounds = 3;
    this.playerWins = 0;
    this.enemyWins = 0;

    // Referências para os dots (se usar a lógica do arquivo 1)
    this.playerRoundDots = [];
    this.enemyRoundDots = [];
    this.playerRoundDotsContainer = null;
    this.enemyRoundDotsContainer = null;
  }

  // Receive data when the scene starts
  init(data) {
    console.log("FightScene: Init com dados", data);
    if (data && data.vueComponentRef) {
        this.vueComponent = data.vueComponentRef; // Get the reference passed from GameContainer
    } else {
        console.error("FightScene: Referência do vueComponent não recebida no init!");
        // Handle the error appropriately, maybe stop the scene or use default behavior
    }
    // Reset round state if restarting
    this.currentRound = this.vueComponent ? this.vueComponent.currentRound : 1;
    this.playerWins = this.vueComponent ? this.vueComponent.playerWins : 0;
    this.enemyWins = this.vueComponent ? this.vueComponent.enemyWins : 0;
    this.roundOver = true; // <<< Garante que começa true a cada reinício
  }

  preload() {
    console.log('FightScene: Preload iniciado');
    // Usar apenas um load por spritesheet
    this.load.spritesheet('player', '/sprite/sprite.png', { frameWidth: 235, frameHeight: 350 });
    this.load.spritesheet('enemy', '/sprite/sprite.png', { frameWidth: 235, frameHeight: 350 });
    // Remover o segundo load de 'player' se for o mesmo arquivo ou corrigir o path
    // this.load.spritesheet('player', 'sprite/moreno_escudo.png', { frameWidth: 240, frameHeight: 320 });

    try {
      this.load.image('background', '/backgrounds/menu.png');
      console.log('FightScene: Tentando carregar background');
    } catch (e) {
      console.log('FightScene: Background não encontrado, usando cor padrão');
    }
    this.load.image('platform', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAUCAYAAAB7wJiVAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAnSURBVHgB7cxBDQAADMOwkb/RpYfYgQT2tgEAAAAAAAAAAADwwAB9pgABKZ/t3QAAAABJRU5ErkJggg==');
  }

  create() {
     // Check if vueComponent reference was received
    if (!this.vueComponent) {
        console.error("FightScene: create() chamado sem referência do vueComponent!");
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Erro: Falha ao carregar componente Vue.', { color: '#ff0000', fontSize: '20px' }).setOrigin(0.5);
        return; // Stop execution if the reference is missing
    }
    console.log('FightScene: Método create chamado!');

    // Configura background
    if (this.textures.exists('background')) {
      const bg = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background');
      const scaleX = this.cameras.main.width / bg.width;
      const scaleY = this.cameras.main.height / bg.height;
      const scale = Math.max(scaleX, scaleY);
      bg.setScale(scale).setDepth(-1);
    } else {
       this.cameras.main.setBackgroundColor('#2d2d2d');
    }

    // Configura física e chão
    this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
    this.createGround();

    // Cria jogador e inimigo
    const groundY = this.cameras.main.height * 0.85;
    const playerStartX = this.cameras.main.width * 0.3;
    const enemyStartX = this.cameras.main.width * 0.7;
    this.player = new Player(this, playerStartX, groundY - 100, 'player');
    this.enemy = new Enemy(this, enemyStartX, groundY - 100, 'enemy');

    // Adiciona colisões
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.enemy, this.ground);
    this.physics.add.collider(this.player, this.enemy);

    // Cria animações
    this.createAnimations();

    // Define animações iniciais
    this.player.play('player-idle');
    this.enemy.play('enemy-idle');

    // Configuração das Teclas
    this.keys = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S, // <<< Tecla S adicionada para consistência com startPreFightTransition
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER // <<< Tecla Enter adicionada
    });

    // Reseta estado do round
    this.player.health = 100;
    this.enemy.health = 100;
    this.roundOver = true; // <<< Input bloqueado inicialmente

    // Comunica estado inicial ao Vue
    this.vueComponent.updateHealth(this.player.health, this.enemy.health);
    this.vueComponent.updateRoundInfo(this.currentRound, this.playerWins, this.enemyWins);

    // Cria barras de vida e VS
    this.createHealthBars();

    // Cria dots de round (se mantiver essa lógica do arquivo 1)
    this.createRoundDots();

    // <<< Integração: Cria objeto de transição >>>
    this.roundTransition = new RoundTransition(this);

    // <<< Integração: Lógica da Transição Inicial >>>
    if (this.currentRound === 1) {
      this.startPreFightTransition(); // Mostra controles no round 1
    } else {
      this.startCountdown(); // Inicia contagem nos rounds seguintes
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

      // Texto VS centralizado
      const vsText = this.add.text(
        this.cameras.main.width * 0.5,
        20 + 10, // Centraliza verticalmente com as barras
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
      if (this.playerHealthBar && this.player) {
          this.playerHealthBar.setValue(this.player.health);
      }
      if (this.enemyHealthBar && this.enemy) {
          this.enemyHealthBar.setValue(this.enemy.health);
      }
      if (this.vueComponent && this.player && this.enemy) {
        this.vueComponent.updateHealth(this.player.health, this.enemy.health);
      }
  }

  // Função para criar os dots de round (mantida do arquivo 1)
  createRoundDots() {
    const dotRadius = 20;
    const dotSpacing = 60;
    const totalDots = 2; // Ajustar se this.totalRounds for diferente
    const healthBarHeight = 20;
    const healthBarY = 20;
    const gap = 60;

    // Player dots
    const playerDotsY = healthBarY + healthBarHeight + gap;
    this.playerRoundDots = [];
    this.playerRoundDotsContainer = this.add.container(this.cameras.main.width * 0.10, playerDotsY).setDepth(11);
    for (let i = 0; i < totalDots; i++) {
      const x = -dotSpacing / 2 + i * dotSpacing;
      const dot = this.add.circle(x, 0, dotRadius, i < this.playerWins ? 0x4CAF50 : 0x888888).setStrokeStyle(2, 0x222222);
      this.playerRoundDotsContainer.add(dot);
      this.playerRoundDots.push(dot);
    }

    // Enemy dots
    const enemyDotsY = healthBarY + healthBarHeight + gap;
    this.enemyRoundDots = [];
    this.enemyRoundDotsContainer = this.add.container(this.cameras.main.width * 0.90, enemyDotsY).setDepth(11);
    for (let i = 0; i < totalDots; i++) {
      const x = -dotSpacing / 2 + i * dotSpacing;
      const dot = this.add.circle(x, 0, dotRadius, i < this.enemyWins ? 0xf44336 : 0x888888).setStrokeStyle(2, 0x222222);
      this.enemyRoundDotsContainer.add(dot);
      this.enemyRoundDots.push(dot);
    }

    // Atualiza os dots imediatamente
    this.updateRoundDots();

    // Patch para atualizar dots quando Vue atualizar rounds (se necessário)
    // Se a lógica de rounds for gerenciada apenas pela cena, isso pode não ser necessário
    // const originalUpdateRoundInfo = this.vueComponent.updateRoundInfo;
    // this.vueComponent.updateRoundInfo = (currentRound, playerWins, enemyWins) => {
    //   originalUpdateRoundInfo.call(this.vueComponent, currentRound, playerWins, enemyWins);
    //   this.playerWins = playerWins;
    //   this.enemyWins = enemyWins;
    //   this.updateRoundDots();
    // };
  }

  // Função para atualizar os dots (mantida do arquivo 1)
  updateRoundDots() {
      const totalDots = 2; // Ajustar se this.totalRounds for diferente
      for (let i = 0; i < totalDots; i++) {
          if (this.playerRoundDots[i]) {
              this.playerRoundDots[i].setFillStyle(i < this.playerWins ? 0x4CAF50 : 0x888888);
          }
          if (this.enemyRoundDots[i]) {
              this.enemyRoundDots[i].setFillStyle(i < this.enemyWins ? 0xf44336 : 0x888888);
          }
      }
  }

  createAnimations() {
    // Cria animações apenas se não existirem
    const animsToCreate = [
        { key: 'player-idle', start: 0, end: 0, frameRate: 8, repeat: -1, sprite: 'player' },
        { key: 'player-walk', start: 1, end: 1, frameRate: 8, repeat: -1, sprite: 'player' },
        { key: 'player-attack', start: 2, end: 2, frameRate: 8, repeat: 0, sprite: 'player' },
        { key: 'enemy-idle', start: 0, end: 0, frameRate: 8, repeat: -1, sprite: 'enemy' },
        { key: 'enemy-walk', start: 1, end: 1, frameRate: 8, repeat: -1, sprite: 'enemy' },
        { key: 'enemy-attack', start: 2, end: 2, frameRate: 8, repeat: 0, sprite: 'enemy' }
    ];

    animsToCreate.forEach(anim => {
        if (!this.anims.exists(anim.key)) {
            this.anims.create({
                key: anim.key,
                frames: this.anims.generateFrameNumbers(anim.sprite, { start: anim.start, end: anim.end }),
                frameRate: anim.frameRate,
                repeat: anim.repeat
            });
        }
    });
  }

  update() {
    // Input só é processado se roundOver for false
    if (this.roundOver || !this.player || !this.enemy) {
        return;
    }

    // Atualiza jogador e inimigo
    try {
        this.player.update(this.keys);
    } catch (error) {
        console.error("Erro ao chamar player.update():", error);
        this.roundOver = true;
    }

    try {
        this.enemy.update(this.player);
    } catch (error) {
        console.error("Erro ao chamar enemy.update():", error);
        this.roundOver = true;
    }

    // Atualiza barras de vida e verifica fim do round
    this.updateHealthBars();
    this.checkRoundEnd(); // <<< Chama a nova função checkRoundEnd
  }

  damagePlayer(amount) {
    if (this.roundOver || !this.player) return;
    this.player.takeDamage(amount);
    this.updateHealthBars();
    console.log(`FightScene: Player damaged, health: ${this.player.health}`);
  }

  damageEnemy(amount) {
    if (this.roundOver || !this.enemy) return;
    this.enemy.takeDamage(amount);
    this.updateHealthBars();
    console.log(`FightScene: Enemy damaged, health: ${this.enemy.health}`);
  }

  // <<< Integração: Função checkRoundEnd substituída pela versão com async/await e roundTransition >>>
  async checkRoundEnd() {
    if (this.roundOver || !this.player || !this.enemy) return; // Se já acabou, não verifica de novo

    if (this.enemy.health <= 0 || this.player.health <= 0) {
      this.roundOver = true; // Marca o fim do round imediatamente

      // Para os personagens
      this.player.setVelocityX(0).play('player-idle');
      this.enemy.setVelocityX(0).play('enemy-idle');

      // Determina vencedor
      let roundWinner = this.enemy.health <= 0 ? 'player' : 'enemy';
      if (roundWinner === 'player') this.playerWins++;
      else this.enemyWins++;

      // Atualiza UI (Vue e dots)
      if (this.vueComponent) {
          this.vueComponent.updateRoundInfo(this.currentRound, this.playerWins, this.enemyWins);
      }
      this.updateRoundDots(); // Atualiza os dots de round

      // Mostra mensagem de fim de round (usando a classe RoundTransition)
      await this.roundTransition.show(roundWinner === 'player' ? 'Você venceu o Round!' : 'Você perdeu o Round!');

      // Verifica fim de jogo
      const playerHasMajority = this.playerWins > this.totalRounds / 2;
      const enemyHasMajority = this.enemyWins > this.totalRounds / 2;
      const lastRound = this.currentRound >= this.totalRounds;

      if (lastRound || playerHasMajority || enemyHasMajority) {
        // Fim de Jogo
        const finalMsg = this.playerWins > this.enemyWins ? 'Vitória!' : this.enemyWins > this.playerWins ? 'Game Over' : 'Empate Final!';
        await this.roundTransition.show(finalMsg, 3000); // Mostra mensagem final

        const restartText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 60,
          'Pressione ESPAÇO para reiniciar', { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(10);

        // Espera o ESPAÇO para reiniciar
        this.input.keyboard.once('keydown-SPACE', () => {
          if (restartText.active) restartText.destroy();
          if (this.vueComponent) this.vueComponent.restartGame(); // Chama método do Vue para reiniciar
        });

      } else {
        // Próximo Round
        this.currentRound++;
        await this.roundTransition.show(`Próximo Round: ${this.currentRound}`); // Mostra mensagem de próximo round
        // Reinicia a cena passando a referência do Vue
        // O init será chamado novamente com estes dados
        this.scene.restart({ vueComponentRef: this.vueComponent });
      }
    }
  }

  // <<< Integração: Função showGameMessage removida (substituída por roundTransition.show) >>>
  // showGameMessage(message, isFinal = false) { ... }

  // <<< Integração: Função para Transição Inicial com Controles (Menu das Teclas) >>>
  startPreFightTransition() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const overlay = this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7).setDepth(20);
    const container = this.add.container(centerX, centerY).setDepth(21);

    const title = this.add.text(0, -120, 'Controles', { fontSize: '32px', color: '#f1c40f' }).setOrigin(0.5);
    container.add(title);

    const createLine = (y, key, desc) => {
      const keyText = this.add.text(-100, y, key, { fontSize: '28px', color: '#f1c40f' }).setOrigin(0, 0.5);
      const descText = this.add.text(0, y, desc, { fontSize: '24px', color: '#ffffff' }).setOrigin(0, 0.5);
      container.add([keyText, descText]);
    };

    createLine(-60, 'W', 'Pular');
    createLine(-20, 'A', 'Mover Esquerda');
    createLine(20, 'S', 'Agachar');
    createLine(60, 'D', 'Mover Direita');
    createLine(100, 'ESPAÇO', 'Atacar');

    const startText = this.add.text(0, 160, 'Pressione ENTER para começar', { fontSize: '20px', color: '#cccccc' }).setOrigin(0.5);
    container.add(startText);

    let startTimer = null;
    let enterListener = null;

    const startFight = () => {
        if (enterListener) this.input.keyboard.removeListener('keydown-ENTER', enterListener);
        if (startTimer) startTimer.remove();
        if (container && container.active) container.destroy();
        if (overlay && overlay.active) overlay.destroy();
        this.startCountdown();
    };

    enterListener = this.input.keyboard.once('keydown-ENTER', startFight);
    startTimer = this.time.delayedCall(5000, startFight);
  }

  // <<< Integração: Função para Contagem Regressiva ("Fight!") >>>
  startCountdown() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const countdownText = this.add.text(centerX, centerY, '', {
      fontSize: '96px',
      color: '#e74c3c',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(21);

    let countdown = 3;

    const timer = this.time.addEvent({
      delay: 500,
      callback: () => {
        if (countdown > 0) {
          countdownText.setText(countdown);
          countdown--;
        } else {
          countdownText.setText('Fight!');
          // Habilita o Input do Jogador
          this.roundOver = false; // <<< HABILITA O INPUT NO UPDATE

          this.time.delayedCall(1000, () => {
              if(countdownText && countdownText.active) countdownText.destroy();
          });
          timer.remove();
        }
      },
      loop: true
    });
  }

  // Função handleResize mantida do arquivo 1
  handleResize(width, height) {
      this.cameras.main.setSize(width, height);
      this.physics.world.setBounds(0, 0, width, height);

      if (this.ground) {
          this.ground.clear(true, true);
          this.createGround();
          if (this.player && this.enemy) {
              this.physics.world.colliders.destroy();
              this.physics.add.collider(this.player, this.ground);
              this.physics.add.collider(this.enemy, this.ground);
              this.physics.add.collider(this.player, this.enemy);
          }
      }

      if (this.healthBarsContainer) {
          this.healthBarsContainer.setPosition(0, 20);
          if(this.playerHealthBar) this.playerHealthBar.setPosition(width * 0.25, 0);
          if(this.enemyHealthBar) this.enemyHealthBar.setPosition(width * 0.75, 0);
          // Reposicionar texto VS
          const vsText = this.children.list.find(child => child.text === 'VS');
          if (vsText) vsText.setPosition(width * 0.5, 20 + 10);
          // Reposicionar dots de round
          if (this.playerRoundDotsContainer) this.playerRoundDotsContainer.setPosition(width * 0.10, this.playerRoundDotsContainer.y);
          if (this.enemyRoundDotsContainer) this.enemyRoundDotsContainer.setPosition(width * 0.90, this.enemyRoundDotsContainer.y);
      }

      const bg = this.children.list.find(child => child.texture && child.texture.key === 'background');
      if (bg) {
          bg.setPosition(width / 2, height / 2);
          const scaleX = width / bg.width;
          const scaleY = height / bg.height;
          const scale = Math.max(scaleX, scaleY);
          bg.setScale(scale);
      }
  }
}

