# Execution Backends

Sprocket evaluates a workflow locally and decomposes it into tasks. Sprocket dispatches
these tasks to a configured execution backend responsible for starting, monitoring, and 
responding to task lifecycle events.

Sprocket currently supports two execution backends:

* A local [Docker execution backend](/configuration/backends/docker.md).
* A remote [Task Execution Service backend](/configuration/backends/tes.md).

There are additional execution backends currently under development:

* An [LSF + Apptainer HPC backend](/configuration/backends/lsf.md).
* A [Slurm + Apptainer HPC backend](/configuration/backends/slurm.md).
* A [generic backend](/configuration/backends/generic.md).

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

## Container Protocol Support

Different execution backends support different container image protocols. The
table below summarizes which protocols are supported by each backend.

| Protocol               | Docker | TES | LSF + Apptainer | Slurm + Apptainer |
| ---------------------- | :----: | :-: | :-------------: | :---------------: |
| `docker://`            |   ✓    |  ✓  |        ✓        |         ✓         |
| `library://`           |        |  ✓  |        ✓        |         ✓         |
| `oras://`              |        |  ✓  |        ✓        |         ✓         |
| `file://` (local SIF)  |        |     |        ✓        |         ✓         |

### Protocol Details

- **[`docker://`](https://docs.docker.com/reference/cli/docker/image/pull/)** —
  OCI/Docker registry images (e.g., `docker://ubuntu:22.04` or simply
  `ubuntu:22.04`). This is the default protocol when no scheme is specified.
- **[`library://`](https://apptainer.org/docs/user/main/library_api.html)** —
  Sylabs Cloud Library images (e.g., `library://sylabs/default/alpine:3.18`).
  Supported by Apptainer-based backends and TES servers that support Sylabs
  Library references.
- **[`oras://`](https://oras.land/docs/quickstart)** — OCI Registry As Storage images (e.g.,
  `oras://ghcr.io/org/image:tag`). Supported by Apptainer-based backends and
  TES servers that support ORAS.
- **`file://`** — Local Apptainer/Singularity `.sif` files (e.g.,
  `file:///path/to/image.sif`). Only supported by Apptainer-based backends
  where the file is accessible from the execution environment.
