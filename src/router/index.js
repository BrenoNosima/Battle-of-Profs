// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';

// Importa as Views (componentes de página) que serão usadas nas rotas.
// Usaremos importações dinâmicas (lazy loading) para otimizar o carregamento inicial.
// Isso significa que o código de cada view só será baixado quando a rota for acessada pela primeira vez.
const MenuView = () => import('@/views/MenuView.vue');
const CreditsView = () => import('@/views/CreditsView.vue');
const GameContainer = () => import('@/views/GameContainer.vue'); // Adicione esta linha

// Define as rotas da aplicação.
// Cada objeto de rota mapeia um caminho (path) para um componente (component).
const routes = [
  {
    path: '/', // Caminho da rota raiz (página inicial)
    name: 'Menu', // Nome da rota (opcional, mas útil para navegação programática)
    component: MenuView, // Componente que será renderizado para esta rota
  },
  {
    path: '/credits', // Caminho para a página de créditos
    name: 'Credits',
    component: CreditsView,
  },
  {
    path: '/game', // Adicione esta rota
    name: 'Game',
    component: GameContainer,
  }
];

// Cria a instância do roteador.
const router = createRouter({
  // history: Define o modo de histórico. createWebHistory() usa a API de histórico do HTML5 (URLs limpas).
  // import.meta.env.BASE_URL é importante para funcionar corretamente em diferentes base paths (ex: em subdiretórios).
  history: createWebHistory(import.meta.env.BASE_URL),
  // routes: A configuração das rotas que definimos acima.
  routes,
});

// Exporta a instância do roteador para ser usada no arquivo principal (main.js).
export default router;

