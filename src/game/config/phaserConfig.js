import Phaser from 'phaser';
import PreloadScene from '@/game/scenes/PreloadScene'; // Ajuste o caminho se necessário
import FightScene from '@/game/scenes/FightScene'; // Ajuste o caminho se necessário

// Configuração base do Phaser
const phaserConfig = {
  type: Phaser.AUTO, // Ou Phaser.CANVAS, Phaser.WEBGL
  width: window.innerWidth, // Largura inicial, será ajustada
  height: window.innerHeight, // Altura inicial, será ajustada
  parent: 'phaser-game-container', // ID do elemento DOM onde o jogo será renderizado
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600 },
      // debug: process.env.NODE_ENV === 'development' // Habilitar debug em desenvolvimento
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE, // Redimensiona o jogo com a janela
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    PreloadScene, // Cena para carregar assets
    FightScene    // Cena principal do jogo
  ],
  // Adicione aqui outras configurações globais se necessário
  // Ex: backgroundColor: '#2d2d2d'
};

export default phaserConfig;

