# jupyterlite-p5-kernel

[![Github Actions Status](https://github.com/jupyterlite/p5-kernel/workflows/Build/badge.svg)](https://github.com/jupyterlite/p5-kernel/actions/workflows/build.yml)
[![JupyterLite](https://jupyterlite.rtfd.io/en/latest/_static/badge-launch.svg)](https://jupyterlite-p5-kernel.readthedocs.io/en/latest/lite/lab)

A p5.js kernel for JupyterLite.

![image](https://user-images.githubusercontent.com/591645/135318337-8e63861c-c598-48db-8c90-2c86d3a8936b.png)

## Requirements

- [JupyterLite](https://github.com/jupyterlite/jupyterlite) `0.1.0b18+`

## Install

This JupyterLite kernel can be installed as a federated server extension.

```bash
# Install the kernel
pip install jupyterlite-p5-kernel

# Build a new JupyterLite site
jupyter lite build
```

See the JupyterLite documentation for more information on how to build sites and include additional extensions: https://jupyterlite.readthedocs.io/en/latest/howto/index.html

## Uninstall

```bash
pip uninstall jupyterlite-p5-kernel
```

## Contributing

### Development install

```bash
# Clone the repo to your local environment
# Change directory to the fork directory

# create a new enviroment
mamba create --name jupyterlite-p5-kernel -c conda-forge python=3.9 yarn jupyterlab
conda activate jupyterlite-p5-kernel

# Install package in development mode
python -m pip install -e .

# Link your development version of the extension with JupyterLab
jlpm run install:extension

# Rebuild the extension Typescript source after making changes
jlpm run build
```

The extension should be linked to `PREFIX/share/jupyter/labextensions` and can be picked up by `jupyterlite`:

```bash
# Install jupyterlite
python -m pip install jupyterlite

# Build a new JupyterLite site
jupyter lite build

# Serve the site
jupyter lite serve

# Launch a browser to the Jupyterlite server url
python -m webbrowser http://localhost:8000/
```

## References

### p5.js

- Processing > ProcessingJS > p5.js
  https://en.wikipedia.org/wiki/Processing#p5.js
- https://github.com/processing/p5.js
- https://p5js.org/learn/
- https://p5js.org/reference/ API docs
- https://p5js.org/examples/
  - https://p5js.org/examples/math-additive-wave.html
  - https://p5js.org/examples/interaction-wavemaker.html
- https://p5js.org/examples/objects-objects.html
- https://github.com/processing/p5.js/wiki/Beyond-the-canvas#creating-html-images
- https://github.com/processing/p5.js/wiki/Getting-started-with-WebGL-in-p5#introducing-webgl-in-p5js
- Summer of Code
  https://github.com/processing/p5.js/wiki#google-summer-of-code-and-processing-fellowships
- Season of Docs
  https://github.com/processing/p5.js/wiki#season-of-docs

#### p5.js Learning Resources

- https://github.com/processing/p5.js/wiki/Educational-Resources
- https://www.khanacademy.org/computing/computer-programming/pjs-documentation
  - https://www.khanacademy.org/computing/computer-programming/programming-games-visualizations/advanced-development-tools/a/using-processingjs-outside-khan-academy
- Khan Academy > Computer Programming > "Intro to JS: Drawing & Animation"
  https://www.khanacademy.org/computing/computer-programming/programming
  - https://github.com/processing/p5.js/wiki/Processing-transition#overview-of-differences
  - https://github.com/processing/p5.js/wiki/p5.js-overview#how-is-this-different-than-processingjs
- Khan Academy > Computing > Pixar in a Box
  https://www.khanacademy.org/computing/pixar
  - https://www.khanacademy.org/computing/pixar/simulation#hair-simulation-code
  - https://www.khanacademy.org/computing/pixar/pixar-rigging#code-character
  - https://en.wikipedia.org/wiki/Lorentz_transformation Rotation about a point other than the origin
  - https://en.wikipedia.org/wiki/Quaternion
