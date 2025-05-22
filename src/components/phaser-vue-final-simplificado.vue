<!--
  phaser-vue-final-simplificado.vue
  
  Jogo completo com:
  - Sprites para jogador e inimigo (apenas 3 frames)
  - Física e colisões
  - Mecânica de ataque e defesa
  - Barras de vida
  - Rounds e vitória
  - Integração completa com Vue
  - Sem efeitos sonoros
-->

<template>
  <div class="game-container">
    <div id="game-container"></div>
    <div class="controls-panel">
      <h2>Controles</h2>
      <p>W, A, S, D - Movimento do Jogador</p>
      <p>Espaço - Atacar</p>
      
      <div class="status-panel">
        <h3>Status do Jogador</h3>
        <div class="health-bar">
          <div class="health-label">Vida:</div>
          <div class="health-bar-container">
            <div class="health-bar-fill" :style="{ width: `${playerHealth}%` }"></div>
          </div>
          <div class="health-value">{{ playerHealth }}%</div>
        </div>
        <p>Posição: X: {{ playerPosition.x.toFixed(0) }}, Y: {{ playerPosition.y.toFixed(0) }}</p>
        <p>Atacando: {{ isAttacking ? 'Sim' : 'Não' }}</p>
      </div>
      
      <div class="status-panel enemy-panel">
        <h3>Status do Inimigo</h3>
        <div class="health-bar">
          <div class="health-label">Vida:</div>
          <div class="health-bar-container">
            <div class="health-bar-fill enemy" :style="{ width: `${enemyHealth}%` }"></div>
          </div>
          <div class="health-value">{{ enemyHealth }}%</div>
        </div>
      </div>
      
      <div class="game-status">
        <h3>Jogo</h3>
        <p>Round: {{ currentRound }}/{{ totalRounds }}</p>
        <p>Status: {{ gameStatus }}</p>
        <button v-if="gameStatus === 'Game Over' || gameStatus === 'Vitória!'" @click="restartGame" class="restart-button">Reiniciar Jogo</button>
      </div>
    </div>
  </div>
</template>

<script>
import Phaser from 'phaser';

