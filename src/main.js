import { createApp } from 'vue';
import App from './App.vue'; // Corrigido: App.vue está na raiz de src

// Importar estilos globais, se necessário (já importados em App.vue)
// import './assets/main.css';

const app = createApp(App);

// Montar a aplicação no elemento com id 'app' definido em index.html
app.mount('#app');

