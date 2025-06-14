import Enemy from './Enemy';

export default class Moreno extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'moreno-idle', {
            animPrefix: 'Moreno',
            health: 500,         // Vida máxima personalizada
            speed: 400,          // Velocidade personalizada
            attackDamage: 0     // Dano personalizado
        });
        // Se quiser adicionar mais propriedades ou lógica específica, faça aqui
    }

    // Se quiser IA ou ataque especial, sobrescreva métodos aqui
    // Exemplo:
    // attack(player) {
    //     super.attack(player);
    //     // Lógica extra para o Moreno
    // }
} 