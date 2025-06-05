import AFRAME from 'aframe';
import { Config, BoardDimensions, BlockShapeDefinition, BlockShapeUnit } from './config'; // Assuming these are correctly defined

// Module-level state
let activeBlock: AFRAME.Entity | null = null;
let gameBoardDimensions: BoardDimensions | null = null;
let sceneRef: AFRAME.Scene | null = null;
let configRef: Config | null = null;
let boardState: (AFRAME.Entity | string | null)[][][] = []; // Represents the grid of settled blocks
let currentDepthColors: string[] = []; // For wall palette shifting (if used by settled blocks)

// Game Loop & Score
let gameLoopIntervalId: number | null = null;
let currentScore: number = 0;

// HUD Manager Reference
let hudManagerRef: any = null; 

// Block Generation
let sevenBag: string[] = []; // For 7-bag randomizer
const ALL_SHAPE_KEYS = ["I", "O", "L", "J", "S", "Z", "T"]; // Standard Tetris shapes

// Ghost Piece
let ghostPieceEntity: AFRAME.Entity | null = null;
let isGhostPieceActive: boolean = false; // Controlled by config and 'G' key

// Constants
const JOYSTICK_DEAD_ZONE = 0.2;
const MOVEMENT_STEP_XZ = 0.1; // For continuous joystick movement
const MOVEMENT_STEP_Y = 0.08;
const SIGNIFICANT_JOYSTICK_Y_THRESHOLD = 0.7;
const ROTATION_INCREMENT = 90; // Standard Tetris rotation increment

// --- Initialization ---
export function initGameLogic(
  sceneElement: AFRAME.Scene,
  gameConfig: Config,
  boardDims: BoardDimensions
) {
  sceneRef = sceneElement;
  configRef = gameConfig;
  gameBoardDimensions = boardDims;

  if (!gameBoardDimensions || !configRef || !configRef.initialFallSpeed || 
      !configRef.basePointsPerLine || configRef.nextBlocksPreviewCount === undefined ||
      !configRef.blockShapes || typeof configRef.ghostPieceEnabled !== 'boolean') {
    console.error("Critical configuration missing for initGameLogic. Aborting.");
    return;
  }

  // Initialize HUD Manager reference
  const hudEntity = sceneRef.querySelector('#hud');
  if (hudEntity && hudEntity.components && hudEntity.components['hud-manager']) {
    hudManagerRef = hudEntity.components['hud-manager'];
    console.log("HUD Manager reference obtained in game-logic.");
  } else {
    console.warn("HUD Manager component not found on #hud entity. HUD will not be updated from game-logic.");
  }

  currentDepthColors = [...configRef.depthColors];
  currentScore = 0;
  hudManagerRef?.updateScore(currentScore);

  // Initialize boardState based on dimensions: boardState[x][y_height][z_depth]
  boardState = new Array(gameBoardDimensions.x).fill(null).map(() =>
    new Array(gameBoardDimensions.z).fill(null).map(() => // Y-axis is height (config.z)
      new Array(gameBoardDimensions.y).fill(null)      // Z-axis is depth/length (config.y)
    )
  );

  initializeBlockGenerator(); // Prepare 7-bag or random
  
  // Ghost Piece Initialization
  isGhostPieceActive = configRef.ghostPieceEnabled;
  if (sceneRef) { // Ensure sceneRef is available
    ghostPieceEntity = sceneRef.createElement('a-entity');
    // Ghost piece will get its shape from game-block component, just like activeBlock
    // We will set its attributes when updateGhostPiece is called.
    // For now, just make it invisible.
    ghostPieceEntity.setAttribute('visible', false);
    sceneRef.appendChild(ghostPieceEntity);
    console.log("Ghost piece entity created and added to scene, initially invisible.");
  } else {
    console.error("Scene reference not available for ghost piece creation.");
  }


  activeBlock = spawnNewBlock(); // Spawns the first block
  if (!activeBlock) {
    console.log("Initial spawn failed, game over scenario triggered.");
    return; 
  }

  setupControllerListeners();
  setupKeyboardListeners(); // For ghost piece toggle
  
  if (gameLoopIntervalId) clearInterval(gameLoopIntervalId);
  gameLoopIntervalId = window.setInterval(gameTick, configRef.initialFallSpeed);

  console.log(`Game logic initialized. Ghost piece: ${isGhostPieceActive}.`);
}

