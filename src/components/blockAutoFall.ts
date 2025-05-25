import AFRAME from 'aframe';
import { occupyCell, isOccupied } from '../boardState';

export interface BlockAutoFallData {
  speed: number;
  boardWidth: number;
  boardDepth: number;
  boardHeight: number;
  floorY: number;
}

declare const AFrame: typeof AFRAME;

export interface BlockAutoFallComponent extends AFrame.Component {
  data: BlockAutoFallData;
  lastTime: number;
}

AFRAME.registerComponent('block-auto-fall', {
  schema: {
    speed: { type: 'number', default: 1 },
    boardWidth: { type: 'number', default: 3 },
    boardDepth: { type: 'number', default: 3 },
    boardHeight: { type: 'number', default: 12 },
    floorY: { type: 'number', default: 0.5 }
  },
  init(this: BlockAutoFallComponent) {
    this.lastTime = 0;
  },
  tick(this: BlockAutoFallComponent, time: number, delta: number) {
    if (!this.lastTime) {
      this.lastTime = time;
      return;
    }
    const step = (delta / 1000) * this.data.speed;
    const pos = this.el.object3D.position;
    const halfW = this.data.boardWidth / 2;
    const halfD = this.data.boardDepth / 2;
    const xIdx = Math.round(pos.x + halfW - 0.5);
    const zIdx = Math.round(pos.z + halfD - 0.5);
    const nextY = pos.y - step;
    const nextIdx = Math.floor(nextY - this.data.floorY);
    if (nextIdx < 0 || isOccupied(xIdx, nextIdx, zIdx)) {
      const finalIdx = Math.max(0, nextIdx + 1);
      pos.y = this.data.floorY + finalIdx;
      this.el.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
      occupyCell(xIdx, finalIdx, zIdx);
      this.el.removeAttribute('block-auto-fall');
      this.el.removeAttribute('block-movement');
      this.el.emit('block-settled', { x: xIdx, y: finalIdx, z: zIdx });
    } else {
      pos.y = nextY;
      this.el.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
    }
  }
});
