// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type { IMimeBundle } from '@jupyterlab/nbformat';

import { JavaScriptExecutor } from '@jupyterlite/javascript-kernel';

import { P5_DOCS } from './p5-docs';

/**
 * p5.js-specific executor that extends the base JavaScript executor.
 */
export class P5Executor extends JavaScriptExecutor {
  /**
   * Override getMimeBundle to render p5.js Graphics objects as images.
   */
  override getMimeBundle(value: any): IMimeBundle {
    if (
      value &&
      typeof value === 'object' &&
      value.constructor?.name === 'p5.Graphics' &&
      typeof value.elt !== 'undefined'
    ) {
      try {
        const canvas = value.elt as HTMLCanvasElement;
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

    return super.getMimeBundle(value);
  }

  /**
   * Provide p5.js-specific documentation for inspect requests.
   *
   * The base class calls this method during inspect to append predefined
   * documentation to the runtime inspection data.
   */
  protected override getBuiltinDocumentation(
    expression: string
  ): string | null {
    return P5_DOCS[expression] ?? super.getBuiltinDocumentation(expression);
  }
}
