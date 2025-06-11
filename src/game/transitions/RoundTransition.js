import Phaser from 'phaser';

export default class RoundTransition {
  constructor(scene) {
    this.scene = scene;
    this.overlay = null;
    this.messageText = null;
  }

  /**
   * Mostra uma mensagem de transição com overlay
   * @param {string} message - Mensagem a ser exibida
   * @param {number} duration - Duração em ms antes de desaparecer (opcional)
   * @returns {Promise} Promise que resolve quando a animação termina
   */
  async show(message, duration = 2000) {
    return new Promise((resolve) => {
      // Cria overlay escuro se não existir
      if (!this.overlay) {
        this.overlay = this.scene.add.rectangle(
          this.scene.cameras.main.width / 2,
          this.scene.cameras.main.height / 2,
          this.scene.cameras.main.width,
          this.scene.cameras.main.height,
          0x000000,
          0.7
        ).setDepth(20);
      }
      
      // Configura o estilo do texto
      const textStyle = {
        fontSize: '48px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
      };
      
      // Cria o texto da mensagem
      this.messageText = this.scene.add.text(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2,
        message,
        textStyle
      ).setOrigin(0.5).setDepth(21);
      
      // Anima o texto
      this.scene.tweens.add({
        targets: this.messageText,
        scale: 1.2,
        duration: 200,
        yoyo: true,
        repeat: 1
      });
      
      // Fade in do overlay
      this.overlay.setAlpha(0);
      this.scene.tweens.add({
        targets: this.overlay,
        alpha: 0.7,
        duration: 300,
        ease: 'Power2'
      });
      
      // Configura o timer para remover a mensagem
      this.scene.time.delayedCall(duration, () => {
        // Fade out do overlay e texto
        this.scene.tweens.add({
          targets: [this.overlay, this.messageText],
          alpha: 0,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            // Limpa os objetos
            if (this.messageText) {
              this.messageText.destroy();
              this.messageText = null;
            }
            if (this.overlay) {
              this.overlay.destroy();
              this.overlay = null;
            }
            // Resolve a promise
            resolve();
          }
        });
      });
    });
  }

  /**
   * Mostra uma tela com as teclas de controle do jogo
   * @param {number} duration - Duração em ms antes de desaparecer (opcional)
   * @returns {Promise} Promise que resolve quando o usuário pressiona ENTER ou o tempo acaba
   */
  async showControlsScreen(duration = 5000) {
    return new Promise((resolve) => {
      // Cria overlay escuro
      const overlay = this.scene.add.rectangle(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
        0x000000,
        0.8
      ).setDepth(20);
      
      // Container para os elementos da tela
      const container = this.scene.add.container(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2
      ).setDepth(21);
      
      // Título
      const title = this.scene.add.text(
        0, -220,
        'CONTROLES',
        {
          fontSize: '48px',
          fill: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4,
          fontStyle: 'bold'
        }
      ).setOrigin(0.5);
      container.add(title);
      
      // Função para criar uma linha de controle
      const createLine = (y, key, desc) => {
        const keyText = this.scene.add.text(-100, y, key, { 
          fontSize: '28px', 
          fill: '#f1c40f',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0, 0.5);
        
        const descText = this.scene.add.text(0, y, desc, { 
          fontSize: '24px', 
          fill: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0, 0.5);
        
        container.add([keyText, descText]);
      };
      
      // Adiciona as linhas de controle
      createLine(-160, 'W', 'Pular');
      createLine(-120, 'A', 'Mover Esquerda');
      createLine(-80, 'D', 'Mover Direita');
      createLine(-40, 'ESPAÇO', 'Atacar');
      createLine(0, 'SHIFT', 'Bloquear');
      createLine(40, 'X', 'Dash');
      
      // Adiciona texto para continuar
      const continueText = this.scene.add.text(
        0, 120,
        'Pressione ENTER para continuar',
        {
          fontSize: '24px',
          fill: '#4CAF50',
          stroke: '#000000',
          strokeThickness: 3
        }
      ).setOrigin(0.5);
      container.add(continueText);
      
      // Anima o texto de continuar
      this.scene.tweens.add({
        targets: continueText,
        alpha: { from: 1, to: 0.5 },
        duration: 800,
        yoyo: true,
        repeat: -1
      });
      
      // Fade in dos elementos
      container.setAlpha(0);
      overlay.setAlpha(0);
      
      this.scene.tweens.add({
        targets: [container, overlay],
        alpha: { from: 0, to: 1 },
        duration: 500,
        ease: 'Power2'
      });
      
      // Listener para ENTER
      const enterKey = this.scene.input.keyboard.addKey('ENTER');
      const enterKeyHandler = () => {
        enterKey.removeListener('down');
        clearTimeout(timer);
        
        // Fade out e limpeza
        this.scene.tweens.add({
          targets: [container, overlay],
          alpha: 0,
          duration: 500,
          ease: 'Power2',
          onComplete: () => {
            container.destroy();
            overlay.destroy();
            resolve();
          }
        });
      };
      
      enterKey.once('down', enterKeyHandler);
      
      // Timer para auto-continuar após a duração especificada
      const timer = setTimeout(() => {
        enterKey.removeListener('down');
        
        // Fade out e limpeza
        this.scene.tweens.add({
          targets: [container, overlay],
          alpha: 0,
          duration: 500,
          ease: 'Power2',
          onComplete: () => {
            container.destroy();
            overlay.destroy();
            resolve();
          }
        });
      }, duration);
    });
  }

  /**
   * Transição para novo cenário quando o jogador vence
   * @param {string} newBackgroundKey - Chave da textura do novo background
   * @returns {Promise} Promise que resolve quando a transição termina
   */
  async transitionToNewScene(newBackgroundKey = 'background2') {
    return new Promise((resolve) => {
      // Fade out dos elementos atuais
      const elementsToFade = [
        this.scene.player, 
        this.scene.enemy, 
        this.scene.healthBarsContainer
      ];
      
      this.scene.tweens.add({
        targets: elementsToFade,
        alpha: 0,
        duration: 1000,
        ease: 'Power2'
      });

      // Encontra o background atual
      const currentBg = this.scene.children.list.find(child => 
        child.texture && child.texture.key === 'background');
      
      if (currentBg) {
        // Fade out do background atual
        this.scene.tweens.add({
          targets: currentBg,
          alpha: 0,
          duration: 1000,
          ease: 'Power2',
          onComplete: () => {
            // Remove o background antigo
            currentBg.destroy();
            
            // Adiciona o novo background com fade in
            const newBg = this.scene.add.image(
              this.scene.cameras.main.width / 2, 
              this.scene.cameras.main.height / 2, 
              newBackgroundKey
            ).setAlpha(0).setDepth(-1);
            
            const scaleX = this.scene.cameras.main.width / newBg.width;
            const scaleY = this.scene.cameras.main.height / newBg.height;
            const scale = Math.max(scaleX, scaleY);
            newBg.setScale(scale);
            
            // Fade in do novo background
            this.scene.tweens.add({
              targets: newBg,
              alpha: 1,
              duration: 1000,
              ease: 'Power2',
              onComplete: () => {
                // Exibe mensagem de vitória
                const victoryText = this.scene.add.text(
                  this.scene.cameras.main.width / 2,
                  this.scene.cameras.main.height / 2 - 50,
                  'VITÓRIA COMPLETA!',
                  {
                    fontSize: '48px',
                    fill: '#fff',
                    stroke: '#000',
                    strokeThickness: 6,
                    fontStyle: 'bold',
                    fontFamily: "'Press Start 2P', cursive, sans-serif"
                  }
                ).setOrigin(0.5).setDepth(20);
                
                // Adiciona texto para continuar
                const continueText = this.scene.add.text(
                  this.scene.cameras.main.width / 2,
                  this.scene.cameras.main.height / 2 + 50,
                  'Pressione E para continuar',
                  {
                    fontSize: '24px',
                    fill: '#fff',
                    stroke: '#000',
                    strokeThickness: 3,
                    fontFamily: "'Press Start 2P', cursive, sans-serif"
                  }
                ).setOrigin(0.5).setDepth(20);
                
                // Listener para E
                this.scene.input.keyboard.once("keydown-E", () => {
                  if (this.scene.vueComponent && this.scene.vueComponent.nextLevel) {
                    this.scene.vueComponent.nextLevel();
                  } else {
                    console.warn("FightScene: vueComponent.nextLevel não está definido. Implemente esta função para avançar para o próximo nível.");
                  }
                  resolve();
                });
              }
            });
          }
        });
      }
    });
  }

  /**
   * Mostra tela de game over com opção de jogar novamente
   * @returns {Promise} Promise que resolve quando o usuário faz uma escolha
   */
  async showGameOverScreen() {
    return new Promise((resolve) => {
      // Cria overlay escuro
      const overlay = this.scene.add.rectangle(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
        0x000000,
        0.7
      ).setDepth(20);
      
      // Container para os elementos da tela
      const container = this.scene.add.container(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2
      ).setDepth(21);
      
      // Título
      const title = this.scene.add.text(
        0, -100,
        'GAME OVER',
        {
          fontSize: '64px',
          fill: '#ff0000',
          stroke: '#000',
          strokeThickness: 6,
          fontStyle: 'bold',
          fontFamily: "'Press Start 2P', cursive, sans-serif"
        }
      ).setOrigin(0.5);
      container.add(title);
      
      // Mensagem
      const message = this.scene.add.text(
        0, 0,
        'Você perdeu a batalha!',
        {
          fontSize: '32px',
          fill: '#ffffff',
          stroke: '#000',
          strokeThickness: 4,
          fontFamily: "'Press Start 2P', cursive, sans-serif"
        }
      ).setOrigin(0.5);
      container.add(message);
      
      // Botão Sim
      const yesButton = this.scene.add.text(
        -100, 100,
        'SIM',
        {
          fontSize: '28px',
          fill: '#4CAF50',
          stroke: '#000',
          strokeThickness: 3,
          backgroundColor: '#333333',
          fontFamily: "'Press Start 2P', cursive, sans-serif",
          padding: {
            left: 20,
            right: 20,
            top: 10,
            bottom: 10
          }
        }
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      // Botão Não
      const noButton = this.scene.add.text(
        100, 100,
        'NÃO',
        {
          fontSize: '28px',
          fill: '#f44336',
          stroke: '#000',
          strokeThickness: 3,
          backgroundColor: '#333333',
          fontFamily: "'Press Start 2P', cursive, sans-serif",
          padding: {
            left: 20,
            right: 20,
            top: 10,
            bottom: 10
          }
        }
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      container.add([yesButton, noButton]);
      
      // Pergunta
      const question = this.scene.add.text(
        0, 50,
        'Deseja jogar novamente?',
        {
          fontSize: '24px',
          fill: '#ffffff',
          fontFamily: "'Press Start 2P', cursive, sans-serif"
        }
      ).setOrigin(0.5);
      container.add(question);
      
      // Efeitos de hover
      yesButton.on('pointerover', () => {
        yesButton.setScale(1.1);
      });
      
      yesButton.on('pointerout', () => {
        yesButton.setScale(1);
      });
      
      noButton.on('pointerover', () => {
        noButton.setScale(1.1);
      });
      
      noButton.on('pointerout', () => {
        noButton.setScale(1);
      });
      
      // Ações dos botões
      yesButton.on('pointerdown', () => {
        // Reinicia o jogo
        if (this.scene.vueComponent) {
          this.scene.vueComponent.restartGame();
        }
        resolve(true);
      });
      
      noButton.on('pointerdown', () => {
        // Solução direta: redirecionar para a página inicial/menu
        window.location.href = '/';
        
        // Limpar recursos antes de sair
        if (this.scene.game) {
          // Tenta destruir a cena atual para liberar recursos
          try {
            this.scene.game.destroy(true);
          } catch (e) {
            console.log("Erro ao destruir o jogo:", e);
          }
        }
        
        resolve(false);
      });
      
      // Também permite usar o teclado
      this.scene.input.keyboard.once('keydown-SPACE', () => {
        if (this.scene.vueComponent) {
          this.scene.vueComponent.restartGame();
        }
        resolve(true);
      });
      
      this.scene.input.keyboard.once('keydown-ESC', () => {
        // Solução direta: redirecionar para a página inicial/menu (mesma lógica do botão NÃO)
        window.location.href = '/';
        
        // Limpar recursos antes de sair
        if (this.scene.game) {
          // Tenta destruir a cena atual para liberar recursos
          try {
            this.scene.game.destroy(true);
          } catch (e) {
            console.log("Erro ao destruir o jogo:", e);
          }
        }
        
        resolve(false);
      });
    });
  }
}
