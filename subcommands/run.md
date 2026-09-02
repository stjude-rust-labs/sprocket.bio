# `sprocket run`

Individual tasks and workflows can be run with the `sprocket run` subcommand. We
outline a few of the important considerations below, but we encourage you to run
`sprocket run --help` to see all available arguments and options.

## Execution backends

See the section on [execution backends](/configuration/backends/overview.md) to
learn more about configuring Sprocket to execute tasks in different
environments.

## Targets

The task or workflow to run can be provided explicitly with
the `--target` argument.

```shell
sprocket run --target main example.wdl
```

Whether or not this argument is _required_ is based on whether inputs are
provided to Sprocket from which the target can be inferred (e.g., providing
an input of `main.is_pirate` implies a target of `main`). Conversely, if
you supply a `--target`, you don't have to prefix your command line inputs with the
target's fully qualified name.

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

> [!IMPORTANT]
>
> The `@` prefix for input files is required. This follows the convention used
> by tools such as `curl`, and it disambiguates input files from bare array
> values (see [Array inputs](#array-inputs) below).

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

### An example

Using the [the WDL document](/guided-tour/example.wdl){target="_self" download="example.wdl"}
from the guided tour, we can specify the `name`
parameter as a key-value pair on the command line.

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

If you wanted to override some of the defaults for the workflow, you could do
so by defining the input in a `hello_overrides.json` file:

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

Then providing that file in the set of inputs to the workflow.

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

## Output directory

By default, `sprocket run` writes all execution artifacts to `./out`. This can
be changed with the `-o, --output-dir` flag.

```shell
sprocket run example.wdl --target main name="World" -o /path/to/output
```

Individual runs are stored at `<output_dir>/runs/<target>/<timestamp>/`, and a
`_latest` symlink is maintained for each target pointing to its most recent run.
The output directory also contains a SQLite provenance database (`sprocket.db`)
that tracks all executions.

The `--suffix` flag appends a user-defined string to the run directory name,
producing `<timestamp>_<suffix>` instead of just `<timestamp>`. This is useful
for identifying runs at a glance:

```shell
sprocket run example.wdl --target main name="World" --suffix experiment-1
```

This changes the run directory from `out/runs/main/<timestamp>/` to
`out/runs/main/<timestamp>_experiment-1/`.

These paths, the `_latest` symlink, and the exact placement of `--suffix` are
part of the current internal layout and may change without deprecation. The
documented JSON formats and `--index-on` behavior below are stable from
executable `1.0`.

The `--index-on` flag takes a path within `<output_dir>/index/` and creates
entries for the run's `outputs.json` and every output that is a `File`, a
`Directory`, or an array of them. This gives results a consistent location that
does not change with each run's timestamp. The path is relative, cannot contain
`.` or `..` components, and is used verbatim, so group results by a value of
your own choosing by interpolating that value into the index path in your shell:

```shell
sprocket run hello.wdl -t hello --index-on greeting
```

For full details on the output directory structure, provenance database, and
output indexing, see the
[Provenance Tracking](/concepts/provenance) documentation.