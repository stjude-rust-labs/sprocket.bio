# `sprocket check` and `sprocket lint`

The `check` and `lint` subcommands allow you to check a WDL file or set of WDL
files to ensure that (a) they are valid WDL and (b) to report any warnings about
the WDL files (described in further detail below).

With respect to checking if WDL files are well-formed, a non-zero exit code will
be emitted if invalid WDL is encountered. This means `sprocket check` or
`sprocket lint` can be integrated nicely into a continuous integration pipeline
to ensure files remain valid. The [Sprocket GitHub
action](https://github.com/stjude-rust-labs/sprocket-action) provides an easy
way to do that on GitHub.

With respect to emitting warnings, there are two levels of warnings in Sprocket:

* **Validation warnings**, which represent potential issues with the form of the
  underlying WDL documents, and
* **Lint warnings**, which are generally more opinionated about writing
  idiomatic WDL but are not strictly form issues.

`sprocket check` only emits validation warnings unless you provide the `-l` flag
(which enables the lint warnings).

`sprocket lint` emits both validation warnings and lint warnings — it is
essentially an alias for `sprocket check -l`.

## Exceptions

Lint exceptions allow for individual lint rules to be ignored in certain contexts.

Given the following WDL document:

```wdl
version 1.1

struct NoTrailingBlankLine {}
workflow ThisIsNotSnakeCase {

}
```

The `ElementSpacing` and `SnakeCase` rules would trigger.

There are multiple ways to add exceptions for these rules.

### Source Comments

Exception comments come in the form `#@ except: <RULES>`, where `RULES` is a comma-separated list of lint rules.

The comments can either be applied to the entire document:

```wdl
#@ except: ElementSpacing, SnakeCase

version 1.1

struct NoTrailingBlankLine {}
workflow ThisIsNotSnakeCase {

}
```

Or on individual items:

```wdl
version 1.1

#@ except: SnakeCase
workflow ThisIsNotSnakeCase {

}
```

Running `sprocket lint` with either of these configurations will emit no warnings.

### `sprocket.toml`

In the [sprocket config file], the `check` table accepts a list of rule exceptions.

For example:

```toml
[check]
except = ["ElementSpacing", "SnakeCase"]
```

Running `sprocket lint` with this configuration will emit no warnings.

### CLI Arguments

Exceptions can also be specified from the command line with the `-e` argument.

For example, running:

```bash
sprocket lint -e ElementSpacing -e SnakeCase
```

Will emit no warnings.

## Rule Configuration

Some lints can be configured in the [sprocket config file], under the `check.lint` table. For a list
of supported options, see the [rules list](https://github.com/stjude-rust-labs/sprocket/blob/main/crates/wdl-lint/RULES.md).

For example, the `ExpectedRuntimeKeys` can be configured to ignore certain keys via the `allowed_runtime_keys` option:

```toml
[check.lint]
allowed_runtime_keys = ["foo"]
```

[sprocket config file]: /configuration/overview.md