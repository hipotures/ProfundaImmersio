import AFRAME from 'aframe';
import { BlockMovementData } from './blockMovement';

interface BlockRotationComponent extends AFrame.Component {
  data: BlockMovementData & { axisX: string; axisY: string };
  onThumbstick: (e: any) => void;
}

declare const AFrame: typeof AFRAME;

AFRAME.registerComponent('block-rotation', {
  schema: {
    boardWidth: { type: 'number', default: 3 },
    boardDepth: { type: 'number', default: 3 },
    boardHeight: { type: 'number', default: 12 },
    axisX: { type: 'string', default: 'rotateY' },
    axisY: { type: 'string', default: 'rotateX' }
  },
  init(this: BlockRotationComponent) {
    this.onThumbstick = this.handleThumbstick.bind(this);
    const left = document.querySelector('#left-hand');
    left?.addEventListener('thumbstickmoved', this.onThumbstick);
  },
  remove(this: BlockRotationComponent) {
    const left = document.querySelector('#left-hand');
    left?.removeEventListener('thumbstickmoved', this.onThumbstick);
  },
  handleThumbstick(this: BlockRotationComponent, e: any) {
    const threshold = 0.95;
    let rotated = false;
    if (Math.abs(e.detail.x) > threshold) {
      const sign = Math.sign(e.detail.x);
      if (this.data.axisX === 'rotateY') this.el.object3D.rotateY(-sign * Math.PI / 2);
      if (this.data.axisX === 'rotateX') this.el.object3D.rotateX(sign * Math.PI / 2);
      if (this.data.axisX === 'rotateZ') this.el.object3D.rotateZ(sign * Math.PI / 2);
      rotated = true;
    }
    if (Math.abs(e.detail.y) > threshold) {
      const sign = Math.sign(e.detail.y);
      if (this.data.axisY === 'rotateY') this.el.object3D.rotateY(-sign * Math.PI / 2);
      if (this.data.axisY === 'rotateX') this.el.object3D.rotateX(sign * Math.PI / 2);
      if (this.data.axisY === 'rotateZ') this.el.object3D.rotateZ(sign * Math.PI / 2);
      rotated = true;
    }
    if (rotated) this.el.emit('block-rotated');
  }
});
