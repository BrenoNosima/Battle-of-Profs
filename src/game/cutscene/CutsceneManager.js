export default class CutsceneManager {
  constructor(scene) {
    this.scene = scene;
    this.cutsceneElements = [];
    this.isPlaying = false;
  }

  /**
   * Limpa a tela removendo todos os elementos da cutscene
   */
  clearScreen() {
    this.cutsceneElements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    this.cutsceneElements = [];
  }

  /**
   * Limpeza dos recursos (alias para clearScreen)
   */
  cleanup() {
    this.clearScreen();
  }

  /**
   * Mostra a cutscene de vitória final
   * @returns {Promise} Promise que resolve quando a cutscene termina
   */
  async showVictoryCutscene() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    try {
      await this.clearScreen();
      
      // Efeito de confete
      await this.showConfettiEffect();
      
      // Texto de vitória
      const victoryText = this.scene.add.text(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2 - 50,
        'VITÓRIA!',
        {
          fontSize: '72px',
          fill: '#ffff00',
          stroke: '#000000',
          strokeThickness: 6,
          fontFamily: 'Arial',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5).setDepth(101);
      this.cutsceneElements.push(victoryText);
      
      // Resto da implementação da cutscene de vitória...
      // (manter o mesmo código que já existe, mas usando this.scene)
      
      // Aguarda pressionar ENTER
      await new Promise(resolve => {
        const onKeyDown = (e) => {
          if (e.key === 'Enter') {
            this.scene.input.keyboard.off('keydown', onKeyDown);
            resolve();
          }
        };
        this.scene.input.keyboard.on('keydown', onKeyDown);
      });
      
    } catch (error) {
      console.error('Erro na cutscene de vitória:', error);
    } finally {
      this.cleanup();
      this.isPlaying = false;
    }
  }

  /**
   * Mostra a cutscene de derrota
   * @returns {Promise} Promise que resolve quando a cutscene termina
   */
  async showDefeatCutscene() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    try {
        await this.clearScreen();
        
        // Cria overlay escuro
        const darkOverlay = this.scene.add.rectangle(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0x000000,
            0.7
        ).setDepth(100);
        this.cutsceneElements.push(darkOverlay);
        
        // Texto de derrota
        const defeatText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2 - 100,
            'DERROTA!',
            {
                fontSize: '72px',
                fill: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6,
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5).setDepth(101);
        this.cutsceneElements.push(defeatText);
        
        // Texto da fase
        const phaseText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2 - 20,
            `Você perdeu na Fase ${this.scene.currentPhase}`,
            {
                fontSize: '36px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5).setDepth(101);
        this.cutsceneElements.push(phaseText);
        
        // Opções
        const retryText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2 + 60,
            'Pressione [R] para tentar a fase novamente',
            {
                fontSize: '24px',
                fill: '#ff5555',
                stroke: '#000000',
                strokeThickness: 3,
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5).setDepth(101);
        this.cutsceneElements.push(retryText);
        
        const backText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2 + 100,
            'Pressione [B] para voltar à fase anterior',
            {
                fontSize: '24px',
                fill: '#ff5555',
                stroke: '#000000',
                strokeThickness: 3,
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5).setDepth(101);
        this.cutsceneElements.push(backText);
        
        const menuText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2 + 140,
            {
                fontSize: '24px',
                fill: '#ff5555',
                stroke: '#000000',
                strokeThickness: 3,
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5).setDepth(101);
        this.cutsceneElements.push(menuText);
        
        // Efeitos de animação
        this.scene.tweens.add({
            targets: defeatText,
            scale: { from: 0.5, to: 1.5 },
            duration: 1000,
            ease: 'Bounce.easeOut'
        });
        
        this.scene.tweens.add({
            targets: [phaseText, retryText, backText, menuText],
            alpha: { from: 0, to: 1 },
            duration: 1500,
            ease: 'Power2'
        });
        
        // Piscar textos de opções
        this.scene.tweens.add({
            targets: [retryText, backText, menuText],
            alpha: { from: 1, to: 0.7 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        // Aguarda interação do jogador
        await new Promise(resolve => {
            const onKeyDown = (e) => {
            switch (e.key.toUpperCase()) {
              case 'R': // Tentar novamente
                this.scene.input.keyboard.off('keydown', onKeyDown);
                this.scene.scene.restart({
                  fightIndex: this.scene.fightIndex,
                  vueComponentRef: this.scene.vueComponent
                });
                resolve();
              break;
            
              case 'B': // Voltar fase anterior
                this.scene.input.keyboard.off('keydown', onKeyDown);
                if (this.scene.fightIndex > 0) {
                  this.scene.scene.start('FightScene', {
                    fightIndex: this.scene.fightIndex - 1,
                    vueComponentRef: this.scene.vueComponent,
                    currentRound: 1,
                    playerWins: 0,
                    enemyWins: 0
                  });
                } else {
                  this.scene.scene.start('MenuScene');
                }
                resolve();
              break;
            }
          };
            
            this.scene.input.keyboard.on('keydown', onKeyDown);
        });
        
    } catch (error) {
        console.error('Erro na cutscene de derrota:', error);
    } finally {
        this.cleanup();
        this.isPlaying = false;
    }
  }


  /**
   * Efeito de confete para vitória
   */
  async showConfettiEffect() {
    return new Promise(resolve => {
      const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
      const confettiPieces = [];
      
      // Cria 50 peças de confete
      for (let i = 0; i < 50; i++) {
        const confetti = this.scene.add.rectangle(
          Phaser.Math.Between(0, this.scene.cameras.main.width),
          -20,
          Phaser.Math.Between(10, 20),
          Phaser.Math.Between(5, 10),
          colors[Phaser.Math.Between(0, colors.length - 1)]
        ).setDepth(102);
        
        this.cutsceneElements.push(confetti);
        
        // Anima cada peça de confete
        this.scene.tweens.add({
          targets: confetti,
          y: this.scene.cameras.main.height + 20,
          rotation: Phaser.Math.Between(-6, 6),
          duration: Phaser.Math.Between(2000, 4000),
          delay: Phaser.Math.Between(0, 1000),
          ease: 'Power1.easeIn',
          onComplete: () => {
            if (confetti && confetti.destroy) {
              confetti.destroy();
            }
          }
        });
      }
      
      this.scene.time.delayedCall(3000, resolve);
    });
  }

  /**
   * Método para mostrar cutscene genérica
   */
  async showGenericCutscene(title, message, color = 0xffffff) {
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    try {
      await this.clearScreen();
      
      // Resto da implementação da cutscene genérica...
      // (manter o mesmo código que já existe, mas usando this.scene)
      
      // Aguarda pressionar espaço
      await new Promise(resolve => {
        const onKeyDown = (e) => {
          if (e.key === ' ') {
            this.scene.input.keyboard.off('keydown', onKeyDown);
            resolve();
          }
        };
        this.scene.input.keyboard.on('keydown', onKeyDown);
      });
      
    } catch (error) {
      console.error('Erro na cutscene genérica:', error);
    } finally {
      this.cleanup();
      this.isPlaying = false;
    }
  }
}