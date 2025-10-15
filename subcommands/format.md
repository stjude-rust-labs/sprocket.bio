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
