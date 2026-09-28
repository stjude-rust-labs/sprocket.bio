---
title: "`sprocket completions`"
description: "Reference for the sprocket completions command and how to enable shell completions for Sprocket."
---

<!-- Sources: `sprocket completions --help` from Sprocket v0.31.0 (ec33b7cc3) -->

# `sprocket completions`

`sprocket` can generate command-line completion scripts for various shells,
allowing you to use tab completion for commands and arguments.

::: warning Warning
Regenerate your shell completion script after every upgrade so that it matches
your installed version. See [Project Status](/about/project-status) for how
command interfaces change over time.
:::

To generate a completion script, use the `completions` subcommand, specifying your shell:

```shell
sprocket completions <SHELL>
```

Supported shells are: `bash`, `elvish`, `fish`, `powershell` and `zsh`. The
script is written to standard output, so redirect it to a file to save it.

## Enabling Completions

The exact steps to correctly enable shell completions depend on your specific
shell and how it's configured. Generally it involves two main steps:

1. Run the `sprocket completions <your shell>` command and redirect its standard output into a file,
   often somewhere in your home directory. For example, a Bash user might run:

```shell
sprocket completions bash > ~/.bash_completions/sprocket.bash
```

2. Modify your shell's startup configuration file (e.g. `~/.bashrc`, `~/.zshrc`,
`~/.config/fish/config.fish`, PowerShell's `$PROFILE`, Elvish's
`~/.config/elvish/rc.elv`) to source the file you just created. Continuing the
Bash example, add this line to your `~/.bashrc`

```shell
source ~/.bash_completions/sprocket.bash
```

Open a new shell (or re-source the startup file) for completions to take effect.
