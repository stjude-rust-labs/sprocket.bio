---
description: "Install Sprocket with Homebrew, a pre-built release binary, or a Docker image, or build it from source with Cargo or Nix."
---

# Installation

If you're looking for the latest stable version of the `sprocket` command line
tool, you can download it through a [package manager](#package-managers),
[download it from the release page](#direct-download), use [Docker](#docker-images), or [build
it from source](#build-from-source).

## Package managers

### Homebrew

Sprocket is available through the [Homebrew package manager](https://brew.sh) on
both MacOS and Linux. After installing Homebrew, you can install Sprocket with
the following command.

```bash
brew install sprocket
```

## Direct download

A pre-built binary for `sprocket` can be downloaded from the latest [release
entry on GitHub](https://github.com/stjude-rust-labs/sprocket/releases). Each
platform has different requirements regarding shared libraries that are expected
to be installed.

## Docker images

Every released version of `sprocket` is available through the GitHub Container
Registry.

```bash
docker run ghcr.io/stjude-rust-labs/sprocket:v0.31.0 -h
```

## Build from source

There are also a number of options to build `sprocket` from source, including
pulling in the released source from [crates.io](#crates-io) or downloading the
source directly from [GitHub](#github). 

All methods for building `sprocket` from source require [Rust] and `cargo` to be
installed. We recommend using [rustup] to accomplish this. 

### Crates.io

You can use `cargo` to install the latest version of `sprocket` from
[crates.io].

```shell
cargo install sprocket
```

If desired, you can also check out a specific version of `sprocket`.

```shell
cargo install sprocket@0.31.0
```

### GitHub

Both the source code and the instructions to build the `sprocket` command line
tool are available on GitHub at [`stjude-rust-labs/sprocket`][github-src].

* The [releases][github-releases] page contains all of the official releases for
  the project.
* If desired, you can install either the latest unpublished version (the code
  available on `main`) _or_ any experimental features by checking out the
  associated feature branch (`git checkout <branch-name>`).

The simplest way is just to clone the repository and build the `main` branch,
which is expected to always contain a compilable and correct (though, perhaps
unreleased) version of Sprocket.

```shell
git clone https://github.com/stjude-rust-labs/sprocket.git
cd sprocket
cargo run --release
```

### Nix flake

Sprocket ships a [Nix](https://nixos.org/download/) flake. With flakes enabled,
you can build or run Sprocket directly from the repository:

```bash
# Build the binary (output at ./result/bin/sprocket)
nix build github:stjude-rust-labs/sprocket#sprocket
./result/bin/sprocket --help

# Or run it without installing
nix run github:stjude-rust-labs/sprocket -- --help
```

## Shell completions

`sprocket` can generate command-line completion scripts for `bash`, `elvish`,
`fish`, `powershell`, and `zsh`:

```shell
sprocket completions <SHELL>
```

Regenerate the script each time you update `sprocket`. See the
[`sprocket completions`](/reference/cli/completions) reference for how to
install and enable the script in your shell.

[crates.io]: https://crates.io/crates/sprocket
[github-releases]: https://github.com/stjude-rust-labs/sprocket/releases
[github-src]: https://github.com/stjude-rust-labs/sprocket
[Homebrew]: https://brew.sh
[Rust]: https://rust-lang.org
[rustup]: https://rustup.rs