function setupControllerListeners() {
  const rightController = sceneRef?.querySelector('#right-controller') as AFRAME.Entity;
  const leftController = sceneRef?.querySelector('#left-controller') as AFRAME.Entity;

  if (rightController) {
    rightController.addEventListener('axismove', handleRightControllerAxisMove);
    rightController.addEventListener('triggerdown', handleHardDrop);
  } else console.error("Right controller not found.");

  if (leftController) {
    leftController.addEventListener('axismove', handleLeftControllerAxisMove);
  } else console.error("Left controller not found.");
}

function setupKeyboardListeners() {
    window.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'g') {
            isGhostPieceActive = !isGhostPieceActive;
            console.log(`Ghost piece toggled: ${isGhostPieceActive ? 'ON' : 'OFF'}`);
            updateGhostPiece(); // Update visibility and position immediately
        }
    });
}


// --- Block Generation (7-bag or Random) ---
function initializeBlockGenerator() {
  if (configRef?.blockGenerationSystem === "7-bag") {
    fillSevenBag();
  }
}

function fillSevenBag() {
  sevenBag = [...ALL_SHAPE_KEYS]; // Copy all standard shapes
  // Fisher-Yates shuffle
  for (let i = sevenBag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sevenBag[i], sevenBag[j]] = [sevenBag[j], sevenBag[i]];
  }
  console.log("7-bag refilled and shuffled:", sevenBag);
}

function getNextShapeName(): string {
  if (!configRef || !configRef.blockShapes) {
    console.error("Config or blockShapes not available for getNextShapeName.");
    return ALL_SHAPE_KEYS[0]; // Fallback
  }

  if (configRef.blockGenerationSystem === "7-bag") {
    if (sevenBag.length === 0) {
      fillSevenBag();
    }
    return sevenBag.pop() || ALL_SHAPE_KEYS[0]; // Pop from bag, fallback if somehow empty
  } else { // Random generation
    const shapeNames = Object.keys(configRef.blockShapes);
    return shapeNames[Math.floor(Math.random() * shapeNames.length)];
  }
}

// --- Game Loop Tick ---
function gameTick() {
  if (!activeBlock || !gameBoardDimensions || !configRef) {
    if (gameLoopIntervalId) clearInterval(gameLoopIntervalId);
    return;
  }

  const blockComp = activeBlock.components['game-block'] as any;
  if (!blockComp) { if (gameLoopIntervalId) clearInterval(gameLoopIntervalId); return; }
  
  const currentPos = activeBlock.getAttribute('position') as THREE.Vector3;
  const potentialY = currentPos.y - 1; // Move one world unit down

  if (checkCollision(activeBlock, {x: currentPos.x, y: potentialY, z: currentPos.z }, activeBlock.getAttribute('rotation'))) {
    const landedAtY = Math.round(currentPos.y + gameBoardDimensions.z / 2 - 0.5); // Get board Y index
    settleBlock(activeBlock, landedAtY); 
    const clearedLines = checkForLineClears();
    if (clearedLines > 0) updateScore(clearedLines);
    
    activeBlock = spawnNewBlock(); 
    if (!activeBlock && gameLoopIntervalId) { 
        console.log("Game Over! (Detected in gameTick after spawn attempt)");
    }
  } else {
    updateActiveBlockPosition(currentPos.x, potentialY, currentPos.z);
  }
  updateGhostPiece(); // Update ghost piece after any active block movement
}

