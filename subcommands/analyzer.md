# `sprocket analyzer`

The `analyzer` subcommand runs the [language server protocol (LSP)][lsp] server
included with Sprocket. Briefly, the Sprocket LSP server is used by your editor
of choice to handle things like "go to definition" requests, "find all
references" requests, symbol renaming, formatting, semantic syntax highlighting,
and snippet generation.

For Visual Studio Code, we have a [prepackaged Sprocket extension][extension]
that automatically downloads the latest version of Sprocket and configures the
LSP. For other editors, you should search for how to set up an LSP with your
editor of choice.

## Transports

At the time of writing, `sprocket analyzer` only supports the standard I/O
(`--stdio`) transport. If you have a use case for us to support other
transports, please [file an issue][issues].

## Help text

```
Runs the Language Server Protocol (LSP) server

Usage: sprocket analyzer [OPTIONS] --stdio

Options:
      --stdio
          Use stdin and stdout for the RPC transport

      --lint
          Whether or not to enable lint rules

  -e, --except <RULE>
          Excepts (ignores) an analysis or lint rule.

          Repeat the flag multiple times to except multiple rules.

  -v, --verbose...
          Increase logging verbosity

  -q, --quiet...
          Decrease logging verbosity

  -c, --config <CONFIG>
          Path to the configuration file

  -s, --skip-config-search
          Skip searching for and loading configuration files.

          Only a configuration file specified as a command line argument will be used.

  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version
```

[lsp]: https://en.wikipedia.org/wiki/Language_Server_Protocol
[extension]: /vscode/getting-started.md
[issues]: https://github.com/stjude-rust-labs/wdl/issues