import AFRAME from 'aframe';

declare const AFrame: typeof AFRAME;

export interface GameTimerComponent extends AFrame.Component {
  data: { limit: number };
  remaining: number;
}

AFRAME.registerComponent('game-timer', {
  schema: { limit: { type: 'number', default: 10 } },
  init(this: GameTimerComponent) {
    this.remaining = this.data.limit;
    this.el.sceneEl?.addEventListener('block-settled', () => {
      this.remaining = this.data.limit;
    });
  },
  tick(this: GameTimerComponent, _, delta: number) {
    this.remaining -= delta / 1000;
    if (this.remaining <= 0) {
      this.el.emit('timer-expired');
      this.remaining = this.data.limit;
    }
  }
});
