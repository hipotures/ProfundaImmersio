import 'aframe';
import { loadConfig } from './configLoader';
import './components/gameBoard';
import './components/gameBlock';
import './components/blockMovement';
import './components/blockHardDrop';
import './components/blockAutoFall';
import './components/blockRotation';
import './components/ghostPiece';
import './components/gameTimer';
import './components/hudTimer';
import { parseShape, ParsedShape, createShapeEntity } from './shapes';
import { initBoardState, clearFullLayers, isOccupied } from './boardState';

function spawnNewBlock(
  scene: Element,
  shape: ParsedShape,
  color: string,
  startY: number,
  boardDims: { width: number; depth: number; height: number }
) {
  const block = document.createElement('a-entity');
  const mesh = createShapeEntity(shape, color);
  block.appendChild(mesh);
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
  block.setAttribute('block-rotation', {
    boardWidth: boardDims.width,
    boardDepth: boardDims.depth,
    boardHeight: boardDims.height
  });
  scene.appendChild(block);
  const existingGhost = scene.querySelector('[ghost-piece]');
  if (existingGhost) scene.removeChild(existingGhost);
  const ghost = document.createElement('a-entity');
  ghost.setAttribute('ghost-piece', {
    shape: JSON.stringify(shape),
    boardWidth: boardDims.width,
    boardDepth: boardDims.depth,
    floorY: 0.5
  });
  scene.appendChild(ghost);
  const halfW = boardDims.width / 2;
  const xIdx = Math.round(0 + halfW - 0.5);
  const zIdx = Math.round(0 + halfW - 0.5);
  if (isOccupied(xIdx, boardDims.height - 1, zIdx)) {
    scene.emit('game-over');
  }
  return block;
}

async function init() {
  console.log('Profunda Immersio starting...');
  try {
    const config = await loadConfig('/config/config.yaml');
    const boardSize = config.boardSizes[0];
    const shapes = config.blocks.shapes.map(parseShape);
    const nextQueue: ParsedShape[] = [];
    function randShape() {
      return shapes[Math.floor(Math.random() * shapes.length)];
    }
    for (let i = 0; i < 3; i++) nextQueue.push(randShape());
    const scene = document.querySelector('a-scene');
    if (!scene) return;

    let score = 0;
    let timeLimit = config.difficultyLevels.easy.startTime;
    let timeRemaining = timeLimit;
    const hud = document.createElement('a-entity');
    hud.setAttribute('position', '0 2 -4');
    const scoreText = document.createElement('a-text');
    scoreText.setAttribute('value', 'Score: 0');
    scoreText.setAttribute('color', '#fff');
    hud.appendChild(scoreText);
    const best = Number(localStorage.getItem('highScore') || 0);
    const bestText = document.createElement('a-text');
    bestText.setAttribute('position', '0 -1 0');
    bestText.setAttribute('color', '#fff');
    bestText.setAttribute('value', `Best: ${best}`);
    hud.appendChild(bestText);
    const timerText = document.createElement('a-text');
    timerText.setAttribute('position', '0 0.5 0');
    timerText.setAttribute('color', '#fff');
    timerText.setAttribute('hud-timer-display', 'scene: a-scene');
    hud.appendChild(timerText);
    const queueText = document.createElement('a-text');
    queueText.setAttribute('position', '0 -0.5 0');
    queueText.setAttribute('color', '#fff');
    hud.appendChild(queueText);
    scene.appendChild(hud);

    const gameOverText = document.createElement('a-text');
    gameOverText.setAttribute('position', '0 0 -1');
    gameOverText.setAttribute('color', '#ff0000');
    gameOverText.setAttribute('visible', 'false');
    scene.appendChild(gameOverText);

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
      const next = nextQueue.shift() as ParsedShape;
      nextQueue.push(randShape());
      spawnNewBlock(board, next, '#fff', dims.height, dims);
      queueText.setAttribute('value', 'Next: ' + nextQueue.map(s => s.name).join(', '));
      timeLimit = Math.max(2, timeLimit - config.scoring.accelerationFactor);
      timeRemaining = timeLimit;
      scene.setAttribute('game-timer', { limit: timeLimit });
    });

    scene.setAttribute('game-timer', { limit: timeLimit });
    scene.addEventListener('timer-expired', () => {
      const active = scene.querySelector('[block-movement]');
      active?.emit('triggerdown', { hand: 'right' });
    });
    scene.addEventListener('tick', () => {
      const timerComp: any = scene.components['game-timer'];
      if (timerComp) {
        timeRemaining = timerComp.remaining;
        timerText.setAttribute('value', `Time: ${timeRemaining.toFixed(1)}`);
      }
    });

    scene.addEventListener('game-over', () => {
      gameOverText.setAttribute('value', 'Game Over');
      gameOverText.setAttribute('visible', 'true');
      const best = Number(localStorage.getItem('highScore') || 0);
      if (score > best) {
        localStorage.setItem('highScore', String(score));
        bestText.setAttribute('value', `Best: ${score}`);
      }
    });

    // Spawn the first block at the top of the board
    const first = nextQueue.shift() as ParsedShape;
    nextQueue.push(randShape());
    spawnNewBlock(board, first, '#fff', dims.height, dims);
    queueText.setAttribute('value', 'Next: ' + nextQueue.map(s => s.name).join(', '));
  } catch (err) {
    console.error(err);
  }
}

init();