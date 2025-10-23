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

## GPU Support

The Docker backend supports GPU acceleration for tasks that require it. To enable GPU support, you must first set up the necessary components on your host system:

1. **NVIDIA Drivers**: Install the appropriate NVIDIA drivers for your GPU hardware. Follow the [official NVIDIA CUDA installation guide](https://docs.nvidia.com/cuda/) for your operating system.

2. **NVIDIA Container Runtime**: Install the NVIDIA Container Runtime to enable Docker containers to access GPU resources. Follow the [NVIDIA Container Toolkit installation guide](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) to set up the runtime on your system.

Once these components are configured, Docker containers launched by Sprocket will be able to access GPU resources when specified in your WDL task runtime attributes. WDL 1.2 is required to specify GPU requirements using the `requirements` section and provide hints about the number of GPUs needed:

```wdl
task gpu_task {
  ...

  requirements {
    gpu: true
  }

  hints {
    gpu: 1
  }

  ...
}
```
