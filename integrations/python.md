---
description: "Install the sprocket-bio package from PyPI to parse and analyze WDL documents programmatically from Python."
---

<!-- Sources: https://pypi.org/project/sprocket-bio/ (0.31.0), https://github.com/stjude-rust-labs/sprocket@v0.31.0 (python/sprocket_bio) -->

# Python Bindings

Sprocket provides Python APIs that you can use to programmatically analyze WDL
documents. These Python bindings expose a subset of the Rust APIs included in
Sprocket's [`wdl`](https://crates.io/crates/wdl) crate.

The bindings are built from the same repository as the command line tool,
[`stjude-rust-labs/sprocket`](https://github.com/stjude-rust-labs/sprocket), and
are released with the same version number as Sprocket itself.

## Installation

Sprocket's Python bindings are available on PyPI as
[`sprocket-bio`](https://pypi.org/project/sprocket-bio/). It requires Python 3.10 or greater, and
can be installed using [Pip](https://pip.pypa.io/):

```bash
pip install sprocket-bio
```

Sprocket publishes precompiled
[wheels](https://packaging.python.org/en/latest/specifications/binary-distribution-format/) for
many common platforms and Python versions. If you install `sprocket-bio` on a platform that does
not have a precompiled wheel, you will need the latest stable release of the [Rust
compiler](https://rust-lang.org/) in order to build from source.

Release 0.31.0 ships wheels for CPython 3.10 through 3.15 (including the
free-threaded builds) and PyPy 3.11, covering macOS on x86-64 and Apple silicon,
`manylinux` and `musllinux` on x86-64 and aarch64, and Windows on x86-64 and
ARM64.

### Supported Python versions

The minimum supported Python version is currently 3.10. `sprocket-bio` supports
the oldest Python version still receiving security updates, and drops support
for versions as they reach end of life. See [Python's version status
page](https://devguide.python.org/versions/) for the current schedule.

## Usage

The package exposes three modules: `sprocket_bio.grammar` for parsing WDL,
`sprocket_bio.ast` for working with the resulting syntax tree, and
`sprocket_bio.diagnostics` for rendering diagnostics the way the command line
tool does. The package is typed, so it ships type stubs for editors and
`mypy`.

For example, parsing a document and printing any diagnostics:

```python
from sprocket_bio.diagnostics import Mode, emit_diagnostics
from sprocket_bio.grammar import SupportedVersion
from sprocket_bio.grammar.grammar import document
from sprocket_bio.grammar.version import V1

with open("example.wdl", "rt", encoding="utf-8") as f:
    source = f.read()

events, diagnostics = document(source, fallback_version=SupportedVersion.V1(V1.ZERO))

if diagnostics:
    emit_diagnostics("example.wdl", source, diagnostics, report_mode=Mode.FULL, colorize=True)
```

Complete, runnable examples — emitting diagnostics, walking the parser event
stream, and building a syntax highlighter — live in
[`python/sprocket_bio/examples`](https://github.com/stjude-rust-labs/sprocket/tree/main/python/sprocket_bio/examples)
in the Sprocket repository.

## Documentation

You can find the Python binding's API docs and several examples online at
<https://sprocket-bio.readthedocs.io/>.

## Building from source

The Python package lives at `python/sprocket_bio` in the Sprocket repository,
and the extension module it bundles is compiled from `crates/sprocket-py` with
the [Maturin](https://www.maturin.rs) build system. To build it yourself with
Python 3.10 or greater:

```shell
# Create the Python virtual environment, installing the latest version of pip
# and setuptools.
python -m venv --upgrade-deps .venv

# Activate the virtual environment.
source .venv/bin/activate

# Install the build system, Maturin.
pip install maturin

# Compile and install `sprocket_bio` in the virtual environment.
maturin develop

# Run unit tests.
pytest
```

Unit tests are defined in `python/tests` using
[`pytest`](https://docs.pytest.org). Type and stub checking is performed by
[`mypy`](https://mypy.readthedocs.io) (`mypy python/` and
`python -m mypy.stubtest sprocket_bio`), code formatting by
[`black`](https://black.readthedocs.io), and import sorting by
[`isort`](https://isort.readthedocs.io). Building the API documentation requires
Python 3.12 or greater and `maturin develop --group docs`, followed by
`sphinx-build --fail-on-warning python/docs <output directory>`.

## Getting help

Report bugs and request features in the [Sprocket issue
tracker](https://github.com/stjude-rust-labs/sprocket/issues), or ask in the
`#sprocket` channel on the WDL Slack. See [Community and
Support](/about/community) for all of the ways to reach the maintainers.
