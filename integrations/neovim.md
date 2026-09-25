---
title: Neovim
description: "Set up WDL language support in Neovim with the sprocket.nvim plugin, including LSP features, commands, and configuration."
---

<!-- Sources: https://github.com/stjude-rust-labs/sprocket.nvim@5bcd86d57b8264e2d6854c29d9d7177ecc3a7322 -->

# Neovim

[`sprocket.nvim`](https://github.com/stjude-rust-labs/sprocket.nvim) provides
WDL support for Neovim, powered by the Sprocket language server
([`sprocket analyzer`](/reference/cli/analyzer)).

The plugin includes:

* **LSP integration.** Completions, diagnostics, hover documentation,
  go-to-definition, and references powered by Sprocket.
* **Syntax highlighting.** WDL 1.0 through 1.3, via Vim regex patterns.
* **Document formatting.** Format WDL files on save or on demand, through the
  language server or the [`sprocket format`](/reference/cli/format) command.
* **Commands.** Validate, lint, and format files without leaving Neovim.
* **Statusline component.** Show language server status in your statusline
  (lualine and similar).
* **Plugin integrations.** Works with `nvim-autopairs` for auto-closing
  `<<<`/`>>>` and `~{`/`}` pairs, and with `Comment.nvim` for `#` comments.

## Requirements

* Neovim 0.11 or greater.
* The `sprocket` binary. See [Installation](/getting-started/installation), or
  let the plugin install it for you.

## Installation

Install the plugin with your package manager of choice:

::: code-group

```lua [lazy.nvim]
{
  "stjude-rust-labs/sprocket.nvim",
  ft = "wdl",
  opts = {},
}
```

```lua [packer.nvim]
use {
  "stjude-rust-labs/sprocket.nvim",
  ft = "wdl",
  config = function()
    require("sprocket").setup({})
  end,
}
```

```vim [vim-plug]
Plug 'stjude-rust-labs/sprocket.nvim'

" In your init.lua or after/plugin:
lua require("sprocket").setup({})
```

:::

### Installing Sprocket

Download the latest release from [GitHub
Releases](https://github.com/stjude-rust-labs/sprocket/releases) and make sure
`sprocket` is on your `PATH`:

```shell
# Example for macOS/Linux
curl -LO https://github.com/stjude-rust-labs/sprocket/releases/latest/download/sprocket-<version>-<platform>.tar.gz
tar -xzf sprocket-*.tar.gz
mv sprocket ~/.local/bin/
```

Alternatively, enable `auto_install` in the plugin configuration to download the
binary automatically.

## Configuration

All options, with their defaults:

```lua
require("sprocket").setup({
  binary = {
    path = nil,            -- Custom path to sprocket binary
    auto_install = false,  -- Auto-download from GitHub if not found
    check_updates = false, -- Check for updates on startup
  },
  server = {
    lint = false,        -- Enable additional linting via `--lint` flag
    log_level = "quiet", -- "quiet" | "info" | "verbose"
  },
  format_on_save = false,  -- Auto-format WDL files before saving
  status = {
    enabled = true, -- Enable statusline component
    icons = {
      ok = "󰗡",
      warning = "",
      error = "",
      loading = "󰑮",
    },
  },
  lsp = {
    capabilities = nil, -- Custom LSP capabilities (auto-detects cmp-nvim-lsp)
    on_attach = nil,    -- Callback when LSP attaches to buffer
    handlers = nil,     -- Custom LSP handlers (merged with defaults)
  },
})
```

Setting `server.lint = true` turns on the [lint
rules](/reference/cli/check-lint) in addition to analysis diagnostics.

### Example with keymaps

```lua
{
  "stjude-rust-labs/sprocket.nvim",
  ft = "wdl",
  opts = {
    lsp = {
      on_attach = function(client, bufnr)
        local map = function(mode, lhs, rhs, desc)
          vim.keymap.set(mode, lhs, rhs, { buffer = bufnr, desc = desc })
        end

        -- Navigation
        map("n", "gd", vim.lsp.buf.definition, "Go to definition")
        map("n", "gr", vim.lsp.buf.references, "Find references")
        map("n", "gI", vim.lsp.buf.implementation, "Go to implementation")
        map("n", "K", vim.lsp.buf.hover, "Hover documentation")

        -- Actions
        map("n", "<leader>rn", vim.lsp.buf.rename, "Rename symbol")
        map("n", "<leader>ca", vim.lsp.buf.code_action, "Code action")
        map("n", "<leader>f", function()
          vim.lsp.buf.format({ async = true })
        end, "Format buffer")

        -- Diagnostics
        map("n", "[d", vim.diagnostic.goto_prev, "Previous diagnostic")
        map("n", "]d", vim.diagnostic.goto_next, "Next diagnostic")
        map("n", "<leader>e", vim.diagnostic.open_float, "Show diagnostic")
      end,
    },
  },
}
```

## Commands

All commands use the `:Sprocket` prefix:

| Command | Description |
|---|---|
| `:Sprocket info` | Show version, binary path, and server status. |
| `:Sprocket restart` | Restart the language server. |
| `:Sprocket stop` | Stop the language server. |
| `:Sprocket version` | Display the installed `sprocket` version. |
| `:Sprocket update` | Download and install the latest `sprocket` version. |
| `:Sprocket check [path]` | Validate a WDL file (defaults to the current buffer). |
| `:Sprocket lint [path]` | Run the linter on a WDL file. |
| `:Sprocket format [path]` | Format a WDL file. |
| `:Sprocket log` | Open the language server log file for debugging. |

## Statusline

Add the status component to your statusline to see language server status at a
glance:

```lua
-- lualine.nvim
require("lualine").setup({
  sections = {
    lualine_x = { require("sprocket").status },
  },
})
```

Icons indicate server status:

* 󰗡 Running normally
*  Warning
*  Error
* 󰑮 Starting or loading

## Health check

Run `:checkhealth sprocket` to verify your setup. The health check reports:

* Neovim version compatibility.
* Binary availability and version.
* Required tools (`curl`, and `tar` or `unzip` for auto-install).
* Language server status.
* Optional dependencies (`nvim-cmp`).
* The current configuration.

## Optional dependencies

| Plugin | Benefit |
|---|---|
| [nvim-cmp](https://github.com/hrsh7th/nvim-cmp) + [cmp-nvim-lsp](https://github.com/hrsh7th/cmp-nvim-lsp) | Enhanced completion with LSP integration. |
| [nvim-autopairs](https://github.com/windwp/nvim-autopairs) | Auto-close `<<<`/`>>>`, `~{`/`}`, and `${`/`}` pairs. |
| [Comment.nvim](https://github.com/numToStr/Comment.nvim) | Toggle comments with `gc` mappings. |

## Troubleshooting

**The language server does not start.**

1. Verify that Sprocket is installed: `:Sprocket version`.
2. Check the log: `:Sprocket log`.
3. Make sure the file has a `.wdl` extension.
4. Run `:checkhealth sprocket`.

**No completions.**

1. Confirm the server is running: `:Sprocket info`.
2. If you use `nvim-cmp`, verify that `cmp-nvim-lsp` is configured.
3. Check your WDL file for syntax errors.

**Formatting does not work.**

1. Check for syntax errors; formatting requires valid WDL.
2. Update Sprocket: `:Sprocket update`.
3. Check the log: `:Sprocket log`.

## Contributing

Contributions are welcome. File issues, request features, or open a pull request
in the [`stjude-rust-labs/sprocket.nvim`](https://github.com/stjude-rust-labs/sprocket.nvim)
repository. The plugin is licensed under either the Apache License 2.0 or the
MIT license, at your option.
