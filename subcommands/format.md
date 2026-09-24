---
description: "Automatically format WDL documents in a consistent style with the sprocket format command."
---

# `sprocket format`

The `format` subcommand provides automated formatting of WDL documents.

When running `sprocket format`, you must choose whether you want to `check`
the files (useful for continuous integration), `overwrite` the files with their
formatted versions, or `view` a single formatted document on STDOUT.

Formatting can be configured through the `[format]` table in `sprocket.toml` or
through the command-line flags shown by `sprocket format --help`. See the
[`wdl-format` configuration
source](https://github.com/stjude-rust-labs/sprocket/blob/main/crates/wdl-format/src/config.rs)
for the complete list of settings.

## Line fitting

The formatter keeps short literal arrays, `if`/`then`/`else` expressions, and
symbolic import clauses on one line when they fit within `max_line_length`.
Longer expressions and clauses are split across lines.

## Preserving source style

Sprocket preserves quote style, task and workflow section order, and deprecated
command or placeholder syntax by default. These settings control whether the
formatter normalizes those forms:

| Option | Values | Default | Behavior |
|--------|--------|---------|----------|
| `quote_style` | `"preserve"`, `"double"`, `"single"` | `"preserve"` | Preserves existing quotes or rewrites string literals to the selected quote style. |
| `reorder_sections` | Boolean | `false` | Reorders task and workflow sections when enabled. |
| `upgrade_deprecations` | Boolean | `false` | Converts curly-brace command sections to heredoc sections and dollar-style placeholders to tilde-style placeholders when enabled. |

For example, this configuration normalizes all three forms:

```toml
[format]
quote_style = "double"
reorder_sections = true
upgrade_deprecations = true
```

## Input formatting

> [!NOTE]
>
> Input sorting is disabled by default. To enable it, set `sort_inputs = true`
> in the `[format]` section of your `sprocket.toml`.

Sprocket has an opinionated order for WDL `input` sections.

First, it sorts by:

1. required inputs
2. optional inputs _without_ defaults
3. optional inputs _with_ defaults
4. inputs with a default value

Within each of those groupings, inputs are further sorted by WDL type:

1. File
2. Array[\*]+
3. Array[\*]
4. struct
5. Object
6. Map[\*, \*]
7. Pair[\*, \*]
8. String
9. Boolean
10. Float
11. Int

For ordering of the same compound type (`Array[\*]`, `Map[\*, \*]`, `Pair[\*, \*]`), Sprocket drops the outermost type (`Array`, `Map`, `Pair`) and recursively applies the above sorting on the first inner type, with ties broken by the second inner type. This continues as far as possible.

Once this ordering is satisfied, it is up to the developer for final order of inputs of the same type. Sprocket `format` will preserve relative ordering within types.

## Trailing commas

The formatter automatically adds trailing commas to multiline lists (e.g.,
`meta`, `parameter_meta`, and `runtime` sections). This is enabled by default
and can be configured via the `trailing_commas` option in the `[format]`
section of your `sprocket.toml`.
