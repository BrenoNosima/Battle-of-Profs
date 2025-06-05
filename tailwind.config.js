// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  // Especifica os arquivos onde o Tailwind deve procurar por classes CSS.
  // Incluímos arquivos .vue, .js, .html para garantir que todas as classes usadas sejam detectadas.
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}", // Abrange todos os arquivos relevantes dentro de src
  ],
  theme: {
    extend: {
      // Aqui podemos estender o tema padrão do Tailwind.
      // Por exemplo, adicionar fontes customizadas, cores, etc.
      fontFamily: {
        // Adiciona a fonte 'Press Start 2P' que estava no HTML original.
        // O nome 'sans' geralmente é usado para a fonte padrão, mas podemos usar um nome específico.
        // Precisaremos importar essa fonte no CSS ou no index.html.
        'press-start': ['"Press Start 2P"', 'cursive'],
      },
      // Adiciona cores customizadas se necessário, ou outras extensões.
      colors: {
        'retro-yellow': '#facc15', // Cor amarela usada nos hovers
        'retro-brown': '#9e7640', // Cor de fundo dos créditos
        'retro-dark-brown': '#451d08', // Cor dos links nos créditos
        'retro-title-brown': '#9e3712', // Cor do título nos créditos
        'retro-menu-bg': 'rgba(85, 77, 39, 0.85)', // Fundo do menu com opacidade
        'retro-menu-item-bg': '#27272a', // Fundo dos itens de menu
      }
    },
  },
  plugins: [],
}