// --- Scoring System ---
function updateScore(clearedLines: number) {
  if (!configRef || clearedLines <= 0) return;
  let pointsEarned = 0;
  const base = configRef.basePointsPerLine;
  const multiplier = configRef.scoreMultiplierEasy || 1.0; 

  if (clearedLines === 1) pointsEarned = base * multiplier;
  else if (clearedLines > 1) {
    const term = base * clearedLines;
    pointsEarned = Math.pow(term, clearedLines) * multiplier;
    if (!isFinite(pointsEarned)) pointsEarned = Number.MAX_SAFE_INTEGER / 2;
  }
  currentScore += pointsEarned;
  hudManagerRef?.updateScore(currentScore);
}

// --- Next Block Preview Update ---
function updateNextBlocksPreview() {
    if (!hudManagerRef || !configRef || !configRef.blockShapes || configRef.nextBlocksPreviewCount === undefined) return;
    const count = configRef.nextBlocksPreviewCount;
    if (count <= 0) { hudManagerRef.updateNextBlocks([]); return; }
    
    const placeholderShapes: string[] = [];
    // Peek into the 7-bag or generate random names for preview
    if (configRef.blockGenerationSystem === "7-bag") {
        let tempBag = [...sevenBag]; // Copy to not modify the actual bag
        if (tempBag.length === 0) { // If current bag is empty, simulate filling it
            const allShapeKeysTemp = [...ALL_SHAPE_KEYS];
            for (let i = allShapeKeysTemp.length - 1; i > 0; i--) { // Shuffle
                const j = Math.floor(Math.random() * (i + 1));
                [allShapeKeysTemp[i], allShapeKeysTemp[j]] = [allShapeKeysTemp[j], allShapeKeysTemp[i]];
            }
            tempBag = allShapeKeysTemp;
        }
        // Get previews from the end of tempBag (as pop takes from end)
        for (let i = 0; i < count; i++) {
            if (tempBag.length > i) {
                 placeholderShapes.push(tempBag[tempBag.length - 1 - i]); // Peek
            } else { // If not enough in current/next bag, show fewer or placeholder
                 placeholderShapes.push("?");
            }
        }
    } else { // Random
        const shapeNames = Object.keys(configRef.blockShapes);
        for (let i = 0; i < count; i++) {
            placeholderShapes.push(shapeNames[Math.floor(Math.random() * shapeNames.length)]);
        }
    }
    hudManagerRef.updateNextBlocks(placeholderShapes);
}


// --- Block Spawning & Game Over Check ---
export function spawnNewBlock(): AFRAME.Entity | null {
  if (!sceneRef || !configRef || !gameBoardDimensions || !configRef.blockShapes) {
    console.error("Cannot spawn block: Critical refs missing.");
    return null;
  }

  updateNextBlocksPreview(); 

  const shapeName = getNextShapeName();
  const shapeDefinition = configRef.blockShapes[shapeName];
  if (!shapeDefinition) {
    console.error(`Shape definition for '${shapeName}' not found in config.`);
    return null; 
  }

  const blockEntity = sceneRef.createElement('a-entity');
  blockEntity.setAttribute('game-block', {
    shapeUnits: shapeDefinition.units,
    shapeColor: shapeDefinition.color,
  });

  // Initial position: Center X, Top of board Y, Center Z (depth)
  // Pivot of the shape is at (0,0,0) local. We need to adjust for board center.
  // For X: board width is 10, so center is 4.5. If pivot is 0, place at boardX = Math.floor(dimX/2) = 5
  // However, our boardState[x] means x is an integer. Block's units are relative.
  // Start position is relative to the game-board entity's center (0,0,0 world for board).
  // If board width is 10, world X ranges from -5 to +5. Pivot at world X=0.
  // Block units are e.g. -1, 0, 1. So, a block at world X=0 will have units at -1, 0, 1.
  // These need to map to boardState indices 4, 5, 6 if board center (X=0) is between index 4 and 5.
  // Our current worldToBoardCoords: boardX = Math.round(worldX + gameBoardDimensions.x / 2 - 0.5);
  // If worldX=0, boardX = Math.round(0 + 10/2 - 0.5) = Math.round(4.5) = 5. This is good.
  const startX = 0; 
  const startY = (gameBoardDimensions.z / 2) - 0.5; // Top row, center of cell
  const startZ = 0; // Center of depth (boardDim.y / 2 - 0.5 if y > 1)

  blockEntity.setAttribute('position', { x: startX, y: startY, z: startZ });
  blockEntity.setAttribute('rotation', { x: 0, y: 0, z: 0 }); 
  
  // Game Over Check
  if (checkCollision(blockEntity, {x: startX, y: startY, z: startZ}, {x:0, y:0, z:0})) {
    console.log(`%cGame Over! Collision on spawn of ${shapeName} at start position.`, "color:red; font-weight:bold;");
    if (gameLoopIntervalId) { clearInterval(gameLoopIntervalId); gameLoopIntervalId = null; }
    hudManagerRef?.updateScore(currentScore); 
    hudManagerRef?.updateNextBlocks(["GAME", "OVER"]); 
    activeBlock = null; 
    return null; 
  }

  sceneRef.appendChild(blockEntity);
  console.log(`Spawned new ${shapeName} block.`);
  updateGhostPiece(); // Update ghost for the new block
  return blockEntity; 
}


