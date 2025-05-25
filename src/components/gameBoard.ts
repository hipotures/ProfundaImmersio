import AFRAME from 'aframe';

export interface GameBoardData {
  width: number;
  depth: number;
  height: number;
  colors: string[];
}

declare const AFrame: typeof AFRAME;

export interface GameBoardComponent extends AFrame.Component {
  data: GameBoardData;
  walls: HTMLElement[];
}

AFRAME.registerComponent('game-board', {
  schema: {
    width: { type: 'int', default: 3 },
    depth: { type: 'int', default: 3 },
    height: { type: 'int', default: 12 },
    colors: { type: 'array', default: [] }
  },
  init(this: GameBoardComponent) {
    const { width, depth, height, colors } = this.data;
    this.walls = [];

    const floor = document.createElement('a-box');
    floor.setAttribute('width', width);
    floor.setAttribute('depth', depth);
    floor.setAttribute('height', 0.1);
    floor.setAttribute('position', `0 0 0`);
    floor.setAttribute('color', '#222');
    this.el.appendChild(floor);

    for (let y = 0; y < height; y++) {
      const color = colors[y % colors.length];
      const wall = document.createElement('a-box');
      wall.setAttribute('width', width);
      wall.setAttribute('height', 0.05);
      wall.setAttribute('depth', depth);
      wall.setAttribute('color', color);
      wall.setAttribute('position', `0 ${y + 0.05} 0`);
      wall.setAttribute('opacity', 0.2);
      wall.classList.add('depth-wall');
      this.el.appendChild(wall);
      this.walls.push(wall);
    }

    this.el.addEventListener('shift-colors', (e: CustomEvent) => {
      const count: number = e.detail.count || 1;
      for (let i = 0; i < count; i++) {
        const first = this.data.colors.shift();
        if (first) this.data.colors.push(first);
      }
      for (let y = 0; y < this.walls.length; y++) {
        const c = this.data.colors[y % this.data.colors.length];
        this.walls[y].setAttribute('color', c);
      }
    });
  }
});
