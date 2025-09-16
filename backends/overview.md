# Execution Backends

Sprocket dispatches tasks to a configured execution backend responsible for
starting, monitoring, and responding to task lifecycle events.

Sprocket currently supports two execution backends:

* A local [Docker execution backend](/backends/docker.md).
* A remote [Task Execution Service backend](/backends/tes.md).

There are two additional execution backends currently under development:

* A [HPC backend](/backends/hpc.md).
* A [generic backend](/backends/generic.md).

## Backend Configuration

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
