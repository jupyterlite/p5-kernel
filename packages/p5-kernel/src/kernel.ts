// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type { KernelMessage } from '@jupyterlab/services';

import {
  JavaScriptKernel,
  IImportInfo,
  ICodeRegistry
} from '@jupyterlite/javascript-kernel';

import { P5Executor } from './executor';

/**
 * A kernel for making p5 sketches in the browser.
 */
export class P5Kernel extends JavaScriptKernel {
  /**
   * Instantiate a new P5Kernel.
   *
   * @param options - The instantiation options for a new P5Kernel.
   */
  constructor(options: P5Kernel.IOptions) {
    super({
      ...options,
      runtime: 'iframe',
      executorFactory: globalScope =>
        new P5Executor(globalScope as unknown as Window)
    });
    const { p5Url } = options;

    // use the kernel id as a display id
    this._displayId = this.id;

    // p5 bootstrap code
    this._bootstrap = `
    import('${p5Url}').then(() => {
      // create the p5 global instance
      window.__globalP5 = new p5();
      return Promise.resolve();
    })
  `;
  }

  /**
   * Handle a kernel_info_request message.
   */
  override async kernelInfoRequest(): Promise<
    KernelMessage.IInfoReplyMsg['content']
  > {
    const content: KernelMessage.IInfoReply = {
      implementation: 'p5.js',
      implementation_version: '0.1.0',
      language_info: {
        codemirror_mode: {
          name: 'javascript'
        },
        file_extension: '.js',
        mimetype: 'text/javascript',
        name: 'p5js',
        nbconvert_exporter: 'javascript',
        pygments_lexer: 'javascript',
        version: 'es2017'
      },
      protocol_version: '5.3',
      status: 'ok',
      banner: 'A p5.js kernel',
      help_links: [
        {
          text: 'p5.js Kernel',
          url: 'https://github.com/jupyterlite/p5-kernel'
        }
      ]
    };
    return content;
  }

  /**
   * Handle an `execute_request` message.
   *
   * @param content - The execute request content.
   */
  override async executeRequest(
    content: KernelMessage.IExecuteRequestMsg['content']
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {
    const { code } = content;
    const transient = {
      display_id: this._displayId
    };

    // handle magics first
    if (code.startsWith('%show')) {
      const magics = await this._magics(code);
      const res = {
        ...magics,
        transient
      };
      if (res) {
        this.displayData(res);
        if (this.parentHeader) {
          this._parentHeaders.push(this.parentHeader);
        }

        return {
          status: 'ok',
          execution_count: this.executionCount,
          user_expressions: {}
        };
      }
    }

    const reply = await super.executeRequest(content);
    if (reply.status !== 'ok') {
      return reply;
    }

    const executor = this._p5Executor;
    if (!code.trim().startsWith('%') && executor && this._codeRegistry) {
      // Register code in the registry for later sketch generation.
      this._p5Executor?.registerCode(code, this._codeRegistry);

      // Extract and track imports from the code.
      const imports = executor.extractImports(code);
      for (const imp of imports) {
        if (!this._imports.some(existing => existing.source === imp.source)) {
          this._imports.push(imp);
        }
      }
    }

    // Update existing displays since the executed code might affect rendering.
    const magics = await this._magics();
    this._parentHeaders.forEach(h => {
      this.updateDisplayData(
        {
          data: magics.data,
          metadata: magics.metadata,
          transient
        },
        h
      );
    });

    return reply;
  }

  /**
   * Initialize runtime for p5 execution.
   *
   * @param context - The runtime ready context.
   */
  protected override async onRuntimeReady(
    context: JavaScriptKernel.IRuntimeReadyContext
  ): Promise<void> {
    if (context.runtime !== 'iframe') {
      throw new Error('P5Kernel requires iframe runtime');
    }

    // Runtime executor is configured via kernel constructor options.
    this._p5Executor = context.executor as P5Executor;
    this._codeRegistry = this._p5Executor.createCodeRegistry();

    // Run p5 bootstrap.
    await context.execute(this._bootstrap);
  }

  /**
   * Handle magics coming from execute requests.
   *
   * @param code - The code block to handle.
   */
  private async _magics(
    code = ''
  ): Promise<KernelMessage.IExecuteResultMsg['content']> {
    const executor = this._p5Executor;

    // Generate import loading code
    const importCode = executor
      ? executor.generateImportCode(this._imports)
      : '';

    // Generate deduplicated code from the registry
    // This uses AST-based generation, so later definitions override earlier ones
    const combinedCode =
      this._p5Executor && this._codeRegistry
        ? this._p5Executor.generateCodeFromRegistry(this._codeRegistry)
        : '';

    // Create an async wrapper that first loads imports, then runs user code
    // The user code is embedded as a function body, not eval'd from a string
    const script = `
        ${this._bootstrap}.then(async () => {
          ${importCode}
          ${combinedCode}
          window.__globalP5._start();
        }).catch(e => console.error(e));
      `;

    // add metadata
    const re = /^%show(?: (.+)\s+(.+))?\s*$/;
    const matches = code.match(re);
    const width = matches?.[1] ?? '100%';
    const height = matches?.[2] ?? '400px';
    // Properly escape the srcdoc content
    const srcdocContent = [
      '<body style="overflow: hidden; margin: 0; padding: 0;">',
      `<script>${script}</script>`,
      '</body>'
    ].join('');

    // Escape the srcdoc attribute value
    const escapedSrcdoc = srcdocContent
      .replace(/&/g, '&amp;')
      .replace(/'/g, '&#39;')
      .replace(/"/g, '&quot;');

    return {
      execution_count: this.executionCount,
      data: {
        'text/html': `<iframe width="${width}" height="${height}" frameborder="0" srcdoc="${escapedSrcdoc}"></iframe>`
      },
      metadata: {}
    };
  }

  private _displayId = '';
  private _bootstrap = '';
  private _codeRegistry?: ICodeRegistry;
  private _imports: IImportInfo[] = [];
  private _parentHeaders: KernelMessage.IHeader<KernelMessage.MessageType>[] =
    [];
  private _p5Executor?: P5Executor;
}

/**
 * A namespace for P5Kernel statics.
 */
export namespace P5Kernel {
  /**
   * The instantiation options for a P5Kernel.
   */
  export interface IOptions extends JavaScriptKernel.IOptions {
    /**
     * The URL to fetch p5.js.
     */
    p5Url: string;

    /**
     * The runtime mode for the kernel.
     */
    runtime?: 'iframe';
  }
}
