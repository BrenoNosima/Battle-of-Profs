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
        // Debug: Verifica se a textura foi carregada
        console.log('Texturas carregadas:', this.scene.textures.getTextureKeys());
        
        if (!this.scene.textures.exists('transition-bg')) {
            console.error('ERRO: transition-bg não encontrada. Verifique o pré-carregamento.');
            // Fallback: Usa um retângulo preto
            this.overlay = this.scene.add.rectangle(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2,
                this.scene.cameras.main.width,
                this.scene.cameras.main.height,
                0x000000
            ).setDepth(50);
        } else {
            // Usa a imagem normalmente
            this.overlay = this.scene.add.image(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2,
                'transition-bg'
            ).setDisplaySize(this.scene.cameras.main.width, this.scene.cameras.main.height);
        }

        this.overlay.setAlpha(0).setDepth(50);
        
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
        // Verifica se a textura existe
        if (!this.scene.textures.exists(newBackgroundKey)) {
            console.error(`Background ${newBackgroundKey} não encontrado!`);
            resolve();
            return;
        }

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

  async showPhaseTransition(fromPhase, toPhase, newBackgroundKey) {
    return new Promise(resolve => {
        // Pausa a música de fundo se estiver tocando
        if (this.scene.backgroundMusic && this.scene.backgroundMusic.isPlaying) {
            this.scene.backgroundMusic.pause();
        }

        // Troca o background imediatamente
        if (this.scene.background) {
            this.scene.background.destroy();
        }

         // Se for transição da fase 2 para 3, mostra o vídeo
        if (fromPhase === 2 && toPhase === 3) {
            const video = this.scene.add.video(
              this.scene.cameras.main.width / 2,
              this.scene.cameras.main.height / 2,
              'video-fase2-3'
            ).setOrigin(0.5).setDepth(100);

            // Ajusta o vídeo para cobrir a tela mantendo o aspecto
            video.on('play', () => {
              const vw = video.width;
              const vh = video.height;
              const sw = this.scene.cameras.main.width;
              const sh = this.scene.cameras.main.height;
              const scale = Math.max(sw / vw, sh / vh);
              video.setScale(scale);
            });

            video.play(true);

            // Adiciona botão de pular
            const skipButton = this.scene.add.text(
              this.scene.cameras.main.width - 40,
              40,
              'Pular',
              {
              fontSize: '32px',
              fill: '#fff',
              backgroundColor: '#000',
              padding: { x: 16, y: 8 },
              fontFamily: 'Arial',
              fontStyle: 'bold'
              }
            )
            .setOrigin(1, 0)
            .setDepth(101)
            .setInteractive({ useHandCursor: true });

            skipButton.on('pointerdown', () => {
              video.stop();
              video.destroy();
              skipButton.destroy();
              resolve();
            });

            // Remove botão ao terminar o vídeo normalmente
            video.once('complete', () => {
              video.destroy();
              skipButton.destroy();
              resolve();
            });
            // Garante que o vídeo só passe uma vez
            video.setLoop(false);
            // Garante que o vídeo será destruído e resolve só após o término real
            video.once('complete', () => {
                video.destroy();
                resolve();
            });

            // Não chama resolve aqui, só no evento 'complete'
            return;
        }
        
        // Se for transição da fase 3 para 4, mostra o vídeo correspondente
        if (fromPhase === 3 && toPhase === 4) {
            const video = this.scene.add.video(
              this.scene.cameras.main.width / 2,
              this.scene.cameras.main.height / 2,
              'final'
            ).setOrigin(0.5).setDepth(100);

            video.on('play', () => {
              const vw = video.width;
              const vh = video.height;
              const sw = this.scene.cameras.main.width;
              const sh = this.scene.cameras.main.height;
              const scale = Math.max(sw / vw, sh / vh);
                video.setScale(scale);

                // Adiciona botão de pular
                const skipButton = this.scene.add.text(
                this.scene.cameras.main.width - 40,
                40,
                'Pular',
                {
                  fontSize: '32px',
                  fill: '#fff',
                  backgroundColor: '#000',
                  padding: { x: 16, y: 8 },
                  fontFamily: 'Arial',
                  fontStyle: 'bold'
                }
                )
                .setOrigin(1, 0)
                .setDepth(101)
                .setInteractive({ useHandCursor: true });

                skipButton.on('pointerdown', () => {
                video.stop();
                video.destroy();
                skipButton.destroy();
                resolve();
                });

                // Remove botão ao terminar o vídeo normalmente
                video.once('complete', () => {
                video.destroy();
                skipButton.destroy();
                resolve();
                });
            });

            

            video.play(true);
            video.setLoop(false);
            video.once('complete', () => {
          video.destroy();
          resolve();
            });

            return;
        }
        
        this.scene.background = this.scene.add.image(0, 0, newBackgroundKey)
            .setOrigin(0)
            .setDisplaySize(this.scene.cameras.main.width, this.scene.cameras.main.height)
            .setDepth(-1);

        // Cria texto da transição
        const phaseText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            `FASE ${toPhase}`,
            {
                fontSize: '72px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6,
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5).setDepth(51);

        // Animação do texto (aparece e some)
        this.scene.tweens.add({
            targets: phaseText,
            scale: { from: 0.5, to: 1.2 },
            alpha: { from: 0, to: 1 },
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.time.delayedCall(1000, () => {
                    this.scene.tweens.add({
                        targets: phaseText,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => {
                            phaseText.destroy();
                            resolve();
                        }
                    });
                });
            }
        });
    });
  }
}

