import yaml from 'js-yaml';

export interface BoardDimensions {
  x: number;
  y: number;
  z: number;
}

export interface AllowedSize extends BoardDimensions {
  name: string;
}

export interface GameMessages {
  gameOver: string;
  newLevel: string;
}

export interface Config {
  boardDimensions: BoardDimensions;
  allowedSizes: AllowedSize[];
  depthColors: string[];
  initialFallSpeed: number;
  blockGenerationSystem: string;
  nextBlocksPreviewCount: number;
  gameMessages: GameMessages;
}

let config: Config | null = null;

export async function loadConfig(): Promise<Config> {
  if (config) {
    return config;
  }

  try {
    const response = await fetch('/config.yaml');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const yamlText = await response.text();
    const loadedConfig = yaml.load(yamlText) as Config;
    
    // Basic validation
    if (!loadedConfig || typeof loadedConfig !== 'object') {
      throw new Error('Invalid configuration format.');
    }
    if (!loadedConfig.boardDimensions || !loadedConfig.allowedSizes || !loadedConfig.depthColors) {
        throw new Error('Missing critical configuration sections.');
    }

    config = loadedConfig;
    return config;
  } catch (error) {
    console.error('Failed to load or parse config.yaml:', error);
    // Fallback to a default/minimal configuration or rethrow,
    // depending on how critical the config is.
    // For now, rethrowing the error.
    throw error; 
  }
}

// Example of how to use it (optional, can be in main.ts)
/*
loadConfig().then(cfg => {
  console.log('Configuration loaded:', cfg);
  // Proceed with game initialization using cfg
}).catch(error => {
  console.error('Failed to initialize game due to config loading error:', error);
});
*/
