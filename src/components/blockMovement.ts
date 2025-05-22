import AFRAME from 'aframe';

export interface BlockMovementData {
  boardWidth: number;
  boardDepth: number;
  boardHeight: number;
}

declare const AFrame: typeof AFRAME;

export interface BlockMovementComponent extends AFrame.Component {
  data: BlockMovementData;
  onKeyDown: (e: KeyboardEvent) => void;
}

AFRAME.registerComponent('block-movement', {
  schema: {
    boardWidth: { type: 'number', default: 3 },
    boardDepth: { type: 'number', default: 3 },
    boardHeight: { type: 'number', default: 12 }
  },
  init(this: BlockMovementComponent) {
    this.onKeyDown = this.handleKeyDown.bind(this);
    window.addEventListener('keydown', this.onKeyDown);
  },
  remove(this: BlockMovementComponent) {
    window.removeEventListener('keydown', this.onKeyDown);
  },
  handleKeyDown(this: BlockMovementComponent, e: KeyboardEvent) {
    const pos = this.el.object3D.position;
    switch (e.key) {
      case 'a':
      case 'ArrowLeft':
        pos.x -= 1;
        break;
      case 'd':
      case 'ArrowRight':
        pos.x += 1;
        break;
      case 'w':
        pos.z -= 1;
        break;
      case 's':
        pos.z += 1;
        break;
      case 'ArrowUp':
        pos.y += 1;
        break;
      default:
        return;
    }

    const halfW = this.data.boardWidth / 2;
    const halfD = this.data.boardDepth / 2;
    pos.x = Math.max(-halfW + 0.5, Math.min(halfW - 0.5, pos.x));
    pos.z = Math.max(-halfD + 0.5, Math.min(halfD - 0.5, pos.z));
    pos.y = Math.min(this.data.boardHeight - 0.5, pos.y);

    this.el.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
  }
});
