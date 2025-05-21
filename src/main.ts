import 'aframe';
import { loadConfig } from './configLoader';
import './components/gameBoard';

async function init() {
  console.log('Profunda Immersio starting...');
  try {
    const config = await loadConfig('/config/config.yaml');
    const boardSize = config.boardSizes[0];
    const scene = document.querySelector('a-scene');
    if (!scene) return;
    const board = document.createElement('a-entity');
    board.setAttribute('game-board', {
      width: boardSize.dimensions[0],
      depth: boardSize.dimensions[1],
      height: boardSize.dimensions[2],
      colors: config.depthColors
    });
    board.setAttribute('position', '0 0 -5');
    scene.appendChild(board);
  } catch (err) {
    console.error(err);
  }
}

window.addEventListener('DOMContentLoaded', init);
