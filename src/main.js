/**
 * main.js
 * 
 * Ponto de entrada da aplicação Vue.
 * Configura e inicializa a aplicação Vue com o componente App.
 */

import { createApp } from 'vue';
import App from './components/App.vue';

// Importar estilos globais se necessário
// import './assets/styles.css';

// Criar e montar a aplicação Vue
const app = createApp(App);

// Registrar plugins globais se necessário
// app.use(plugin);

// Montar a aplicação no elemento com id 'app'
app.mount('#app');

// Exportar a instância do app para uso em outros arquivos se necessário
export default app;
