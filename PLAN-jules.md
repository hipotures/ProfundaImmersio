1.  **Project Setup and Configuration System:**
    *   Initialize a Vite.js project with TypeScript and A-Frame.
    *   Set up the basic PWA structure (manifest.json, service worker).
    *   Implement the YAML configuration system using `js-yaml` to load and parse `config.yaml`.
    *   Define the initial `config.yaml` schema based on `prd.txt` (board dimensions, colors, initial game settings).
2.  **Game Board (Studnia) Generation:**
    *   Create an A-Frame component `game-board`.
    *   Implement logic to read board dimensions and depth colors from the parsed YAML configuration.
    *   Dynamically generate the "studnia" walls and floor using A-Frame primitives.
    *   Render grid lines for each depth layer.
    *   Apply initial wall styling and depth-based coloring.
3.  **Block Definition, Spawning, and Basic Movement:**
    *   Create an A-Frame component `game-block` (initially simple box).
    *   Implement a function to spawn new blocks at the top of the studnia.
    *   Set up A-Frame event listeners for the right VR controller.
    *   Implement joystick input processing for XZ plane movement and Y-axis (upward) movement.
    *   Implement boundary checks to constrain block movement within studnia walls.
4.  **Block Hard Drop and Rotation (SRS):**
    *   Implement hard drop functionality (right controller trigger) to instantly move the block to the lowest possible position.
    *   Set up A-Frame event listeners for the left VR controller.
    *   Implement SRS rotation logic, including wall kicks, based on joystick input and `config.yaml` mapping.
5.  **Block Landing, Stacking, and Line Clearing:**
    *   Implement logic to detect when an active block lands on the floor or other settled blocks.
    *   Manage a 3D data structure (`boardState`) representing occupied cells in the studnia.
    *   Transition active blocks to a "settled" state and update `boardState`.
    *   Implement logic to scan `boardState` for completed horizontal layers.
    *   Remove blocks from cleared layers and shift blocks above them down.
    *   Implement the studnia wall color palette shift upon line clearing.
6.  **Automatic Block Falling, Game Loop, and Scoring:**
    *   Establish the core game loop (A-Frame `tick` or `setInterval`).
    *   Implement automatic downward movement of the active block.
    *   Integrate collision detection for landing.
    *   On landing, finalize position, check for line clears, and spawn a new block.
    *   Implement the scoring system based on `prd.txt` (points for lines, multi-line bonuses, speed-based multipliers).
7.  **HUD Implementation (Score, Next Block):**
    *   Set up a basic HUD using A-Frame text or a UI library.
    *   Display the current score in real-time.
    *   Create a "next block" preview area, configurable for N blocks.
8.  **Advanced Block Features:** (Currently blocked by file system issues)
    *   Implement active block transparency.
    *   Landed blocks change color to match the landing level's wall strip.
    *   Implement optional level numbering on block fronts.
    *   Define and parse custom block shapes from `config.yaml`.
    *   Implement selectable block generation systems (e.g., 7-bag).
9.  **Ghost Piece Implementation:**
    *   Create a visual representation for the ghost piece.
    *   Calculate and display the ghost piece's final landing position in real-time.
    *   Add a game option to toggle ghost piece visibility.
10. **UI: Start Menu and Options Screen:** (Currently blocked by file system issues)
    *   Set up an A-Frame UI library (e.g., `aframe-gui`).
    *   Implement the Start Menu and Options Screen panels.
    *   Implement controls for game settings (difficulty, board size, sound, feature toggles) and link them to the configuration/game state.
11. **HUD/FUI Styling and Visual Enhancements:**
    *   Apply the visual style from `hud_fui.md` (background, grid, colors, typography).
    *   Style HUD/UI widgets and implement micro-animations and interactive feedback.
12. **Sound and Haptic Feedback:**
    *   Set up a sound manager and integrate sound effects for game events.
    *   Implement haptic feedback for Quest 3 controllers.
    *   Add options to toggle sound and haptics.
13. **PWA Finalization and Offline Capabilities:**
    *   Enhance the service worker for comprehensive asset caching.
    *   Ensure all critical game assets are cached for offline play.
    *   Update `manifest.json` and test PWA functionality thoroughly.
14. **Difficulty Progression, Timer, and Game Over:**
    *   Implement a visual countdown timer for block placement.
    *   Define difficulty levels in `config.yaml` affecting game speed and scoring.
    *   Implement logic for the game to speed up based on configurable triggers.
    *   Implement "Game Over" condition detection and display.
15. **Game State Management (Zustand/Jotai):**
    *   Integrate a state management library (e.g., Zustand).
    *   Refactor game logic (score, level, board state, settings) to use the global state store.
16. **Internationalization (i18n):**
    *   Integrate `i18next`.
    *   Externalize user-facing strings to resource files.
    *   Implement language selection in options.
17. **Data Persistence (LocalStorage):**
    *   Implement saving/loading of player statistics and preferences to LocalStorage.
18. **Multiple Game Boards Support (Stretch Goal, if time permits):**
    *   Refactor core logic to support 1-4 independent game boards.
    *   Implement controls and HUD adaptations for multiple boards.
19. **Documentation and Final Testing:**
    *   Create documentation for the `config.yaml` schema and setup.
    *   Conduct thorough manual testing in a VR environment.
    *   Profile and optimize for performance on Quest 3 (target >= 72 FPS).
20. **Submit the solution.**
    *   Submit the complete project with a descriptive commit message.
