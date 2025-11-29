import type { KernelMessage } from '@jupyterlab/services';

import { BaseKernel, type IKernel } from '@jupyterlite/services';

import { PromiseDelegate } from '@lumino/coreutils';

/**
 * A kernel for making p5 sketches in the browser
 */
export class P5Kernel extends BaseKernel {
  /**
   * Instantiate a new P5Kernel.
   *
   * @param options The instantiation options for a new P5Kernel.
   */
  constructor(options: P5Kernel.IOptions) {
    super(options);
    const { p5Url } = options;

    // use the kernel id as a display id
    this._displayId = this.id;

    // create the main IFrame
    this._iframe = document.createElement('iframe');
    this._iframe.style.visibility = 'hidden';
    this._iframe.style.position = 'absolute';
    // position outside of the page
    this._iframe.style.top = '-100000px';

    // p5 bootstrap code
    this._bootstrap = `
    import('${p5Url}').then(() => {
      // create the p5 global instance
      window.__globalP5 = new p5();
      return Promise.resolve();
    })
  `;

    this._iframe.onload = async () => {
      await this._initIFrame();
      this._eval(this._bootstrap);
      this._ready.resolve();
      window.addEventListener('message', (e: MessageEvent) => {
        const msg = e.data;
        if (msg.event === 'stream') {
          const content = msg as KernelMessage.IStreamMsg['content'];
          this.stream(content);
        }
      });
    };
    document.body.appendChild(this._iframe);
  }

  /**
   * A promise that is fulfilled when the kernel is ready.
   */
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  /**
   * Dispose the kernel.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._iframe.remove();
    super.dispose();
  }

  /**
   * Handle a kernel_info_request message
   */
  async kernelInfoRequest(): Promise<KernelMessage.IInfoReplyMsg['content']> {
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
   * Handle an `execute_request` message
   *
   * @param msg The parent message.
   */
  async executeRequest(
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
        this._parentHeaders.push(this['_parentHeader']);

        return {
          status: 'ok',
          execution_count: this.executionCount,
          user_expressions: {}
        };
      }
    }

    try {
      const result = this._eval(code);

      this.publishExecuteResult({
        execution_count: this.executionCount,
        data: {
          'text/plain': result
        },
        metadata: {}
      });

      // only store the input if the execution is successful
      if (!code.trim().startsWith('%')) {
        this._inputs.push(code);
      }

      // update existing displays since the executed code might affect the rendering
      // of existing sketches

      const magics = await this._magics();
      const { data, metadata } = magics;
      this._parentHeaders.forEach(h => {
        this.updateDisplayData(
          {
            data,
            metadata,
            transient
          },
          h
        );
      });

      return {
        status: 'ok',
        execution_count: this.executionCount,
        user_expressions: {}
      };
    } catch (e) {
      const { name, stack, message } = e as any as Error;

      this.publishExecuteError({
        ename: name,
        evalue: message,
        traceback: [`${stack}`]
      });

      return {
        status: 'error',
        execution_count: this.executionCount,
        ename: name,
        evalue: message,
        traceback: [`${stack}`]
      };
    }
  }

  /**
   * Handle an complete_request message
   *
   * @param msg The parent message.
   */
  async completeRequest(
    content: KernelMessage.ICompleteRequestMsg['content']
  ): Promise<KernelMessage.ICompleteReplyMsg['content']> {
    // naive completion on window names only
    // TODO: improve and move logic to the iframe
    const vars = this._evalFunc(
      this._iframe.contentWindow,
      'Object.keys(window)'
    ) as string[];
    const { code, cursor_pos } = content;
    const words = code.slice(0, cursor_pos).match(/(\w+)$/) ?? [];
    const word = words[0] ?? '';
    const matches = vars.filter(v => v.startsWith(word));

    return {
      matches,
      cursor_start: cursor_pos - word.length,
      cursor_end: cursor_pos,
      metadata: {},
      status: 'ok'
    };
  }

  async inspectRequest(
    content: KernelMessage.IInspectRequestMsg['content']
  ): Promise<KernelMessage.IInspectReplyMsg['content']> {
    throw new Error('not implemented');
  }

  async isCompleteRequest(
    content: KernelMessage.IIsCompleteRequestMsg['content']
  ): Promise<KernelMessage.IIsCompleteReplyMsg['content']> {
    throw new Error('not implemented');
  }

  async commInfoRequest(
    content: KernelMessage.ICommInfoRequestMsg['content']
  ): Promise<KernelMessage.ICommInfoReplyMsg['content']> {
    throw new Error('not implemented');
  }

  inputReply(content: KernelMessage.IInputReplyMsg['content']): void {
    throw new Error('not implemented');
  }

  async commOpen(msg: KernelMessage.ICommOpenMsg): Promise<void> {
    throw new Error('not implemented');
  }

  async commMsg(msg: KernelMessage.ICommMsgMsg): Promise<void> {
    throw new Error('not implemented');
  }

  async commClose(msg: KernelMessage.ICommCloseMsg): Promise<void> {
    throw new Error('not implemented');
  }

  /**
   * Execute code in the kernel IFrame.
   *
   * @param code The code to execute.
   */
  protected _eval(code: string): string {
    return this._evalFunc(this._iframe.contentWindow, code);
  }

  /**
   * Handle magics coming from execute requests.
   *
   * @param code The code block to handle.
   */
  private async _magics(
    code = ''
  ): Promise<KernelMessage.IExecuteResultMsg['content']> {
    const input = this._inputs
      .map(c => {
        const exec = ['try {', `window.eval(\`${c}\`);`, '} catch(e) {}'].join(
          '\n'
        );
        return exec;
      })
      .join('\n');
    const script = `
        ${this._bootstrap}.then(() => {
          ${input}
          window.__globalP5._start();
        })
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

  /**
   * Create a new IFrame
   *
   * @param iframe The IFrame to initialize.
   */
  protected async _initIFrame(): Promise<void> {
    if (!this._iframe.contentWindow) {
      return;
    }
    this._evalFunc(
      this._iframe.contentWindow,
      `
          console._log = console.log;
          console._error = console.error;
          window._bubbleUp = function(msg) {
            window.parent.postMessage(msg);
          }
          console.log = function() {
            const args = Array.prototype.slice.call(arguments);
            window._bubbleUp({
              "event": "stream",
              "name": "stdout",
              "text": args.join(' ') + '\\n'
            });
          };
          console.info = console.log;
          console.error = function() {
            const args = Array.prototype.slice.call(arguments);
            window._bubbleUp({
              "event": "stream",
              "name": "stderr",
              "text": args.join(' ') + '\\n'
            });
          };
          console.warn = console.error;
          window.onerror = function(message, source, lineno, colno, error) {
            console.error(message);
          }
        `
    );
  }

  private _displayId = '';
  private _bootstrap = '';
  private _iframe: HTMLIFrameElement;
  private _evalFunc = new Function(
    'window',
    'code',
    'return window.eval(code);'
  );
  private _inputs: string[] = [];
  private _ready = new PromiseDelegate<void>();
  private _parentHeaders: KernelMessage.IHeader<KernelMessage.MessageType>[] =
    [];
}

/**
 * A namespace for P5Kernel statics.
 */
export namespace P5Kernel {
  /**
   * The instantiation options for a P5Kernel
   */
  export interface IOptions extends IKernel.IOptions {
    /**
     * The URL to fetch p5.js
     */
    p5Url: string;
  }
}
