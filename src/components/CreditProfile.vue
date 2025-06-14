<template>
  <!-- src/components/CreditProfile.vue -->
  <!-- Componente para exibir uma seção de perfil individual nos créditos. -->
  <!-- Recebe dados do perfil via props e aplica layout alternado. -->

  <!-- A classe :class aplica 'reverse' condicionalmente baseado na prop 'reverseLayout' -->
  <!-- A classe 'credits-section' vem do CSS global (src/index.css) para scroll snap -->
  <div class="credits-section section flex flex-col md:flex-row" :class="{ reverse: reverseLayout }" ref="profileSection">
    <!-- Coluna de Informações (Nome, Botões Sociais) -->
    <div class="info flex-1 flex flex-col justify-center items-center p-6 md:p-10 text-center">
      <!-- Título (Nome) com efeito de máquina de escrever -->
      <!-- O span interno é o alvo da animação -->
      <h1 class="mb-6 md:mb-8">
        <span class="typewriter-target font-press-start text-2xl sm:text-3xl md:text-4xl whitespace-pre-line leading-tight block" :style="{ textShadow: '2px 2px 0 #000, 4px 4px 0 #333, 0 0 8px #000' }">
          <!-- O texto será preenchido pela função typewriter -->
        </span>
      </h1>

      <!-- Botões de Redes Sociais -->
      <div class="flex flex-col items-center space-y-4">
        <a :href="profile.githubUrl" target="_blank" class="btn-social">
          GitHub
        </a>
        <a :href="profile.linkedinUrl" target="_blank" class="btn-social">
          LinkedIn
        </a>
      </div>
    </div>

    <!-- Coluna da Imagem -->
    <div class="image flex-1 overflow-hidden h-1/2 md:h-full">
      <!-- Usamos :src para a imagem e :alt para acessibilidade -->
      <img :src="getImageUrl(profile.imageName)" :alt="profile.name.replace('\n', ' ')" class="w-full h-full object-cover" />
    </div>
  </div>
</template>

<script setup>
// Importações do Vue
import { defineProps, ref, onMounted, onUnmounted } from 'vue';

// Define as props que o componente espera receber do pai (CreditsView)
const props = defineProps({
  profile: {
    type: Object,
    required: true, // Objeto contendo os dados do perfil (name, imageName, githubUrl, linkedinUrl)
  },
  reverseLayout: {
    type: Boolean,
    default: false, // Controla se o layout é invertido (imagem à esquerda)
  },
});

// Referência para o elemento raiz da seção do perfil (usado pelo IntersectionObserver)
const profileSection = ref(null);
// Referência para o span onde o texto será digitado
const typewriterTarget = ref(null);
// Estado para controlar se a animação já foi executada
const hasTyped = ref(false);
let observer = null;

// Função para simular o efeito de máquina de escrever
const typewriter = (element, text, delay = 75) => {
  if (!element || hasTyped.value) return; // Não executa se já digitou ou o elemento não existe
  hasTyped.value = true; // Marca que a animação começou
  let i = 0;
  element.textContent = ""; // Limpa o conteúdo inicial
  const type = () => {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, delay);
    }
  };
  type();
};

// Função auxiliar para obter a URL completa da imagem na pasta assets
// Vite trata caminhos relativos em `src` automaticamente.
// Se as imagens estiverem em `public`, o caminho seria diferente.
const getImageUrl = (name) => {
  // Assume que as imagens estão em src/assets/img/
  // A estrutura `new URL(..., import.meta.url)` é a forma padrão do Vite para resolver assets dinâmicos.
  try {
    return new URL(`../assets/img/${name}`, import.meta.url).href;
  } catch (e) {
    console.error(`Erro ao carregar imagem: ${name}`, e);
    return ''; // Retorna string vazia ou uma imagem placeholder em caso de erro
  }
};

// Configura o IntersectionObserver quando o componente é montado
onMounted(() => {
  // Encontra o elemento span dentro do componente montado
  typewriterTarget.value = profileSection.value.querySelector('.typewriter-target');

  const options = {
    root: null, // Observa intersecção com o viewport
    rootMargin: '0px',
    threshold: 0.5, // Ativa quando 50% do elemento está visível
  };

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // Se a seção do perfil está visível e a animação ainda não rodou
      if (entry.isIntersecting && !hasTyped.value) {
        // Chama a função typewriter com o nome do perfil (substituindo \n por newline real)
        typewriter(typewriterTarget.value, props.profile.name.replace(/\\n/g, '\n'));
        // Opcional: Desconectar o observer após a animação para otimizar
        // observer.unobserve(entry.target);
      }
    });
  }, options);

  // Começa a observar o elemento da seção do perfil
  if (profileSection.value) {
    observer.observe(profileSection.value);
  }
});

// Limpa o observer quando o componente é desmontado para evitar memory leaks
onUnmounted(() => {
  if (observer && profileSection.value) {
    observer.unobserve(profileSection.value);
  }
});

</script>

<style scoped>
/* Estilos específicos para CreditProfile.vue */

.section {
  /* O height e scroll-snap-align vêm do CSS global (.credits-section) */
  /* Garante que as seções tenham altura total */
  height: 100vh;
}

.section.reverse {
  /* Inverte a ordem das colunas em telas maiores (md:) */
  @media (min-width: 768px) {
    flex-direction: row-reverse;
  }
}

/* Estilos para os botões sociais (adaptados do creditos.html) */
.btn-social {
  display: inline-block;
  font-family: 'Press Start 2P', cursive, sans-serif;
  font-size: 1rem; /* Ajustado para consistência */
  padding: 12px 28px; /* Ajustado */
  margin-top: 16px;
  background: #202834;
  color: #fff;
  border: 3px solid #fff;
  border-radius: 14px;
  box-shadow: 2px 2px 0 #000, 4px 4px 0 #333;
  text-align: center;
  transition: background 0.2s, color 0.2s;
  text-shadow: 2px 2px 0 #000;
  text-decoration: none;
  width: 200px; /* Ajustado */
  max-width: 100%;
}

.btn-social:hover {
  background-color: #5ae8ec;
  color: #012643;
  text-shadow: none;
}

.info{
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 0rem;
  /* Fundo infinito com a imagem */
  background-image: url('@/assets/img/ChatGPT Image 13 de jun. de 2025, 23_42_06.png');
  background-position: center;
}

/* Ajustes responsivos */
@media (max-width: 768px) {
  .section {
    flex-direction: column; /* Empilha verticalmente em telas menores */
  }
  .section.reverse {
     flex-direction: column; /* Mantém empilhado */
  }
  .info {
    height: 50%; /* Divide a altura */
    padding: 20px;
  }
  .image {
    height: 50%; /* Divide a altura */
  }
  .info h1 span {
    font-size: 1.8rem; /* Reduz tamanho da fonte do nome */
  }
  .btn-social {
    font-size: 0.9rem;
    padding: 10px 20px;
    width: 180px;
  }
}

@media (max-width: 480px) {
   .info h1 span {
    font-size: 1.5rem;
  }
}
</style>

