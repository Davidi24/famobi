# Neon Snake

A compact browser game built with Phaser 3, TypeScript, Vite, and a DOM-based interface.

This repository is intentionally a small game only. It does not contain the Famobi SDK, analytics, a backend, or a dashboard.

## Gameplay

- Clear three increasingly fast levels.
- Eat the required number of fruit to advance.
- Avoid walls, your own trail, and level obstacles.
- Pause, resume, retry, or return to the main menu.
- Play with arrow keys, WASD, swipe gestures, or the on-screen direction pad.

## Run locally

Requirements: Node.js 22 or newer and pnpm.

```bash
pnpm install
pnpm dev
```

Then open the local URL printed by Vite.

## Checks

```bash
pnpm check
pnpm build
pnpm preview
```

## Project structure

```text
src/
├── game/
│   ├── input.ts
│   ├── levels.ts
│   ├── scenes/
│   │   └── SnakeScene.ts
│   ├── snakeGame.ts
│   └── types.ts
├── main.ts
└── style.css
```

The game simulation remains independent from Phaser. The scene adapts simulation state into graphics and input, while the HUD and menus remain accessible DOM elements.

## Publish with GitHub Pages

1. Create a public GitHub repository and place these files at its root.
2. Push the repository's default branch.
3. Open **Settings → Pages** in GitHub.
4. Under **Build and deployment**, choose **GitHub Actions** as the source.

The included workflow builds and deploys the game whenever the default branch is updated.

## License

MIT
