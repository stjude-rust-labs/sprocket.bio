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

With respect to emitting warnings, there are two levels of warnings in Sprocket:

* **Validation warnings**, which represent potential issues with the form of the
  underlying WDL documents, and
* **Lint warnings**, which are generally more opinionated about writing
  idiomatic WDL but are not strictly form issues.

`sprocket check` only emits validation warnings unless you provide the `-l` flag
(which enables the lint warnings).

`sprocket lint` emits both validation warnings and lint warnings — it is
essentially an alias for `sprocket check -l`.