export default {
  name: 'PhaserVueFinal',
  
  data() {
    return {
      game: null,
      playerPosition: { x: 400, y: 300 },
      enemyPosition: { x: 600, y: 300 },
      playerHealth: 100,
      enemyHealth: 100,
      isAttacking: false,
      currentRound: 1,
      totalRounds: 3,
      gameStatus: 'Em andamento',
      playerWins: 0,
      enemyWins: 0
    };
  },
  
  mounted() {
    this.initGame();
  },
  
  beforeDestroy() {
    if (this.game) {
      this.game.destroy(true);
    }
  },
  
  methods: {
    initGame() {
      // Referência ao componente Vue
      const vueComponent = this;
      
      // Classe de cena personalizada
      class FightScene extends Phaser.Scene {
        constructor() {
          super('FightScene');
          this.player = null;
          this.enemy = null;
          this.keys = null;
          this.playerAttackCooldown = false;
          this.enemyAttackCooldown = false;
          this.roundOver = false;
        }
        
        preload() {
          console.log('Preload iniciado');
          
          // Carregar sprites do jogador
          this.load.spritesheet('player', 'sprite/sprite.png', { frameWidth: 235, frameHeight: 350 });
          
          // Carregar sprites do inimigo (usando o mesmo sprite mas com tint diferente)
          this.load.spritesheet('enemy', 'sprite/sprite.png', { frameWidth: 235, frameHeight: 350 });
          
          // Carregar background
          try {
            this.load.image('background', 'backgrounds/menu.png');
            console.log('Tentando carregar background');
          } catch (e) {
            console.log('Background não encontrado, usando cor padrão');
          }
        }
        
        create() {
          console.log('Método create chamado!');
          
          // Adicionar background se existir
          if (this.textures.exists('background')) {
            console.log('Background encontrado, adicionando à cena');
            this.add.image(400, 300, 'background').setDisplaySize(800, 600);
          } else {
            console.log('Background não disponível, usando cor padrão');
          }
          
          // Configurar física
          this.physics.world.setBounds(0, 0, 800, 600);
          
          // Criar o jogador
          this.player = this.physics.add.sprite(200, 300, 'player');
          this.player.setScale(0.3); // Ajustar escala conforme necessário
          this.player.setCollideWorldBounds(true);
          this.player.setBounce(0.2);
          this.player.setSize(100, 200); // Ajustar hitbox
          this.player.health = 100;
          
          // Criar o inimigo
          this.enemy = this.physics.add.sprite(600, 300, 'enemy');
          this.enemy.setScale(0.3); // Ajustar escala conforme necessário
          this.enemy.setCollideWorldBounds(true);
          this.enemy.setBounce(0.2);
          this.enemy.setSize(100, 200); // Ajustar hitbox
          this.enemy.setTint(0x00ffff); // Cor diferente para distinguir
          this.enemy.health = 100;
          this.enemy.direction = -1; // Direção para IA
          
          // Configurar colisão entre jogador e inimigo
          this.physics.add.collider(this.player, this.enemy);
          
          // Criar animações para o jogador e inimigo
          this.createAnimations();
          
          // Iniciar animações idle
          this.player.play('player-idle');
          this.enemy.play('enemy-idle');
          
          // Adicionar teclas WASD e espaço
          this.keys = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
          });
          
          // Resetar estado do jogo
          this.roundOver = false;
          vueComponent.playerHealth = 100;
          vueComponent.enemyHealth = 100;
          vueComponent.gameStatus = 'Em andamento';
        }
        
        createAnimations() {
          // Animações do jogador - usando apenas os 3 frames disponíveis
          this.anims.create({
            key: 'player-idle',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
            frameRate: 8,
            repeat: -1
          });
          
          this.anims.create({
            key: 'player-walk',
            frames: this.anims.generateFrameNumbers('player', { start: 1, end: 1 }),
            frameRate: 8,
            repeat: -1
          });
          
          this.anims.create({
            key: 'player-attack',
            frames: this.anims.generateFrameNumbers('player', { start: 2, end: 2 }),
            frameRate: 8,
            repeat: 0
          });
          
          // Animações do inimigo (mesmas frames, chaves diferentes)
          this.anims.create({
            key: 'enemy-idle',
            frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 0 }),
            frameRate: 8,
            repeat: -1
          });
          
          this.anims.create({
            key: 'enemy-walk',
            frames: this.anims.generateFrameNumbers('enemy', { start: 1, end: 1 }),
            frameRate: 8,
            repeat: -1
          });
          
          this.anims.create({
            key: 'enemy-attack',
            frames: this.anims.generateFrameNumbers('enemy', { start: 2, end: 2 }),
            frameRate: 8,
            repeat: 0
          });
        }
        
        update() {
          // Não atualizar se o round acabou
          if (this.roundOver) return;
          
          // Velocidade de movimento
          const speed = 160;
          
          // Resetar velocidade do jogador
          this.player.setVelocity(0);
          
          // Movimento com WASD
          if (this.keys.a.isDown) {
            this.player.setVelocityX(-speed);
            this.player.flipX = true; // Virar para a esquerda
            this.player.play('player-walk', true);
          } else if (this.keys.d.isDown) {
            this.player.setVelocityX(speed);
            this.player.flipX = false; // Virar para a direita
            this.player.play('player-walk', true);
          } else if (this.keys.w.isDown) {
            this.player.setVelocityY(-speed);
            this.player.play('player-walk', true);
          } else if (this.keys.s.isDown) {
            this.player.setVelocityY(speed);
            this.player.play('player-walk', true);
          } else if (!this.playerAttackCooldown) {
            // Se não estiver se movendo nem atacando, voltar para idle
            this.player.play('player-idle', true);
          }
          
          // Ataque com espaço
          if (Phaser.Input.Keyboard.JustDown(this.keys.space) && !this.playerAttackCooldown) {
            this.playerAttack();
          }
          
          // IA simples para o inimigo
          this.updateEnemyAI();
          
          // Atualizar posição no componente Vue
          vueComponent.playerPosition = {
            x: this.player.x,
            y: this.player.y
          };
          
          vueComponent.enemyPosition = {
            x: this.enemy.x,
            y: this.enemy.y
          };
          
          // Verificar fim do round
          this.checkRoundEnd();
        }
        
        playerAttack() {
          // Iniciar ataque
          this.playerAttackCooldown = true;
          vueComponent.isAttacking = true;
          
          // Reproduzir animação de ataque
          this.player.play('player-attack', true);
          
          // Verificar se o inimigo está no alcance do ataque
          const attackRange = 100;
          const distance = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.enemy.x, this.enemy.y
          );
          
          if (distance < attackRange) {
            // Causar dano ao inimigo
            this.damageEnemy(20);
            
            // Empurrar o inimigo
            const angle = Phaser.Math.Angle.Between(
              this.player.x, this.player.y,
              this.enemy.x, this.enemy.y
            );
            
            this.enemy.setVelocity(
              Math.cos(angle) * 300,
              Math.sin(angle) * 300
            );
          }
          
          // Criar efeito visual de ataque
          const attackDirection = this.player.flipX ? -1 : 1;
          const attackEffect = this.add.circle(
            this.player.x + (attackDirection * 50), 
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
          
          // Terminar ataque após um tempo
          this.time.delayedCall(500, () => {
            // Voltar para animação idle
            if (!this.keys.a.isDown && !this.keys.d.isDown && 
                !this.keys.w.isDown && !this.keys.s.isDown) {
              this.player.play('player-idle', true);
            }
            
            // Atualizar estado no Vue
            vueComponent.isAttacking = false;
            
            // Cooldown de ataque
            this.time.delayedCall(300, () => {
              this.playerAttackCooldown = false;
            });
          });
        }
        
        enemyAttack() {
          // Iniciar ataque
          this.enemyAttackCooldown = true;
          
          // Reproduzir animação de ataque
          this.enemy.play('enemy-attack', true);
          
          // Verificar se o jogador está no alcance do ataque
          const attackRange = 100;
          const distance = Phaser.Math.Distance.Between(
            this.enemy.x, this.enemy.y,
            this.player.x, this.player.y
          );
          
          if (distance < attackRange) {
            // Causar dano ao jogador
            this.damagePlayer(15);
            
            // Empurrar o jogador
            const angle = Phaser.Math.Angle.Between(
              this.enemy.x, this.enemy.y,
              this.player.x, this.player.y
            );
            
            this.player.setVelocity(
              Math.cos(angle) * 300,
              Math.sin(angle) * 300
            );
          }
          
          // Criar efeito visual de ataque
          const attackDirection = this.enemy.flipX ? -1 : 1;
          const attackEffect = this.add.circle(
            this.enemy.x + (attackDirection * 50), 
            this.enemy.y,
            25, 
            0x00ffff, 
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
          
          // Terminar ataque após um tempo
          this.time.delayedCall(500, () => {
            // Voltar para animação idle
            this.enemy.play('enemy-idle', true);
            
            // Cooldown de ataque
            this.time.delayedCall(800, () => {
              this.enemyAttackCooldown = false;
            });
          });
        }
        
        updateEnemyAI() {
          // Não atualizar IA se estiver em cooldown de ataque
          if (this.enemyAttackCooldown) return;
          
          // Calcular distância até o jogador
          const distance = Phaser.Math.Distance.Between(
            this.enemy.x, this.enemy.y,
            this.player.x, this.player.y
          );
          
          // Velocidade de movimento do inimigo
          const speed = 120;
          
          // Atualizar direção do inimigo
          if (this.player.x < this.enemy.x) {
            this.enemy.flipX = true;
          } else {
            this.enemy.flipX = false;
          }
          
          // Comportamento baseado na distância
          if (distance < 80) {
            // Atacar se estiver perto
            this.enemyAttack();
          } else if (distance < 300) {
            // Perseguir o jogador
            const angle = Phaser.Math.Angle.Between(
              this.enemy.x, this.enemy.y,
              this.player.x, this.player.y
            );
            
            this.enemy.setVelocity(
              Math.cos(angle) * speed,
              Math.sin(angle) * speed
            );
            
            // Animação de andar
            this.enemy.play('enemy-walk', true);
          } else {
            // Movimento aleatório quando longe
            if (Math.random() < 0.02) {
              this.enemy.direction = Math.random() < 0.5 ? -1 : 1;
            }
            
            this.enemy.setVelocityX(speed * this.enemy.direction);
            
            // Animação de andar
            this.enemy.play('enemy-walk', true);
          }
        }
        
        damagePlayer(amount) {
          // Reduzir vida do jogador
          this.player.health -= amount;
          if (this.player.health < 0) this.player.health = 0;
          
          // Atualizar barra de vida no Vue
          vueComponent.playerHealth = this.player.health;
        }
        
        damageEnemy(amount) {
          // Reduzir vida do inimigo
          this.enemy.health -= amount;
          if (this.enemy.health < 0) this.enemy.health = 0;
          
          // Atualizar barra de vida no Vue
          vueComponent.enemyHealth = this.enemy.health;
        }
        
        checkRoundEnd() {
          // Verificar se algum lutador está sem vida
          if (this.player.health <= 0 || this.enemy.health <= 0) {
            // Marcar round como terminado
            this.roundOver = true;
            
            // Determinar vencedor
            if (this.player.health <= 0 && this.enemy.health <= 0) {
              // Empate
              vueComponent.gameStatus = 'Empate!';
            } else if (this.player.health <= 0) {
              // Inimigo venceu
              vueComponent.enemyWins++;
              vueComponent.gameStatus = 'Você perdeu!';
            } else {
              // Jogador venceu
              vueComponent.playerWins++;
              vueComponent.gameStatus = 'Você venceu!';
            }
            
            // Verificar fim do jogo
            if (vueComponent.currentRound >= vueComponent.totalRounds || 
                vueComponent.playerWins > vueComponent.totalRounds / 2 || 
                vueComponent.enemyWins > vueComponent.totalRounds / 2) {
              // Jogo terminou
              if (vueComponent.playerWins > vueComponent.enemyWins) {
                vueComponent.gameStatus = 'Vitória!';
              } else if (vueComponent.enemyWins > vueComponent.playerWins) {
                vueComponent.gameStatus = 'Game Over';
              } else {
                vueComponent.gameStatus = 'Empate Final!';
              }
            } else {
              // Preparar próximo round
              this.time.delayedCall(2000, () => {
                vueComponent.currentRound++;
                this.scene.restart();
              });
            }
          }
        }
      }
      
      // Configuração do jogo Phaser
      const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#2d2d2d',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false
          }
        },
        scene: FightScene
      };
      
      // Criar instância do jogo
      this.game = new Phaser.Game(config);
    },
    
    restartGame() {
      // Resetar estado do jogo
      this.playerHealth = 100;
      this.enemyHealth = 100;
      this.currentRound = 1;
      this.gameStatus = 'Em andamento';
      this.playerWins = 0;
      this.enemyWins = 0;
      
      // Reiniciar a cena
      if (this.game) {
        this.game.scene.getScene('FightScene').scene.restart();
      }
    }
  }
};
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