// --- Ghost Piece Logic ---
function updateGhostPiece() {
    if (!ghostPieceEntity || !activeBlock || !isGhostPieceActive || !configRef || !configRef.blockShapes) {
        ghostPieceEntity?.setAttribute('visible', false);
        return;
    }

    const activeBlockComp = activeBlock.components['game-block'] as any;
    if (!activeBlockComp) {
        ghostPieceEntity.setAttribute('visible', false);
        return;
    }

    // Sync ghost piece's shape and color with active block
    const currentShapeUnits = activeBlockComp.getShapeUnits();
    const currentShapeColor = activeBlock.getAttribute('game-block').shapeColor; // Get from attribute directly
    
    // Check if ghost piece has game-block component, if not, add it.
    let ghostBlockComp = ghostPieceEntity.components['game-block'] as any;
    if (!ghostBlockComp) {
        ghostPieceEntity.setAttribute('game-block', {
            shapeUnits: currentShapeUnits,
            shapeColor: '#808080' // Default ghost color
        });
        ghostBlockComp = ghostPieceEntity.components['game-block'];
        ghostBlockComp?.setOpacity(0.3); // Set ghost opacity
    } else {
        // Update existing ghost piece shape if different (e.g. if it was for a different block type before)
        ghostPieceEntity.setAttribute('game-block', 'shapeUnits', currentShapeUnits);
        // Ghost color usually fixed, but can sync if desired: ghostBlockComp.setColor(currentShapeColor);
        ghostBlockComp.setOpacity(0.3); // Ensure opacity is set
    }
    
    const currentPos = activeBlock.getAttribute('position') as THREE.Vector3;
    const currentRot = activeBlock.getAttribute('rotation') as THREE.Vector3;
    ghostPieceEntity.setAttribute('rotation', currentRot); // Match rotation

    let ghostY = currentPos.y;
    // Project downwards to find landing spot
    for (let y = currentPos.y; y >= (-gameBoardDimensions.z / 2); y -= 1) { // Iterate one world unit at a time
        if (checkCollision(activeBlock, { x: currentPos.x, y: y, z: currentPos.z }, currentRot)) {
            ghostY = y + 1; // Collision at y, so ghost is one unit above
            break;
        }
        ghostY = y; // This y is valid
    }
    
    ghostPieceEntity.setAttribute('position', { x: currentPos.x, y: ghostY, z: currentPos.z });
    ghostPieceEntity.setAttribute('visible', true);
}


