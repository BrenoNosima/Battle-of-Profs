<template>
  <div :id="containerId" class="game-container-wrapper"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Phaser from 'phaser';
import phaserConfig from '@/game/config/phaserConfig'; // Ajuste o caminho se necessário

const containerId = 'phaser-game-container';
let gameInstance = null;

// Props para passar dados do Vue para o Phaser, se necessário
// const props = defineProps({
//   someData: String
// });

// Emits para passar eventos do Phaser para o Vue, se necessário
// const emit = defineEmits(['gameOver', 'scoreUpdate']);

onMounted(() => {
  // Passa referências ou dados para a configuração do Phaser, se necessário
  // Exemplo: phaserConfig.parent = containerId;
  // Exemplo: phaserConfig.callbacks = { postBoot: () => console.log('Game Booted from Vue!') };
  // Exemplo: phaserConfig.physics.arcade.debug = true;

  // Garante que o ID do container pai está definido
  const config = { ...phaserConfig, parent: containerId };

  gameInstance = new Phaser.Game(config);

  // Exemplo de como escutar eventos do Phaser (precisa ser emitido pelo jogo)
  // gameInstance.events.on('phaserGameOver', () => {
  //   emit('gameOver');
  // });
  // gameInstance.events.on('phaserScoreUpdate', (score) => {
  //   emit('scoreUpdate', score);
  // });

  // Adiciona listener para redimensionamento
  window.addEventListener('resize', resizeGame);
  resizeGame(); // Chama uma vez para definir o tamanho inicial
});

onUnmounted(() => {
  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
  }
  window.removeEventListener('resize', resizeGame);
});

// Função para redimensionar o canvas do Phaser
const resizeGame = () => {
  if (gameInstance && gameInstance.isBooted) {
    const container = document.getElementById(containerId);
    if (container) {
      const width = container.clientWidth;
      const height = container.clientHeight;
      gameInstance.scale.resize(width, height);

      // Centralizar câmera se necessário (pode variar dependendo do jogo)
      gameInstance.cameras.main.centerOn(width / 2, height / 2);
    }
  }
};

</script>

<style scoped>
.game-container-wrapper {
  width: 100%;
  height: 80vh; /* Ajuste a altura conforme necessário */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden; /* Evita barras de rolagem no container */
  background-color: #2c3e50; /* Cor de fundo padrão */
}

/* Estilos adicionais para o canvas podem ser necessários */
:deep(canvas) {
  display: block;
  max-width: 100%;
  max-height: 100%;
}
</style>
