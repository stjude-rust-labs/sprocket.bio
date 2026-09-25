# `sprocket format`

The `format` subcommand provides automated formatting of WDL documents.

When running `sprocket format`, you must choose whether you want to `check`
the files (useful for continuous integration), `overwrite` the files with their
formatted versions, or `view` a single formatted document on STDOUT.

::: warning Compatibility
The exact layout produced by the formatter may change in any release. A file
that passes `sprocket format check` in one release may fail in a later release
until you reformat it. The `format` subcommands, their options, configuration
keys documented on this site, and the meanings of their exit statuses remain
stable from Sprocket `1.0`.
:::

There are a number of options for formatting that can be configured: either via
the `format` key in your `sprocket.toml` or via command-line options. Run
`sprocket config schema` to see the complete set of formatting keys and types
supported by your installed Sprocket version.

`sprocket format check` exits with status `0` when every checked file matches
the current formatter. It exits with status `1` when a file needs reformatting
or the check cannot complete, and status `2` when the command line or one of its
arguments is invalid.

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
