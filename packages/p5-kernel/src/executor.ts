// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type { IMimeBundle } from '@jupyterlab/nbformat';

import {
  JavaScriptExecutor,
  ExecutorConfig
} from '@jupyterlite/javascript-kernel';

/**
 * p5.js-specific executor that extends the base JavaScript executor.
 * Adds p5-specific MIME bundle handling and documentation.
 */
export class P5Executor extends JavaScriptExecutor {
  /**
   * Instantiate a new P5Executor.
   *
   * @param globalScope - The global window scope for the executor.
   * @param config - Optional executor configuration.
   */
  constructor(globalScope: Window, config?: ExecutorConfig) {
    super(globalScope, config);
  }

  /**
   * Override getMimeBundle to add p5.js-specific handling.
   */
  override getMimeBundle(value: any): IMimeBundle {
    // Handle p5.js Graphics object
    if (this._isP5Graphics(value)) {
      return this._getP5GraphicsMimeBundle(value);
    }

    // Fall back to base implementation
    return super.getMimeBundle(value);
  }

  /**
   * Override to add p5.js-specific documentation.
   */
  protected override getBuiltinDocumentation(
    expression: string
  ): string | null {
    // Check p5-specific docs first
    const p5Doc = this._getP5Documentation(expression);
    if (p5Doc) {
      return p5Doc;
    }

    // Fall back to base JavaScript docs
    return super.getBuiltinDocumentation(expression);
  }

  /**
   * Check if value is a p5.js Graphics object.
   */
  private _isP5Graphics(value: any): boolean {
    return (
      value &&
      typeof value === 'object' &&
      value.constructor?.name === 'p5.Graphics' &&
      typeof value.elt !== 'undefined'
    );
  }

  /**
   * Get MIME bundle for p5.js Graphics objects.
   */
  private _getP5GraphicsMimeBundle(graphics: any): IMimeBundle {
    try {
      const canvas = graphics.elt as HTMLCanvasElement;
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      return {
        'image/png': base64,
        'text/plain': `p5.Graphics(${canvas.width}x${canvas.height})`
      };
    } catch {
      return { 'text/plain': 'p5.Graphics' };
    }
  }

