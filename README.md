# Projeto Battle-of-Profs Refatorado em Vue.js Modular

Este é o projeto "Battle-of-Profs" original, refatorado para uma estrutura Vue.js mais modular e organizada, separando a lógica do jogo (Phaser) dos componentes da interface (Vue).

## Estrutura de Pastas

A nova estrutura do projeto está organizada da seguinte forma:

```
/Battle-of-Profs-Vue/
├── public/             # Assets estáticos (imagens, etc.)
│   ├── backgrounds/
│   └── sprite/
├── src/
│   ├── App.vue           # Componente raiz da aplicação Vue
│   ├── main.js         # Ponto de entrada da aplicação Vue
│   ├── assets/           # Assets processados pelo build (CSS, fontes)
│   ├── components/       # Componentes Vue reutilizáveis
│   │   └── GameContainer.vue # Wrapper para o canvas do Phaser
│   └── game/             # Lógica do jogo Phaser
│       ├── scenes/         # Cenas do Phaser
│       │   ├── PreloadScene.js
│       │   └── FightScene.js
│       ├── config/         # Configurações do Phaser
│       │   └── phaserConfig.js
│       ├── core/           # (Vazio por enquanto, pode conter classes Player, Enemy)
│       ├── utils/          # (Vazio por enquanto, pode conter utilitários)
│       └── composables/    # (Vazio por enquanto, pode conter Vue Composables)
├── .eslintrc.cjs       # Configuração do ESLint (se existir no original)
├── index.html          # Arquivo HTML principal
├── package.json        # Dependências e scripts do projeto
├── tsconfig.json       # Configuração do TypeScript
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts      # Configuração do Vite
└── README.md           # Este arquivo
```

**Principais Mudanças:**

*   A lógica do Phaser que estava no componente `phaser-vue-ajustado.vue` foi movida para `src/game/scenes/FightScene.js`.
*   Uma nova cena `src/game/scenes/PreloadScene.js` foi criada para lidar com o carregamento de assets.
*   A configuração do Phaser está centralizada em `src/game/config/phaserConfig.js`.
*   O componente `src/components/GameContainer.vue` agora é responsável por inicializar e conter a instância do jogo Phaser.
*   O `src/App.vue` foi simplificado para apenas renderizar o `GameContainer.vue`.
*   As pastas `core`, `utils` e `composables` foram criadas para futura expansão e melhor organização, mas ainda não foram populadas extensivamente nesta refatoração inicial.

## Como Executar

1.  **Descompacte** o arquivo `Battle-of-Profs-Vue.zip`.
2.  **Navegue** até o diretório `Battle-of-Profs-Vue` no seu terminal:
    ```bash
    cd Battle-of-Profs-Vue
    ```
3.  **Instale as dependências** (certifique-se de ter Node.js e npm/yarn instalados):
    ```bash
    npm install
    # ou
    # yarn install
    ```
4.  **Execute o servidor de desenvolvimento**:
    ```bash
    npm run dev
    # ou
    # yarn dev
    ```
5.  Abra o navegador no endereço fornecido (geralmente `http://localhost:5173`).

## Observações

*   Esta refatoração focou na separação estrutural da lógica do Phaser e Vue. O código dentro das cenas do Phaser (`FightScene.js`) ainda pode ser otimizado e dividido em mais arquivos (como `Player.js`, `Enemy.js`, `uiElements.js`, `particles.js`) para maior clareza e reutilização, conforme sugerido na estrutura de pastas.
*   A validação completa do funcionamento pode exigir ajustes finos nos caminhos de importação ou na lógica de comunicação entre Vue e Phaser, dependendo do ambiente de execução.
*   O arquivo `eslint.config.ts` não foi encontrado no projeto original e, portanto, não foi copiado.

