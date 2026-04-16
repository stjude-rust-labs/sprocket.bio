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
Sprocket will error. See the section on [overriding task CPU and memory requirements](/configuration/overview.md#overriding-task-cpu-and-memory-requirements).

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

## Resource Mapping

WDL resource requirements and hints are mapped to Docker container parameters
differently depending on whether the Docker daemon is running in local mode or as
part of a Swarm cluster.

### Local Mode

In local Docker mode, only the `max_cpu` and `max_memory` hints are forwarded to
Docker as hard limits ([`HostConfig.NanoCpus`](https://docs.docker.com/reference/api/engine/version/v1.47/#tag/Container/operation/ContainerCreate)
and [`HostConfig.Memory`](https://docs.docker.com/reference/api/engine/version/v1.47/#tag/Container/operation/ContainerCreate),
respectively). When not in Swarm mode, the `cpu` and `memory` requirements from
the WDL `requirements` section are _not_ passed to Docker as it does not enforce
resource reservations, so these values are silently ignored at the container
level. They are, however, used internally by Sprocket's task manager for
scheduling and queuing decisions (i.e., deciding when to start the next task
based on available resources).

If a task specifies `memory` but no `max_memory` hint, the container runs with
no memory constraint enforced by Docker. The same applies to CPU: without a
`max_cpu` hint, no CPU limit is set on the container.

Additionally, if `max_cpu` or `max_memory` exceeds what the Docker daemon
reports as available, Sprocket clamps the value down to the host's capacity,
since Docker does not respond gracefully to over-subscription.

The `disk` requirement is passed as a `HostConfig.StorageOpt["size"]` parameter,
and `gpu` is passed as a `HostConfig.DeviceRequests` entry for NVIDIA GPUs.

| WDL Declaration | Type | Docker `HostConfig` Parameter | Behavior |
|-|-|-|-|
| `cpu` | Requirement | _(none)_ | Used only by Sprocket's internal scheduler |
| `memory` | Requirement | _(none)_ | Used only by Sprocket's internal scheduler |
| `max_cpu` | Hint | `NanoCpus` | Hard CPU limit; clamped to host capacity |
| `max_memory` | Hint | `Memory` | Hard memory limit; clamped to host capacity |
| `disk` | Requirement | `StorageOpt["size"]` | Storage limit |
| `gpu` | Hint | `DeviceRequests` (NVIDIA) | GPU passthrough |

### Swarm Mode

In Docker Swarm mode, both
[reservations](https://docs.docker.com/engine/swarm/services/#reserve-memory-or-cpus-for-a-service)
and [limits](https://docs.docker.com/engine/containers/resource_constraints/#limit-a-containers-access-to-memory)
are forwarded. The `cpu` and `memory` requirements become Swarm
[_reservations_](https://docs.docker.com/engine/swarm/services/#reserve-memory-or-cpus-for-a-service)
([`Reservations.NanoCPUs`](https://docs.docker.com/reference/api/engine/version/v1.47/#tag/Service/operation/ServiceCreate)
and [`Reservations.MemoryBytes`](https://docs.docker.com/reference/api/engine/version/v1.47/#tag/Service/operation/ServiceCreate)),
which the Swarm scheduler uses to place the task on a node with sufficient
capacity—these are soft limits that guarantee the container can access at least
the configured amount. The `max_cpu` and `max_memory` hints become Swarm
[_limits_](https://docs.docker.com/engine/containers/resource_constraints/#limit-a-containers-access-to-memory)
([`Limits.NanoCPUs`](https://docs.docker.com/reference/api/engine/version/v1.47/#tag/Service/operation/ServiceCreate)
and [`Limits.MemoryBytes`](https://docs.docker.com/reference/api/engine/version/v1.47/#tag/Service/operation/ServiceCreate)),
which are hard limits that prevent the container from using more than the
configured amount. If a container exceeds its memory limit, it is
OOM-terminated.

| WDL Declaration | Type | Docker Swarm Parameter | Behavior |
|-|-|-|-|
| `cpu` | Requirement | `Reservations.NanoCPUs` | Soft limit; used for Swarm scheduling/placement |
| `memory` | Requirement | `Reservations.MemoryBytes` | Soft limit; used for Swarm scheduling/placement |
| `max_cpu` | Hint | `Limits.NanoCPUs` | Hard CPU limit enforced on the container |
| `max_memory` | Hint | `Limits.MemoryBytes` | Hard memory limit; container is OOM-terminated if exceeded |
| `disk` | Requirement | `StorageOpt["size"]` | Storage limit |
| `gpu` | Hint | `DeviceRequests` (NVIDIA) | GPU passthrough |

## GPU Support

The Docker backend supports GPU acceleration for tasks that require it. To enable GPU support, you must first set up the necessary components on your host system:

1. **NVIDIA Drivers**: Install the appropriate NVIDIA drivers for your GPU hardware. Follow the [official NVIDIA CUDA installation guide](https://docs.nvidia.com/cuda/) for your operating system.

2. **NVIDIA Container Runtime**: Install the NVIDIA Container Runtime to enable Docker containers to access GPU resources. Follow the [NVIDIA Container Toolkit installation guide](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) to set up the runtime on your system.