# `sprocket validate`

The `validate` subcommand allows you to validate that a set of inputs satisfies
the requirements to run a particular task or workflow.

The arguments for validate are the same as the arguments for `sprocket run`. As
such, you can check out the [`run` subcommand
documentation](/subcommands/run.md) to learn more.

The subcommand will give a non-zero exit code if the inputs are not valid for
the specified task or workflow. In addition to type checking, `sprocket validate`
verifies that `File` and `Directory` inputs reference paths that exist on the
filesystem, catching missing input files before a run is attempted.

This is useful for continuous integration purposes. The [Sprocket GitHub
action](https://github.com/stjude-rust-labs/sprocket-action) provides an easy
way to do that on GitHub.