import Enemy from './Enemy';

export default class Hugo extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'hugo-idle', {
            animPrefix: 'hugo',
            health: 370,         // Vida máxima personalizada
            speed: 420,          // Velocidade personalizada
            attackDamage: 14     // Dano personalizado
        });
        // Adicione lógica ou propriedades específicas do Hugo aqui, se necessário
    }

    // Exemplo de override de ataque:
    // attack(player) {
    //     super.attack(player);
    //     // Lógica extra para o Hugo
    // }
}