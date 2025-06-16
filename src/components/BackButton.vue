<template>
  <!-- src/components/BackButton.vue -->
  <!-- Componente reutilizável para o botão "VOLTAR". -->
  <!-- Usa a funcionalidade de histórico do Vue Router para voltar à página anterior. -->
  <button
    class="retro-back-btn"
    @click="goBack"
    @mouseover="playHoverSound"
  >
    Voltar
  </button>
</template>

<script setup>
// Importa o useRouter para acessar a instância do roteador.
import { useRouter } from 'vue-router';
import hoverSoundUrl from '@/assets/sounds/houver.mp3';

// Obtém a instância do roteador.
const router = useRouter();

const hoverAudio = new Audio(hoverSoundUrl);

// Função para navegar para a página anterior no histórico do navegador.
const goBack = () => {
  // router.back() é equivalente a window.history.back()
  router.back();
};

function playHoverSound() {
  hoverAudio.currentTime = 0;
  hoverAudio.play();
}
</script>

<style scoped>
.retro-back-btn {
  position: fixed;
  top: 24px;
  left: 24px;
  z-index: 100;
  font-family: 'Press Start 2P', cursive, sans-serif;
  font-size: 1rem;
  padding: 18px 36px;
  background: #202834;
  color: #fff;
  border: 4px solid #fff;
  border-radius: 18px;
  box-shadow: 2px 2px 0 #000, 4px 4px 0 #333;
  text-shadow: 2px 2px 0 #000;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  pointer-events: auto;
}

.retro-back-btn:hover {
  background: #5ae8ec;
  color: #012643;
  text-shadow: none;
}

@media (max-width: 640px) {
  .retro-back-btn {
    top: 12px;
    left: 12px;
    font-size: 0.8rem;
    padding: 12px 20px;
  }
}
</style>

