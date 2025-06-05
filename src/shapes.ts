export interface ShapeDef {
  name: string;
  pattern: string;
}

export interface ParsedShape {
  name: string;
  cells: [number, number, number][];
  width: number;
  height: number;
}

export function parseShape(def: ShapeDef): ParsedShape {
  const lines = def.pattern.trim().split('\n');
  const cells: [number, number, number][] = [];
  for (let y = 0; y < lines.length; y++) {
    for (let x = 0; x < lines[y].length; x++) {
      if (lines[y][x].toUpperCase() === 'X') {
        cells.push([x, lines.length - 1 - y, 0]);
      }
    }
  }
  return { name: def.name, cells, width: lines[0].length, height: lines.length };
}

export function createShapeEntity(shape: ParsedShape, color: string): HTMLElement {
  const entity = document.createElement('a-entity');
  for (const cell of shape.cells) {
    const box = document.createElement('a-box');
    box.setAttribute('width', 1);
    box.setAttribute('height', 1);
    box.setAttribute('depth', 1);
    box.setAttribute('position', `${cell[0]} ${cell[1]} ${cell[2]}`);
    box.setAttribute('color', color);
    entity.appendChild(box);
  }
  entity.object3D.position.set(0, 0, 0);
  return entity;
}
