# Profunda Immersio

Profunda Immersio is a VR falling-block puzzle game inspired by Tetris. The project aims to deliver a minimalist yet immersive experience for Meta Quest devices using **A-Frame**, **TypeScript** and **Vite** as a Progressive Web App.

The full product requirements are written in Polish in [`prd.txt`](prd.txt). For convenience a short English summary is available in [README.en.md](README.en.md).

The repository currently contains documentation, initial configuration, and a minimal `package.json`. Source code will live in the `src/` directory while game assets such as sounds or models belong in `assets/`.

## Getting Started

```bash
# Clone the repository
git clone <this repo>
cd ProfundaImmersio

# Install dependencies
# The repository includes a package.json with A-Frame, js-yaml, Vite and TypeScript
npm install

# Start development server
npm run dev

# Run tests (currently none)
npm test
```

A-Frame and Vite are expected development tools. `config/config.yaml` stores gameplay options such as board sizes, depth colors and block definitions. See [docs/config-schema.md](docs/config-schema.md) for details.

## Tasks
The high level implementation plan is divided into numbered tasks found in `task-complexity-report.json`. These cover project setup, game board generation, block mechanics, user interface, internationalization and more.

Contributions should align with these tasks, gradually turning this skeleton into a playable VR experience.

## Additional Documentation
- [README.en.md](README.en.md) — English summary of the project.
- [`prd.txt`](prd.txt) — Product Requirements Document in Polish.
- [docs/config-schema.md](docs/config-schema.md) — explanation of YAML configuration keys.
