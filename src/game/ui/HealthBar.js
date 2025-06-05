import Phaser from 'phaser';

export default class HealthBar {
    constructor(scene, x, y, width, height, color) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = 600;
        this.height = 50;
        this.color = color;
        this.bgColor = 0xffffff; // fundo branco
        this.value = 100;
        this.maxValue = 100;
        this.roundsWon = 0;

        this.paddingTop = 20;

        // Elementos gráficos
        this.bgGraphics = scene.add.graphics();
        this.barGraphics = scene.add.graphics();
        this.roundCircles = [scene.add.graphics(), scene.add.graphics()]; // duas bolinhas

        this.setPosition(x, y);
        this.draw();

        console.log("HealthBar criada:", x, y);
    }

    draw() {
        this.bgGraphics.clear();
        this.barGraphics.clear();
        this.roundCircles.forEach(c => c.clear());

        const padding = 6;
        const offsetY = this.paddingTop;

        // Fundo branco com borda arredondada
        this.bgGraphics.fillStyle(this.bgColor, 1);
        this.bgGraphics.fillRoundedRect(
            -this.width / 2 - padding,
            -this.height / 2 - padding + offsetY,
            this.width + padding * 2,
            this.height + padding * 2,
            12
        );

        // Barra de vida (cinza de fundo)
        this.barGraphics.fillStyle(0x999999, 1);
        this.barGraphics.fillRect(
            -this.width / 2,
            -this.height / 2 + offsetY,
            this.width,
            this.height
        );

        // Barra de vida (colorida conforme valor atual)
        const percentage = this.value / this.maxValue;
        const barWidth = Math.max(0, this.width * percentage);

        this.barGraphics.fillStyle(this.color, 1);
        this.barGraphics.fillRoundedRect(
            -this.width / 2,
            -this.height / 2 + offsetY,
            barWidth,
            this.height,
            1
        );

        // Desenhar bolinhas de rounds
        const radius = 14;
        const spacing = 10;

        this.roundCircles.forEach((circle, index) => {
            const cx = -radius - spacing / 2 + index * (radius * 2 + spacing);
            const cy = -this.height / 2 + offsetY - radius * 2; // acima da barra de vida

            const color = index < this.roundsWon ? 0x000000 : 0xaaaaaa;

            circle.fillStyle(color, 1);
            circle.fillCircle(cx, cy, radius);
        });

        
    }

    setValue(newValue) {
        this.value = Phaser.Math.Clamp(newValue, 0, this.maxValue);
        this.draw();
    }

    setMaxValue(newMaxValue) {
        this.maxValue = newMaxValue;
        this.draw();
    }

    setRoundsWon(rounds) {
        this.roundsWon = Phaser.Math.Clamp(rounds, 0, 2);
        this.draw();
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;

        this.bgGraphics.setPosition(x, y);
        this.barGraphics.setPosition(x, y);
        this.roundCircles.forEach(c => c.setPosition(x, y));
    }

    getGraphics() {
        return [
            this.bgGraphics,
            this.barGraphics,
            ...this.roundCircles
        ];
    }

    destroy() {
        this.bgGraphics.destroy();
        this.barGraphics.destroy();
        this.roundCircles.forEach(c => c.destroy());
    }

}
