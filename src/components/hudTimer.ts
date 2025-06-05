import AFRAME from 'aframe';

declare const AFrame: typeof AFRAME;

AFRAME.registerComponent('hud-timer-display', {
  schema: { scene: { type: 'selector' } },
  tick: function (this: any) {
    const sceneEl = this.data.scene || this.el.sceneEl;
    const timer = sceneEl?.components['game-timer'];
    if (!timer) return;
    const remaining = timer.remaining;
    this.el.setAttribute('value', `Time: ${remaining.toFixed(1)}`);
  }
});
