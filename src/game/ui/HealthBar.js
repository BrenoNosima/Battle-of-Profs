import Phaser from 'phaser';

export default class HealthBar {
    constructor(scene, x, y, width, height, color, bgColor) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.bgColor = bgColor;
        this.value = 100; // Default to full health
        this.maxValue = 100;

        // Create the graphics objects
        this.bgGraphics = this.scene.add.graphics();
        this.barGraphics = this.scene.add.graphics();

        // Set initial position (relative to the container it will be added to)
        this.bgGraphics.x = this.x;
        this.bgGraphics.y = this.y;
        this.barGraphics.x = this.x;
        this.barGraphics.y = this.y;

        this.draw();

        console.log("HealthBar: Barra de vida criada em", x, y);
    }

    draw() {
        // Clear previous drawings
        this.bgGraphics.clear();
        this.barGraphics.clear();

        // Draw background
        this.bgGraphics.fillStyle(this.bgColor, 0.8);
        // Draw relative to the graphics object's position (which is set by the container)
        // Use setOrigin(0.5, 0.5) equivalent by drawing around the center point (0,0)
        this.bgGraphics.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Draw foreground bar
        const percentage = this.value / this.maxValue;
        const barWidth = Math.max(0, this.width * percentage); // Ensure width is not negative

        this.barGraphics.fillStyle(this.color, 1);
        // Draw relative to the graphics object's position, aligning left within the background space
        this.barGraphics.fillRect(-this.width / 2, -this.height / 2, barWidth, this.height);
    }

    setValue(newValue) {
        this.value = Phaser.Math.Clamp(newValue, 0, this.maxValue);
        this.draw(); // Redraw when value changes
    }

    setMaxValue(newMaxValue) {
        this.maxValue = newMaxValue;
        this.draw(); // Redraw if max value changes
    }

    // Method to get the graphics objects to add them to a container
    getGraphics() {
        return [this.bgGraphics, this.barGraphics];
    }

    // Method to update position if needed (e.g., on resize)
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.bgGraphics.setPosition(x, y);
        this.barGraphics.setPosition(x, y);
        // No need to redraw unless size/value changes
    }

    destroy() {
        this.bgGraphics.destroy();
        this.barGraphics.destroy();
    }
}

