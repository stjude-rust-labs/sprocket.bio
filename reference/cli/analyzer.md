---
description: "Run Sprocket's WDL language server (LSP) to power go to definition, diagnostics, completions, and more in your editor."
---

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
editor) matches the output of [`sprocket format`](/reference/cli/format). See the
[configuration guide](/concepts/configuration) for the available `[format]`
options.

Set `lint = true` under `[analyzer]`, or pass `--lint`, to enable
[lint rules](/reference/lint-rules). The analyzer and
[`sprocket check`](/reference/cli/check-lint) share diagnostic exceptions from
the `except` list under `[check]`:

```toml
[analyzer]
lint = true

[check]
except = ["ContainerUri"]
```

This example suppresses the
[`ContainerUri`](/reference/lint-rules#containeruri) rule.

After an initial document analysis, the language server reuses unchanged
analysis results as you edit instead of analyzing the whole document again.

## Code lenses

The analyzer provides code lenses that editors can show as actions next to
relevant WDL and test definitions. In Sprocket test YAML files, these actions
can run every test under a target or one individual test.

## Transports

At the time of writing, `sprocket analyzer` only supports the standard I/O
(`--stdio`) transport. If you have a use case for us to support other
transports, please [file an issue][issues].

Start the analyzer over standard input and output with:

```shell
sprocket analyzer --stdio
```

[lsp]: https://en.wikipedia.org/wiki/Language_Server_Protocol
[extension]: /integrations/vscode
[neovim]: https://github.com/stjude-rust-labs/sprocket.nvim
[issues]: https://github.com/stjude-rust-labs/wdl/issues