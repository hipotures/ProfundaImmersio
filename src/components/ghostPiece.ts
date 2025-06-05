import AFRAME from 'aframe';
import { lowestEmptyY } from '../boardState';
import { ParsedShape, createShapeEntity } from '../shapes';

declare const AFrame: typeof AFRAME;

interface GhostComponent extends AFrame.Component {
  data: { shape: ParsedShape; floorY: number; boardWidth: number; boardDepth: number };
  updateGhost: () => void;
}

AFRAME.registerComponent('ghost-piece', {
  schema: {
    shape: { type: 'string' },
    floorY: { type: 'number', default: 0.5 },
    boardWidth: { type: 'number', default: 3 },
    boardDepth: { type: 'number', default: 3 }
  },
  init(this: GhostComponent) {
    this.updateGhost = this.calculate.bind(this);
    this.el.sceneEl?.addEventListener('block-moved', this.updateGhost);
    this.calculate();
  },
  remove(this: GhostComponent) {
    this.el.sceneEl?.removeEventListener('block-moved', this.updateGhost);
  },
  calculate(this: GhostComponent) {
    const shape: ParsedShape = JSON.parse(this.data.shape);
    this.el.innerHTML = '';
    const mesh = createShapeEntity(shape, '#888');
    mesh.setAttribute('material', 'opacity', 0.3);
    const pos = this.el.sceneEl?.querySelector('[block-movement]')?.object3D.position;
    if (!pos) return;
    const halfW = this.data.boardWidth / 2;
    const halfD = this.data.boardDepth / 2;
    const xIdx = Math.round(pos.x + halfW - 0.5);
    const zIdx = Math.round(pos.z + halfD - 0.5);
    const yIdx = lowestEmptyY(xIdx, zIdx);
    this.el.object3D.position.set(pos.x, this.data.floorY + yIdx, pos.z);
    this.el.appendChild(mesh);
  }
});
