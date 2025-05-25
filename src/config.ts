import yaml from 'js-yaml';

export interface BoardDimensions {
  x: number; // Width
  y: number; // Depth/Length into scene
  z: number; // Height of well/studnia (A-Frame Y-axis)
}

export interface AllowedSize extends BoardDimensions { // Not currently used by game logic
  name: string;
}

export interface GameMessages {
  gameOver: string;
  newLevel: string;
}

// Structure for a single unit (1x1x1 box) within a block shape
export interface BlockShapeUnit {
  x: number; // Relative x position from the shape's pivot
  y: number; // Relative y position from the shape's pivot
  z: number; // Relative z position from the shape's pivot (should be 0 for 2D feel on XY plane)
}

// Structure for a block shape definition from config.yaml
export interface BlockShapeDefinition {
  color: string; // Hex color string for this shape
  units: BlockShapeUnit[]; // Array of relative unit positions
}

// Type for the collection of all block shapes, keyed by shape name (e.g., "I", "L")
export interface BlockShapes {
  [shapeName: string]: BlockShapeDefinition;
}

export interface Config {
  boardDimensions: BoardDimensions;
  allowedSizes: AllowedSize[];
  depthColors: string[]; // For wall segments
  initialFallSpeed: number; // Milliseconds for one step down
  blockGenerationSystem: "random" | "7-bag"; // Type of block generator
  nextBlocksPreviewCount: number;
  gameMessages: GameMessages;
  
  // Scoring
  basePointsPerLine: number;
  scoreMultiplierEasy: number;
  scoreMultiplierMedium: number;
  scoreMultiplierHard: number;

  // Optional Features
  showLevelNumbersOnBlocks: boolean;
  blockShapes: BlockShapes; // Definitions for all available block shapes
  ghostPieceEnabled: boolean; // Added for ghost piece feature
}

let config: Config | null = null; // Singleton instance of the loaded configuration

export async function loadConfig(): Promise<Config> {
  if (config) {
    return config; // Return cached config if already loaded
  }

  try {
    const response = await fetch('/config.yaml'); // Assumes config.yaml is in the /public folder
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} while fetching /config.yaml`);
    }
    const yamlText = await response.text();
    const loadedConfig = yaml.load(yamlText) as Config; // Type assertion
    
    // --- Configuration Validation ---
    if (!loadedConfig || typeof loadedConfig !== 'object') {
      throw new Error('Invalid configuration format: Root is not an object.');
    }
    // Validate critical fields
    const requiredFields: (keyof Config)[] = [
        'boardDimensions', 'allowedSizes', 'depthColors', 'initialFallSpeed', 
        'blockGenerationSystem', 'nextBlocksPreviewCount', 'gameMessages',
        'basePointsPerLine', 'scoreMultiplierEasy', 
        'showLevelNumbersOnBlocks', 'blockShapes', 'ghostPieceEnabled' // Added ghostPieceEnabled
    ];
    for (const field of requiredFields) {
        if (loadedConfig[field] === undefined) { // Check for undefined, null is a valid YAML value for some
            console.error("Loaded config on error:", loadedConfig);
            throw new Error(`Missing critical configuration field: '${field}'.`);
        }
    }
    // Validate boardDimensions structure
    if (typeof loadedConfig.boardDimensions.x !== 'number' || 
        typeof loadedConfig.boardDimensions.y !== 'number' ||
        typeof loadedConfig.boardDimensions.z !== 'number') {
        throw new Error('Invalid boardDimensions structure in config.');
    }
    // Validate blockShapes structure
    if (typeof loadedConfig.blockShapes !== 'object' || Object.keys(loadedConfig.blockShapes).length === 0) {
        throw new Error('Config error: `blockShapes` must be a non-empty object.');
    }
    // Validate at least one shape and its units
    const firstShapeName = Object.keys(loadedConfig.blockShapes)[0];
    if (firstShapeName) {
        const firstShape = loadedConfig.blockShapes[firstShapeName];
        if (!firstShape.color || typeof firstShape.color !== 'string' ||
            !firstShape.units || !Array.isArray(firstShape.units) || firstShape.units.length === 0) {
            throw new Error(`Invalid structure for block shape '${firstShapeName}'. Must have color (string) and non-empty units array.`);
        }
        const firstUnit = firstShape.units[0];
        if (typeof firstUnit.x !== 'number' || typeof firstUnit.y !== 'number' || typeof firstUnit.z !== 'number') {
            throw new Error(`Invalid unit structure in block shape '${firstShapeName}'. Units must have x, y, z as numbers.`);
        }
    }
    if (typeof loadedConfig.ghostPieceEnabled !== 'boolean') {
        throw new Error('Config error: `ghostPieceEnabled` must be a boolean.');
    }
    // --- End Validation ---

    config = loadedConfig; // Cache the loaded and validated config
    console.log("Configuration loaded and validated successfully (config.ts).");
    return config;
  } catch (error) {
    console.error('Failed to load or parse/validate config.yaml (config.ts):', error);
    throw error; 
  }
}
