<template>
  <!-- src/views/MenuView.vue -->
  <!-- Esta é a "View" ou página principal do menu. -->
  <!-- Ela utiliza Tailwind para estilização e componentes Vue para funcionalidades. -->

  <!-- Container principal que aplica a imagem de fundo e centraliza o conteúdo -->
  <!-- A classe `bg-pattern` vem do src/index.css e precisa ter o caminho da imagem ajustado -->
  <!-- Vamos definir o background diretamente aqui para melhor controle no Vue -->
  <div class="min-h-screen flex flex-col items-center justify-center bg-pattern p-4"
       :style="{ backgroundImage: `url(${backgroundImageUrl})` }">

    <!-- Logo do Jogo -->
    <!-- Usamos :src para vincular dinamicamente a imagem importada -->
    <img :src="logoUrl" alt="Logo do Professor Stryke" class="logo-jogo mb-4 md:mb-8">

    <!-- Caixa do Menu Principal (visível quando não está carregando) -->
    <div v-if="!isLoading" class="menu-box w-full max-w-md md:max-w-lg lg:max-w-xl" id="menu-box">
      <ul id="main-menu" class="space-y-4 w-full">
        <!-- Botão JOGAR -->
        <!-- @click chama o método handlePlayClick -->
        <li @click="handlePlayClick" class="menu-item p-4 bg-retro-menu-item-bg pixel-border text-center rounded cursor-pointer hover:bg-retro-yellow hover:text-black transition-colors duration-200">
          JOGAR
        </li>

        <!-- Botão CRÉDITOS -->
        <!-- Usamos <router-link> para navegação interna do Vue Router -->
        <!-- O `to="/credits"` aponta para a rota definida em src/router/index.js -->
        <li>
          <router-link to="/credits"
            class="menu-item block p-4 bg-retro-menu-item-bg pixel-border text-center rounded cursor-pointer hover:bg-retro-yellow hover:text-black transition-colors duration-200">
            CRÉDITOS
          </router-link>
        </li>
      </ul>
    </div>

    <!-- Área da Barra de Carregamento (visível quando isLoading é true) -->
    <!-- Usamos o componente LoadingBar que criamos -->
    <!-- Passamos a propriedade :progress para controlar o preenchimento da barra -->
    <LoadingBar v-else :progress="loadingProgress" id="loading-bar-area" />

  </div>
</template>

<script setup>
// Importações necessárias do Vue e outros módulos
import { ref } from 'vue'; // ref é usado para criar variáveis reativas
import { useRouter } from 'vue-router'; // useRouter para navegação programática (se necessário)

// Importa o componente LoadingBar
import LoadingBar from '@/components/LoadingBar.vue';

// Importa as imagens estáticas usando a sintaxe do Vite
// Isso garante que as imagens sejam processadas corretamente pelo build
import logoPath from '@/assets/img/Logo do Professor Stryke.png';
// O nome do arquivo de fundo tem caracteres especiais, vamos usar o nome correto
// Renomear o arquivo seria uma boa prática para evitar problemas.
// Assumindo que o arquivo foi copiado corretamente para src/assets/img/
import backgroundPath from '@/assets/img/ChatGPT Image 15 de mai. de 2025, 10_05_41.png';

// Variáveis reativas para controlar o estado da UI
const isLoading = ref(false); // Controla a visibilidade do menu vs. barra de carregamento
const loadingProgress = ref(0); // Controla a porcentagem da barra de carregamento (0-100)

// Obtém a instância do roteador (não estritamente necessário aqui, mas útil se precisarmos de navegação programática)
const router = useRouter();

// URLs processadas para as imagens
const logoUrl = ref(logoPath);
const backgroundImageUrl = ref(backgroundPath);

// Função chamada quando o botão "JOGAR" é clicado
const handlePlayClick = () => {
  isLoading.value = true;
  loadingProgress.value = 0;
  setTimeout(() => {
    loadingProgress.value = 100;
  }, 50);
  setTimeout(() => {
    router.push('/game'); // <-- Troca para navegação real
  }, 700);
};

</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap");/* necessariamente precisa estar na tag style */

/* Estilos específicos para MenuView.vue. */
/* Usamos `scoped` para evitar que estes estilos afetem outros componentes. */

/* Estilos adaptados do index.html original */
.logo-jogo {
  width: 320px;
  max-width: 90vw; /* Garante responsividade */
  height: auto;
  display: block;
  margin-left: auto;
  margin-right: auto;
  /* Adiciona position relative para garantir que fique acima do ::before do bg-pattern */
  position: relative;
  z-index: 1;
}

.menu-box {
  background: theme('colors.retro-menu-bg'); /* Usando cor do tema Tailwind */
  border-radius: 16px;
  padding: 40px 24px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.7);
  border: 4px solid #fff;
  /* max-width é definido pelas classes Tailwind (max-w-md etc.) */
  /* width: 100%; */ /* Já definido pela classe w-full */
  margin-left: auto; /* Centraliza */
  margin-right: auto; /* Centraliza */
  /* Garante que fique acima do ::before do bg-pattern */
  position: relative;
  z-index: 1;
}

.menu-item {
  font-size: 1.3rem;
  /* padding já está nas classes Tailwind (p-4) */
  /* width: 100% !important; */ /* Usar w-full do Tailwind */
  box-sizing: border-box;
  /* display: block; */ /* Já é block por padrão ou pela classe `block` no router-link */
  text-align: center;
  /* background: theme('colors.retro-menu-item-bg'); */ /* Definido nas classes Tailwind */
  border-radius: 8px;
  /* transition: background 0.2s, color 0.2s; */ /* Definido nas classes Tailwind */
  color: white;
  /* cursor: pointer; */ /* Definido nas classes Tailwind */
  font-family: 'Press Start 2P', cursive, sans-serif;
}

/* O hover é tratado pelas classes hover: do Tailwind */
/* .menu-item:hover { ... } */

/* Media queries para ajustar o layout em telas menores */
@media (max-width: 768px) { /* md breakpoint */
  .menu-box {
    padding: 30px 20px;
  }
  .menu-item {
    font-size: 1.1rem;
  }
}

@media (max-width: 500px) {
  .logo-jogo {
    width: 180px;
    margin-bottom: 8px;
  }
  .menu-box {
    padding: 20px 15px;
    max-width: 95vw;
  }
   .menu-item {
    font-size: 1rem;
    padding: 0.8rem; /* Ajuste o padding se necessário */
  }
}

/* Estilo para o container principal com fundo */
.bg-pattern {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  position: relative; /* Necessário para o z-index do ::before */
}

/* Pseudo-elemento para a sobreposição escura (copiado do index.css global, mas pode ser específico se necessário) */
.bg-pattern::before {
  content: "";
  position: absolute; /* Usar absolute em vez de fixed para ficar contido no div */
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 0; /* Atrás do conteúdo */
  pointer-events: none;
}

/* Garante que o conteúdo direto (logo, menu-box) fique acima do ::before */
.logo-jogo,
.menu-box,
#loading-bar-area {
  position: relative;
  z-index: 1;
}
</style>

