import AFRAME from 'aframe';

export interface GameBlockData {
  color: string;
}

declare const AFrame: typeof AFRAME;

export interface GameBlockComponent extends AFrame.Component {
  data: GameBlockData;
}

AFRAME.registerComponent('game-block', {
  schema: {
    color: { type: 'string', default: '#fff' }
  },
  init(this: GameBlockComponent) {
    const box = document.createElement('a-box');
    box.setAttribute('width', 1);
    box.setAttribute('height', 1);
    box.setAttribute('depth', 1);
    box.setAttribute('color', this.data.color);
    this.el.appendChild(box);
  }
});
