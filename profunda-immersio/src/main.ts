import './style.css';
import 'aframe'; // Import A-Frame
import { loadConfig, Config, BoardDimensions } from './config'; // Assuming Config interface is exported
import './components/game-board'; // Import to register game-board
import './components/game-block'; // Import to register game-block
import { initGameLogic } from './game-logic'; // Import game logic functions

async function main() {
  try {
    const config: Config = await loadConfig();
    console.log('Configuration loaded:', config);

    if (!config || !config.boardDimensions) {
      console.error("Critical configuration (boardDimensions) missing. Aborting.");
      document.body.innerHTML = "<p>Error: Critical configuration missing. See console.</p>";
      return;
    }
    const boardDimensions = config.boardDimensions;

    const appDiv = document.querySelector<HTMLDivElement>('#app');
    if (!appDiv) {
      console.error("Could not find #app element to initialize A-Frame scene.");
      return;
    }

    // Set up the A-Frame scene HTML
    // The game-board entity will be centered at 0,0,0 in its own local space.
    // We can position it further away using its position attribute if needed.
    // For example, position="0 0 -5" to move it 5 units away from the camera along Z.
    appDiv.innerHTML = `
      <a-scene background="color: #222" renderer="colorManagement: true">
        <!-- Game Board Entity -->
        <a-entity id="game-board-entity" game-board position="0 0 -${boardDimensions.y * 1.5}"></a-entity> 
        
        <!-- Camera Rig -->
        <a-entity id="camera-rig" position="0 1.6 ${boardDimensions.y / 2}">
          <a-entity id="camera" camera look-controls></a-entity>
        </a-entity>

        <!-- VR Controllers -->
        <a-entity id="left-controller" oculus-touch-controls="hand: left"></a-entity>
        <a-entity id="right-controller" oculus-touch-controls="hand: right"></a-entity>

        <!-- Lighting -->
        <a-entity light="type: ambient; color: #BBB; intensity: 0.8"></a-entity>
        <a-entity light="type: directional; color: #FFF; intensity: 0.6" position="-0.5 1 1"></a-entity>
        <a-sky color="#ECECEC"></a-sky>
      </a-scene>
    `;

    // A-Frame scene is now in the DOM. Wait for it to initialize.
    const sceneEl = document.querySelector('a-scene');
    if (!sceneEl) {
      console.error("A-Frame scene element not found after setting innerHTML.");
      return;
    }

    // Wait for the scene to load before trying to interact with its elements
    sceneEl.addEventListener('loaded', () => {
      console.log("A-Frame scene loaded.");
      // Initialize game logic after scene and config are ready
      // The game-board component will use the config directly via loadConfig()
      // game-logic needs boardDimensions which we have from the loaded config.
      initGameLogic(sceneEl as AFRAME.Scene, config, boardDimensions as BoardDimensions);
      console.log("Game logic initialized.");
    });

  } catch (error) {
    console.error('Failed to initialize application:', error);
    const appDiv = document.querySelector<HTMLDivElement>('#app');
    if (appDiv) {
      appDiv.innerHTML = `<p>Error loading application. See console for details: ${error}</p>`;
    }

  } catch (error) {
    console.error('Failed to initialize application:', error);
    const appDiv = document.querySelector<HTMLDivElement>('#app');
    if (appDiv) {
      appDiv.innerHTML = `<p>Error loading application. See console for details.</p>`;
    }
  }
}

main();
