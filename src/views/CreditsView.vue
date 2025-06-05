<template>
  <!-- src/views/CreditsView.vue -->
  <!-- View (página) que exibe a lista de perfis dos créditos. -->
  <!-- Utiliza scroll snap para navegação entre os perfis. -->

  <!-- Container principal para os perfis com scroll snap -->
  <!-- A classe `credits-scroll-container` vem do src/index.css -->
  <div class="credits-scroll-container">
    <BackButton />
    
  <!-- Botão Voltar -->
  <!-- Importamos e usamos o componente BackButton que criamos. -->
    <!-- Loop através da lista de perfis -->
    <!-- `v-for` itera sobre o array `profiles` definido no script. -->
    <!-- `:key` é essencial para o Vue identificar cada item unicamente. -->
    <!-- `:profile` passa o objeto de perfil atual como prop para o componente CreditProfile. -->
    <!-- `:reverseLayout` alterna o layout (imagem esquerda/direita) baseado no índice (par/ímpar). -->
    <CreditProfile
      v-for="(profile, index) in profiles"
      :key="profile.id" 
      :profile="profile"
      :reverseLayout="index % 2 !== 0" 
    />
  </div>
</template>

<script setup>
// Importações do Vue e componentes
import { ref } from 'vue';
import BackButton from '@/components/BackButton.vue'; // Importa o botão Voltar
import CreditProfile from '@/components/CreditProfile.vue'; // Importa o componente de perfil

// Dados dos perfis - idealmente viriam de uma API ou arquivo de configuração,
// mas para este exemplo, definimos diretamente aqui.
const profiles = ref([
  {
    id: 1,
    name: "Henrique\nIkeda",
    imageName: "minha ft.jpg", // Nome exato do arquivo em src/assets/img/
    githubUrl: "https://github.com/Henrique-Ikeda",
    linkedinUrl: "https://www.linkedin.com/in/henrique-ikeda-/",
  },
  {
    id: 2,
    name: "Breno\nNosima",
    imageName: "breno.jpeg",
    githubUrl: "https://github.com/BrenoNosima",
    linkedinUrl: "https://www.linkedin.com/in/brenonosima/",
  },
  {
    id: 3,
    name: "Felipe\nGaleti",
    imageName: "felipe_cabeca.jpeg",
    githubUrl: "https://github.com/FGaleti",
    linkedinUrl: "https://www.linkedin.com/in/felipe-galeti-g%C3%B4ngora-023b37301/",
  },
  {
    id: 4,
    // Corrigindo o nome conforme o comentário no HTML original (Calos -> Carlos)
    name: "Carlos\nEduardo", 
    imageName: "cadu.jpg",
    githubUrl: "https://github.com/CaduCarfi",
    linkedinUrl: "https://www.linkedin.com/in/carlos-eduardo-carfi-1994032ab/",
  },
  {
    id: 5,
    // Corrigindo o nome conforme o comentário no HTML original (Zica -> Bezerra?)
    // Mantendo "Zica" por enquanto, conforme o código original.
    name: "Leonardo\nZica", 
    imageName: "leo.jpeg",
    githubUrl: "https://github.com/H4ttiz",
    linkedinUrl: "https://www.linkedin.com/in/leonardo-bezerra-da-silva-2507a92bb/",
  },
  {
    id: 6,
    name: "Thiago\nChapecó",
    imageName: "thiago.jpg",
    githubUrl: "https://github.com/ThiagoCHAPECO",
    linkedinUrl: "https://www.linkedin.com/in/thiago-gimenes-090b352ab/",
  },
]);

// Nenhuma lógica adicional necessária nesta view, pois a complexidade
// está nos componentes filhos (CreditProfile, BackButton).

</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap");

/* Estilos específicos para CreditsView.vue */

/* O container principal já tem estilos globais para scroll snap */
/* Podemos adicionar outros estilos específicos aqui se necessário */
  
/* Garante que o container ocupe toda a altura e largura */
.credits-scroll-container {
  height: 100vh;
  width: 100vw;
  overflow-x: hidden; /* Evita scroll horizontal */
  /* A cor de fundo é definida pela classe Tailwind bg-retro-brown */
}

body {
  font-family: 'Press Start 2P', cursive, sans-serif;
}
</style>

