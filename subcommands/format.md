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

## Help text

```
Formats a document or a directory containing documents

Usage: sprocket format [OPTIONS] <COMMAND>

Commands:
  check      Check if files are formatted correctly and print diff if not
  view       Format a document and send the result to STDOUT
  overwrite  Reformat all WDL documents via overwriting
  help       Print this message or the help of the given subcommand(s)

Options:
      --no-color
          Disables color output

  -m, --report-mode <MODE>
          The report mode for any emitted diagnostics

          Possible values:
          - full:     Prints diagnostics as multiple lines
          - one-line: Prints diagnostics as one line

  -t, --with-tabs
          Use tabs for indentation (default is spaces)

  -i, --indentation-size <SIZE>
          The number of spaces to use for indentation levels (default is 4)

      --max-line-length <LENGTH>
          The maximum line length (default is 90)

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
