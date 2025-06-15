import Phaser from 'phaser';

export default class CutsceneManager {
  constructor(scene) {
    this.scene = scene;
    this.isPlaying = false;
    this.cutsceneElements = [];
  }

  /**
   * Inicia a cutscene entre a Fase 2 e Fase 3
   * @returns {Promise} Promise que resolve quando a cutscene termina
   */
  async startCutscene() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    
    try {
      await this.clearScreen();
      await this.showOpeningText();
      await this.showCharacterDialogue();
      await this.showTransitionEffect();
      await this.showClosingText();
      
      // Adiciona prompt para continuar após a cutscene
      const continueText = this.scene.add.text(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height - 100,
        'Aperte [P] para continuar para a próxima fase',
        {
          fontSize: '24px',
          fill: '#4CAF50',
          stroke: '#000000',
          strokeThickness: 3,
          fontFamily: 'Arial'
        }
      ).setOrigin(0.5).setDepth(101);
      
      // Aguarda pressionar P
      await new Promise(resolve => {
        const onKeyDown = () => {
          this.scene.input.keyboard.off('keydown-P', onKeyDown);
          continueText.destroy();
          resolve();
        };
        this.scene.input.keyboard.on('keydown-P', onKeyDown);
      });
      
    } catch (error) {
      console.error('Erro durante a cutscene:', error);
    } finally {
      this.cleanup();
      this.isPlaying = false;
    }
  }

  /**
   * Limpa a tela para a cutscene
   */
  async clearScreen() {
    return new Promise(resolve => {
      // Cria overlay preto cobrindo toda a tela
      const overlay = this.scene.add.rectangle(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
        0x000000,
        0
      ).setDepth(100);
      
      this.cutsceneElements.push(overlay);
      
      // Fade to black
      this.scene.tweens.add({
        targets: overlay,
        alpha: 1,
        duration: 1000,
        ease: 'Power2',
        onComplete: resolve
      });
    });
  }

  /**
   * Mostra texto de abertura da cutscene
   */
  async showOpeningText() {
    return new Promise(resolve => {
      const openingText = this.scene.add.text(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2 - 100,
        'A batalha se intensifica...',
        {
          fontSize: '36px',
          fill: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
          fontFamily: 'Arial',
          align: 'center'
        }
      ).setOrigin(0.5).setDepth(101).setAlpha(0);
      
      this.cutsceneElements.push(openingText);
      
      // Fade in do texto
      this.scene.tweens.add({
        targets: openingText,
        alpha: 1,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => {
          // Aguarda e faz fade out
          this.scene.time.delayedCall(2000, () => {
            this.scene.tweens.add({
              targets: openingText,
              alpha: 0,
              duration: 1000,
              ease: 'Power2',
              onComplete: resolve
            });
          });
        }
      });
    });
  }

  /**
   * Mostra diálogo dos personagens
   */
  async showCharacterDialogue() {
    return new Promise(resolve => {
      // Container para o diálogo
      const dialogueContainer = this.scene.add.container(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height - 150
      ).setDepth(101).setAlpha(0);
      
      this.cutsceneElements.push(dialogueContainer);
      
      // Caixa de diálogo
      const dialogueBox = this.scene.add.rectangle(
        0, 0,
        this.scene.cameras.main.width * 0.8,
        120,
        0x000000,
        0.8
      ).setStrokeStyle(3, 0xffffff);
      
      // Texto do diálogo
      const dialogueText = this.scene.add.text(
        0, -20,
        'Breno: "Este é apenas o começo... O verdadeiro desafio está por vir!"',
        {
          fontSize: '24px',
          fill: '#ffffff',
          fontFamily: 'Arial',
          align: 'center',
          wordWrap: { width: this.scene.cameras.main.width * 0.7 }
        }
      ).setOrigin(0.5);
      
      // Nome do personagem
      const characterName = this.scene.add.text(
        -dialogueBox.width / 2 + 20, -dialogueBox.height / 2 - 15,
        'BRENO',
        {
          fontSize: '18px',
          fill: '#ffff00',
          fontFamily: 'Arial',
          fontStyle: 'bold'
        }
      ).setOrigin(0);
      
      dialogueContainer.add([dialogueBox, dialogueText, characterName]);
      
      // Anima entrada do diálogo
      this.scene.tweens.add({
        targets: dialogueContainer,
        alpha: 1,
        y: this.scene.cameras.main.height - 150,
        duration: 500,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Aguarda e remove o diálogo
          this.scene.time.delayedCall(3000, () => {
            this.scene.tweens.add({
              targets: dialogueContainer,
              alpha: 0,
              duration: 500,
              ease: 'Power2',
              onComplete: resolve
            });
          });
        }
      });
    });
  }

  /**
   * Mostra efeito de transição especial
   */
  async showTransitionEffect() {
    return new Promise(resolve => {
      // Cria partículas de energia
      const particles = [];
      
      for (let i = 0; i < 20; i++) {
        const particle = this.scene.add.circle(
          Phaser.Math.Between(0, this.scene.cameras.main.width),
          Phaser.Math.Between(0, this.scene.cameras.main.height),
          Phaser.Math.Between(3, 8),
          0x00ffff,
          0.8
        ).setDepth(102);
        
        particles.push(particle);
        this.cutsceneElements.push(particle);
        
        // Anima as partículas
        this.scene.tweens.add({
          targets: particle,
          x: this.scene.cameras.main.width / 2,
          y: this.scene.cameras.main.height / 2,
          scale: { from: 1, to: 0 },
          alpha: { from: 0.8, to: 0 },
          duration: 2000,
          ease: 'Power2'
        });
      }
      
      // Flash de luz no centro
      const flash = this.scene.add.circle(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2,
        50,
        0xffffff,
        0
      ).setDepth(103);
      
      this.cutsceneElements.push(flash);
      
      // Anima o flash
      this.scene.tweens.add({
        targets: flash,
        scale: { from: 1, to: 10 },
        alpha: { from: 0, to: 1 },
        duration: 1000,
        ease: 'Power2',
        yoyo: true,
        onComplete: () => {
          this.scene.time.delayedCall(500, resolve);
        }
      });
    });
  }

  /**
   * Mostra texto de encerramento
   */
  async showClosingText() {
    return new Promise(resolve => {
      const closingText = this.scene.add.text(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2,
        'A batalha final se aproxima...',
        {
          fontSize: '42px',
          fill: '#ff0000',
          stroke: '#000000',
          strokeThickness: 4,
          fontFamily: 'Arial',
          fontStyle: 'bold',
          align: 'center'
        }
      ).setOrigin(0.5).setDepth(101).setAlpha(0);
      
      this.cutsceneElements.push(closingText);
      
      // Anima o texto final
      this.scene.tweens.add({
        targets: closingText,
        alpha: 1,
        scale: { from: 0.5, to: 1 },
        duration: 1000,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Aguarda e faz fade out
          this.scene.time.delayedCall(2500, () => {
            this.scene.tweens.add({
              targets: closingText,
              alpha: 0,
              duration: 1000,
              ease: 'Power2',
              onComplete: resolve
            });
          });
        }
      });
    });
  }

  /**
   * Limpa todos os elementos da cutscene
   */
  cleanup() {
    this.cutsceneElements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    this.cutsceneElements = [];
  }

  /**
   * Para a cutscene imediatamente (se necessário)
   */
  stop() {
    if (!this.isPlaying) return;
    
    this.cleanup();
    this.isPlaying = false;
    console.log('Cutscene interrompida.');
  }

  /**
   * Verifica se a cutscene está sendo reproduzida
   */
  isPlayingCutscene() {
    return this.isPlaying;
  }
}

