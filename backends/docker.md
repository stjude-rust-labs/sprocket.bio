# Docker Execution Backend

The Docker execution backend submits tasks to a local Docker daemon.

If the local Docker daemon is part of [Swarm](https://docs.docker.com/engine/swarm/),
the backend will create a [service](https://docs.docker.com/reference/cli/docker/service/)
to execute the task, allowing the swarm manager to decide where and when to run
the task in the cluster.

If the local Docker daemon is not participating in a swarm, the backend will
create a single local container to run the task.

## Configuration

The Docker backend supports the following configuration:

```toml
[run.backends.default]
type = "docker"
# Disable cleanup of Docker daemon resources.
# The containers and services created by the Docker backend will persist
# after the task has completed; it is intended to be used for issue
# investigation.
cleanup = false
```
