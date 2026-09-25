# `sprocket config`

Sprocket has a number of configuration options that can be initialized or
interrogated using the `config` subcommand.

`sprocket config schema` prints the configuration schema for your installed
Sprocket version.

`sprocket config default` generates a default configuration file and prints it
to standard output. You can use this as the basis for customizing a Sprocket
configuration file.

`sprocket config resolve` loads configuration in [the order specified on the
configuration guide](/configuration/overview.md#load-order) and
prints the effective configuration.

Notably, while configuration is something we intend to put more effort into
solving in the future, our existing documentation on what configuration options
exist is lacking at the moment. You can expect the [configuration guide
documentation](/configuration/overview.md) to be updated as we make progress
in that area. In the meantime, use `sprocket config schema` to see the options
supported by your installed version.