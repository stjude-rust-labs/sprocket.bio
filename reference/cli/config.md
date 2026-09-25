---
description: "Initialize and inspect Sprocket configuration with the sprocket config command."
---

# `sprocket config`

Sprocket has a number of configuration options that can be initialized or
interrogated using the `config` subcommand.

`sprocket config init` generates a default configuration object and prints it to
standard out — you can use this as the basis for customizing a Sprocket
configuration file.

`sprocket config resolve` loads configuration in [the order specified on the
configuration guide](/concepts/configuration#load-order) and
prints the effective configuration.

`sprocket config schema` prints a [JSON schema](https://json-schema.org) for
`sprocket.toml` to standard out. You can use this to validate your configuration
file or to enable autocompletion and inline documentation in editors that
support JSON schema for TOML.

```shell
sprocket config schema > sprocket.schema.json
```

Every option that can appear in `sprocket.toml` is listed in the
[configuration reference](/reference/configuration), which is generated from the
same schema that `sprocket config schema` prints. For how configuration files
are discovered and merged, see the
[configuration guide](/concepts/configuration).