import 'aframe';
import { loadConfig } from './configLoader';
import './components/gameBoard';
import './components/gameBlock';
import './components/blockMovement';
import './components/blockHardDrop';
import './components/blockAutoFall';
import { initBoardState, clearFullLayers } from './boardState';

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
  block.setAttribute('block-hard-drop', {
    boardWidth: boardDims.width,
    boardDepth: boardDims.depth,
    boardHeight: boardDims.height
  });
  block.setAttribute('block-auto-fall', {
    boardWidth: boardDims.width,
    boardDepth: boardDims.depth,
    boardHeight: boardDims.height,
    floorY: 0.5
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

    let score = 0;
    const hud = document.createElement('a-entity');
    hud.setAttribute('position', '0 2 -4');
    const scoreText = document.createElement('a-text');
    scoreText.setAttribute('value', 'Score: 0');
    scoreText.setAttribute('color', '#fff');
    hud.appendChild(scoreText);
    scene.appendChild(hud);

    const board = document.createElement('a-entity');
    board.setAttribute('game-board', {
      width: boardSize.dimensions[0],
      depth: boardSize.dimensions[1],
      height: boardSize.dimensions[2],
      colors: config.depthColors
    });
    board.setAttribute('position', '0 0 -5');
    scene.appendChild(board);

    const dims = {
      width: boardSize.dimensions[0],
      depth: boardSize.dimensions[1],
      height: boardSize.dimensions[2]
    };

    initBoardState(dims.width, dims.depth, dims.height);

    scene.addEventListener('block-settled', () => {
      const cleared = clearFullLayers();
      if (cleared > 0) {
        score += config.scoring.lineClearBase * Math.pow(2, cleared - 1);
        scoreText.setAttribute('value', `Score: ${score}`);
        board.emit('shift-colors', { count: cleared });
      }
      spawnNewBlock(board, '#fff', dims.height, dims);
    });

    // Spawn the first block at the top of the board
    spawnNewBlock(board, '#fff', dims.height, dims);
  } catch (err) {
    console.error(err);
  }
}

init();
