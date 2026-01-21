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

## Structs

Structs and their members can be documented with both [Meta sections](#meta-sections)
and [documentation comments](#documentation-comments).

### Meta sections

**WDL v1.2** introduced the `meta` and `parameter_meta` sections for structs and struct
members respectively. See [Meta entries](#meta-entries) for the available keys.

For prior versions, see [documentation comments](#documentation-comments).

#### Example

```wdl
struct Foo {
  String bar

  meta {
    description: "This is a struct-level comment."
  }
  
  parameter_meta {
    bar: "Bar is a very important struct member."
  }
}
```

## Enums

Enums, unlike [structs](#structs), do not support `meta`/`parameter_meta` sections nor have their own specified equivalent.
`sprocket doc` instead supports [documentation comments](#documentation-comments), both on the enum itself and its variants.

### Example

```wdl
## An RGB24 color enum
##
## Each variant is represented as a 24-bit hexadecimal
## RGB string with exactly one non-zero channel.
enum Color[String] {
    ## Pure red
    Red = "#FF0000",
    ## Pure green
    ##
    ## Some really long description about green.
    Green = "#00FF00",
    Blue = "#0000FF" # No description provided
}
```

## Documentation comments

> [!CAUTION]
>
> This section describes a feature that has not yet entered the RFC process.
> This functionality may change in future releases. See [the discussion](https://github.com/openwdl/wdl/issues/757).

Documentation comments are denoted by `##` and can be used anywhere in the document. They are intended to replace the
`meta`/`parameter_meta` sections found in `struct`s, `task`s, and `workflow`s.

Internally, documentation comments map to the existing [`description`](#description) and [`help`](#help) meta entries.
The first paragraph will be used for the `description`, with all following paragraphs being joined and used for `help`.

Documentation comments can be mixed with `meta`/`parameter_meta` sections like so:

```wdl
struct Foo {
  String bar
  ## Description of the `baz` field.
  String baz

  meta {
    description: "This is a struct-level comment."
  }
  
  parameter_meta {
    bar: "Bar is a very important struct member."
  }
}
```

In the case that they overlap, the comments will take precedence:

```wdl
struct Foo {
  ## This is the description that will show for `bar`.
  String bar
  
  parameter_meta {
    bar: "This description will not be shown."
  }
}
```

### Preamble comments

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