// --- Coordinate Conversion & Validation ---
// Converts world coordinates (center of a block's pivot) to discrete boardState array indices.
function worldToBoardCoords(worldX: number, worldY: number, worldZ: number): { x: number, y: number, z: number } | null {
  if (!gameBoardDimensions) return null;
  // board origin (0,0,0) in array maps to world (-width/2, -height_of_well/2, -depth_into_scene/2)
  // For a unit at world (wx, wy, wz), its board index is (round(wx + dimX/2 - 0.5), ...)
  const boardX = Math.round(worldX + gameBoardDimensions.x / 2 - 0.5);
  const boardY_height = Math.round(worldY + gameBoardDimensions.z / 2 - 0.5); // gameBoardDimensions.z is height of well
  const boardZ_depth = Math.round(worldZ + gameBoardDimensions.y / 2 - 0.5); // gameBoardDimensions.y is depth into scene
  return { x: boardX, y: boardY_height, z: boardZ_depth };
}

function isValidBoardCoord(bx: number, by_height: number, bz_depth: number): boolean {
  if (!gameBoardDimensions) return false;
  return bx >= 0 && bx < gameBoardDimensions.x &&
         by_height >= 0 && by_height < gameBoardDimensions.z && // Y index for height
         bz_depth >= 0 && bz_depth < gameBoardDimensions.y;   // Z index for depth
}

// --- Collision Detection (for multi-unit shapes) ---
// Checks collision for EACH UNIT of the block at a given potential pivot position and rotation.
function checkCollision(
    blockEntityToCheck: AFRAME.Entity, 
    potentialPivotPos: {x: number, y: number, z: number}, 
    potentialPivotRotDeg: {x: number, y: number, z: number} // Degrees
): boolean {
  if (!blockEntityToCheck || !gameBoardDimensions || !configRef || !configRef.blockShapes) return true;

  const blockComp = blockEntityToCheck.components['game-block'] as any;
  if (!blockComp) return true;
  const shapeUnits = blockComp.getShapeUnits() as BlockShapeUnit[];

  // Create a temporary THREE.Object3D to handle rotation transformation for each unit
  const tempObject = new AFRAME.THREE.Object3D();
  tempObject.position.set(potentialPivotPos.x, potentialPivotPos.y, potentialPivotPos.z);
  tempObject.rotation.set(
    AFRAME.THREE.MathUtils.degToRad(potentialPivotRotDeg.x),
    AFRAME.THREE.MathUtils.degToRad(potentialPivotRotDeg.y),
    AFRAME.THREE.MathUtils.degToRad(potentialPivotRotDeg.z)
  );
  tempObject.updateMatrixWorld(); // Important to apply transformations

  for (const unit of shapeUnits) {
    const localUnitPos = new AFRAME.THREE.Vector3(unit.x, unit.y, unit.z);
    const worldUnitPos = localUnitPos.applyMatrix4(tempObject.matrixWorld);

    // 1. Boundary Collision (World Coordinates for each unit)
    const unitRadius = 0.5; // Assuming unit block is 1x1x1, radius from center is 0.5
    if ( (worldUnitPos.y - unitRadius) < (-gameBoardDimensions.z / 2) || // Floor
         (worldUnitPos.y + unitRadius) > (gameBoardDimensions.z / 2)  || // Ceiling
         (worldUnitPos.x - unitRadius) < (-gameBoardDimensions.x / 2) || // Left wall
         (worldUnitPos.x + unitRadius) > (gameBoardDimensions.x / 2)  || // Right wall
         (worldUnitPos.z - unitRadius) < (-gameBoardDimensions.y / 2) || // Back wall (depth)
         (worldUnitPos.z + unitRadius) > (gameBoardDimensions.y / 2) ) { // Front wall (depth)
        return true; // Collision with boundary
    }

    // 2. Settled Block Collision (Board Coordinates for each unit)
    const bCoords = worldToBoardCoords(worldUnitPos.x, worldUnitPos.y, worldUnitPos.z);
    if (!bCoords || !isValidBoardCoord(bCoords.x, bCoords.y, bCoords.z)) {
      // This unit is outside the discrete board grid (even if within continuous world bounds for pivot)
      return true; 
    }
    if (boardState[bCoords.x][bCoords.y][bCoords.z] !== null) {
      // If the cell is occupied by anything other than the current activeBlock itself
      // (This check is more relevant if boardState stores direct entity refs and we are checking activeBlock against itself)
      // For now, if it's not null, it's a collision.
      return true; 
    }
  }
  return false; // No collision for any unit
}


