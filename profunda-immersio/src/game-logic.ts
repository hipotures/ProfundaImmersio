import AFRAME from 'aframe';
import { Config, BoardDimensions } from './config';

// Module-level state
let activeBlock: AFRAME.Entity | null = null;
let gameBoardDimensions: BoardDimensions | null = null; // {x:width, y:length/depth, z:heightOfWell}
let sceneRef: AFRAME.Scene | null = null;
let configRef: Config | null = null;
let boardState: (AFRAME.Entity | string | null)[][][] = []; // Stores refs to settled block entities or their color
let currentDepthColors: string[] = []; // Mutable copy of depth colors for palette shifting

const JOYSTICK_DEAD_ZONE = 0.2;
const MOVEMENT_STEP_XZ = 0.1; // Continuous movement step
const MOVEMENT_STEP_Y = 0.08;
const SIGNIFICANT_JOYSTICK_Y_THRESHOLD = 0.7;
const ROTATION_INCREMENT = 15; // Degrees

// --- Initialization ---
export function initGameLogic(
  sceneElement: AFRAME.Scene,
  gameConfig: Config,
  boardDims: BoardDimensions
) {
  sceneRef = sceneElement;
  configRef = gameConfig;
  gameBoardDimensions = boardDims;

  if (!gameBoardDimensions || !configRef) {
    console.error("Board dimensions or config not available for initGameLogic");
    return;
  }
  currentDepthColors = [...configRef.depthColors]; // Initialize mutable copy

  // Initialize boardState: boardState[x][y_height][z_depth]
  // Y-dimension (height) from config.boardDimensions.z
  // Z-dimension (length/depth) from config.boardDimensions.y
  boardState = new Array(gameBoardDimensions.x).fill(null).map(() =>
    new Array(gameBoardDimensions.z).fill(null).map(() =>
      new Array(gameBoardDimensions.y).fill(null)
    )
  );
  console.log(`Board state initialized: ${gameBoardDimensions.x}x${gameBoardDimensions.z}x${gameBoardDimensions.y}`);

  activeBlock = spawnNewBlock();
  if (!activeBlock) {
    console.error("Failed to spawn initial block.");
    return;
  }

  setupControllerListeners();
  console.log("Game logic and controller listeners initialized.");
}

function setupControllerListeners() {
  const rightController = sceneRef?.querySelector('#right-controller') as AFRAME.Entity;
  const leftController = sceneRef?.querySelector('#left-controller') as AFRAME.Entity;

  if (rightController) {
    rightController.addEventListener('axismove', handleRightControllerAxisMove);
    rightController.addEventListener('triggerdown', handleHardDrop);
  } else {
    console.error("Right controller not found.");
  }

  if (leftController) {
    leftController.addEventListener('axismove', handleLeftControllerAxisMove);
  } else {
    console.error("Left controller not found.");
  }
}

// --- Block Spawning ---
export function spawnNewBlock(): AFRAME.Entity | null {
  if (!sceneRef || !configRef || !gameBoardDimensions) return null;

  const blockEntity = document.createElement('a-entity');
  const blockData = { width: 1, height: 1, depth: 1 }; // Assuming 1x1x1 blocks

  // Start position: centered X, top of well Y, centered Z (depth)
  const startX = 0; // World coordinate
  const startY = (gameBoardDimensions.z / 2) - (blockData.height / 2); // World coordinate
  const startZ = 0; // World coordinate

  blockEntity.setAttribute('game-block', {
    ...blockData,
    color: currentDepthColors[Math.floor(Math.random() * currentDepthColors.length)] || 'silver'
  });
  blockEntity.setAttribute('position', { x: startX, y: startY, z: startZ });
  blockEntity.setAttribute('rotation', { x: 0, y: 0, z: 0 });

  sceneRef.appendChild(blockEntity);
  activeBlock = blockEntity;
  console.log('Spawned new block at (world):', { x: startX, y: startY, z: startZ });
  return activeBlock;
}

// --- Coordinate Conversion & Validation ---
function worldToBoardCoords(worldX: number, worldY: number, worldZ: number): { x: number, y: number, z: number } | null {
  if (!gameBoardDimensions) return null;
  // Assuming block's pivot is its center.
  // Board origin (0,0,0) in boardState corresponds to world (-width/2, -height/2, -depth/2)
  const boardX = Math.round(worldX + gameBoardDimensions.x / 2 - 0.5);
  const boardY_height = Math.round(worldY + gameBoardDimensions.z / 2 - 0.5); // Y in world is height
  const boardZ_depth = Math.round(worldZ + gameBoardDimensions.y / 2 - 0.5); // Z in world is length/depth

  return { x: boardX, y: boardY_height, z: boardZ_depth };
}

