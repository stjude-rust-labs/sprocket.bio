---
description: "Generate a template input JSON file for any WDL task or workflow with the sprocket inputs command."
---

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
- `--hide-defaults` — emits only required inputs by hiding defaulted and
  optional inputs.
- `--show-non-literals` — includes inputs whose default values are non-literal
  expressions in the template. These appear as
  `<NON-LITERAL: expression>`. This option cannot be combined with
  `--hide-defaults` or `--type-signatures`.
- `--nested-inputs` — includes overrideable inputs for each task called in the workflow,
  not just the top-level workflow inputs.
- `--type-signatures` — renders every included value as its declared WDL type
  instead of a placeholder or default value. Combine it with `--hide-defaults`
  to emit only required inputs and their types.
- `--yaml` — outputs the template as YAML instead of JSON.
