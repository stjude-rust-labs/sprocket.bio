# Python Bindings

Sprocket provides Python APIs that you can use to programmatically analyze WDL documents. These
Python bindings expose a subset of the Rust APIs included in Sprocket's
[`wdl`](https://crates.io/crates/wdl) crate.

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

## Documentation

You can find the Python binding's API docs and several examples online at
<https://sprocket-bio.readthedocs.io/>.
