# Docker Execution Backend

The Docker execution backend submits tasks to a local Docker daemon.

If the local Docker daemon is part of [Swarm](https://docs.docker.com/engine/swarm/),
the backend will create a [service](https://docs.docker.com/reference/cli/docker/service/)
to execute the task, allowing the swarm manager to decide where and when to run
the task in the cluster.

If the local Docker daemon is not participating in a swarm, the backend will
create a single local container to run the task. Sprocket will only submit the
task to the Docker daemon once sufficient resources are available on the host,
as per the resource requests of other executing tasks.

If a task's resource requirement exceeds the known maximum of a resource,
Sprocket will error. See the section on [overriding task CPU and memory requirements](/user-guides/configuration.md#overriding-task-cpu-and-memory-requirements).

## Configuration

The Docker backend supports the following configuration:

```toml
[run.backends.default]
type = "docker"
# Disable cleanup of Docker daemon resources.
# The containers and services created by the Docker backend will persist
# after the a has completed when this setting is set to `false`.
# WARNING: ONLY DISABLE THIS SETTING IF REQUIRED FOR INVESTIGATING AN ISSUE.
# THE DOCKER DAEMON'S PERFORMANCE MAY BE ADVERSELY IMPACTED BY FAILING TO
# CLEANUP CONTAINERS.
cleanup = false
```
