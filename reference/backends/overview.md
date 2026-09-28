---
description: "Choose where Sprocket runs your WDL tasks: locally with Docker, on a TES server, or on an HPC cluster with LSF or Slurm and Apptainer."
---

# Execution Backends

Sprocket evaluates a workflow locally and decomposes it into tasks. Sprocket dispatches
these tasks to a configured execution backend responsible for starting, monitoring, and 
responding to task lifecycle events. See the
[execution model](/concepts/execution-model) for how a run proceeds end to end.

Sprocket currently supports the following execution backends:

* A local [Docker execution backend](/reference/backends/docker).
* A remote [Task Execution Service backend](/reference/backends/tes).
* An [LSF + Apptainer HPC backend](/reference/backends/lsf) (experimental).
* A [Slurm + Apptainer HPC backend](/reference/backends/slurm) (experimental).

## Backend configuration

A `sprocket.toml` configuration file may contain settings for zero or more
execution backends, but currently Sprocket uses only one specified backend
during a workflow evaluation.

The execution backend is specified in the `run` section:

```toml
[run]
backend = "<name>"
```

The name corresponds to an entry in the `run.backends` table. A `backend`
setting is required if there is more than one backend or if the backends table
does not contain a `default` entry.

An example of configuring more than one backend:

```toml
[run]
backend = "server1"

[run.backends.server1]
type = "tes"
# ...

[run.backends.server2]
type = "tes"
# ...
```

**If no execution backend is configured in `sprocket.toml`, the Docker backend
is used**.

## Container protocol support

Different execution backends support different container image protocols:
Docker accepts `docker://` images, TES servers accept `docker://`, `library://`,
and `oras://`, and the Apptainer-based backends accept those plus local
`file://` SIF images. See
[containers](/concepts/containers#container-protocol-support) for the full table
and the details of each protocol.
