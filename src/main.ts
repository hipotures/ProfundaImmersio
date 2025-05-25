import './style.css';
import 'aframe'; // Import A-Frame
import { loadConfig, Config, BoardDimensions } from './config'; // Assuming Config interface is exported
import './components/game-board'; // Import to register game-board
import './components/game-block'; // Import to register game-block
import './components/hud-manager'; // Import to register hud-manager
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

    // Scene setup with HUD integrated into the camera
    appDiv.innerHTML = `
      <a-scene background="color: #222" renderer="colorManagement: true">
        <!-- Game Board Entity -->
        <a-entity id="game-board-entity" game-board position="0 0 -${boardDimensions.y * 1.5}"></a-entity> 
        
        <!-- Camera Rig with HUD -->
        <a-entity id="camera-rig" position="0 1.6 ${boardDimensions.y / 2}">
          <a-entity id="camera" camera look-controls>
            <!-- HUD attached to the camera -->
            <a-entity id="hud" hud-manager position="0 0 -0.5"></a-entity> 
            <!-- Adjust HUD position: 0 0 -0.5 makes it slightly in front of camera -->
            <!-- The hud-manager component itself will place score/next elements relative to this #hud entity -->
          </a-entity>
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

    const sceneEl = document.querySelector('a-scene');
    if (!sceneEl) {
      console.error("A-Frame scene element not found after setting innerHTML.");
      return;
    }

    sceneEl.addEventListener('loaded', () => {
      console.log("A-Frame scene loaded.");
      initGameLogic(sceneEl as AFRAME.Scene, config, boardDimensions as BoardDimensions);
      console.log("Game logic initialized.");
    });

  } catch (error) {
    console.error('Failed to initialize application:', error);
    const appDiv = document.querySelector<HTMLDivElement>('#app');
    if (appDiv) {
      appDiv.innerHTML = `<p>Error loading application. See console for details: ${error}</p>`;
    }
  }
}

main();
