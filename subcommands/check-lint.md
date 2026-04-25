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

workflow ThisIsNotSnakeCase {
  String single_quoted_string = 'this string uses single quotes'
}
```

The `DoubleQuotes` and `SnakeCase` rules would trigger.

There are multiple ways to add exceptions for these rules.

### Source Comments

Exception comments come in the form `#@ except: <RULES>`, where `RULES` is a comma-separated list of lint rules.

The comments can either be applied to the entire document:

```wdl
#@ except: DoubleQuotes, SnakeCase

version 1.1

workflow ThisIsNotSnakeCase {
  String single_quoted_string = 'this string uses single quotes'
}
```

Or on individual items:

```wdl
version 1.1

#@ except: SnakeCase
workflow ThisIsNotSnakeCase {
  #@ except: DoubleQuotes
  String single_quoted_string = 'this string uses single quotes'
}
```

Running `sprocket lint` with either of these configurations will emit no warnings.

### `sprocket.toml`

In the [sprocket config file], the `check` table accepts a list of rule exceptions.

For example:

```toml
[check]
except = ["DoubleQuotes", "SnakeCase"]
```

Running `sprocket lint` with this configuration will emit no warnings.

### CLI Arguments

Exceptions can also be specified from the command line with the `-e` argument.

For example, running:

```bash
sprocket lint -e DoubleQuotes -e SnakeCase
```

Will emit no warnings.

## Baselines

Adopting `sprocket check` on an existing codebase often surfaces a large
number of pre-existing diagnostics. Fixing all of them before turning on CI
enforcement can be impractical, but you may still want `sprocket check` to
catch _new_ issues introduced by future work.

A **baseline** captures the set of diagnostics that exist today and excludes
them from both `sprocket check`'s output and its exit code calculation. Any
diagnostic _not_ in the baseline still surfaces, so newly introduced issues
fail CI while the existing backlog is cleaned up on your own schedule.

### Generating a baseline

Run `sprocket lint` (or `sprocket check`) with `--generate-baseline`:

```bash
sprocket lint --generate-baseline
```

This writes a `sprocket-baseline.toml` file in the current directory
containing every diagnostic emitted by the run. Subsequent runs of
`sprocket check` or `sprocket lint` automatically discover the baseline and
suppress matching diagnostics.

To override the default location, set `baseline` under the `[check]` table
in your [sprocket config file]:

```toml
[check]
baseline = "path/to/sprocket-baseline.toml"
```

To ignore the baseline for a single run (e.g., to see the full set of
diagnostics), pass `--no-baseline`.

### Stale entries

If the baseline contains entries that no longer match any diagnostic in the
current run — for example, because the underlying code was fixed —
`sprocket check` fails and reports the stale entries with a suggestion to
regenerate the baseline.

### Editor integration

The Sprocket LSP also respects `sprocket-baseline.toml`, so baselined
diagnostics are suppressed in the editor as well as in CI.

## Filtering lint rules

The set of active lint rules can be controlled via the `[check]` section in
`sprocket.toml`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `all_lint_rules` | Boolean | `false` | Enable all lint rules, including those outside the default set |
| `only_lint_tags` | List | `[]` | Restrict linting to rules with these tags |
| `filter_lint_tags` | List | `[]` | Exclude rules with these tags |

For example, to enable all rules except `ContainerUri`:

```toml
[check]
all_lint_rules = true
except = ["ContainerUri"]
```

## Rule Configuration

Some lints can be configured in the [sprocket config file], under the `check.lint` table. For a list
of supported options, see the [rules list](https://github.com/stjude-rust-labs/sprocket/blob/main/crates/wdl-lint/RULES.md).

For example, the `ExpectedRuntimeKeys` can be configured to ignore certain keys via the `allowed_runtime_keys` option:

```toml
[check.lint]
allowed_runtime_keys = ["foo"]
```

[sprocket config file]: /configuration/overview.md