function isValidBoardCoord(bx: number, by: number, bz: number): boolean {
  if (!gameBoardDimensions) return false;
  return bx >= 0 && bx < gameBoardDimensions.x &&
         by >= 0 && by < gameBoardDimensions.z && // by is height index
         bz >= 0 && bz < gameBoardDimensions.y;   // bz is depth/length index
}

// --- Collision Detection ---
/**
 * Checks if the block at its current position collides with boundaries or settled blocks.
 * For 1x1x1 blocks, this is straightforward.
 * @param blockEntity The block to check.
 */
function checkCollision(blockEntity: AFRAME.Entity): boolean {
  if (!blockEntity || !gameBoardDimensions) return true; // Fail safe

  const pos = blockEntity.getAttribute('position') as THREE.Vector3;
  const blockComp = blockEntity.components['game-block'] as any;
  if (!blockComp) return true;
  const dims = blockComp.getDimensions(); // {width, height, depth}

  // 1. Boundary Collision (using world coordinates)
  const worldMinY = -gameBoardDimensions.z / 2 + dims.height / 2; // Floor
  if (pos.y < worldMinY) return true; // Collision with floor

  // Side/top boundaries (less critical if movement is clamped, but good for sanity)
  const worldMinX = -gameBoardDimensions.x / 2 + dims.width / 2;
  const worldMaxX = gameBoardDimensions.x / 2 - dims.width / 2;
  const worldMinZ_depth = -gameBoardDimensions.y / 2 + dims.depth / 2;
  const worldMaxZ_depth = gameBoardDimensions.y / 2 - dims.depth / 2;
  const worldMaxY_height = gameBoardDimensions.z / 2 - dims.height / 2; // Ceiling

  if (pos.x < worldMinX || pos.x > worldMaxX ||
      pos.z < worldMinZ_depth || pos.z > worldMaxZ_depth ||
      pos.y > worldMaxY_height) {
    // This case should ideally be prevented by checkBoundaries during movement
    console.warn("Block out of movement bounds during collision check.");
    return true;
  }

  // 2. Settled Block Collision
  const bCoords = worldToBoardCoords(pos.x, pos.y, pos.z);
  if (!bCoords) return true; // Invalid coordinate mapping

  if (!isValidBoardCoord(bCoords.x, bCoords.y, bCoords.z)) {
    // This can happen if block center is valid world coord, but rounds to invalid board coord
    // e.g. exactly on a boundary. Treat as collision for safety or refine worldToBoardCoords.
    // For now, if it maps outside valid discrete grid, consider it a collision or error.
    // This logic means the block must be fully within a cell.
    console.warn("Block maps to invalid board coordinates", bCoords);
    return true; 
  }

  if (boardState[bCoords.x][bCoords.y][bCoords.z] !== null) {
    return true; // Collision with a settled block
  }

  return false;
}


// --- Block Settling & Line Clearing ---
function settleBlock(blockEntity: AFRAME.Entity) {
  if (!blockEntity || !gameBoardDimensions) return;

  const pos = blockEntity.getAttribute('position') as THREE.Vector3;
  const bCoords = worldToBoardCoords(pos.x, pos.y, pos.z);

  if (bCoords && isValidBoardCoord(bCoords.x, bCoords.y, bCoords.z)) {
    // Store entity ref or a marker (e.g., its color string)
    // Storing entity ref is powerful but can have issues if entity is removed elsewhere.
    // Storing color or type is safer for boardState integrity.
    const color = blockEntity.getAttribute('game-block')?.color || 'gray';
    boardState[bCoords.x][bCoords.y][bCoords.z] = blockEntity; // Storing entity itself for now
    console.log(`Block settled at board [${bCoords.x}][${bCoords.y}][${bCoords.z}]`);

    // Detach from active control
    if (activeBlock === blockEntity) {
      activeBlock = null;
    }
    // Optional: Add to a 'settled-blocks' <a-entity> group in the scene
    // const settledGroup = sceneRef?.querySelector('#settled-blocks-group') || sceneRef?.createElement('a-entity');
    // if (!settledGroup.id) { settledGroup.id = 'settled-blocks-group'; sceneRef?.appendChild(settledGroup); }
    // settledGroup.appendChild(blockEntity); // This changes entity's parent, might affect position if not handled
  } else {
    console.error("Failed to settle block: invalid board coordinates for", pos);
    // If it can't settle, it might be out of bounds - remove it?
    // blockEntity.parentNode?.removeChild(blockEntity);
  }
}

