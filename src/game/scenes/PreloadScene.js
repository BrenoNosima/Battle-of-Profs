import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    console.log('PreloadScene: preload');

    // Exibir barra de progresso (opcional, mas recomendado)
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Carregando...', // Loading...
      style: {
        font: '20px monospace',
        fill: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: '0%',
      style: {
        font: '18px monospace',
        fill: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);

    const assetText = this.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: '',
      style: {
        font: '18px monospace',
        fill: '#ffffff'
      }
    });
    assetText.setOrigin(0.5, 0.5);

    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);

    this.load.on('progress', (value) => {
      percentText.setText(parseInt(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0x00fff7, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
    });

    this.load.on('fileprogress', (file) => {
      assetText.setText('Carregando asset: ' + file.key); // Loading asset:
    });

    this.load.on('complete', () => {
      console.log('PreloadScene: complete');
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
      this.scene.start('FightScene'); // Inicia a cena principal após o preload
    });

    // --- Carregamento de Assets --- 
    // (Movido da função preload original)

    // Carregar sprites do jogador
    this.load.spritesheet('player', 'sprite/sprite.png', { frameWidth: 235, frameHeight: 350 });

    // Carregar sprites do inimigo (usando o mesmo sprite mas com tint diferente)
    this.load.spritesheet('enemy', 'sprite/sprite.png', { frameWidth: 235, frameHeight: 350 });

    // Carregar background
    // Usar try-catch não é ideal no preload, o Phaser lida com erros.
    // Se o arquivo não existir, o Phaser emitirá um erro no console.
    this.load.image('background', 'backgrounds/menu.png');
    console.log('Tentando carregar background: backgrounds/menu.png');

    // Carregar plataforma invisível (usando um retângulo transparente em vez de data URI)
    // Criaremos isso dinamicamente na FightScene se necessário, ou usamos um asset simples.
    // this.load.image('platform', 'path/to/transparent_pixel.png'); // Exemplo
    // Por enquanto, vamos omitir o carregamento da plataforma aqui, pois ela era gerada via data URI.
    // A FightScene pode criar um retângulo físico invisível.

    // Carregar outros assets se houver (sons, fontes, etc.)
    // Exemplo: this.load.audio('punchSound', 'sounds/punch.wav');
  }

  create() {
    // O create da PreloadScene geralmente é vazio ou contém configurações iniciais mínimas.
    // A lógica principal de criação do jogo vai para a FightScene.
    console.log('PreloadScene: create');
    // Poderia iniciar a próxima cena aqui também, mas 'complete' do load é mais seguro.
    // this.scene.start('FightScene');
  }
}

