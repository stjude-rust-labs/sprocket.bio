---
title: "`sprocket explain`"
description: "Reference for the sprocket explain command, which describes lint and validation rules."
---

# `sprocket explain`

The `sprocket explain` command describes lint and validation rules. It can
explain one rule, list rules by tag, or print the definitions used in rule
documentation.

For a browsable list of every rule, see the
[lint and validation rule reference](/reference/lint-rules). To select,
suppress, or baseline rules when checking WDL, see
[`sprocket check` and `sprocket lint`](/reference/cli/check-lint).

## Usage

Sprocket 0.31.0 supports these forms:

```txt
sprocket explain <RULE>
sprocket explain --tag <TAG>
sprocket explain --definitions
sprocket explain --list-all-rules
sprocket explain --list-all-tags
```

| Argument or option | Description |
|---|---|
| `<RULE>` | Explain one rule by its ID, such as `ImportPlacement`. |
| `-t, --tag <TAG>` | List all lint rules with a tag. |
| `--definitions` | Print the general WDL definitions used by the rule explanations. |
| `--list-all-rules` | List every lint and validation rule, then exit. |
| `--list-all-tags` | List every lint tag, then exit. |
| `-f, --format <FORMAT>` | Select `default` human-readable output or machine-readable `json` output. The default is `default`. |

Use `--format json` when another program needs to consume the result. For
example, this returns an array of rule objects:

```shell
sprocket explain --list-all-rules --format json
```

The command also accepts Sprocket's common logging, color, ignore, and
configuration options. Run `sprocket explain --help` for the complete list.

## Explain one rule

For example, [`ImportPlacement`](/reference/lint-rules#importplacement)
explains where import statements belong and shows both the reported code and
its revision:

```shell
sprocket explain ImportPlacement
```

````txt
ImportPlacement [Clarity]
Ensures that imports are placed between the version statement and any document items.

All import statements should follow the WDL version declaration with one empty line between the version and the first import statement.

Examples:
```wdl
version 1.2

workflow example {
}

import "example2.wdl"
```
Use instead:

```wdl
version 1.2

import "example2.wdl"

workflow example {
}
```
````

## List tags

Use `--list-all-tags` to see the tags accepted by `--tag`:

```shell
sprocket explain --list-all-tags
```

```txt
Available tags:
  - All
  - Clarity
  - Completeness
  - Correctness
  - Deprecated
  - Documentation
  - Naming
  - Performance
  - Portability
  - Sorting
  - Spacing
  - SprocketCompatibility
  - Style
```