#game-container {
  width: 800px;
  height: 600px;
  margin: 0 auto;
  border: 2px solid #333;
}

.controls-panel {
  width: 100%;
  margin-top: 20px;
  padding: 15px;
  background-color: #f0f0f0;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h2, h3 {
  margin-top: 0;
  color: #333;
}

.status-panel {
  margin-top: 15px;
  padding: 10px;
  background-color: #e0e0e0;
  border-radius: 4px;
}

.enemy-panel {
  background-color: #d8e0f0;
}

.health-bar {
  display: flex;
  align-items: center;
  margin: 10px 0;
}

.health-label {
  width: 50px;
}

.health-bar-container {
  flex: 1;
  height: 20px;
  background-color: #ddd;
  border-radius: 3px;
  overflow: hidden;
  margin: 0 10px;
}

.health-bar-fill {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s ease;
}

.health-bar-fill.enemy {
  background-color: #f44336;
}

.health-value {
  width: 40px;
  text-align: right;
}

.game-status {
  margin-top: 15px;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
  text-align: center;
}

.restart-button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.restart-button:hover {
  background-color: #45a049;
}

/* Responsividade para telas menores */
@media (max-width: 820px) {
  #game-container {
    width: 100%;
    height: 0;
    padding-bottom: 75%; /* Manter proporção 4:3 */
  }
}
</style>
