export default class RoundTransition {
  constructor(scene) {
    this.scene = scene;

    // Cria o container da transição, invisível no começo
    this.container = this.scene.add.container(0, 0).setDepth(100).setVisible(false);

    // Tela preta translúcida para escurecer o fundo
    this.background = this.scene.add.rectangle(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0x000000,
      0.7
    );
    this.container.add(this.background);

    // Texto central da mensagem
    this.text = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      '',
      {
        fontSize: '48px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
        fontFamily: 'Arial',
        align: 'center',
      }
    ).setOrigin(0.5);
    this.container.add(this.text);
  }

  /**
   * Mostra a transição com uma mensagem e executa um callback após a transição.
   * @param {string} message - Mensagem a ser exibida.
   * @param {number} duration - Duração em milissegundos da exibição da mensagem.
   * @param {Function} [onComplete] - Função a ser executada após a transição.
   */
  async show(message, duration = 2000, onComplete) {
    this.text.setText(message);
    this.container.setVisible(true);
    this.container.alpha = 0;

    // Fade in
    await this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 500,
      ease: 'Power2',
    }).play().promise;

    // Espera pela duração da mensagem
    await new Promise(resolve => this.scene.time.delayedCall(duration, resolve));

    // Fade out
    await this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
    }).play().promise;

    this.container.setVisible(false);

    // Executa o callback, se existir
    if (onComplete && typeof onComplete === 'function') {
      onComplete();
    }
  }
}