# Quickstart Checklist

This page is for people new to the Sprocket project who want to understand how
to adopt it on their own project. Work through the items below to get your
development environment, CI pipeline, and workflow execution set up.

## Development environment

- [ ] **Install Sprocket.** Get the `sprocket` CLI on your machine via
  Homebrew, direct download, or from source. See the
  [Installation](/installation) page.

- [ ] **Set up your editor.** Install the
  [VSCode extension](https://marketplace.visualstudio.com/items?itemName=stjude-rust-labs.sprocket-vscode)
  or the [Neovim plugin](https://github.com/stjude-rust-labs/sprocket.nvim)
  for inline diagnostics and syntax highlighting. See the
  [VSCode guide](/vscode/getting-started) for details.

- [ ] **Generate shell completions.** Enable tab completion for commands and
  arguments in your shell. See
  [Shell completions](/installation#shell-completions).

## Code quality

- [ ] **Lint your WDL documents.** Run `sprocket lint` to catch validation
  errors and style issues early. See the
  [Guided Tour](/guided-tour#ensuring-high-quality-code) for a walkthrough.

- [ ] **Format your WDL documents.** Run `sprocket format overwrite` to
  maintain consistent style across your project. See the
  [format command](/subcommands/format) reference.

- [ ] **Add the GitHub Action.** Add the
  [Sprocket GitHub Action](https://github.com/stjude-rust-labs/sprocket-action)
  to your CI pipeline so that linting and formatting are checked on every pull
  request.

## Running workflows

- [ ] **Run your first workflow.** Execute a task or workflow with
  `sprocket run`. The [Guided Tour](/guided-tour#running-tasks-and-workflows)
  walks through a complete example.

- [ ] **Configure an execution backend.** If you are running on an HPC cluster
  or a TES endpoint, configure a backend in your `sprocket.toml`. See the
  [Execution Backends](/configuration/backends/overview) overview.

## Community

- [ ] **Join the conversation.** The `#sprocket` channel on the
  [OpenWDL Slack](https://join.slack.com/t/openwdl/shared_invite/zt-ctmj4mhf-cFBNxIiZYs6SY9HgM9UAVw)
  is the best place for questions, feedback, and discussion.
