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
    const right = document.querySelector('#right-hand');
    right?.addEventListener('thumbstickmoved', this.handleThumbstick.bind(this));
  },
  remove(this: BlockMovementComponent) {
    window.removeEventListener('keydown', this.onKeyDown);
    const right = document.querySelector('#right-hand');
    right?.removeEventListener('thumbstickmoved', this.handleThumbstick.bind(this));
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
    this.el.emit('block-moved');
  },
  handleThumbstick(this: BlockMovementComponent, e: any) {
    const threshold = 0.95;
    const pos = this.el.object3D.position;
    if (Math.abs(e.detail.x) > threshold) {
      pos.x += Math.sign(e.detail.x);
    }
    if (Math.abs(e.detail.y) > threshold) {
      pos.z += Math.sign(e.detail.y);
    }
    const halfW = this.data.boardWidth / 2;
    const halfD = this.data.boardDepth / 2;
    pos.x = Math.max(-halfW + 0.5, Math.min(halfW - 0.5, pos.x));
    pos.z = Math.max(-halfD + 0.5, Math.min(halfD - 0.5, pos.z));
    this.el.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
    this.el.emit('block-moved');
  }
});
