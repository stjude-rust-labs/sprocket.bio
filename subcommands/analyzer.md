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

[lsp]: https://en.wikipedia.org/wiki/Language_Server_Protocol
[extension]: /vscode/getting-started.md
[issues]: https://github.com/stjude-rust-labs/wdl/issues