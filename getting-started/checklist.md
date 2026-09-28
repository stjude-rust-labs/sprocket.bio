---
description: "A step-by-step checklist for adopting Sprocket on your project: set up your editor, CI pipeline, and workflow execution environment."
---

# Checklist

This page is for people new to the Sprocket project who want to understand how
to adopt it on their own project. Work through the items below to get your
development environment, CI pipeline, and workflow execution set up.

## Development environment

- [ ] **Learn WDL (if needed).** If you're new to the Workflow Description
  Language, the OpenWDL
  [Getting started](https://openwdl.org/docs/start/overview/) tutorial is a
  fast-paced introduction to the language. For an in-depth course on building,
  testing, and releasing production pipelines, see the
  [Production guide](https://openwdl.org/docs/production/getting-started/).

- [ ] **Understand how a run works.** Skim the
  [execution model](/concepts/execution-model) to see what Sprocket evaluates
  locally and what it dispatches to a backend.

- [ ] **Install Sprocket.** Get the `sprocket` CLI on your machine via
  Homebrew, direct download, or from source. See the
  [Installation](/getting-started/installation) page.

- [ ] **Set up your editor.** Install the
  [VSCode extension](https://marketplace.visualstudio.com/items?itemName=stjude-rust-labs.sprocket-vscode)
  or the [Neovim plugin](https://github.com/stjude-rust-labs/sprocket.nvim)
  for inline diagnostics and syntax highlighting. See the
  [VSCode guide](/integrations/vscode) for details.

- [ ] **Generate shell completions.** Enable tab completion for commands and
  arguments in your shell. See
  [Shell completions](/reference/cli/completions).

- [ ] **Autocomplete your configuration.** Run `sprocket config schema` and
  point your editor at the result to get completion and inline documentation
  for `sprocket.toml`. See the
  [config command](/reference/cli/config) and the
  [configuration reference](/reference/configuration).

## Code quality

- [ ] **Lint your WDL documents.** Run `sprocket lint` to catch validation
  errors and style issues early. See the
  [Guided Tour](/getting-started/guided-tour#ensuring-high-quality-code) for a walkthrough.

- [ ] **Decide which rules you want.** Browse the
  [lint rules reference](/reference/lint-rules) (or run
  [`sprocket explain`](/reference/cli/explain)) and record the exceptions your
  project needs in `sprocket.toml`. See
  [check/lint configuration](/reference/cli/check-lint#rule-configuration).

- [ ] **Format your WDL documents.** Run `sprocket format overwrite` to
  maintain consistent style across your project. See the
  [format command](/reference/cli/format) reference.

- [ ] **Baseline existing diagnostics (optional).** If your codebase has
  pre-existing lint or validation diagnostics that you cannot address all at
  once, run `sprocket lint --generate-baseline` to capture
  them in a `sprocket-baseline.toml` file. Subsequent runs of `sprocket
  check` will ignore baselined diagnostics, so CI catches _new_ issues while
  the existing backlog is cleaned up on your own schedule. See
  [Baselines](/reference/cli/check-lint#baselines) for details.

- [ ] **Add the GitHub Action.** Add the
  [Sprocket GitHub Action](https://github.com/stjude-rust-labs/sprocket-action)
  to your CI pipeline so that linting and formatting are checked on every pull
  request.

- [ ] **Validate inputs in CI.** Run
  [`sprocket validate`](/reference/cli/validate) against the input files you
  ship so that missing, mistyped, or missing-on-disk inputs fail fast instead of
  failing part-way through a run.

## Running workflows

- [ ] **Run your first workflow.** Execute a task or workflow with
  `sprocket run`. The [Guided Tour](/getting-started/guided-tour#running-tasks-and-workflows)
  walks through a complete example.

- [ ] **Learn how inputs are resolved.** Targets, `@` input files, and array
  inputs are covered on the [Inputs and targets](/concepts/inputs) page;
  `sprocket inputs` can generate a template to start from.

- [ ] **Pin your container images.** Replace mutable tags with digests so runs
  stay reproducible. See [Containers](/concepts/containers#pinning-images).

- [ ] **Configure an execution backend.** If you are running on an HPC cluster
  or a TES endpoint, configure a backend in your `sprocket.toml`. See the
  [Execution Backends](/reference/backends/overview) overview.

- [ ] **Turn on the call cache.** Set `cache = "on"` under `[run.task]` so that
  iterating on a workflow reuses the tasks that already succeeded. See
  [Call Caching](/concepts/call-caching).

- [ ] **Know where your results land.** Runs, logs, task attempts, and the
  provenance database live under the output directory; `--index-on` gives
  results a stable path. See [Provenance Tracking](/concepts/provenance).

## Community

- [ ] **Join the conversation.** The `#sprocket` channel on the
  [OpenWDL Slack](https://join.slack.com/t/openwdl/shared_invite/zt-ctmj4mhf-cFBNxIiZYs6SY9HgM9UAVw)
  is the best place for questions, feedback, and discussion. See
  [Community and Support](/about/community) for issue trackers, discussions, and
  how to contribute.
