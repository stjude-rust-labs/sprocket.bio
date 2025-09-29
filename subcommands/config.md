# `sprocket config`

Sprocket has a number of configuration options that can be initialized or
interrogated using the `config` subcommand.

`sprocket config init` generates a default configuration object and prints it to
standard out — you can use this as the basis for customizing a Sprocket
configuration file.

`sprocket config resolve` loads configuration in [the order specified on the
configuration guide](/configuration/overview.md#load-order) and
prints the effective configuration.

Notably, while configuration is something we intend to put more effort into
solving in the future, our existing documentation on what configuration options
exist is lacking at the moment. You can expect the [configuration guide
documentation](/configuration/overview.md) to be updated as we make progress
in that area. In the meantime, the best way to see what options are available is
to [look at the `Config` struct in the source
code](https://github.com/stjude-rust-labs/sprocket/blob/main/src/config.rs).

## Help text

```
Display the effective configuration

Usage: sprocket config [OPTIONS] <COMMAND>

Commands:
  init     Generates a default configuration file
  resolve  Displays the current configuration
  help     Print this message or the help of the given subcommand(s)

Options:
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