// --- Block Settling & Line Clearing Logic (for multi-unit shapes) ---
function settleBlock(blockToSettle: AFRAME.Entity, landedAtBoardY: number) {
  if (!blockToSettle || !gameBoardDimensions || !configRef) return;

  const blockComp = blockToSettle.components['game-block'] as any;
  if (!blockComp) return;
  
  const shapeUnits = blockComp.getShapeUnits() as BlockShapeUnit[];
  const worldPivotPos = blockComp.getWorldPosition(); // THREE.Vector3
  const worldPivotRot = blockComp.getWorldRotation(); // THREE.Euler (radians)

  // Apply rotation to each unit to get its world offset, then add pivot's world position
  const tempObject = new AFRAME.THREE.Object3D();
  tempObject.position.copy(worldPivotPos);
  tempObject.rotation.copy(worldPivotRot);
  tempObject.updateMatrixWorld();

  shapeUnits.forEach((unit: BlockShapeUnit) => {
    const localUnitPos = new AFRAME.THREE.Vector3(unit.x, unit.y, unit.z);
    const worldUnitPos = localUnitPos.applyMatrix4(tempObject.matrixWorld);
    const bCoords = worldToBoardCoords(worldUnitPos.x, worldUnitPos.y, worldUnitPos.z);

    if (bCoords && isValidBoardCoord(bCoords.x, bCoords.y, bCoords.z)) {
      // Store a reference to the main block entity in each cell it occupies
      boardState[bCoords.x][bCoords.y][bCoords.z] = blockToSettle; 
    } else {
      console.error("Failed to settle a unit of block: invalid board coordinates for unit", {unit, worldUnitPos, bCoords});
    }
  });

  // Finalize the look of the settled block (opacity, color by depth, level number)
  blockComp.finalizeLook(landedAtBoardY, configRef);


  if (activeBlock === blockToSettle) activeBlock = null;
  console.log(`Block settled. Units added to boardState.`);
}

function checkForLineClears(): number {
  if (!gameBoardDimensions || !sceneRef) return 0;
  let linesCleared = 0;
  // Iterate Y-layers (height) from bottom (0) to top (boardDim.z - 1)
  for (let y_height = 0; y_height < gameBoardDimensions.z; y_height++) {
    let layerFull = true;
    // For a 2D game (boardDimensions.y is 1), the inner z_depth loop runs once.
    for (let x = 0; x < gameBoardDimensions.x; x++) {
      for (let z_depth = 0; z_depth < gameBoardDimensions.y; z_depth++) {
        if (boardState[x][y_height][z_depth] === null) {
          layerFull = false; break; 
        }
      }
      if (!layerFull) break;
    }

    if (layerFull) {
      clearLayer(y_height);
      shiftBlocksDown(y_height);
      shiftPalette(); 
      linesCleared++;
      y_height--; // Re-check the current layer index
    }
  }
  return linesCleared;
}

function clearLayer(layerY_height: number) { 
  if (!gameBoardDimensions || !sceneRef) return;
  // Keep track of main block entities to remove them once, not per unit
  const entitiesToRemove = new Set<AFRAME.Entity>();

  for (let x = 0; x < gameBoardDimensions.x; x++) {
    for (let z_depth = 0; z_depth < gameBoardDimensions.y; z_depth++) {
      const cellContent = boardState[x][layerY_height][z_depth];
      if (cellContent instanceof AFRAME.Entity) {
        entitiesToRemove.add(cellContent); // Add main block entity
      }
      boardState[x][layerY_height][z_depth] = null; 
    }
  }
  entitiesToRemove.forEach(entity => {
    entity.parentNode?.removeChild(entity);
  });
}

