import Enemy from './Enemy';

export default class Cidao extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'cidao-idle', {
            animPrefix: 'cidao',
            health: 420,         // Vida máxima personalizada
            speed: 380,          // Velocidade personalizada
            attackDamage: 16     // Dano personalizado
        });
        // Adicione lógica ou propriedades específicas do Cidão aqui, se necessário
    }

    // Exemplo de override de ataque:
    // attack(player) {
    //     super.attack(player);
    //     // Lógica extra para o Cidão
    // }
}