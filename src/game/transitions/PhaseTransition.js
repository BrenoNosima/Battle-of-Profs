import Phaser from 'phaser';

export default class PhaseTransition {
  constructor(scene) {
    this.scene = scene;
    this.overlay = null;
    this.isTransitioning = false;
  }

  /**
   * Executa uma transição suave entre fases
   * @param {number} fromPhase - Fase atual
   * @param {number} toPhase - Próxima fase
   * @param {string} newBackgroundKey - Chave do novo background
   * @returns {Promise} Promise que resolve quando a transição termina
   */
  async executePhaseTransition(fromPhase, toPhase, newBackgroundKey) {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    
    try {
      // Fase 1: Fade out
      await this.fadeOut();
      
      // Fase 2: Mostrar texto de transição
      await this.showTransitionText(fromPhase, toPhase);
      
      // Fase 3: Trocar background
      await this.changeBackground(newBackgroundKey);
      
      // Fase 4: Fade in
      await this.fadeIn();
      
    } catch (error) {
      console.error('Erro na transição de fase:', error);
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Fade out da tela atual
   */
  async fadeOut() {
    return new Promise(resolve => {
      // Cria overlay preto
      this.overlay = this.scene.add.rectangle(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
        0x000000,
        0
      ).setDepth(50);

      // Anima fade out
      this.scene.tweens.add({
        targets: this.overlay,
        alpha: 1,
        duration: 1000,
        ease: 'Power2',
        onComplete: resolve
      });
    });
  }

  /**
   * Mostra texto de transição entre fases
   */
  async showTransitionText(fromPhase, toPhase) {
    return new Promise(resolve => {
      const transitionText = this.scene.add.text(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2,
        `Fase ${toPhase}`,
        {
          fontSize: '64px',
          fill: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4,
          fontFamily: 'Arial',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5).setDepth(51);

      // Anima o texto
      this.scene.tweens.add({
        targets: transitionText,
        scale: { from: 0.5, to: 1.2 },
        alpha: { from: 0, to: 1 },
        duration: 500,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Aguarda um momento e remove o texto
          this.scene.time.delayedCall(1500, () => {
            this.scene.tweens.add({
              targets: transitionText,
              alpha: 0,
              duration: 500,
              onComplete: () => {
                transitionText.destroy();
                resolve();
              }
            });
          });
        }
      });
    });
  }

  /**
   * Troca o background da cena
   */
  async changeBackground(newBackgroundKey) {
    return new Promise(resolve => {
      // Remove background atual
      if (this.scene.background) {
        this.scene.background.destroy();
      }

      // Cria novo background
      this.scene.background = this.scene.add.image(0, 0, newBackgroundKey)
        .setOrigin(0)
        .setDisplaySize(this.scene.cameras.main.width, this.scene.cameras.main.height)
        .setDepth(-1)
        .setAlpha(0);

      // Fade in do novo background
      this.scene.tweens.add({
        targets: this.scene.background,
        alpha: 1,
        duration: 1000,
        ease: 'Power2',
        onComplete: resolve
      });
    });
  }

  /**
   * Fade in da nova cena
   */
  async fadeIn() {
    return new Promise(resolve => {
      if (!this.overlay) {
        resolve();
        return;
      }

      // Anima fade in
      this.scene.tweens.add({
        targets: this.overlay,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => {
          this.overlay.destroy();
          this.overlay = null;
          resolve();
        }
      });
    });
  }

  /**
   * Transição rápida para mudança de sprites
   */
  async quickSpriteTransition() {
    return new Promise(resolve => {
      // Flash branco rápido para indicar mudança
      const flash = this.scene.add.rectangle(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
        0xffffff,
        0
      ).setDepth(45);

      this.scene.tweens.add({
        targets: flash,
        alpha: { from: 0, to: 0.8 },
        duration: 100,
        yoyo: true,
        onComplete: () => {
          flash.destroy();
          resolve();
        }
      });
    });
  }

  /**
   * Transição especial para cutscene
   */
  async cutsceneTransition() {
    return new Promise(resolve => {
      // Cria efeito de cortinas fechando
      const leftCurtain = this.scene.add.rectangle(
        0,
        this.scene.cameras.main.height / 2,
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height,
        0x000000
      ).setOrigin(0, 0.5).setDepth(55);

      const rightCurtain = this.scene.add.rectangle(
        this.scene.cameras.main.width,
        this.scene.cameras.main.height / 2,
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height,
        0x000000
      ).setOrigin(1, 0.5).setDepth(55);

      // Anima as cortinas se fechando
      this.scene.tweens.add({
        targets: leftCurtain,
        x: this.scene.cameras.main.width / 2,
        duration: 1500,
        ease: 'Power2'
      });

      this.scene.tweens.add({
        targets: rightCurtain,
        x: this.scene.cameras.main.width / 2,
        duration: 1500,
        ease: 'Power2',
        onComplete: () => {
          // Aguarda um momento e abre as cortinas
          this.scene.time.delayedCall(1000, () => {
            this.scene.tweens.add({
              targets: leftCurtain,
              x: 0,
              duration: 1500,
              ease: 'Power2'
            });

            this.scene.tweens.add({
              targets: rightCurtain,
              x: this.scene.cameras.main.width,
              duration: 1500,
              ease: 'Power2',
              onComplete: () => {
                leftCurtain.destroy();
                rightCurtain.destroy();
                resolve();
              }
            });
          });
        }
      });
    });
  }

  /**
   * Limpa recursos da transição
   */
  cleanup() {
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }
    this.isTransitioning = false;
  }
}

