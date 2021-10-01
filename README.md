# jupyterlite-p5-kernel

[![Github Actions Status](https://github.com/jupyterlite/p5-kernel/workflows/Build/badge.svg)](https://github.com/jupyterlite/p5-kernel/actions/workflows/build.yml)

A p5.js kernel for JupyterLite.

![image](https://user-images.githubusercontent.com/591645/135318337-8e63861c-c598-48db-8c90-2c86d3a8936b.png)

## Requirements

- [JupyterLite](https://github.com/jupyterlite/jupyterlite) `0.1.0a10+`

## Install

This JupyterLite kernel can be installed as a federated server extension.

```bash
# install the kernel
pip install jupyterlite-p5-kernel

# build a new JupyterLite site
jupyter lite build
```

See the JupyterLite documentation for more information on how to build sites and include additional extensions: https://jupyterlite.readthedocs.io/en/latest/configuring.html#adding-extensions

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
# install jupyterlite
python -m pip install jupyterlite

# build a new JupyterLite site
jupyter lite build

# server the site
jupyter lite serve
```

Then go to http://localhost:8000 to launch JupyterLite with the federated server extension.
