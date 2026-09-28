---
description: "Check that a set of inputs satisfies a WDL task or workflow before running it with the sprocket validate command."
---

# `sprocket validate`

The `validate` subcommand allows you to validate that a set of inputs satisfies
the requirements to run a particular task or workflow.

Inputs are supplied exactly as they are for `sprocket run`: key-value pairs,
input files prefixed with `@`, and bare values appended to the preceding key's
array. See [Inputs and targets](/concepts/inputs) for the rules, and the
[`run` subcommand documentation](/reference/cli/run) for the options the two
subcommands share.

The one difference is the target. Unlike `run`, `validate` does not infer a
target from the document, so `--target` is required when you validate a task or
workflow without supplying any inputs.

```shell
sprocket validate example.wdl --target main name="World"
```

The subcommand will give a non-zero exit code if the inputs are not valid for
the specified task or workflow. In addition to type checking, `sprocket validate`
verifies that `File` and `Directory` inputs reference paths that exist on the
filesystem, catching missing input files before a run is attempted. It does not
catch potential runtime errors that may occur when running the task or workflow.

This is useful for continuous integration purposes. The [Sprocket GitHub
action](https://github.com/stjude-rust-labs/sprocket-action) provides an easy
way to do that on GitHub.