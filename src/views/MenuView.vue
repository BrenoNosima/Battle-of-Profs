<template>
  <!-- src/views/MenuView.vue -->
  <!-- Esta é a "View" ou página principal do menu. -->
  <!-- Ela utiliza Tailwind para estilização e componentes Vue para funcionalidades. -->

  <!-- Container principal que aplica a imagem de fundo e centraliza o conteúdo -->
  <!-- A classe `bg-pattern` vem do src/index.css e precisa ter o caminho da imagem ajustado -->
  <!-- Vamos definir o background diretamente aqui para melhor controle no Vue -->
  <div class="h-screen flex flex-col items-center justify-center bg-pattern p-4"
       :style="{ backgroundImage: `url(${backgroundImageUrl})` }">

    <!-- Logo do Jogo -->
    <!-- Usamos :src para vincular dinamicamente a imagem importada -->
    <img :src="logoUrl" alt="Logo do Professor Stryke" class="logo-jogo mb-4 md:mb-8">

    <!-- Menu principal -->
    <div v-if="!showIntroImage && !showVideo" class="menu-box w-full max-w-md md:max-w-lg lg:max-w-xl" id="menu-box">
      <ul id="main-menu" class="space-y-4 w-full">
        <!-- Botão JOGAR -->
        <!-- @click chama o método handlePlayClick -->
        <li
          @click="handlePlayClick"
          @mouseenter="playHoverSound"
          class="menu-item p-4 bg-retro-menu-item-bg pixel-border text-center rounded cursor-pointer transition-colors duration-200"
        >
          JOGAR
        </li>

        <!-- Botão CRÉDITOS -->
        <!-- Usamos <router-link> para navegação interna do Vue Router -->
        <!-- O `to="/credits"` aponta para a rota definida em src/router/index.js -->
        <li>
          <router-link
            to="/credits"
            class="menu-item block p-4 bg-retro-menu-item-bg pixel-border text-center rounded cursor-pointer transition-colors duration-200"
            @mouseenter="playHoverSound"
          >
            CRÉDITOS
          </router-link>
        </li>
      </ul>
    </div>

    <!-- Imagem de introdução -->
    <div v-else-if="showIntroImage" class="intro-image-container flex flex-col items-center justify-center">
      <img :src="textoIntroPath" alt="Introdução" class="intro-image mb-8" />
    </div>

    <!-- Vídeo de introdução -->
    <div v-else class="intro-video-container">
      <video
        ref="introVideo"
        src="@/assets/video_intro.mp4" 
        class="intro-video"
        autoplay
        controls
        playsinline
        @ended="goToGame"
      ></video>
      <!-- Botão para pular o vídeo -->
      <button class="skip-btn" @click="goToGame">Pular vídeo</button>
    </div>
  </div>
</template>

<script setup>
// Importações necessárias do Vue e outros módulos
import { ref } from 'vue'; // ref é usado para criar variáveis reativas
import { useRouter } from 'vue-router'; // useRouter para navegação programática (se necessário)

// Importa as imagens estáticas usando a sintaxe do Vite
// Isso garante que as imagens sejam processadas corretamente pelo build
import logoPath from '@/assets/img/ChatGPT Image 13 de jun. de 2025, 22_10_03.png';
// O nome do arquivo de fundo tem caracteres especiais, vamos usar o nome correto
// Renomear o arquivo seria uma boa prática para evitar problemas.
// Assumindo que o arquivo foi copiado corretamente para src/assets/img/
import backgroundPath from '@/assets/img/ChatGPT Image 13 de jun. de 2025, 21_23_22.png';
import textoIntroPath from '@/assets/img/texto_intro.png';

// Variável reativa para controlar se o vídeo está sendo exibido
const showIntroImage = ref(false);
const showVideo = ref(false);

// Obtém a instância do roteador (não estritamente necessário aqui, mas útil se precisarmos de navegação programática)
const router = useRouter();

// URLs processadas para as imagens
const logoUrl = ref(logoPath);
const backgroundImageUrl = ref(backgroundPath);

