<!--
  phaser-vue-minimo.vue
  
  Exemplo absolutamente mínimo de integração Vue e Phaser
  Apenas um retângulo vermelho com movimento WASD
-->

<template>
  <div>
    <div id="game-container"></div>
    <div class="controls">
      <p>Use WASD para mover o retângulo</p>
    </div>
  </div>
</template>

<script>
import Phaser from 'phaser';

export default {
  name: 'PhaserVueMinimo',
  
  mounted() {
    // Configuração mínima do Phaser
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'game-container',
      backgroundColor: '#2d2d2d',
      scene: {
        create: function() {
          // Criar retângulo vermelho no centro
          this.rect = this.add.rectangle(400, 300, 100, 100, 0xff0000);
          
          // Adicionar teclas WASD
          this.keys = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D
          });
        },
        update: function() {
          // Velocidade de movimento
          const speed = 2;
          
          // Movimento com WASD
          if (this.keys.a.isDown) {
            this.rect.x -= speed;
          }
          if (this.keys.d.isDown) {
            this.rect.x += speed;
          }
          if (this.keys.w.isDown) {
            this.rect.y -= speed;
          }
          if (this.keys.s.isDown) {
            this.rect.y += speed;
          }
        }
      }
    };
    
    // Criar jogo
    this.game = new Phaser.Game(config);
  },
  
  beforeDestroy() {
    if (this.game) {
      this.game.destroy(true);
    }
  }
};
</script>

<style scoped>
#game-container {
  width: 800px;
  height: 600px;
  margin: 0 auto;
  border: 2px solid #333;
}

.controls {
  text-align: center;
  margin-top: 20px;
  font-family: Arial, sans-serif;
}
</style>
