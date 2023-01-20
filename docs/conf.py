extensions = ["myst_parser", "jupyterlite_sphinx"]

master_doc = "index"
source_suffix = ".md"

# General information about the project.
project = "JupyterLite p5 kernel"
author = "JupyterLite Contributors"

exclude_patterns = []
highlight_language = "python"
pygments_style = "sphinx"

html_theme = "pydata_sphinx_theme"
html_static_path = ["_static"]

html_css_files = ["custom.css"]
