# `sprocket dev doc`

> [!CAUTION]
> 
> This document describes the beta release of the `doc` command,
> which is currently exposed under the `dev` subcommand (i.e. `sprocket dev
> doc`). This functionality may change in future releases.

Via the `sprocket dev doc` command, Sprocket is capable of rendering rich HTML
documentation for a WDL workspace. To make the most of this tool, there are
certain documentation conventions which need to be followed. This page describes
those best practices to ensure high-quality resulting documentation.

If you need an example of where `sprocket dev doc` is used to its fullest
potential, the [St. Jude Cloud `workflows` repository] can be viewed [on
GitHub](https://github.com/stjudecloud/workflows) or [as rendered
HTML](https://stjudecloud.github.io/workflows/index.html).

## Homepage

We encourage you to customize the experience of your user documentation by
writing a custom Markdown document which can be embedded at the root of your
generated documentation.

A Markdown file can be embedded in the homepage with the `--homepage <MARKDOWN
FILE>` flag during documentation generation. Every page contains links back to
the homepage. If no homepage is provided, your users will be faced with an empty
screen stating "There's nothing to see on this page".

## Custom logos and themes

If you wish to provide a custom logo, you can do so with the `--logo` argument.

While it is technically possible to supply your own custom CSS styling, this
capability is currently undocumented. We recommend sticking with the default
styling at this point in time, but do let us know what kinds of customization
you would like to see in future releases! 

We are working on adding a light/dark mode toggle as well, so make sure to
follow along for updates (see
[#546](https://github.com/stjude-rust-labs/wdl/issues/546) for more
information).

## Preamble comments

To provide top-level documentation for a file, add a comment block before the
`version` statement where each line starts with a double pound sign (i.e., `##`,
which we term a "preamble comment"). These preamble comments will be rendered as
Markdown above the generated table of contents on that file's dedicated page.
For example:

```wdl
## # This is a header
##
## This is a paragraph with **bolding**, _italics_, and `code` formatting.

version 1.2

workflow foo {}
```

## Structs

Structs are treated different for WDL v1.0/v1.1 and v1.2.

### v1.0 and v1.1

The WDL specification does not offer a way to document structs prior to WDL
v1.2, so the pages for them are rather limited. The pages for these structs will
have a copy of the raw WDL definition.

### v1.2

HTML documentation for structs defined in v1.2 WDL has not yet been implemented,
so they are given the same treatment as pre-v1.2 structs.

## Meta entries

All meta entries will render in the final HTML documentation, but there are some
special conventions we introduce. Each key below is expected to have a WDL
`String` value.

### `description`

Every struct, task, and workflow `meta` section should have a `description` key.
This description string can have Markdown formatting. The `description` string
should be less than 140 characters or it will be clipped in some contexts.

### `help`

This text can be of any length. It is best practice to keep `description` short
and put any additional text needed under the `help` key. Help strings can also
be styled with Markdown.

### `category`

Workflows can have a `category` key which will group workflow pages on the left
sidebar.

### `external_help`

This key should have a URL as its value (i.e. a valid hyperlink represented as a
WDL `String`), and will be rendered as a button which will open a new tab or
window visiting the link.

### `warning`

This text will be rendered in a special "warning box" to draw the attention of
users. This can also be styled with Markdown formatting.

## Parameter meta entries

Each input and output to a workflow or task should be documented, but there is
some flexibility in the specifics. To get the most out of `sprocket dev doc`, it
is recommended that each instance of parameter documentation be a meta object.
That object should have at least a `description` key. If a parameter has a
`String` value for its meta entry instead of a meta object, that string value
will be treated as if it were the `description` key of a meta object with no
other entries.

### Inputs

Each entry in the `input` section of a task or workflow is expected to have a
corresponding entry in the `parameter_meta` section. There is special handling
for the `group` key of a meta object when used as documentation for an input:

* all inputs sharing the same `String` value for the `group` key will be
  rendered together in a dedicated table
* required inputs are _always_ rendered under the "Required Inputs" table and
  thus should _not_ have a `group` key (it will be ignored if present)
* the `Common` group of inputs will always come after the required inputs
* inputs without a `group` will be rendered under "Other Inputs" which will be
  the last input table
* the `Resource` group of inputs will immediately precede the "Other Inputs"
  table
* all other groups will render alphabetically between the `Common` table and the
  `Resource` table.

### Outputs

Outputs can be documented in one of two places: either in the task/workflow
`meta` section under an `outputs` key or at the root of the `parameter_meta`
section. To be compliant with the [Sprocket `MatchingOutputMeta` lint
rule](https://docs.rs/wdl/latest/wdl/lint/index.html#lint-rules), you should
document each output under an `outputs` key in the `meta` section and not
include outputs anywhere in the `parameter_meta`.

## Help text

```
Document a workspace

Usage: sprocket dev doc [OPTIONS] [WORKSPACE]

Arguments:
  [WORKSPACE]
          Path to the local WDL workspace to document

Options:
      --homepage <MARKDOWN FILE>
          Path to a Markdown file to embed in the `<output>/index.html` file

  -l, --logo <SVG FILE>
          Path to an SVG logo to embed on each page.

          If not supplied, the default Sprocket logo will be used.

      --prioritize-workflows-view
          Initialize pages on the "Workflows" view instead of the "Full Directory" view of the left nav bar

      --output <DIR>
          Output directory for the generated documentation. If not specified, the documentation will be generated in `<workspace>/docs`

      --overwrite
          Overwrite any existing documentation.

          If specified, any existing files in the output directory will be deleted. Otherwise, the command will ignore existing files. Regardless of this flag, the command will overwrite any existing files which conflict with the generated documentation.

      --open
          Open the generated documentation in the default web browser

      --javascript-head-open <JS FILE>
          Path to a `.js` file that should have its contents embedded in a `<script>` tag for each HTML page, immediately after the opening `<head>` tag

      --javascript-head-close <JS FILE>
          Path to a `.js` file that should have its contents embedded in a `<script>` tag for each HTML page, immediately before the closing `<head>` tag

      --javascript-body-open <JS FILE>
          Path to a `.js` file that should have its contents embedded in a `<script>` tag for each HTML page, immediately after the opening `<body>` tag

      --javascript-body-close <JS FILE>
          Path to a `.js` file that should have its contents embedded in a `<script>` tag for each HTML page, immediately before the closing `<body>` tag

      --theme <DIR>
          An optional path to a custom theme directory.

          This argument is meant to be used by developers of the `wdl` crates; customizing the theme used for the generated documentation is currently unsupported.

      --install
          Install the theme if it is not already installed.

          `npm` and `npx` are expected to be available in the environment.

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

  -V, --version
          Print version
```
