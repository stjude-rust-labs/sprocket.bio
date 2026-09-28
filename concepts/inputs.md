---
title: Inputs and Targets
description: "How Sprocket resolves the target to run and the inputs it receives, including key=value pairs, input files, and array inputs."
---

<!-- Sources: `sprocket run --help`, `sprocket validate --help`, and `sprocket dev server submit --help` from Sprocket v0.31.0 (ec33b7cc3) -->

# Inputs and Targets

A Sprocket run has a **target** — the task or workflow to run — and a set of
**inputs** for that target. Both are resolved from the command line and from any
input files you pass. This page describes how `sprocket run` resolves them; the
[`validate`](/reference/cli/validate) and
[`dev server submit`](/reference/cli/dev/server-submit) subcommands accept the
same kinds of inputs, with the small differences described
[below](#validate-and-dev-server-submit).

## Targets

The task or workflow to run can be provided explicitly with the `--target`
(`-t`) argument.

```shell
sprocket run --target main example.wdl
```

Whether or not this argument is _required_ depends on the inputs you provide:

- **With no inputs**, Sprocket infers the target from the document: a workflow
  is selected if one exists, otherwise a single task is selected. If the target
  remains ambiguous (for example, multiple tasks and no workflow), Sprocket
  reports an error.
- **With inputs and no `--target`**, every input key — in files and in
  command-line key/value pairs alike — is expected to be prefixed with the name
  of the task or workflow being run (e.g., `main.name`).
- **With `--target`**, the target name and a `.` delimiter are prepended to any
  input key that does not already carry that prefix. This applies to keys in
  input files as well as to key/value pairs on the command line, so you can drop
  the repeated `main.` prefix everywhere.

Sprocket will indicate when it cannot infer the target.

## Inputs

Inputs to a Sprocket run are provided as arguments passed after the WDL document
name is provided. Each input can be specified as either

* a key-value pair (e.g., `main.is_pirate=true`),
* a JSON file of inputs prefixed with `@` (e.g., `@hello_defaults.json` where
  the contents are `{ "main.is_pirate": true }`), or
* a YAML file of inputs prefixed with `@` (e.g., `@hello_defaults.yaml` where
  the contents are `main.is_pirate: true`).

Inputs are _incrementally_ applied, meaning that inputs specified later override
inputs specified earlier. This enables you to do something like the following to
use a set of default parameters and iterate through sample names in Bash rather
than create many individual input files.

```bash
sprocket run example.wdl @hello_defaults.json main.name="Ari"
```

The command above does not specify a target, because every input key is fully
qualified with the target name and a period (`main.`). Passing `--target main`
instead lets you write `greetings=...` and `name=...` in both the file and the
command line.

::: warning Important
The `@` prefix for input files is required. This follows the convention used
by tools such as `curl`, and it disambiguates input files from bare array
values (see [Array inputs](#array-inputs) below). If a bare input looks like a
JSON or YAML file, Sprocket reports the missing `@` prefix instead of an array
type mismatch.
:::

```txt
error: failed to parse inputs from `inputs.json`

Caused by:
    unrecognized input `inputs.json`: prefix input files with `@` (e.g., `@inputs.json`) or use `key=value` for inputs
```

### Array inputs

Sprocket supports ergonomic ways to provide `Array` inputs on the command line
without resorting to JSON syntax.

**Repeated keys.** Specifying the same key multiple times collects the values
into an array:

```shell
sprocket run example.wdl task.files=a.txt task.files=b.txt task.files=c.txt
```

A single occurrence of the key remains scalar.

**Shell globbing.** Values from shell glob expansion are appended to the
preceding key's array, which makes it easy to pass a set of files without
repeating the key:

```shell
sprocket run example.wdl task.files=*.txt
```

More generally, a bare value on the command line is appended to the preceding
key's array.

## An example

Using [the WDL document](/guided-tour/example.wdl){target="_self" download="example.wdl"}
from the [guided tour](/getting-started/guided-tour#running-tasks-and-workflows),
the `name` parameter can be specified as a key-value pair on the command line.

```shell
sprocket run example.wdl --target main name="World"
```

After a few seconds, this job runs successfully with the following outputs.

```json
{
  "main.messages": [
    "Hello, World!",
    "Hallo, World!",
    "Hej, World!"
  ]
}
```

To override some of the defaults for the workflow, define those inputs in a
`hello_overrides.json` file:

```json
{
  "main.greetings": [
    "Good morning",
    "Good afternoon",
    "Good evening"
  ],
  "main.is_pirate": true
}
```

Then provide that file in the set of inputs to the workflow.

```shell
sprocket run example.wdl @hello_overrides.json main.name="Sprocket"
```

This produces the following output.

```json
{
  "main.messages": [
    "Good morning, Sprocket!",
    "Good afternoon, Sprocket!",
    "Good evening, Sprocket!",
    "Ahoy, Sprocket!"
  ]
}
```

## Generating an input template

Rather than writing an input file by hand, `sprocket inputs` generates one for
any task or workflow, with a `<REQUIRED>` placeholder for each required input
and the declared default for the rest:

```shell
sprocket inputs example.wdl --target main
```

Save the output to a file, fill in the values, and pass it to `sprocket run`
with an `@` prefix. See the [`sprocket inputs`](/reference/cli/inputs) reference
for the available options.

## Checking inputs before a run

`sprocket validate` checks a set of inputs against a task or workflow without
running anything: every required input is supplied, every supplied input is
correctly typed, no extraneous inputs are provided, and any `File` or
`Directory` inputs exist on the filesystem. See the
[`sprocket validate`](/reference/cli/validate) reference.

```shell
sprocket validate example.wdl --target main name="World"
```

### `validate` and `dev server submit`

Both subcommands take inputs the same way `run` does, with one difference:
neither infers a target from the document. `--target` is required when you do
not supply any inputs.

```txt
error: the `--target` option is required if no inputs are provided
```
