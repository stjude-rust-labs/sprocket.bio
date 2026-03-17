# `sprocket inputs`

The `inputs` subcommand generates a template input JSON file for a given task or
workflow. Required inputs appear with a `<REQUIRED>` placeholder and their type,
inputs with defaults show their default values directly, and optional inputs
without defaults appear as `null`.

```shell
sprocket inputs example.wdl --target main
```

```json
{
  "main.name": "String <REQUIRED>",
  "main.greeting": "hello"
}
```

## Options

- `--target` (`-t`) — selects which task or workflow to generate inputs for,
  consistent with the `run` and `validate` subcommands.
- `--hide-defaults` — hides any inputs with default values, allowing you to
  focus only on the required inputs.
- `--show-non-literals` — includes inputs whose default values are non-literal
  expressions in the template. These appear as
  `<NON-LITERAL: expression>`.
- `--nested-inputs` — includes an input for each task called in the workflow,
  not just the top-level workflow inputs.
- `--yaml` — outputs the template as YAML instead of JSON.
