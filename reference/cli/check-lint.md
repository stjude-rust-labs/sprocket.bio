---
description: "Validate WDL documents and report lint warnings with the sprocket check and sprocket lint commands, locally or in CI."
---

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

With respect to emitting warnings, there are two kinds of rules in Sprocket:

* **Validation rules**, which report potential issues with the form of the
  underlying WDL documents, and
* **Lint rules**, which are generally more opinionated about writing idiomatic
  WDL but are not strictly form issues.

`sprocket check` only emits validation diagnostics unless you provide the
`-l, --lint` flag, which enables lint diagnostics.

`sprocket lint` emits both validation warnings and lint warnings — it is
essentially an alias for `sprocket check -l`.

See the [lint and validation rule reference](/reference/lint-rules) for every
available rule. You can also use
[`sprocket explain <RULE>`](/reference/cli/explain) to read a rule's
explanation and examples in the terminal.

## Exceptions

Diagnostic exceptions allow individual validation or lint rules to be ignored
in certain contexts.

Given the following WDL document:

```wdl
version 1.1

workflow example {
  input {
    String unused_input
  }
}
```

The [`UnusedInput`](/reference/lint-rules#unusedinput) rule reports
`unused_input`.

There are multiple ways to add an exception for this rule.

### Source comments

Exception comments use `#@ except: <RULES>`, where `RULES` is a comma-separated
list of rule IDs.

The comments can either be applied to the entire document:

```wdl
#@ except: UnusedInput

version 1.1

workflow example {
  input {
    String unused_input
  }
}
```

Or on individual items:

```wdl
version 1.1

#@ except: UnusedInput
workflow example {
  input {
    String unused_input
  }
}
```

Running `sprocket lint` with either form suppresses the `UnusedInput` warning.

### `sprocket.toml`

In the [sprocket config file], the `check` table accepts a list of rule IDs or
tags to except.

For example:

```toml
[check]
except = ["UnusedInput"]
```

Running `sprocket lint` with this configuration suppresses the `UnusedInput`
warning.

### CLI arguments

Exceptions can also be specified from the command line with the repeatable
`-e, --except <RULE>` option. The value can be a rule ID or tag.

For example, running:

```shell
sprocket lint -e UnusedInput
```

This also suppresses the `UnusedInput` warning.

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

```shell
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

Select lint tags with `tags` and exclude individual rule IDs or whole tags with
`except` in the `[check]` section of `sprocket.toml`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tags` | List | `[]` | Opt into lint tags. An empty list uses the default set of tags. |
| `except` | List | `[]` | Exclude rule IDs or tags from running. |

For example, to enable all lint rules except
[`ContainerUri`](/reference/lint-rules#containeruri):

```toml
[check]
tags = ["All"]
except = ["ContainerUri"]
```

The equivalent command-line options are the repeatable `--tag <TAG>` and
`-e, --except <RULE>` options. Command-line values are additive with values
loaded from configuration files.

## Rule configuration

Some lints can be configured in the [sprocket config file] under the
`check.lint` table. See the
[lint and validation rule reference](/reference/lint-rules) for supported
options and the
[source rules list](https://github.com/stjude-rust-labs/sprocket/blob/main/crates/wdl-lint/RULES.md)
for the source documentation.

For example,
[`ExpectedRuntimeKeys`](/reference/lint-rules#expectedruntimekeys) can be
configured to ignore certain keys with the `allowed_runtime_keys` option:

```toml
[check.lint]
allowed_runtime_keys = ["foo"]
```

[sprocket config file]: /concepts/configuration