function checkForLineClears(): number {
  if (!gameBoardDimensions || !sceneRef) return 0;
  let linesCleared = 0;
  // Iterate Y-layers (height) from bottom (0) to top (boardDim.z - 1)
  for (let y = 0; y < gameBoardDimensions.z; y++) {
    let layerFull = true;
    for (let x = 0; x < gameBoardDimensions.x; x++) {
      for (let z = 0; z < gameBoardDimensions.y; z++) {
        if (boardState[x][y][z] === null) {
          layerFull = false;
          break;
        }
      }
      if (!layerFull) break;
    }

    if (layerFull) {
      console.log(`Layer ${y} is full! Clearing.`);
      clearLayer(y);
      shiftBlocksDown(y);
      shiftPalette(); // Affects currentDepthColors
      linesCleared++;
      y--; // Re-check the current layer index as blocks have shifted down
    }
  }
  if (linesCleared > 0) {
    console.log(`Cleared ${linesCleared} lines.`);
    // TODO: Update game-board visual for wall colors if component supports it
    console.log("Wall palette shifted. New top color:", currentDepthColors[currentDepthColors.length-1]);
  }
  return linesCleared;
}

function clearLayer(layerY_height: number) {
  if (!gameBoardDimensions || !sceneRef) return;
  for (let x = 0; x < gameBoardDimensions.x; x++) {
    for (let z = 0; z < gameBoardDimensions.y; z++) {
      const cellContent = boardState[x][layerY_height][z];
      if (cellContent instanceof AFRAME.Entity) {
        cellContent.parentNode?.removeChild(cellContent);
      }
      boardState[x][layerY_height][z] = null;
    }
  }
}

function shiftBlocksDown(clearedLayerY_height: number) {
  if (!gameBoardDimensions || !sceneRef) return;
  // Iterate from the cleared layer upwards to the top
  for (let y = clearedLayerY_height; y < gameBoardDimensions.z - 1; y++) {
    for (let x = 0; x < gameBoardDimensions.x; x++) {
      for (let z = 0; z < gameBoardDimensions.y; z++) {
        const cellAbove = boardState[x][y + 1][z];
        if (cellAbove) { // If there's a block in the cell above
          boardState[x][y][z] = cellAbove; // Move reference down in boardState
          boardState[x][y + 1][z] = null;  // Clear the cell above

          if (cellAbove instanceof AFRAME.Entity) {
            const currentPos = cellAbove.getAttribute('position') as THREE.Vector3;
            cellAbove.setAttribute('position', { x: currentPos.x, y: currentPos.y - 1, z: currentPos.z });
          }
        }
      }
    }
  }
  // Ensure the very top layer is cleared after shifting from it
  for (let x = 0; x < gameBoardDimensions.x; x++) {
    for (let z = 0; z < gameBoardDimensions.y; z++) {
        boardState[x][gameBoardDimensions.z - 1][z] = null;
    }
  }
}


function shiftPalette() {
  if (currentDepthColors.length > 0) {
    const bottomColor = currentDepthColors.shift(); // Remove first color
    if (bottomColor) {
      currentDepthColors.push(bottomColor); // Add it to the end
    }
    console.log("Palette shifted. Game board walls should ideally update.");
  }
}

// --- Controller Handlers ---
function handleRightControllerAxisMove(evt: any) {
  if (!activeBlock || !gameBoardDimensions) return;

  const stickXRaw = evt.detail.axis[0] ?? evt.detail.axis[2] ?? 0;
  const stickYRaw = evt.detail.axis[1] ?? evt.detail.axis[3] ?? 0;

  const currentPos = activeBlock.getAttribute('position') as THREE.Vector3;
  let newX = currentPos.x;
  let newY = currentPos.y;
  let newZ = currentPos.z;

  // Tentative new position
  if (Math.abs(stickXRaw) > JOYSTICK_DEAD_ZONE) newX += stickXRaw * MOVEMENT_STEP_XZ;
  if (Math.abs(stickYRaw) > JOYSTICK_DEAD_ZONE) newZ += stickYRaw * MOVEMENT_STEP_XZ; // Stick Y for Z-depth

  if (stickYRaw < -SIGNIFICANT_JOYSTICK_Y_THRESHOLD) newY += MOVEMENT_STEP_Y; // Stick Y significantly up for Y-up
  else if (stickYRaw > SIGNIFICANT_JOYSTICK_Y_THRESHOLD) newY -= MOVEMENT_STEP_Y; // Stick Y significantly down for Y-down

  // Before applying, check if this new position would collide (excluding self/activeBlock)
  // This is tricky because checkCollision uses the block's *current* position.
  // For predictive collision, we'd need to check the newX, newY, newZ.
  // For now, we move then clamp/check. A better way is to check, then move if valid.
  
  updateActiveBlockPosition(newX, newY, newZ);
  enforceVisualBoundaries(); // Renamed from checkBoundaries for clarity
}

