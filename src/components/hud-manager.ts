import AFRAME from 'aframe';

AFRAME.registerComponent('hud-manager', {
  schema: {
    // Configuration for HUD elements if needed, e.g., text color, font
  },

  scoreTextEl: null as AFRAME.Entity | null,
  nextBlocksContainerEl: null as AFRAME.Entity | null,
  nextBlockTextElements: [] as AFRAME.Entity[],


  init: function () {
    const el = this.el; // This component is typically attached to an entity parented to the camera

    // --- Score Text ---
    this.scoreTextEl = document.createElement('a-text');
    this.scoreTextEl.setAttribute('id', 'score-text-display');
    this.scoreTextEl.setAttribute('value', 'Score: 0');
    this.scoreTextEl.setAttribute('position', '-0.5 0.5 -1'); // Adjust position relative to HUD entity
    this.scoreTextEl.setAttribute('color', 'white');
    this.scoreTextEl.setAttribute('width', '2'); // Scale/width of the text entity
    this.scoreTextEl.setAttribute('align', 'left');
    this.scoreTextEl.setAttribute('shader', 'msdf'); // For better text rendering
    this.scoreTextEl.setAttribute('font', 'https://cdn.aframe.io/fonts/mozillavr.fnt');


    // --- Next Blocks Preview Area ---
    this.nextBlocksContainerEl = document.createElement('a-entity');
    this.nextBlocksContainerEl.setAttribute('id', 'next-block-preview-area');
    // Position it to the right of the score, or below, adjust as needed
    this.nextBlocksContainerEl.setAttribute('position', '0.3 0.5 -1'); 
    
    // Placeholder text for the preview area title
    const previewTitleEl = document.createElement('a-text');
    previewTitleEl.setAttribute('value', 'Next:');
    previewTitleEl.setAttribute('position', '0 0.1 0'); // Relative to nextBlocksContainerEl
    previewTitleEl.setAttribute('color', 'white');
    previewTitleEl.setAttribute('width', '1.5');
    previewTitleEl.setAttribute('align', 'left');
    previewTitleEl.setAttribute('shader', 'msdf');
    previewTitleEl.setAttribute('font', 'https://cdn.aframe.io/fonts/mozillavr.fnt');
    this.nextBlocksContainerEl.appendChild(previewTitleEl);

    el.appendChild(this.scoreTextEl);
    el.appendChild(this.nextBlocksContainerEl);

    console.log('HUD Manager initialized.');
  },

  updateScore: function (newScore: number) {
    if (this.scoreTextEl) {
      this.scoreTextEl.setAttribute('value', `Score: ${newScore}`);
    } else {
      console.warn('Score text element not found in HUD Manager.');
    }
  },

  updateNextBlocks: function (nextBlockShapes: string[]) {
    if (!this.nextBlocksContainerEl) {
      console.warn('Next blocks container not found in HUD Manager.');
      return;
    }

    // Clear previous next block text elements
    this.nextBlockTextElements.forEach(textEl => textEl.parentNode?.removeChild(textEl));
    this.nextBlockTextElements = [];

    // Create new text elements for each placeholder shape
    nextBlockShapes.forEach((shape, index) => {
      const textEl = document.createElement('a-text');
      textEl.setAttribute('value', shape);
      // Position each text element below the previous one
      textEl.setAttribute('position', `0 ${-0.1 * (index + 1)} 0`); // Simple stacking
      textEl.setAttribute('color', 'yellow');
      textEl.setAttribute('width', '1.5');
      textEl.setAttribute('align', 'left');
      textEl.setAttribute('shader', 'msdf');
      textEl.setAttribute('font', 'https://cdn.aframe.io/fonts/mozillavr.fnt');
      
      this.nextBlocksContainerEl?.appendChild(textEl);
      this.nextBlockTextElements.push(textEl);
    });
    // console.log('HUD updated next blocks:', nextBlockShapes);
  },

  remove: function () {
    // Clean up text elements if the component is removed
    if (this.scoreTextEl && this.scoreTextEl.parentNode) {
      this.scoreTextEl.parentNode.removeChild(this.scoreTextEl);
    }
    this.nextBlockTextElements.forEach(textEl => textEl.parentNode?.removeChild(textEl));
    this.nextBlockTextElements = [];
    if (this.nextBlocksContainerEl && this.nextBlocksContainerEl.parentNode) {
        this.nextBlocksContainerEl.parentNode.removeChild(this.nextBlocksContainerEl);
    }
  }
});

console.log('hud-manager component registered.');