function shiftBlocksDown(clearedLayerY_height: number) { 
  if (!gameBoardDimensions || !sceneRef) return;
  const movedEntities = new Set<AFRAME.Entity>(); // Track entities already moved in this shift operation

  for (let y = clearedLayerY_height; y < gameBoardDimensions.z - 1; y++) {
    for (let x = 0; x < gameBoardDimensions.x; x++) {
      for (let z_depth = 0; z_depth < gameBoardDimensions.y; z_depth++) {
        const cellAbove = boardState[x][y + 1][z_depth];
        boardState[x][y][z_depth] = cellAbove; 
        
        if (cellAbove instanceof AFRAME.Entity && !movedEntities.has(cellAbove)) {
          const blockComp = cellAbove.components['game-block'] as any;
          if (blockComp) {
            const currentPos = cellAbove.getAttribute('position') as THREE.Vector3;
            // Move the entire block entity down by 1 world unit
            cellAbove.setAttribute('position', { x: currentPos.x, y: currentPos.y - 1, z: currentPos.z });
            movedEntities.add(cellAbove); // Mark as moved for this shift pass
            
            // Update landedLevel for color after shifting if showLevelNumbersOnBlocks or depth coloring is on
            if (configRef?.showLevelNumbersOnBlocks || (configRef?.depthColors && configRef.depthColors.length > 0)) {
                const newBoardY = Math.round( (currentPos.y - 1) + gameBoardDimensions.z / 2 - 0.5);
                blockComp.finalizeLook(newBoardY, configRef);
            }
          }
        }
      }
    }
  }
  // Clear the top layer as its contents have shifted down
  for (let x = 0; x < gameBoardDimensions.x; x++) {
    for (let z_depth = 0; z_depth < gameBoardDimensions.y; z_depth++) {
      boardState[x][gameBoardDimensions.z - 1][z_depth] = null;
    }
  }
}

function shiftPalette() {
  if (currentDepthColors.length > 0) {
    const bottomColor = currentDepthColors.shift(); 
    if (bottomColor) currentDepthColors.push(bottomColor); 
  }
}

// --- Controller Event Handlers (adapted for multi-unit collision) ---
function handleRightControllerAxisMove(evt: any) {
  if (!activeBlock || !gameBoardDimensions) return;
  const stickXRaw = evt.detail.axis[0] ?? evt.detail.axis[2] ?? 0;
  const stickYRaw = evt.detail.axis[1] ?? evt.detail.axis[3] ?? 0;
  const currentPos = activeBlock.getAttribute('position') as THREE.Vector3;
  const currentRot = activeBlock.getAttribute('rotation') as THREE.Vector3; // Degrees
  let newX = currentPos.x; let newY = currentPos.y; let newZ = currentPos.z;

  if (Math.abs(stickXRaw) > JOYSTICK_DEAD_ZONE) newX += (stickXRaw > 0 ? 1 : -1); // Move by 1 world unit
  if (Math.abs(stickYRaw) > JOYSTICK_DEAD_ZONE) newZ += (stickYRaw > 0 ? 1 : -1); // Stick Y for Z-depth by 1 world unit
  
  // Y-axis movement from joystick (if pushed significantly) - discrete steps
  if (stickYRaw < -SIGNIFICANT_JOYSTICK_Y_THRESHOLD) newY += 1; 
  else if (stickYRaw > SIGNIFICANT_JOYSTICK_Y_THRESHOLD) newY -= 1;
  
  // Try to move only if the new position is valid
  if (!checkCollision(activeBlock, {x: newX, y: newY, z: newZ}, currentRot)) {
    updateActiveBlockPosition(newX, newY, newZ);
  } else { // If combined move fails, try XZ only, then Y only
      if (newX !== currentPos.x || newZ !== currentPos.z) { // If XZ movement was intended
          if (!checkCollision(activeBlock, {x: newX, y: currentPos.y, z: newZ}, currentRot)) {
              updateActiveBlockPosition(newX, currentPos.y, newZ);
          }
      }
      if (newY !== currentPos.y) { // If Y movement was intended (and XZ might have failed or not happened)
          const finalX = activeBlock.getAttribute('position').x; // Use potentially updated X
          const finalZ = activeBlock.getAttribute('position').z; // Use potentially updated Z
          if (!checkCollision(activeBlock, {x: finalX, y: newY, z: finalZ}, currentRot)) {
              updateActiveBlockPosition(finalX, newY, finalZ);
          }
      }
  }
  updateGhostPiece();
}

