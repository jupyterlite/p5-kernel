import { KernelMessage } from '@jupyterlab/services';

import { BaseKernel, IKernel } from '@jupyterlite/kernel';

import { PromiseDelegate } from '@lumino/coreutils';

/**
 * The mimetype for mime bundle results
 */
const MIME_TYPE = 'text/html-sandboxed';

/**
 * A kernel for making p5 sketches in the browser
 */
export class P5Kernel extends BaseKernel implements IKernel {
  /**
   * Instantiate a new P5Kernel.
   *
   * @param options The instantiation options for a new P5Kernel.
   */
  constructor(options: P5Kernel.IOptions) {
    super(options);
    const { p5Url } = options;
    this._bootstrap = `
      import('${p5Url}').then(() => {
        // create the p5 global instance
        window.__globalP5 = new p5();
        return Promise.resolve();
      })
    `;
    // use the kernel id as a display id
    this._displayId = this.id;
    // wait for the parent IFrame to be ready
    super.ready.then(async () => {
      // TODO
      this._p5Ready.resolve();
    });
  }

  /**
   * A promise that is fulfilled when the kernel is ready.
   */
  get ready(): Promise<void> {
    return this._p5Ready.promise;
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

    const result = await super.executeRequest(content);
    if (result.status !== 'ok') {
      return result;
    }

    // only store the input if the execution is successful
    if (!code.trim().startsWith('%')) {
      this._inputs.push(code);
    }

    // update existing displays since the executed code might affect the rendering
    // of existing sketches

    const magics = await this._magics();
    const { data, metadata } = magics;
    this._parentHeaders.forEach(h => {
      this.clearOutput({ wait: false });
      this.updateDisplayData(
        {
          data,
          metadata,
          transient
        },
        h
      );
    });

    return result;
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
    const width = matches?.[1] ?? undefined;
    const height = matches?.[2] ?? undefined;
    return {
      execution_count: this.executionCount,
      data: {
        [MIME_TYPE]: [
          '<body style="overflow: hidden;">',
          `<script>${script}</script>`,
          '</body>'
        ].join('\n')
      },
      metadata: {
        [MIME_TYPE]: {
          width,
          height
        }
      }
    };
  }

  private _displayId = '';
  private _bootstrap = '';
  private _inputs: string[] = [];
  private _p5Ready = new PromiseDelegate<void>();
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
