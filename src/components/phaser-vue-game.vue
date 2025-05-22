<!--
  phaser-vue-game.vue
  
  Arquivo único que integra Vue e Phaser com comandos WASD e espaço para ataque.
  Usa um retângulo colorido como personagem.
  VERSÃO FINAL - Com tratamento de erro para background
-->

<template>
  <div class="game-container">
    <div id="phaser-game"></div>
    <div class="controls-info">
      <h2>Controles</h2>
      <p>W, A, S, D - Movimento</p>
      <p>Espaço - Atacar</p>
      <div class="status">
        <p>Posição: X: {{ playerPosition.x.toFixed(0) }}, Y: {{ playerPosition.y.toFixed(0) }}</p>
        <p>Atacando: {{ isAttacking ? 'Sim' : 'Não' }}</p>
      </div>
    </div>
  </div>
</template>

<script>
// Importar Phaser
import * as Phaser from 'phaser';

export default {
  name: 'PhaserVueGame',
  
  data() {
    return {
      game: null,
      playerPosition: { x: 0, y: 0 },
      isAttacking: false
    };
  },
  
  mounted() {
    this.initGame();
  },
  
  beforeUnmount() {
    if (this.game) {
      this.game.destroy(true);
    }
  },
  
  methods: {
    initGame() {
      // Referência ao componente Vue para uso nas cenas Phaser
      const vueComponent = this;
      
      // Classe de cena personalizada para melhor organização
      class GameScene extends Phaser.Scene {
        constructor() {
          super('GameScene');
          this.vueComponent = vueComponent;
          this.player = null;
          this.keys = null;
          this.attackCooldown = false;
        }
        
        preload() {
          // Não tentamos carregar o background aqui para evitar erros
          console.log('Preload iniciado');
        }
        
        create() {
          console.log('Cena criada, adicionando retângulo...');
          
          // Criar o jogador (retângulo vermelho)
          this.player = this.add.rectangle(400, 300, 50, 50, 0xff0000);
          console.log('Retângulo criado:', this.player);
          
          // Adicionar física ao jogador
          this.physics.add.existing(this.player);
          
          // Configurar colisão com os limites do mundo
          this.player.body.setCollideWorldBounds(true);
          
          // Configurar teclas WASD
          this.keys = {
            w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
          };
        }
        
        update() {
          // Verificar se o jogador existe
          if (!this.player || !this.player.body) {
            console.error('Jogador não inicializado corretamente');
            return;
          }
          
          // Resetar velocidade
          this.player.body.setVelocity(0);
          
          // Velocidade de movimento
          const speed = 200;
          
          // Movimento WASD
          if (this.keys.a.isDown) {
            this.player.body.setVelocityX(-speed);
          } else if (this.keys.d.isDown) {
            this.player.body.setVelocityX(speed);
          }
          
          if (this.keys.w.isDown) {
            this.player.body.setVelocityY(-speed);
          } else if (this.keys.s.isDown) {
            this.player.body.setVelocityY(speed);
          }
          
          // Ataque (espaço)
          if (Phaser.Input.Keyboard.JustDown(this.keys.space) && !this.attackCooldown) {
            this.attack();
          }
          
          // Atualizar posição no componente Vue
          if (this.vueComponent) {
            this.vueComponent.playerPosition = {
              x: this.player.x,
              y: this.player.y
            };
          }
        }
        
        attack() {
          // Iniciar ataque
          this.attackCooldown = true;
          
          // Mudar cor para indicar ataque (amarelo)
          this.player.fillColor = 0xffff00;
          
          // Atualizar estado de ataque no Vue
          if (this.vueComponent) {
            this.vueComponent.isAttacking = true;
          }
          
          // Criar efeito visual de ataque (círculo que se expande)
          const attackEffect = this.add.circle(
            this.player.x, 
            this.player.y, 
            25, 
            0xffff00, 
            0.7
          );
          
          // Animar o efeito de ataque
          this.tweens.add({
            targets: attackEffect,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              attackEffect.destroy();
            }
          });
          
          // Terminar ataque após 300ms
          this.time.delayedCall(300, () => {
            // Voltar à cor original
            this.player.fillColor = 0xff0000;
            
            // Atualizar estado no Vue
            if (this.vueComponent) {
              this.vueComponent.isAttacking = false;
            }
            
            // Cooldown de ataque (500ms total)
            this.time.delayedCall(200, () => {
              this.attackCooldown = false;
            });
          });
        }
      }
      
      // Configuração do jogo Phaser
      const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'phaser-game',
        backgroundColor: '#2d2d2d',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: true // Ativar debug para ver hitboxes
          }
        },
        scene: GameScene
      };
      
      // Criar instância do jogo
      this.game = new Phaser.Game(config);
    }
  }
};
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

#phaser-game {
  width: 800px;
  height: 600px;
  max-width: 100%;
  border: 2px solid #333;
  border-radius: 4px;
  overflow: hidden;
}

.controls-info {
  width: 100%;
  margin-top: 20px;
  padding: 15px;
  background-color: #f0f0f0;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-top: 0;
  color: #333;
}

.status {
  margin-top: 15px;
  padding: 10px;
  background-color: #e0e0e0;
  border-radius: 4px;
}

/* Responsividade para telas menores */
@media (max-width: 820px) {
  #phaser-game {
    width: 100%;
    height: 0;
    padding-bottom: 75%; /* Manter proporção 4:3 */
  }
}
</style>
