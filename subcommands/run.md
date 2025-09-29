# `sprocket run`

Individual tasks and workflows can be run with the `sprocket run` subcommand. We
outline a few of the important considerations below, but we encourage you to run
`sprocket run --help` to see all available arguments and options.

## Execution backends

See the section on [execution backends](/configuration/backends/overview.md) to
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

## Help text

```
Runs a task or workflow

Usage: sprocket run [OPTIONS] <PATH or URL> [INPUTS]...

Arguments:
  <PATH or URL>
          A source WDL file or URL

  [INPUTS]...
          The inputs for the task or workflow.

          These inputs can be either paths to files containing inputs or key-value pairs passed in on the command line.

Options:
  -e, --entrypoint <NAME>
          The name of the task or workflow to run.

          This argument is required if trying to run a task or workflow without any inputs.

          If `entrypoint` is not specified, all inputs (from both files and key-value pairs) are expected to be prefixed with the name of the workflow or task being run.

          If `entrypoint` is specified, it will be appended with a `.` delimiter and then prepended to all key-value pair inputs on the command line. Keys specified within files are unchanged by this argument.

  -r, --runs-dir <ROOT_DIR>
          The root "runs" directory; defaults to `./runs/`.

          Individual invocations of `sprocket run` will nest their execution directories beneath this root directory at the path `<entrypoint name>/<timestamp>/`. On Unix systems, the latest `run` invocation will be symlinked at `<entrypoint name>/_latest`.

      --output <OUTPUT_DIR>
          The execution directory.

          If this argument is supplied, the default output behavior of nesting execution directories using the entrypoint and timestamp will be disabled.

      --overwrite
          Overwrites the execution directory if it exists

      --no-color
          Disables color output

  -m, --report-mode <MODE>
          The report mode

          Possible values:
          - full:     Prints diagnostics as multiple lines
          - one-line: Prints diagnostics as one line

      --aws-access-key-id <ID>
          The AWS Access Key ID to use; overrides configuration

          [env: AWS_ACCESS_KEY_ID=]

      --aws-secret-access-key <KEY>
          The AWS Secret Access Key to use; overrides configuration

          [env: AWS_SECRET_ACCESS_KEY]

      --aws-default-region <REGION>
          The default AWS region; overrides configuration

          [env: AWS_DEFAULT_REGION=]

      --google-hmac-access-key <KEY>
          The Google Cloud Storage HMAC access key to use; overrides configuration

          [env: GOOGLE_HMAC_ACCESS_KEY=]

      --google-hmac-secret <SECRET>
          The Google Cloud Storage HMAC secret to use; overrides configuration

          [env: GOOGLE_HMAC_SECRET]

  -v, --verbose...
          Increase logging verbosity

  -q, --quiet...
          Decrease logging verbosity

  -c, --config <CONFIG>
          Path to the configuration file

  -s, --skip-config-search
          Skip searching for and loading configuration files.

          Only a configuration file specified as a command line argument will be used.

  -h, --help
          Print help (see a summary with '-h')
```
