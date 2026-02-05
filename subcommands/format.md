# `sprocket format`

The `format` subcommand provides automated formatting of WDL documents.

When running `sprocket format`, you must choose whether you want to `check`
the files (useful for continuous integration), `overwrite` the files with their
formatted versions, or `view` a single formatted document on STDOUT.

There are a number of options for formatting that can be configured: either via
`format` key in your `sprocket.toml` (see the `FormatConfig` struct in [the
configuration source
code](https://github.com/stjude-rust-labs/sprocket/blob/main/src/config.rs) for
a full list of options) or via the various command line flags made available on
the subcommand.

## Input formatting

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

Ordering of the same compound type (Array[\*], Map[\*, \*], Pair[\*, \*]), Sprocket drops the outermost type (Array, Map, Pair) and recursively applies the above sorting on the first inner type, with ties broken by the second inner type. This continues as far as possible.

Once this ordering is satisfied, it is up to the developer for final order of inputs of the same type. Sprocket `format` will preserve relative ordering within types.