function handleHardDrop() {
  if (!activeBlock || !gameBoardDimensions || !configRef) return;
  const currentPos = activeBlock.getAttribute('position') as THREE.Vector3;
  const currentRot = activeBlock.getAttribute('rotation') as THREE.Vector3; // Degrees
  let landingY = currentPos.y;

  for (let y = currentPos.y; y >= (-gameBoardDimensions.z / 2); y -= 1) {
    if (checkCollision(activeBlock, { x: currentPos.x, y: y -1, z: currentPos.z }, currentRot)) { // Check one step below
      landingY = y; break; 
    }
    landingY = y; // This y is valid if loop continues
  }
  updateActiveBlockPosition(currentPos.x, landingY, currentPos.z);
  
  const landedAtBoardY = Math.round(landingY + gameBoardDimensions.z / 2 - 0.5);
  settleBlock(activeBlock, landedAtBoardY); 
  const clearedLines = checkForLineClears();
  if (clearedLines > 0) updateScore(clearedLines);
  
  activeBlock = spawnNewBlock(); 
  if (!activeBlock && gameLoopIntervalId) console.log("Game Over! (Detected in hardDrop)");
  updateGhostPiece(); // Update ghost after new block (or if game over, will hide it)
}

function handleLeftControllerAxisMove(evt: any) {
  if (!activeBlock) return;
  const stickXRaw = evt.detail.axis[0] ?? evt.detail.axis[2] ?? 0;
  const stickYRaw = evt.detail.axis[1] ?? evt.detail.axis[3] ?? 0;
  const currentPos = activeBlock.getAttribute('position') as THREE.Vector3;
  const currentRot = activeBlock.getAttribute('rotation') as THREE.Vector3; // Degrees
  let newRot = {...currentRot};

  if (Math.abs(stickXRaw) > JOYSTICK_DEAD_ZONE) {
    newRot.y += stickXRaw > 0 ? -ROTATION_INCREMENT : ROTATION_INCREMENT; // Yaw
  }
  // For simplicity, only one rotation per axis event for now (e.g. no pitch if yawing)
  else if (Math.abs(stickYRaw) > JOYSTICK_DEAD_ZONE) { 
    newRot.x += stickYRaw > 0 ? -ROTATION_INCREMENT : ROTATION_INCREMENT; // Pitch
  } else {
    return; // No significant joystick movement
  }
  
  if (!checkCollision(activeBlock, currentPos, newRot)) { 
    activeBlock.setAttribute('rotation', newRot);
  } else {
    // Basic wall kick: try moving 1 unit left/right if rotation failed
    let kicked = false;
    for (const dx of [-1, 1]) { // Try moving 1 unit on X
        const kickedPos = { ...currentPos, x: currentPos.x + dx };
        if (!checkCollision(activeBlock, kickedPos, newRot)) {
            activeBlock.setAttribute('position', kickedPos);
            activeBlock.setAttribute('rotation', newRot);
            kicked = true;
            break;
        }
    }
    if (!kicked) console.log("Rotation failed, collision even with kick attempt.");
  }
  updateGhostPiece();
}

// --- Position Update & Boundary (Visual only, collision handles game logic boundaries) ---
function updateActiveBlockPosition(x: number, y: number, z: number) {
  if (!activeBlock) return;
  activeBlock.setAttribute('position', { x, y, z });
  // Ghost piece update is usually called after this by the main handlers
}

export function getActiveBlock(): AFRAME.Entity | null { return activeBlock; }

console.log('game-logic.ts (multi-unit aware) overwritten.');
