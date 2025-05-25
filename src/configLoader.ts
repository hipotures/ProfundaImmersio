import { load } from 'js-yaml';

export interface GameConfig {
  boardSizes: { name: string; dimensions: [number, number, number] }[];
  depthColors: string[];
  blocks: {
    shapes: { name: string; pattern: string }[];
  };
  scoring: {
    lineClearBase: number;
    accelerationFactor: number;
  };
  difficultyLevels: Record<string, { startTime: number }>;
  controls: {
    rotationSystem: string[];
    joystickMapping: {
      left: { x: string; y: string };
      right: { x: string; y: string };
    };
  };
}

export async function loadConfig(url: string): Promise<GameConfig> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load config: ${response.status}`);
  }
  const text = await response.text();
  const data = load(text) as GameConfig;
  return data;
}
