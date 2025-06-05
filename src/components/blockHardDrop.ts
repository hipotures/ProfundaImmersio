import AFRAME from 'aframe';
import { lowestEmptyY, occupyCell } from '../boardState';

export interface BlockHardDropData {
  floorY: number;
  boardWidth: number;
  boardDepth: number;
  boardHeight: number;
}

declare const AFrame: typeof AFRAME;

export interface BlockHardDropComponent extends AFrame.Component {
  data: BlockHardDropData;
  onKeyDown: (e: KeyboardEvent) => void;
  onTriggerDown: () => void;
}

AFRAME.registerComponent('block-hard-drop', {
  schema: {
    floorY: { type: 'number', default: 0.5 },
    boardWidth: { type: 'number', default: 3 },
    boardDepth: { type: 'number', default: 3 },
    boardHeight: { type: 'number', default: 12 }
  },
  init(this: BlockHardDropComponent) {
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onTriggerDown = this.handleTriggerDown.bind(this);
    window.addEventListener('keydown', this.onKeyDown);
    this.el.sceneEl?.addEventListener('triggerdown', this.onTriggerDown);
  },
  remove(this: BlockHardDropComponent) {
    window.removeEventListener('keydown', this.onKeyDown);
    this.el.sceneEl?.removeEventListener('triggerdown', this.onTriggerDown);
  },
  handleKeyDown(this: BlockHardDropComponent, e: KeyboardEvent) {
    if (e.code === 'Space') {
      this.drop();
    }
  },
  handleTriggerDown(this: BlockHardDropComponent, e: any) {
    if (e?.detail?.hand && e.detail.hand !== 'right') return;
    this.drop();
  },
  drop(this: BlockHardDropComponent) {
    const pos = this.el.object3D.position;
    const halfW = this.data.boardWidth / 2;
    const halfD = this.data.boardDepth / 2;
    const xIdx = Math.round(pos.x + halfW - 0.5);
    const zIdx = Math.round(pos.z + halfD - 0.5);
    const yIdx = lowestEmptyY(xIdx, zIdx);
    pos.y = this.data.floorY + yIdx;
    this.el.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
    occupyCell(xIdx, yIdx, zIdx);
    this.el.removeAttribute('block-movement');
    this.el.emit('block-settled', { x: xIdx, y: yIdx, z: zIdx });
  }
});
