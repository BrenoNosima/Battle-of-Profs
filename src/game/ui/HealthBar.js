import Phaser from 'phaser';

export default class HealthBar {
    constructor(scene, x, y, width, height, color, isPlayer) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width || 400; // Largura reduzida para deixar espaço para o VS
        this.height = height || 30;
        this.color = color;
        this.bgColor = 0x333333; // Fundo mais escuro
        this.value = 100;
        this.maxValue = 100;
        this.roundsWon = 0;
        this.isPlayer = isPlayer; // Para posicionar os rounds corretamente

        // Elementos gráficos
        this.bgGraphics = scene.add.graphics();
        this.barGraphics = scene.add.graphics();
        this.roundIndicators = [];
        
        // Texto de round (bolinhas)
        for (let i = 0; i < 2; i++) {
            this.roundIndicators.push(scene.add.graphics());
        }

        // Efeitos visuais
        this.damageEffect = scene.add.graphics();
        this.damageEffect.setAlpha(0);

        this.setPosition(x, y);
        this.draw();
    }

    draw() {
        // Limpa todos os gráficos
        this.bgGraphics.clear();
        this.barGraphics.clear();
        this.roundIndicators.forEach(ind => ind.clear());
        this.damageEffect.clear();

        // Desenha o fundo da barra
        this.bgGraphics.fillStyle(this.bgColor, 0.8);
        this.bgGraphics.fillRoundedRect(
            -this.width / 2 - 4,
            -this.height / 2 - 4,
            this.width + 8,
            this.height + 8,
            16
        );

        // Barra de fundo (cinza)
        this.barGraphics.fillStyle(0x555555, 1);
        this.barGraphics.fillRoundedRect(
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height,
            12
        );

        // Barra de vida atual
        const percentage = this.value / this.maxValue;
        const barWidth = Math.max(0, this.width * percentage);

        this.barGraphics.fillStyle(this.color, 1);
        this.barGraphics.fillRoundedRect(
            -this.width / 2,
            -this.height / 2,
            barWidth,
            this.height,
            1
        );

        // Efeito de dano (vermelho piscante)
        if (this.value < this.maxValue) {
            this.barGraphics.fillStyle(0x000000, 0.3);
            this.barGraphics.fillRoundedRect(
            -this.width / 0 + barWidth,
            -this.height / 0,
            this.width - barWidth,
            this.height,
            20
            );
        }

        // Indicadores de round (bolinhas)
        const circleRadius = 10;
        const circleSpacing = 15;
        const circleY = -this.height - 15; // Posição acima da barra

        this.roundIndicators.forEach((circle, index) => {
            const circleX = (this.isPlayer ? -1 : 1) * 
                          (this.width/2 - circleRadius - index * (circleRadius*2 + circleSpacing));
            
            const fillColor = index < this.roundsWon ? this.color : 0x666666;
            const lineColor = index < this.roundsWon ? 0xffffff : 0x999999;

            circle.fillStyle(fillColor, 1);
            circle.fillCircle(circleX, circleY, circleRadius);
            circle.lineStyle(2, lineColor, 1);
            circle.strokeCircle(circleX, circleY, circleRadius);
        });

        // Adiciona efeito de brilho quando a vida está cheia
        if (this.value === this.maxValue) {
            this.barGraphics.fillStyle(0xffffff, 0.2);
            this.barGraphics.fillRoundedRect(
                -this.width / 2 + barWidth - 30,
                -this.height / 2,
                30,
                this.height,
                12
            );
        }
    }

    setValue(newValue) {
        // Efeito visual ao receber dano
        if (newValue < this.value) {
            this.scene.tweens.add({
                targets: this.damageEffect,
                alpha: 0.8,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    this.damageEffect.setAlpha(0);
                }
            });
        }

        this.value = Phaser.Math.Clamp(newValue, 0, this.maxValue);
        this.draw();
    }

    setMaxValue(newMaxValue) {
        this.maxValue = newMaxValue;
        this.draw();
    }

    setRoundsWon(rounds) {
        this.roundsWon = Phaser.Math.Clamp(rounds, 0, 2);
        
        // Efeito ao ganhar um round
        if (rounds > this.roundsWon) {
            this.scene.tweens.add({
                targets: this.roundIndicators[rounds-1],
                scale: { from: 1, to: 1.5 },
                duration: 300,
                yoyo: true
            });
        }
        
        this.draw();
    }
        
    setPosition(x, y) {
        this.x = x;
        this.y = y;

        this.bgGraphics.setPosition(x, y);
        this.barGraphics.setPosition(x, y);
        this.damageEffect.setPosition(x, y);
        this.roundIndicators.forEach(ind => ind.setPosition(x, y));
    }

    getGraphics() {
        return [
            this.bgGraphics,
            this.barGraphics,
            this.damageEffect,
            ...this.roundIndicators
        ];
    }

    destroy() {
        this.bgGraphics.destroy();
        this.barGraphics.destroy();
        this.damageEffect.destroy();
        this.roundIndicators.forEach(ind => ind.destroy());
    }
}