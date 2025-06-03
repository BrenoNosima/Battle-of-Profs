import Phaser from 'phaser';

export default class HealthBar {
    constructor(scene, x, y, width, height, color, side = 'left') {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.bgColor = 0xffffff; // fundo branco
        this.value = 100;
        this.maxValue = 100;
        this.roundsWon = 0;
        this.side = side; // 'left' ou 'right'

        // Elementos gráficos
        this.bgGraphics = scene.add.graphics();
        this.barGraphics = scene.add.graphics();
        this.roundCircles = [
            scene.add.graphics(),
            scene.add.graphics()
        ];

        this.setPosition(x, y);
        this.draw();

        console.log("HealthBar criada:", side, x, y);
    }

    draw() {
        this.bgGraphics.clear();
        this.barGraphics.clear();
        this.roundCircles.forEach(g => g.clear());

        // Parâmetros
        const radius = 14;
        const spacing = 10;
        const padding = 6;

        const fullWidth = this.width + (radius * 5 + spacing * 5); // espaço para as bolinhas

        // Fundo branco com borda arredondada
        this.bgGraphics.fillStyle(this.bgColor, 1);
        this.bgGraphics.fillRoundedRect(
            -fullWidth / 1.67,
            -this.height / 2 - padding,
            fullWidth, 
            this.height + padding * 2,
            12
        );

        // Barra de vida (com largura proporcional)

       this.barGraphics.fillStyle(0x999999, 1); // cinza
       this.barGraphics.fillRect(
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
       );

        const percentage = this.value / this.maxValue;
        const barWidth = Math.max(0, this.width * percentage);

        this.barGraphics.fillStyle(this.color, 1);
        this.barGraphics.fillRoundedRect(-this.width / 2, -this.height / 2, barWidth, this.height, 1);

        // Bolinhas de rounds
        const offsetY = 0;
        const yPos = offsetY;

        this.roundCircles.forEach((circle, index) => {
            let cx;
            if (this.side === 'left') {
                cx = this.width / 2 + spacing + index * (radius * 2 + spacing);
            } else {
                cx = -this.width / 2 - (radius * 2 + spacing) + index * -(radius * 1.5 + spacing);
            }

            const color = index < this.roundsWon ? 0x000000 : 0xaaaaaa;
            circle.fillStyle(color, 1);
            circle.fillCircle(cx, yPos, radius);
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
