# `sprocket analyzer`

The `analyzer` subcommand runs the [language server protocol (LSP)][lsp] server
included with Sprocket. Briefly, the Sprocket LSP server is used by your editor
of choice to handle things like "go to definition" requests, "find all
references" requests, symbol renaming, formatting, semantic syntax highlighting,
and snippet generation.

For Visual Studio Code, we have a [prepackaged Sprocket extension][extension]
that automatically downloads the latest version of Sprocket and configures the
LSP. For Neovim, the [`sprocket.nvim`][neovim] plugin provides similar
integration. For other editors, you should search for how to set up an LSP with
your editor of choice.

## Configuration

The analyzer honors the `[format]` section of your `sprocket.toml`, so
formatting performed through the LSP (for example, "format document" in your
editor) matches the output of [`sprocket format`](/subcommands/format). See the
[configuration guide](/configuration/overview.md) for the available `[format]`
options.

Set `lint = true` under `[analyzer]` to enable lint rules. The analyzer and
`sprocket check` share diagnostic exceptions from `[check].except`:

```toml
[analyzer]
lint = true

[check]
except = ["ContainerUri"]
```

The former `[analyzer].except` setting is no longer accepted; move those entries
to `[check].except`.

After an initial document analysis, the language server reuses unchanged
analysis results as you edit instead of analyzing the whole document again.

## Test code lenses

The analyzer provides code lenses for Sprocket test YAML files. Editors that
support the corresponding Sprocket commands can show actions above a target to
run all of its tests and above a test name to run that individual test.

## Transports

At the time of writing, `sprocket analyzer` only supports the standard I/O
(`--stdio`) transport. If you have a use case for us to support other
transports, please [file an issue][issues].

[lsp]: https://en.wikipedia.org/wiki/Language_Server_Protocol
[extension]: /vscode/getting-started.md
[neovim]: https://github.com/stjude-rust-labs/sprocket.nvim
[issues]: https://github.com/stjude-rust-labs/wdl/issues