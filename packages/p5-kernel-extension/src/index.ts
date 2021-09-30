// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import {
  JupyterLiteServer,
  JupyterLiteServerPlugin
} from '@jupyterlite/server';

import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';

import { P5Kernel } from '@jupyterlite/p5-kernel';

import p5Logo from '../style/icons/p5js.png';

/**
 * The default CDN fallback for p5.js
 */
const P5_CDN_URL = 'https://cdn.jsdelivr.net/npm/p5@1.3.1/lib/p5.js';

/**
 * A plugin to register the p5.js kernel.
 */
const kernel: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/p5-kernel-extension:kernel',
  autoStart: true,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    const url = PageConfig.getOption('p5Url') || P5_CDN_URL;
    const p5Url = URLExt.isLocal(url)
      ? URLExt.join(window.location.origin, url)
      : url;
    const logo = new URL(p5Logo);
    console.log(`logo: ${logo.pathname}`);
    kernelspecs.register({
      spec: {
        name: 'p5js',
        display_name: 'p5.js',
        language: 'javascript',
        argv: [],
        spec: {
          argv: [],
          env: {},
          display_name: 'p5.js',
          language: 'javascript',
          interrupt_mode: 'message',
          metadata: {}
        },
        resources: {
          'logo-32x32': 'TODO',
          'logo-64x64': '' // TODO: replace by logo.pathname when fixed upstream
        }
      },
      create: async (options: IKernel.IOptions): Promise<IKernel> => {
        return new P5Kernel({
          ...options,
          p5Url
        });
      }
    });
  }
};

const plugins: JupyterLiteServerPlugin<any>[] = [kernel];

export default plugins;