  /**
   * Get p5.js-specific documentation.
   */
  private _getP5Documentation(expression: string): string | null {
    const p5Docs: Record<string, string> = {
      // Drawing
      createCanvas:
        'Creates a canvas element (p5.js). Usage: createCanvas(width, height, [renderer])',
      resizeCanvas:
        'Resizes the canvas to given width and height (p5.js). Usage: resizeCanvas(width, height, [noRedraw])',
      background:
        'Sets the background color of the canvas (p5.js). Usage: background(color) or background(r, g, b, [a])',
      clear: 'Clears the canvas (p5.js).',
      fill: 'Sets the fill color for shapes (p5.js). Usage: fill(color) or fill(r, g, b, [a])',
      noFill: 'Disables filling shapes (p5.js).',
      stroke:
        'Sets the stroke color for shapes (p5.js). Usage: stroke(color) or stroke(r, g, b, [a])',
      noStroke: 'Disables drawing the stroke (p5.js).',
      strokeWeight:
        'Sets the width of the stroke (p5.js). Usage: strokeWeight(weight)',
      // Shapes
      rect: 'Draws a rectangle (p5.js). Usage: rect(x, y, width, [height], [tl], [tr], [br], [bl])',
      ellipse:
        'Draws an ellipse (p5.js). Usage: ellipse(x, y, width, [height])',
      circle: 'Draws a circle (p5.js). Usage: circle(x, y, diameter)',
      line: 'Draws a line (p5.js). Usage: line(x1, y1, x2, y2)',
      point: 'Draws a point (p5.js). Usage: point(x, y)',
      triangle:
        'Draws a triangle (p5.js). Usage: triangle(x1, y1, x2, y2, x3, y3)',
      quad: 'Draws a quadrilateral (p5.js). Usage: quad(x1, y1, x2, y2, x3, y3, x4, y4)',
      arc: 'Draws an arc (p5.js). Usage: arc(x, y, w, h, start, stop, [mode], [detail])',
      bezier:
        'Draws a Bezier curve (p5.js). Usage: bezier(x1, y1, x2, y2, x3, y3, x4, y4)',
      // Text
      text: 'Draws text to the canvas (p5.js). Usage: text(str, x, y, [x2], [y2])',
      textSize: 'Sets the font size (p5.js). Usage: textSize(size)',
      textFont: 'Sets the font (p5.js). Usage: textFont(font, [size])',
      textAlign:
        'Sets text alignment (p5.js). Usage: textAlign(horizAlign, [vertAlign])',
      textWidth: 'Returns the width of text (p5.js). Usage: textWidth(str)',
      // Transform
      translate: 'Moves the origin point (p5.js). Usage: translate(x, y, [z])',
      rotate: 'Rotates around the origin (p5.js). Usage: rotate(angle)',
      scale:
        'Scales the coordinate system (p5.js). Usage: scale(s) or scale(x, y, [z])',
      push: 'Saves the current drawing style settings and transformations (p5.js).',
      pop: 'Restores the drawing style settings saved by push() (p5.js).',
      // Events
      setup: 'Called once when the program starts (p5.js function).',
      draw: 'Called continuously to update the canvas (p5.js function).',
      preload: 'Called before setup() to load assets (p5.js function).',
      mousePressed: 'Called once when a mouse button is pressed (p5.js event).',
      mouseReleased:
        'Called once when a mouse button is released (p5.js event).',
      mouseMoved: 'Called when the mouse moves (p5.js event).',
      mouseDragged: 'Called when the mouse moves while pressed (p5.js event).',
      keyPressed: 'Called once when a key is pressed (p5.js event).',
      keyReleased: 'Called once when a key is released (p5.js event).',
      keyTyped: 'Called once when a key is typed (p5.js event).',
      // Variables
      mouseX: 'Current horizontal position of the mouse (p5.js).',
      mouseY: 'Current vertical position of the mouse (p5.js).',
      pmouseX: 'Previous horizontal position of the mouse (p5.js).',
      pmouseY: 'Previous vertical position of the mouse (p5.js).',
      mouseButton:
        'Current mouse button pressed (LEFT, RIGHT, CENTER) (p5.js).',
      mouseIsPressed: 'True if mouse is currently pressed (p5.js).',
      key: 'Most recent key pressed (p5.js).',
      keyCode: 'Key code of the most recent key pressed (p5.js).',
      keyIsPressed: 'True if any key is currently pressed (p5.js).',
      width: 'Width of the canvas (p5.js).',
      height: 'Height of the canvas (p5.js).',
      frameCount:
        'Number of frames displayed since the program started (p5.js).',
      frameRate:
        'Gets or sets the frame rate (p5.js). Usage: frameRate() or frameRate(fps)',
      deltaTime: 'Time in milliseconds since the last frame (p5.js).',
      // Math
      random:
        'Returns a random floating-point number (p5.js). Usage: random([min], [max]) or random(choices)',
      randomSeed: 'Sets the seed for random() (p5.js). Usage: randomSeed(seed)',
      noise: 'Returns Perlin noise value (p5.js). Usage: noise(x, [y], [z])',
      noiseSeed: 'Sets the seed for noise() (p5.js). Usage: noiseSeed(seed)',
      noiseDetail:
        'Sets octaves and falloff for noise (p5.js). Usage: noiseDetail(lod, falloff)',
      map: 'Re-maps a number from one range to another (p5.js). Usage: map(value, start1, stop1, start2, stop2, [withinBounds])',
      constrain:
        'Constrains a value between min and max (p5.js). Usage: constrain(n, low, high)',
      lerp: 'Linear interpolation between two values (p5.js). Usage: lerp(start, stop, amt)',
      dist: 'Distance between two points (p5.js). Usage: dist(x1, y1, x2, y2)',
      mag: 'Magnitude of a vector (p5.js). Usage: mag(x, y)',
      // Color
      color:
        'Creates a color object (p5.js). Usage: color(gray, [a]) or color(r, g, b, [a]) or color(colorString)',
      red: 'Extracts red value from a color (p5.js). Usage: red(color)',
      green: 'Extracts green value from a color (p5.js). Usage: green(color)',
      blue: 'Extracts blue value from a color (p5.js). Usage: blue(color)',
      alpha: 'Extracts alpha value from a color (p5.js). Usage: alpha(color)',
      hue: 'Extracts hue value from a color (p5.js). Usage: hue(color)',
      saturation:
        'Extracts saturation from a color (p5.js). Usage: saturation(color)',
      brightness:
        'Extracts brightness from a color (p5.js). Usage: brightness(color)',
      lerpColor:
        'Interpolates between two colors (p5.js). Usage: lerpColor(c1, c2, amt)',
      colorMode:
        'Changes the color mode (p5.js). Usage: colorMode(mode, [max1], [max2], [max3], [maxA])',
      // Image
      loadImage:
        'Loads an image (p5.js). Usage: loadImage(path, [successCallback], [failureCallback])',
      image:
        'Draws an image (p5.js). Usage: image(img, x, y, [width], [height])',
      createImage:
        'Creates a new p5.Image (p5.js). Usage: createImage(width, height)',
      // Control
      loop: 'Starts the draw() loop (p5.js).',
      noLoop: 'Stops the draw() loop (p5.js).',
      redraw: 'Executes draw() once (p5.js). Usage: redraw([n])',
      // Vector
      createVector:
        'Creates a new p5.Vector (p5.js). Usage: createVector([x], [y], [z])'
    };

    return p5Docs[expression] ?? null;
  }
}
