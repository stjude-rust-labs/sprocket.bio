---
title: Introduction
description: "Sprocket is an open-source bioinformatics workflow engine built on the Workflow Description Language (WDL)."
---

![Sprocket, by St. Jude Rust Labs](/repo-header.png)

# Introduction

**Sprocket** is a bioinformatics workflow execution engine built on top of the
[Workflow Description Language](https://openwdl.org). It runs WDL tasks and
workflows on your laptop, on an HPC cluster, or in the cloud, and it ships with
the development tools you need to write WDL in the first place: a linter, a
formatter, a language server, and a documentation generator.

Sprocket is written in [Rust](https://www.rust-lang.org/) and enjoys all of the
benefits that come with that choice. It also takes heavy inspiration from Rust
in terms of its approach to building developer tools that are a joy to use. The
project is developed in the open by [St. Jude Rust Labs].

## Project goals

The project has multiple high-level goals, including to:

- Provide a [**high-performance** workflow execution
  engine](/about/philosophy#high-performance-workflow-execution-engine) capable
  of orchestrating massive bioinformatics workloads (the stated target is
  20,000+ concurrent jobs).
- Develop a suite of [**modern development
  tools**](/about/philosophy#modern-development-tools) that brings
  bioinformatics development on par with other modern languages (e.g.,
  [`wdl-lsp`](https://github.com/stjude-rust-labs/wdl/tree/main/wdl-lsp)).
- Maintain a [**community-focused
  codebase**](/about/philosophy#community-focused-codebase) that enables a
  diverse set of contributors from academic, non-profit, and commercial
  organizations.
- Build on an [**open, domain-tailored
  standard**](/about/philosophy#open-tailored-standard) to ensure the toolset
  remains singularly focused on unencumbered innovation within bioinformatics.
- Retain a [**simple and accessible user
  experience**](/about/philosophy#simple-and-accessible-user-experience) when
  complexity isn't warranted.

The [philosophy](/about/philosophy) page explains each goal in full, along with
what the project considers goal-adjacent and what it considers a non-goal.

## The parts of the project

The code that drives Sprocket is split across the [`wdl`] family of crates, the
[`sprocket`] command line tool, the [Visual Studio Code extension]
([source](https://github.com/stjude-rust-labs/sprocket-vscode)), and the
[Neovim plugin] ([source](https://github.com/stjude-rust-labs/sprocket.nvim)).

## How Sprocket runs a workflow

`sprocket run` evaluates your WDL document locally, localizes any remote
inputs, and decomposes the workflow into individual tasks. Each task is
dispatched to the one configured execution backend—Docker on your local
machine by default, or a TES server or HPC cluster—and Sprocket monitors it,
retries it when asked to, reuses a cached result when one is available, and
records the run in a provenance database alongside its outputs. See the
[execution model](/concepts/execution-model) for the full picture.

## Where to go next

- [Installation](/getting-started/installation) — get the `sprocket` command
  line tool with Homebrew, a release binary, Docker, or Cargo.
- [Guided tour](/getting-started/guided-tour) — lint, validate, and run a small
  WDL document from start to finish.
- [Adoption checklist](/getting-started/checklist) — set up your editor, your
  CI pipeline, and your execution environment.
- [Run on Slurm](/guides/slurm) and [run on LSF](/guides/lsf) — put workflows on
  an HPC cluster with Apptainer.
- [Configuration](/concepts/configuration) — how `sprocket.toml` is discovered,
  merged, and resolved.
- [Commands](/reference/cli/run) — the reference for `run` and every other
  subcommand.

[`wdl`]: https://github.com/stjude-rust-labs/wdl
[`sprocket`]: https://github.com/stjude-rust-labs/sprocket
[Visual Studio Code extension]: https://marketplace.visualstudio.com/items?itemName=stjude-rust-labs.sprocket-vscode
[Neovim plugin]: https://github.com/stjude-rust-labs/sprocket.nvim
[St. Jude Rust Labs]: https://github.com/stjude-rust-labs
