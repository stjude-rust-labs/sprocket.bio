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

## Rule configuration

Individual lint rules can be configured via the `[check.lint]` section in
`sprocket.toml`. Currently, the following options are supported:

| Option | Type | Description |
|--------|------|-------------|
| `allowed_runtime_keys` | List of strings | Additional runtime keys to allow beyond the WDL specification defaults (used by the `ExpectedRuntimeKeys` rule) |

```toml
[check.lint]
allowed_runtime_keys = ["gpu", "queue"]
```

## Filtering lint rules

The set of active lint rules can be controlled via the `[check]` section in
`sprocket.toml`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `except` | List | `[]` | Rule IDs to exclude from running |
| `all_lint_rules` | Boolean | `false` | Enable all lint rules, including those outside the default set |
| `only_lint_tags` | List | `[]` | Restrict linting to rules with these tags |
| `filter_lint_tags` | List | `[]` | Exclude rules with these tags |

For example, to enable all rules except `ContainerUri`:

```toml
[check]
all_lint_rules = true
except = ["ContainerUri"]
```