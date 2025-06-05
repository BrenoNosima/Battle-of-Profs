<template>
  <!-- src/components/LoadingBar.vue -->
  <!-- Componente reutilizável para exibir uma barra de carregamento animada. -->
  <div class="menu-box">
    <div class="loading-bar-container">
      <div class="loading-bar-bg">
        <!-- A largura da barra de preenchimento é controlada dinamicamente -->
        <!-- A classe CSS `loading-bar-fill` define a aparência e a transição. -->
        <div class="loading-bar-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <p class="loading-text">Carregando...</p>
    </div>
  </div>
</template>

<script setup>
// Importa defineProps para definir as propriedades que o componente pode receber.
import { defineProps } from 'vue';

// Define as propriedades esperadas pelo componente.
// Neste caso, esperamos uma propriedade 'progress' do tipo Number,
// que representa a porcentagem de preenchimento da barra (0 a 100).
defineProps({
  progress: {
    type: Number,
    required: true, // Indica que a propriedade é obrigatória.
    default: 0, // Valor padrão caso não seja fornecida.
    // Validador opcional para garantir que o valor esteja entre 0 e 100.
    validator: (value) => value >= 0 && value <= 100,
  },
});
</script>

<style scoped>
/* Estilos específicos para este componente. 'scoped' garante que os estilos */
/* não afetem outros componentes da aplicação. */

/* Estilos copiados e adaptados do index.html original */
.menu-box {
  /* Estilos para o container geral, se necessário, ou pode ser aplicado no pai */
  /* Mantido aqui para encapsular o estilo original */
  background: rgba(85, 77, 39, 0.85);
  border-radius: 16px;
  padding: 40px 24px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.7);
  border: 4px solid #fff;
  max-width: 600px;
  width: 90%; /* Ajustado para melhor responsividade */
  margin: 20px auto; /* Adicionado margem para espaçamento */
  position: relative; /* Garante que fique acima do overlay ::before */
  z-index: 1;
}

.loading-bar-container {
  width: 100%; /* Ocupa a largura do menu-box */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-bar-bg {
  width: 100%;
  height: 22px;
  background: #444;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.loading-bar-fill {
  height: 100%;
  width: 0%; /* Começa vazia, controlada pela prop 'progress' */
  /* Gradiente de cores como no original */
  background: linear-gradient(90deg, #a1753a 60%, #facc15 100%);
  border-radius: 12px;
  /* Transição suave na mudança de largura */
  transition: width 0.5s linear; /* Ajustado tempo de transição */
  position: absolute;
  left: 0;
  top: 0;
}

.loading-text {
  /* Usa a fonte definida globalmente */
  font-family: inherit;
  color: #fff;
  font-size: 1rem;
  text-align: center;
  margin: 0;
}

/* Media query para telas menores */
@media (max-width: 500px) {
  .menu-box {
    padding: 20px 15px;
    max-width: 95vw;
  }
  .loading-text {
    font-size: 0.9rem;
  }
}
</style>

