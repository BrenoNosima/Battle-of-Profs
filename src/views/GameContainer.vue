<template>
  <div class="fullscreen-container">
    <div id="game-container"></div>
  </div>
</template>

<script>//commit pra atualizar
import Phaser from 'phaser';
import FightScene from '../game/FightScene.js'; // Corrected path

export default {
  name: 'GameContainer',

  data() {
    return {
      game: null,
      playerHealth: 100,
      enemyHealth: 100,
      currentRound: 1,
      totalRounds: 3,
      playerWins: 0,
      enemyWins: 0
    };
  },

  mounted() {
    this.initGame();
    window.addEventListener('resize', this.resizeGame);
    this.resizeGame();
  },

  beforeUnmount() {  //Garante que o Phaser seja destruído ao sair da rota do jogo
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
    window.removeEventListener('resize', this.resizeGame);
  },

  methods: {
    initGame() {
      const gameConfig = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: 'game-container',
        backgroundColor: '#2d2d2d',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 600 },
            debug: false
          }
        },
        scene: FightScene, // Pass the class directly
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH
        }
      };

      this.game = new Phaser.Game(gameConfig);

      // Start the scene manually and pass data
      this.game.scene.start('FightScene', { vueComponentRef: this });
    },

    resizeGame() {
      if (this.game && this.game.scale) {
        this.game.scale.resize(window.innerWidth, window.innerHeight);
        const scene = this.game.scene.getScene('FightScene');
        if (scene && scene.scene.isActive()) {
           scene.handleResize(window.innerWidth, window.innerHeight);
        }
      }
    },

    restartGame() {
      console.log("GameContainer: Reiniciando o jogo...");
      this.playerHealth = 100;
      this.enemyHealth = 100;
      this.currentRound = 1;
      this.playerWins = 0;
      this.enemyWins = 0;

      const scene = this.game.scene.getScene('FightScene');
      if (scene) {
         // Restart the scene, passing the ref again
         scene.scene.restart({ vueComponentRef: this }); 
      }
    },

    updateHealth(playerHealth, enemyHealth) {
      this.playerHealth = playerHealth;
      this.enemyHealth = enemyHealth;
    },

    updateRoundInfo(currentRound, playerWins, enemyWins) {
      this.currentRound = currentRound;
      this.playerWins = playerWins;
      this.enemyWins = enemyWins;
    }
  }
};
</script>

<style>
/* Reset CSS */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fullscreen-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
}

#game-container {
  width: 100%;
  height: 100%;
}
</style>
