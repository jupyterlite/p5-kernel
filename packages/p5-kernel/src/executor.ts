// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type { IMimeBundle } from '@jupyterlab/nbformat';

import type { KernelMessage } from '@jupyterlab/services';

import {
  JavaScriptExecutor,
  type IInspectResult
} from '@jupyterlite/javascript-kernel';

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
   * Override inspect to replace bound function stubs with proper p5.js docs.
   *
   * The base inspect method evaluates the expression at runtime, which
   * succeeds for p5 globals but yields unhelpful "function bound ()" output.
   * This override replaces the result entirely when we have p5 docs.
   */
  override inspect(
    code: string,
    cursorPos: number,
    detailLevel: KernelMessage.IInspectRequestMsg['content']['detail_level'] = 0
  ): IInspectResult {
    const result = super.inspect(code, cursorPos, detailLevel);

    if (result.found) {
      // Extract expression the same way the base does
      const expression = this._extractExpressionForInspect(code, cursorPos);
      if (expression) {
        const doc = P5_DOCS[expression];
        if (doc) {
          result.data = {
            'text/plain': `${expression}: ${doc}`,
            'text/markdown': `**${expression}**\n\n${doc}`
          };
        }
      }
    }

    return result;
  }

  /**
   * Extract the expression at the cursor position for inspect lookups.
   * Mirrors the logic in the base class's private _extractExpressionAtCursor.
   */
  private _extractExpressionForInspect(
    code: string,
    cursorPos: number
  ): string | null {
    const beforeCursor = code.substring(0, cursorPos);
    const afterCursor = code.substring(cursorPos);
    const beforeMatch = beforeCursor.match(/[\w.$]+$/);
    const afterMatch = afterCursor.match(/^[\w]*/);
    if (!beforeMatch) {
      return null;
    }
    return beforeMatch[0] + (afterMatch?.[0] || '');
  }

  /**
   * Provide p5.js-specific documentation for inspect requests.
   *
   * p5.js uses bound methods, so runtime inspection only shows
   * `function bound ()`. This override provides proper docs.
   */
  protected override getBuiltinDocumentation(
    expression: string
  ): string | null {
    return P5_DOCS[expression] ?? super.getBuiltinDocumentation(expression);
  }
}
