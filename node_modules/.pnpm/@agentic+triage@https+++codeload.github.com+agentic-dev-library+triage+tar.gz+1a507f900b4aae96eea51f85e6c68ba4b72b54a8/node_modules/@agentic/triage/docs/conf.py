# Configuration file for the Sphinx documentation builder.
# Synced from jbcom-control-center - customize as needed

import os
import sys
import subprocess
from datetime import datetime

# -- Path setup --------------------------------------------------------------

# Better path handling
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
src_dir = os.path.join(root_dir, "src")

# Add source to path for autodoc
sys.path.insert(0, src_dir)

# -- Project information -----------------------------------------------------

project = "PACKAGE_NAME"
copyright = f"{datetime.now().year}, Jon Bogaty"
author = "Jon Bogaty"
release = "0.0.0"

# Try to get project info from pyproject.toml
try:
    import tomllib
    pyproject_path = os.path.join(root_dir, "pyproject.toml")
    if os.path.exists(pyproject_path):
        with open(pyproject_path, "rb") as f:
            data = tomllib.load(f)
            project_data = data.get("project", {})
            release = project_data.get("version", "0.0.0")
            project = project_data.get("name", "PACKAGE_NAME")
except Exception:
    # Fallback to package.json
    try:
        import json
        package_json_path = os.path.join(root_dir, "package.json")
        if os.path.exists(package_json_path):
            with open(package_json_path) as f:
                release = json.load(f).get("version", "0.0.0")
                # usually package.json has name too
    except Exception:
        pass

# -- General configuration ---------------------------------------------------

extensions = [
    # Python documentation
    "sphinx.ext.autodoc",
    "sphinx.ext.autosummary",
    "sphinx.ext.napoleon",
    "sphinx.ext.viewcode",
    "sphinx.ext.intersphinx",
    "sphinx_autodoc_typehints",
    # Markdown support
    "myst_parser",
    # Diagrams (optional - requires sphinxcontrib-mermaid)
    # "sphinxcontrib.mermaid",
]

templates_path = ["_templates"]
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]

# Source file suffixes
source_suffix = {
    ".rst": "restructuredtext",
    ".md": "markdown",
}

# -- Options for HTML output -------------------------------------------------

html_theme = "sphinx_rtd_theme"
html_static_path = ["_static"]
html_title = f"{project} Documentation"

html_theme_options = {
    "navigation_depth": 4,
    "collapse_navigation": False,
    "sticky_navigation": True,
    "includehidden": True,
    "titles_only": False,
}

# -- Extension configuration -------------------------------------------------

# autodoc settings
autodoc_default_options = {
    "members": True,
    "member-order": "bysource",
    "special-members": "__init__",
    "undoc-members": True,
    "exclude-members": "__weakref__",
    "show-inheritance": True,
}
autodoc_typehints = "description"
autodoc_class_signature = "separated"

# autosummary settings
autosummary_generate = True

# napoleon settings (Google/NumPy style docstrings)
napoleon_google_docstring = True
napoleon_numpy_docstring = True
napoleon_include_init_with_doc = True
napoleon_use_param = True
napoleon_use_rtype = True

# intersphinx settings
intersphinx_mapping = {
    "python": ("https://docs.python.org/3", None),
}

# myst_parser settings
myst_enable_extensions = [
    "colon_fence",
    "deflist",
    "fieldlist",
    "tasklist",
]
myst_heading_anchors = 3

# -- Setup for sphinx-apidoc -------------------------------------------------

def run_apidoc(app):
    """Run sphinx-apidoc to generate API documentation."""
    # Only run if src directory exists
    if os.path.exists(src_dir):
        output_dir = os.path.join(current_dir, "api")

        # Use subprocess to run sphinx-apidoc to avoid environment issues
        # -o: output directory
        # -f: force overwriting
        # -M: put module documentation before submodule documentation
        # -e: put documentation for each module on its own page
        cmd = [
            sys.executable, "-m", "sphinx.ext.apidoc",
            "-o", output_dir,
            src_dir,
            "--force",
            "--module-first",
            "--separate"
        ]

        try:
            print(f"Running sphinx-apidoc: {' '.join(cmd)}")
            subprocess.run(cmd, check=True)

            # Post-process modules.rst to change title from "src" to "Modules"
            modules_rst = os.path.join(output_dir, "modules.rst")
            if os.path.exists(modules_rst):
                with open(modules_rst, "r") as f:
                    content = f.read()

                # sphinx-apidoc uses title and underline of same length.
                # src
                # ===
                if content.startswith("src\n==="):
                     # Replace with Modules
                     # Modules
                     # =======
                     content = content.replace("src\n===", "Modules\n=======", 1)
                     with open(modules_rst, "w") as f:
                         f.write(content)

        except subprocess.CalledProcessError as e:
            print(f"Error running sphinx-apidoc: {e}")
        except Exception as e:
            print(f"Unexpected error running sphinx-apidoc: {e}")

def setup(app):
    app.connect('builder-inited', run_apidoc)
