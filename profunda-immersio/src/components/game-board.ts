import AFRAME from 'aframe';
import { loadConfig, Config, BoardDimensions } from '../config'; // Assuming Config interface is exported

const GRID_LINE_COLOR = '#CCCCCC';
const WALL_THICKNESS = 0.1;

AFRAME.registerComponent('game-board', {
  schema: {
    // We can define properties here if we want them to be configurable from HTML
    // For now, we'll pull directly from config.ts
  },

  // Store config and dimensions for access by other methods
  config: null as Config | null,
  boardDim: null as BoardDimensions | null,
  depthColors: [] as string[],

  async init() {
    try {
      const config = await loadConfig();
      if (!config || !config.boardDimensions || !config.depthColors) {
        console.error('Game board: Configuration not loaded or incomplete!');
        return;
      }
      this.config = config;
      // Studnia Width (X-axis): config.boardDimensions.x
      // Studnia Length/Depth into scene (Z-axis A-Frame): config.boardDimensions.y
      // Studnia Height/Depth of well (Y-axis A-Frame): config.boardDimensions.z
      this.boardDim = config.boardDimensions;
      this.depthColors = config.depthColors;

      this.createBoardBase();
      this.createWalls();
      this.createGridLines();

    } catch (error) {
      console.error('Error initializing game board:', error);
    }
  },

  createBoardBase() {
    if (!this.el || !this.boardDim) return;
    const el = this.el;
    const boardDim = this.boardDim;

    // Floor plane
    const floor = document.createElement('a-plane');
    floor.setAttribute('width', boardDim.x); // Spans studnia width
    floor.setAttribute('height', boardDim.y); // Spans studnia length/depth into scene
    floor.setAttribute('rotation', '-90 0 0'); // Rotate to be horizontal
    // Position its center at X=0, Z=0 (relative to game-board entity).
    // Its top surface will be at Y = -boardDim.z / 2 (bottom of the well)
    floor.setAttribute('position', `0 ${-boardDim.z / 2} 0`);
    floor.setAttribute('color', '#444444');
    floor.setAttribute('roughness', '0.8');
    el.appendChild(floor);
  },

  createWalls() {
    if (!this.el || !this.boardDim || !this.depthColors) return;
    const el = this.el;
    const boardDim = this.boardDim; // x: width, y: length/depth into scene, z: height of well
    const depthColors = this.depthColors;
    const segmentHeight = 1; // Each segment of the wall is 1 unit high (along Y-axis)

    // Wall definitions: [isSideWall, xCenter, zCenter, wallWidth, wallLength (depth into scene)]
    const wallPositions = [
      { id: 'back', x: 0, z: -boardDim.y / 2, w: boardDim.x, l: WALL_THICKNESS },
      { id: 'front', x: 0, z: boardDim.y / 2, w: boardDim.x, l: WALL_THICKNESS },
      { id: 'left', x: -boardDim.x / 2, z: 0, w: WALL_THICKNESS, l: boardDim.y },
      { id: 'right', x: boardDim.x / 2, z: 0, w: WALL_THICKNESS, l: boardDim.y },
    ];

    wallPositions.forEach(wall => {
      // Skip front wall to have an open view, common in Tetris-like games
      if (wall.id === 'front') return;

      for (let i = 0; i < boardDim.z; i++) { // Iterate for each layer of the well's height
        const segment = document.createElement('a-box');
        // Y position for the center of the segment
        const yPos = (-boardDim.z / 2) + (segmentHeight / 2) + i * segmentHeight;
        const color = depthColors[i % depthColors.length];

        segment.setAttribute('width', wall.w);
        segment.setAttribute('height', segmentHeight);
        segment.setAttribute('depth', wall.l);
        segment.setAttribute('position', `${wall.x} ${yPos} ${wall.z}`);
        segment.setAttribute('color', color);
        segment.setAttribute('material', 'roughness: 0.8; metalness: 0.2'); // Add some material properties
        el.appendChild(segment);
      }
    });
  },

  createGridLines() {
    if (!this.el || !this.boardDim) return;
    const el = this.el;
    const boardDim = this.boardDim; // x: width, y: length/depth into scene, z: height of well
    const gridLineThickness = 0.02;

    // Grid lines for each layer of the well's height (along Y-axis)
    // These lines form a grid on the XZ plane for each Y level.
    for (let yLevelIndex = 0; yLevelIndex < boardDim.z; yLevelIndex++) {
      // Position the grid slightly above the bottom of the cell, or at the top boundary of the cell
      const yPos = (-boardDim.z / 2) + (yLevelIndex + 1) - (gridLineThickness / 2) ;


      // Lines parallel to X-axis (spanning studnia width)
      // These are drawn for each unit of studnia length/depth (boardDim.y)
      for (let i = 0; i <= boardDim.y; i++) {
        const line = document.createElement('a-box');
        line.setAttribute('width', boardDim.x);
        line.setAttribute('height', gridLineThickness);
        line.setAttribute('depth', gridLineThickness);
        // Position: center X, current Y level, z ranges from -boardDim.y/2 to +boardDim.y/2
        line.setAttribute('position', `0 ${yPos} ${-boardDim.y / 2 + i}`);
        line.setAttribute('color', GRID_LINE_COLOR);
        line.setAttribute('material', 'shader: flat; emissive: ${GRID_LINE_COLOR}; emissiveIntensity: 0.5');
        el.appendChild(line);
      }

      // Lines parallel to Z-axis (spanning studnia length/depth)
      // These are drawn for each unit of studnia width (boardDim.x)
      for (let i = 0; i <= boardDim.x; i++) {
        const line = document.createElement('a-box');
        line.setAttribute('width', gridLineThickness);
        line.setAttribute('height', gridLineThickness);
        line.setAttribute('depth', boardDim.y);
        // Position: x ranges from -boardDim.x/2 to +boardDim.x/2, current Y level, center Z
        line.setAttribute('position', `${-boardDim.x / 2 + i} ${yPos} 0`);
        line.setAttribute('color', GRID_LINE_COLOR);
        line.setAttribute('material', 'shader: flat; emissive: ${GRID_LINE_COLOR}; emissiveIntensity: 0.5');
        el.appendChild(line);
      }
    }
  }
});
console.log('game-board component registered with A-Frame.'); // For debugging
