/**
 * Configurações das lutas do jogo
 * Cada objeto representa uma fase com:
 * - name: Nome da luta (opcional, para debug)
 * - background: Imagem de fundo (usará a mesma para todas as fases se não especificado)
 * - player: Classe do personagem do jogador
 * - enemy: Classe do personagem inimigo
 * - playerSprites: Configuração das sprites do jogador
 * - enemySprites: Configuração das sprites do inimigo
 */

// Configuração compartilhada

const playerSpritesConfig = {
    idle: { path: '/sprite/player/playerParado.png', frameWidth: 70, frameHeight: 110, frames: 1 },
    walk: { path: '/sprite/player/playerAndando.png', frameWidth: 66.5, frameHeight: 110, frames: 5 },
    attack: { path: '/sprite/player/playerAtaque.png', frameWidth: 87.5, frameHeight: 110, frames: 4 },
    block: { path: '/sprite/player/playerDefendendo.png', frameWidth: 118, frameHeight: 115, frames: 1 },
    jump: { path: '/sprite/player/playerPulando.png', frameWidth: 75, frameHeight: 110, frames: 1 },
    dash: { path: '/sprite/player/playerDash.png', frameWidth: 162, frameHeight: 90, frames: 1 }
};

export default [
    {
        name: "Fase 1: Breno vs Moreno",
        background: 'menu.png', // Usando uma imagem de fundo compartilhada
        player: 'Player',
        enemy: 'Moreno',
        playerSprites: playerSpritesConfig,
        enemySprites: {
            idle: {path: '/sprite/Moreno/morenoParado.png', frameWidth: 80, frameHeight: 110, frames: 1},
            walk: {path: '/sprite/Moreno/morenoAndando.png', frameWidth: 73, frameHeight: 110, frames: 4},
            attack: {path: '/sprite/Moreno/morenoAtaque.png',frameWidth: 83.3, frameHeight: 110, frames: 4},
            special: {path: '/sprite/Moreno/morenoAtaqueEspecial.png',frameWidth: 160, frameHeight: 100, frames: 4},
            jump: {path: '/sprite/Moreno/morenoPulando.png', frameWidth: 80, frameHeight: 110, frames: 1},
        },
        enemyConfig: {
            // Configurações específicas do Moreno
            health: 100,
            speed: 200,
            attackDamage: 8
        }
    },
    {
        name: "Fase 2: Breno vs Cidão",
        background: 'bloco8.png',
        player: 'Player',
        enemy: 'Cidao',
        playerSprites: playerSpritesConfig,
        enemySprites: {
            idle: {path: '/sprite/cidao/cidaoParado.png', frameWidth: 67, frameHeight: 100, frames: 1},
            walk: {path: '/sprite/cidao/cidaoAndando.png',frameWidth: 55, frameHeight: 100, frames: 4},
            attack: {path: '/sprite/cidao/cidaoAtaque.png',frameWidth: 77, frameHeight: 90, frames: 4},
            special: {path: '/sprite/cidao/cidaoAtaqueEspecial.png',frameWidth: 80, frameHeight: 90, frames: 1},
            jump: {path: '/sprite/cidao/cidaoPulando.png', frameWidth: 80, frameHeight: 100, frames: 1},
        },
        enemyConfig: {
            // Configurações específicas do Cidão
            health: 120,
            speed: 180,
            attackDamage: 10
        }
    },
    {
        name: "Fase 3: Breno vs Hugo",
        background: 'inspira-space.png',
        player: 'Player',
        enemy: 'Hugo',
        playerSprites: playerSpritesConfig,
        enemySprites: {
            idle: { path: '/sprite/hugo/hugoParado.png', frameWidth: 85, frameHeight: 125, frames: 1 },
            walk: { path: '/sprite/hugo/hugoAndando.png', frameWidth: 72.5, frameHeight: 110, frames: 4 },
            attack: { path: '/sprite/hugo/hugoAtaque.png', frameWidth: 77.5, frameHeight: 115, frames: 4 },
            special: { path: '/sprite/hugo/hugoAtaqueEspecial.png', frameWidth: 160, frameHeight: 122, frames: 4 },
            jump: { path: '/sprite/hugo/hugoPulando.png', frameWidth: 97, frameHeight: 120, frames: 1 }
        },
        enemyConfig: {
            // Configurações específicas do Hugo
            health: 150,
            speed: 160,
            attackDamage: 12
        }
    },
    {
        name: "Fase Final: Parabéns!",
        background: 'final.png', // coloque uma imagem de fundo comemorativa
        music: 'music.mp3', // música de finalização
        player: null,
        enemy: null,
        playerSprites: null,
        enemySprites: null,
        enemyConfig: null
    }
];