function handleHardDrop() {
  if (!activeBlock || !gameBoardDimensions) return;

  const blockComp = activeBlock.components['game-block'] as any;
  if (!blockComp) return;
  const dims = blockComp.getDimensions();

  let currentY = activeBlock.getAttribute('position').y;
  const finalDropY = -gameBoardDimensions.z / 2 + dims.height / 2; // Target floor Y

  // Simulate dropping: check collision one step down at a time
  // This is simplified; a real Tetris finds the lowest valid spot directly.
  let testY = currentY;
  activeBlock.setAttribute('position', {x: activeBlock.getAttribute('position').x, y: testY, z: activeBlock.getAttribute('position').z});

  while(testY >= finalDropY) {
    activeBlock.setAttribute('position', {x: activeBlock.getAttribute('position').x, y: testY, z: activeBlock.getAttribute('position').z});
    if (checkCollision(activeBlock)) { // Collision with something below (or floor)
        // Move one step back up if not floor collision, because collision means it *intersected*
        if (testY + dims.height > finalDropY + dims.height) { // Crude check if it's not exactly on floor
             activeBlock.setAttribute('position', {x: activeBlock.getAttribute('position').x, y: testY + dims.height, z: activeBlock.getAttribute('position').z});
        }
        break;
    }
    testY -= dims.height; // Move one block unit down
  }
   if (testY < finalDropY) { // Ensure it rests on the floor if nothing else hit
        activeBlock.setAttribute('position', {x: activeBlock.getAttribute('position').x, y: finalDropY, z: activeBlock.getAttribute('position').z});
   }


  console.log("Block hard dropped.");
  settleBlock(activeBlock); // activeBlock becomes null here
  checkForLineClears();
  spawnNewBlock();
}

function handleLeftControllerAxisMove(evt: any) {
  if (!activeBlock) return;

  const stickXRaw = evt.detail.axis[0] ?? evt.detail.axis[2] ?? 0;
  const stickYRaw = evt.detail.axis[1] ?? evt.detail.axis[3] ?? 0;

  const currentRotation = activeBlock.getAttribute('rotation') as THREE.Vector3;
  let newRotX = currentRotation.x;
  let newRotY = currentRotation.y;

  if (Math.abs(stickXRaw) > JOYSTICK_DEAD_ZONE) {
    newRotY += stickXRaw > 0 ? -ROTATION_INCREMENT : ROTATION_INCREMENT;
  }
  if (Math.abs(stickYRaw) > JOYSTICK_DEAD_ZONE) {
    newRotX += stickYRaw > 0 ? -ROTATION_INCREMENT : ROTATION_INCREMENT;
  }

  activeBlock.setAttribute('rotation', { x: newRotX, y: newRotY, z: currentRotation.z });
  enforceVisualBoundaries(); // Check boundaries after rotation
}

// --- Position Update & Boundary Enforcement ---
function updateActiveBlockPosition(x: number, y: number, z: number) {
  if (!activeBlock) return;
  activeBlock.setAttribute('position', { x, y, z });
}

// Renamed from checkBoundaries to make its purpose clearer (visual clamping)
// This version primarily ensures the block *visual* doesn't exit the area.
// Collision with settled blocks is handled by checkCollision.
function enforceVisualBoundaries() {
  if (!activeBlock || !gameBoardDimensions) return;

  const pos = activeBlock.getAttribute('position') as THREE.Vector3;
  const blockComp = activeBlock.components['game-block'] as any;
  if (!blockComp) return;
  const dims = blockComp.getDimensions();

  const worldMinX = -gameBoardDimensions.x / 2 + dims.width / 2;
  const worldMaxX = gameBoardDimensions.x / 2 - dims.width / 2;
  const worldMinZ_depth = -gameBoardDimensions.y / 2 + dims.depth / 2;
  const worldMaxZ_depth = gameBoardDimensions.y / 2 - dims.depth / 2;
  const worldMinY_height = -gameBoardDimensions.z / 2 + dims.height / 2; // Floor
  const worldMaxY_height = gameBoardDimensions.z / 2 - dims.height / 2; // Ceiling

  const clampedX = Math.max(worldMinX, Math.min(pos.x, worldMaxX));
  const clampedZ = Math.max(worldMinZ_depth, Math.min(pos.z, worldMaxZ_depth));
  const clampedY = Math.max(worldMinY_height, Math.min(pos.y, worldMaxY_height));

  if (pos.x !== clampedX || pos.y !== clampedY || pos.z !== clampedZ) {
    updateActiveBlockPosition(clampedX, clampedY, clampedZ);
    // console.log("Block position clamped by enforceVisualBoundaries.");
  }
}

export function getActiveBlock(): AFRAME.Entity | null {
  return activeBlock;
}

console.log('game-logic.ts loaded with advanced features, awaiting initialization.');
