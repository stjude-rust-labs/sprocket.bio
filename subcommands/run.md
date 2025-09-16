# `sprocket run`

Individual tasks and workflows can be run with the `sprocket run` subcommand. We
outline a few of the important considerations below, but we encourage you to run
`sprocket run --help` to see all available arguments and options.

## Execution backends

See the section on [execution backends](/user-guides/backends/overview.md) to
learn more about configuring Sprocket to execute tasks in different
environments.

## Entrypoints

The task or workflow to run can be provided explicitly with
the `--entrypoint` argument.

```shell
sprocket run --entrypoint main example.wdl
```

Whether or not this argument is _required_ is based on whether inputs are
provided to Sprocket from which the entrypoint can be inferred (e.g., providing
an input of `main.is_pirate` implies an entrypoint of `main`). Conversely, if
you supply an `--entrypoint`, you don't have to prefix your inputs with the
entrypoint fully qualified name.

Sprocket will indicate when it cannot infer the entrypoint.

## Inputs

Inputs to a Sprocket run are provided as arguments passed after the WDL document
name is provided. Each input can be specified as either

* a key value pair (e.g., `main.is_pirate=true`)
* a JSON file containing inputs (e.g., a `hello_defaults.json` file where the
  contents are `{ "main.is_pirate": true }`)
* a YAML file containing inputs (e.g. a `hello_defaults.yaml` file where the
  contents are `main.is_pirate: true`)

Inputs are _incrementally_ applied, meaning that inputs specified later override
inputs specified earlier. This enables you to do something like the following to
use a set of default parameters and iterate through sample names in Bash rather
than create many individual input files.

```bash
sprocket run example.wdl hello_defaults.json main.name="Ari"
```

### An example

Using the [the WDL document](/guided-tour/example.wdl){target="_self" download="example.wdl"}
from the guided tour, we can specify the `name`
parameter as a key-value pair on the command line.

```shell
sprocket run example.wdl --entrypoint main name="World"
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
sprocket run example.wdl hello_overrides.json main.name="Sprocket"
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