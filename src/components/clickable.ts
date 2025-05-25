import AFRAME from 'aframe';

const HOVER_COLOR = '#FFD700'; // Gold
const CLICK_COLOR = '#FFA500'; // Orange

AFRAME.registerComponent('clickable', {
  schema: {
    targetFunction: { type: 'string', default: '' } // Name of the function to call on the ui-manager
  },
  
  originalColor: '',

  init: function () {
    this.el.setAttribute('geometry', 'primitive: plane; height: 0.1; width: 0.4');
    this.el.setAttribute('material', 'color: #555555; shader: flat'); // Default button color
    
    // Ensure text is a child and set up
    let textEl = this.el.querySelector('a-text');
    if (!textEl) {
      textEl = document.createElement('a-text');
      this.el.appendChild(textEl);
    }
    textEl.setAttribute('value', this.el.getAttribute('button-text') || 'Button');
    textEl.setAttribute('align', 'center');
    textEl.setAttribute('color', '#FFFFFF');
    textEl.setAttribute('position', '0 0 0.01'); // Slightly in front of the plane
    textEl.setAttribute('width', '0.8'); // Scale text relative to button plane width

    this.originalColor = this.el.getAttribute('material').color;

    this.el.addEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.el.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    this.el.addEventListener('click', this.onClick.bind(this)); // For mouse clicks / direct interaction
  },

  onMouseEnter: function () {
    this.el.setAttribute('material', 'color', HOVER_COLOR);
  },

  onMouseLeave: function () {
    this.el.setAttribute('material', 'color', this.originalColor);
  },

  onClick: function () {
    this.el.setAttribute('material', 'color', CLICK_COLOR);
    // console.log(`Button clicked: ${this.el.id}, target function: ${this.data.targetFunction}`);
    
    // Emit an event that the ui-manager can listen for, or directly call a method if a reference is available.
    // For simplicity here, we'll emit an event on the button entity itself.
    // The ui-manager will need to find its buttons and add specific listeners.
    if (this.data.targetFunction) {
        this.el.emit('ui_button_click', { functionName: this.data.targetFunction }, false);
    }

    // Revert color after a short delay for visual feedback
    setTimeout(() => {
      this.el.setAttribute('material', 'color', this.originalColor);
    }, 200);
  },

  remove: function () {
    this.el.removeEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.el.removeEventListener('mouseleave', this.onMouseLeave.bind(this));
    this.el.removeEventListener('click', this.onClick.bind(this));
  }
});

console.log('clickable component registered.');
