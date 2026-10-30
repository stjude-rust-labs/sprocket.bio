---
description: "Record the manifest checksums of the container images used by your WDL tasks in a sprocket.lock file with the experimental sprocket dev lock command."
---

# `sprocket dev lock`

::: danger Caution
This document describes the beta release of the `lock` command. This functionality is considered
experimental and may change in future releases.
:::

Via the `sprocket dev doc` command, Sprocket is capable of generating a lockfile for mutable container image tags for a
WDL workspace (including its imports).

Within the WDL documents, each WDL `task` is checked for a `runtime.{container,docker}` or `requirements.container` key.
If a container image is specified, the lock command attempts to get the manifest from the container registry.
It then writes a `sprocket.lock` file with a record of each manifest encountered and the corresponding checksum at the
time the lock command was run.

The generated `sprocket.lock` file can then be consumed by any execution subcommands
(e.g., [`run`](/reference/cli/run), [`test`](/reference/cli/test)). If a lockfile exists, those subcommands will implicitly
use it, then the execution engine will use the image map contained in the lock file to replace tagged image values with checksummed
image values at runtime.

The goal of this functionality is to help users comply with the guidance in the
[specification](https://github.com/openwdl/wdl/blob/wdl-1.3/SPEC.md#container) to use the most specific URI to refer to
containers, typically the digest, while allowing users and developers to continue using the human-readable tag values
(e.g., `ubuntu:latest`) in their source. This functionality can also help ensure a level of consistency across runs for
a cohort by "locking" the container values to immutable checksums, rather than mutable tags that are commonly utilized
in WDL source. See [Containers](/concepts/containers) for why pinning container images matters for reproducibility and
for the call cache.

## Limitations

`sprocket dev lock` cannot be used on container images with placeholders. By default, they will simply
be ignored, and in `--strict` mode they are a hard error.

## Configuration

`sprocket dev lock` can be configured via the [`sprocket.toml`](/concepts/configuration) config file.

### Default container image

* CLI: none
* Config: `run.task.container = <IMAGE>`

For `task`s that don't specify a container, the global default will be used. Note that this will not
appear in the lockfile unless a task actually uses it.

### Library registry

* CLI: none
* Config: `lock.library.registry = "<REGISTRY>"`

To generate lockfile entries for `library://` URIs, a library registry needs to be known ahead of time.
The registry can either be specified in the URI itself (e.g., `library://library.sylabs.io/...`), or
via this config option.