// Função chamada quando o botão "JOGAR" é clicado
const handlePlayClick = () => {
  showIntroImage.value = true;
  setTimeout(goToVideo, 15000); // 15 segundos
};

// Quando clicar em "Continuar" ou passar o tempo, mostra o vídeo
function goToVideo() {
  showIntroImage.value = false;
  showVideo.value = true;
}

// Função chamada quando o vídeo termina ou o usuário clica em "Pular vídeo"
function goToGame() {
  router.push('/game');
}

// --- NOVO: Lógica para o áudio de hover ---
import hoverSoundUrl from '@/assets/sounds/houver.mp3';

// Cria o objeto de áudio
const hoverAudio = new Audio(hoverSoundUrl);

// Função para tocar o áudio ao passar o mouse
function playHoverSound() {
  hoverAudio.currentTime = 0;
  hoverAudio.play();
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap");/* necessariamente precisa estar na tag style */

/* Estilos específicos para MenuView.vue. */
/* Usamos `scoped` para evitar que estes estilos afetem outros componentes. */

/* Estilos adaptados do index.html original */
.logo-jogo {
  width: 400px;
  max-width: 90vw; /* Garante responsividade */
  height: auto;
  display: block;
  margin-top: 50px;
  margin-left: auto;
  margin-right: auto;
  /* Adiciona position relative para garantir que fique acima do ::before do bg-pattern */
  position: relative;
  z-index: 1;
}

.menu-box {
  background-color: #012643;
  border-radius: 16px;
  padding: 40px 24px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.7);
  border: 4px solid white;
  margin-left: auto; /* Centraliza */
  margin-right: auto; /* Centraliza */
  /* Garante que fique acima do ::before do bg-pattern */
  position: relative;
  z-index: 1;
  margin-bottom: 100px;
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
  text-shadow: 2px 2px 0 #000;
  text-decoration: none;
}
.menu-item:hover {
  background-color: #5ae8ec !important;
  color: #012643 !important;
  transition: background 0.2s, color 0.2s;
  text-shadow: none;
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
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 0;
  pointer-events: none;
  backdrop-filter: blur(3px); /* <-- Adiciona o efeito de blur */
  -webkit-backdrop-filter: blur(3px); /* Suporte para Safari */
}

/* Garante que o conteúdo direto (logo, menu-box) fique acima do ::before */
.logo-jogo,
.menu-box {
  position: relative;
  z-index: 1;
}

/* --- NOVO: Estilos para o vídeo de introdução --- */
.intro-video-container {
  position: fixed; /* Garante que cobre toda a tela */
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.95);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.intro-video {
  width: 100vw;
  height: 100vh;
  object-fit: cover; /* Faz o vídeo cobrir toda a tela */
  border-radius: 0;
  box-shadow: none;
}

.skip-btn {
  position: fixed;
  right: 40px;
  bottom: 40px;
  margin: 0;
  padding: 16px 36px;
  font-family: 'Press Start 2P', cursive, sans-serif;
  background: #5ae8ec;
  color: #012643;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  box-shadow: 2px 2px 0 #000;
  transition: background 0.2s, color 0.2s;
  z-index: 101;
}
.skip-btn:hover {
  background: #012643;
  color: #5ae8ec;
}

/* --- NOVO: Estilos para a imagem de introdução --- */
.intro-image-container {
  position: fixed; /* Garante que cobre toda a tela */
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.95);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.intro-image {
  max-width: 90vw;
  height: 98%;
  border-radius: 0;
  box-shadow: none;
}

.continue-btn {
  margin-top: 24px;
  padding: 12px 24px;
  font-family: 'Press Start 2P', cursive, sans-serif;
  background: #5ae8ec;
  color: #012643;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  box-shadow: 2px 2px 0 #000;
  transition: background 0.2s, color 0.2s;
  z-index: 101;
}
.continue-btn:hover {
  background: #012643;
  color: #5ae8ec;
}
</style>

