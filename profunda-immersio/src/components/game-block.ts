import AFRAME from 'aframe';

AFRAME.registerComponent('game-block', {
  schema: {
    width: { type: 'number', default: 1 },
    height: { type: 'number', default: 1 },
    depth: { type: 'number', default: 1 },
    color: { type: 'color', default: 'blue' }
  },

  boxEl: null as AFRAME.Entity | null,

  init: function () {
    const data = this.data;
    const el = this.el;

    this.boxEl = document.createElement('a-box');
    this.boxEl.setAttribute('width', data.width);
    this.boxEl.setAttribute('height', data.height);
    this.boxEl.setAttribute('depth', data.depth);
    this.boxEl.setAttribute('color', data.color);
    this.boxEl.setAttribute('material', 'opacity: 0.7; transparent: true');
    
    // Position the box relative to the entity. If the entity is at (x,y,z),
    // and the box is a child, its local position should be (0,0,0)
    // for the block's center to be at the entity's (x,y,z).
    this.boxEl.setAttribute('position', '0 0 0'); 

    el.appendChild(this.boxEl);
  },

  setPosition: function (x: number, y: number, z: number) {
    this.el.setAttribute('position', { x, y, z });
  },

  // Updates component data and visual
  setDimensions: function (width: number, height: number, depth: number) {
    this.data.width = width;
    this.data.height = height;
    this.data.depth = depth;
    if (this.boxEl) {
      this.boxEl.setAttribute('width', width);
      this.boxEl.setAttribute('height', height);
      this.boxEl.setAttribute('depth', depth);
    }
  },
  
  // Helper to get current dimensions
  getDimensions: function() {
    return {
        width: this.data.width,
        height: this.data.height,
        depth: this.data.depth,
    };
  },

  // Helper to get current position
  getPosition: function() {
    return this.el.getAttribute('position');
  },

  update: function (oldData) {
    // If color changes, update the box color
    if (this.boxEl && oldData.color !== this.data.color) {
      this.boxEl.setAttribute('color', this.data.color);
    }
    // If dimensions change through setAttribute on the entity, update the box
    if (this.boxEl && 
        (oldData.width !== this.data.width || 
         oldData.height !== this.data.height || 
         oldData.depth !== this.data.depth)) {
      this.boxEl.setAttribute('width', this.data.width);
      this.boxEl.setAttribute('height', this.data.height);
      this.boxEl.setAttribute('depth', this.data.depth);
    }
  },

  remove: function () {
    if (this.boxEl && this.boxEl.parentNode === this.el) {
      this.el.removeChild(this.boxEl);
    }
    this.boxEl = null;
  }
});

console.log('game-block component registered with A-Frame.');
