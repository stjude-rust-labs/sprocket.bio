# `sprocket config`

Sprocket has a number of configuration options that can be initialized or
interrogated using the `config` subcommand.

`sprocket config init` generates a default configuration object and prints it to
standard out — you can use this as the basis for customizing a Sprocket
configuration file.

`sprocket config resolve` loads configuration in [the order specified on the
configuration guide](/user-guides/configuration.md#load-order) and
prints the effective configuration.

Notably, while configuration is something we intend to put more effort into
solving in the future, our existing documentation on what configuration options
exist is lacking at the moment. You can expect the [configuration guide
documentation](/user-guides/configuration.md) to be updated as we make progress
in that area. In the meantime, the best way to see what options are available is
to [look at the `Config` struct in the source
code](https://github.com/stjude-rust-labs/sprocket/blob/main/src/config.rs). 