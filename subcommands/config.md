# `sprocket config`

Sprocket has a number of configuration options that can be initialized or
interrogated using the `config` subcommand.

`sprocket config init` generates a default configuration object and prints it to
standard out — you can use this as the basis for customizing a Sprocket
configuration file.

`sprocket config resolve` loads configuration in [the order specified on the
configuration guide](/configuration/overview.md#load-order) and
prints the effective configuration.

`sprocket config schema` prints a [JSON schema](https://json-schema.org) for
`sprocket.toml` to standard out. You can use this to validate your configuration
file or to enable autocompletion and inline documentation in editors that
support JSON schema for TOML.

```shell
sprocket config schema > sprocket.schema.json
```

Notably, while configuration is something we intend to put more effort into
solving in the future, our existing documentation on what configuration options
exist is lacking at the moment. You can expect the [configuration guide
documentation](/configuration/overview.md) to be updated as we make progress
in that area. In the meantime, the best way to see what options are available is
to [look at the `Config` struct in the source
code](https://github.com/stjude-rust-labs/sprocket/blob/main/src/config.rs). 