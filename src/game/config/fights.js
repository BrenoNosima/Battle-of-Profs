/**
 * Configurações das lutas do jogo
 * Cada objeto representa uma luta com:
 * - background: imagem de fundo
 * - player: classe do personagem do jogador
 * - enemy: classe do personagem inimigo
 * - sprites: caminhos para as spritesheets de cada ação
 */

export default [
    {
        name: "Breno vs Moreno", // Nome da luta
        background: 'menu.png', // Imagem de fundo (em public/backgrounds/)
        player: 'Player', // Classe do jogador (Player.js)
        enemy: 'Moreno', // Classe do inimigo (Moreno.js)
        playerSprites: {
            idle: { path: '/sprite/player/playerParado.png', frameWidth: 70, frameHeight: 110, frames: 1 },
            walk: { path: '/sprite/player/playerAndando.png', frameWidth: 66.5, frameHeight: 110, frames: 5 },
            attack: { path: '/sprite/player/playerAtaque.png', frameWidth: 87.5, frameHeight: 110, frames: 4 },
            block: { path: '/sprite/player/playerDefendendo.png', frameWidth: 118, frameHeight: 115, frames: 1 },
            jump: { path: '/sprite/player/playerPulando.png', frameWidth: 75, frameHeight: 110, frames: 1 },
            dash: { path: '/sprite/player/playerDash.png', frameWidth: 162, frameHeight: 90, frames: 1 } // NOVO!
        },
        enemySprites: {
            idle: {path: '/sprite/moreno/morenoParado.png', frameWidth: 80, frameHeight: 110, frames: 1},
            walk: {path: '/sprite/moreno/morenoAndando.png', frameWidth: 70, frameHeight: 110, frames: 4},
            attack: {path: '/sprite/moreno/morenoAtaque.png',frameWidth: 86.25, frameHeight: 110, frames: 4},
            special: {path: '/sprite/moreno/morenoAtaqueEspecial.png',frameWidth: 190, frameHeight: 110, frames: 4},
            jump: {path: '/sprite/moreno/morenoPulando.png', frameWidth: 80, frameHeight: 110, frames: 1},
        }
    },
    {
        name: "Breno vs Cidão",
        background: 'inspira-space.png', 
        player: 'Player', 
        enemy: 'Cidao',
        playerSprites: {
            idle: { path: '/sprite/player/playerParado.png', frameWidth: 70, frameHeight: 110, frames: 1 },
            walk: { path: '/sprite/player/playerAndando.png', frameWidth: 66.5, frameHeight: 110, frames: 5 },
            attack: { path: '/sprite/player/playerAtaque.png', frameWidth: 87.5, frameHeight: 110, frames: 4 },
            block: { path: '/sprite/player/playerDefendendo.png', frameWidth: 118, frameHeight: 115, frames: 1 },
            jump: { path: '/sprite/player/playerPulando.png', frameWidth: 75, frameHeight: 110, frames: 1 },
            dash: { path: '/sprite/player/playerDash.png', frameWidth: 162, frameHeight: 90, frames: 1 } // NOVO!
        },
        enemySprites: {
            idle: {path: '/sprite/cidao/cidaoParado.png', frameWidth: 67, frameHeight: 105, frames: 1},
            walk: {path: '/sprite/cidao/cidaoAndando.png',frameWidth: 57.5, frameHeight: 90, frames: 4},
            attack: {path: '/sprite/cidao/cidaoAtaque.png',frameWidth: 80, frameHeight: 99, frames: 4},
            special: {path: '/sprite/cidao/cidaoAtaqueEspecial.png',frameWidth: 425, frameHeight: 99, frames: 1},
            jump: {path: '/sprite/cidao/cidaoPulando.png', frameWidth: 80, frameHeight: 108, frames: 1},
        }
    },
    {
        name: "Breno vs Hugo",
        background: 'bloco8.png',
        player: 'Player',
        enemy: 'Hugo',
        playerSprites: {
            idle: { path: '/sprite/player/playerParado.png', frameWidth: 70, frameHeight: 110, frames: 1 },
            walk: { path: '/sprite/player/playerAndando.png', frameWidth: 66.5, frameHeight: 110, frames: 5 },
            attack: { path: '/sprite/player/playerAtaque.png', frameWidth: 87.5, frameHeight: 110, frames: 4 },
            block: { path: '/sprite/player/playerDefendendo.png', frameWidth: 118, frameHeight: 115, frames: 1 },
            jump: { path: '/sprite/player/playerPulando.png', frameWidth: 75, frameHeight: 110, frames: 1 },
            dash: { path: '/sprite/player/playerDash.png', frameWidth: 162, frameHeight: 90, frames: 1 } // NOVO!
        },
        enemySprites: {
            idle: {path: '/sprite/hugo/hugoParado.png', frameWidth: 85, frameHeight: 125, frames: 1},
            walk: {path: '/sprite/hugo/hugoAndando.png',frameWidth: 72.5, frameHeight: 110, frames: 4},
            attack: {path: '/sprite/hugo/hugoAtaque.png',frameWidth: 77.5, frameHeight: 115, frames: 4},
            special: {path: '/sprite/hugo/hugoAtaqueEspecial.png',frameWidth: 110, frameHeight: 122, frames: 4},
            jump: {path: '/sprite/hugo/hugoPulando.png', frameWidth: 97, frameHeight: 120, frames: 1},
        }
    }
];



