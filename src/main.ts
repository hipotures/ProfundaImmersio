import 'aframe';
import { loadConfig } from './configLoader';
import './components/gameBoard';
import './components/gameBlock';
import './components/blockMovement';

function spawnNewBlock(
  scene: Element,
  color: string,
  startY: number,
  boardDims: { width: number; depth: number; height: number }
) {
  const block = document.createElement('a-entity');
  block.setAttribute('game-block', { color });
  block.setAttribute('position', `0 ${startY} 0`);
  block.setAttribute('block-movement', {
    boardWidth: boardDims.width,
    boardDepth: boardDims.depth,
    boardHeight: boardDims.height
  });
  scene.appendChild(block);
  return block;
}

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

    // Spawn the first block at the top of the board
    spawnNewBlock(
      board,
      '#fff',
      boardSize.dimensions[2],
      {
        width: boardSize.dimensions[0],
        depth: boardSize.dimensions[1],
        height: boardSize.dimensions[2]
      }
    );
  } catch (err) {
    console.error(err);
  }
}

init();
