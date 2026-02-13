# Running Sprocket on an LSF cluster

Sprocket is a workflow execution engine for the [Workflow Description
Language](https://openwdl.org) (WDL). It can dispatch individual task executions
to an HPC cluster using IBM Spectrum LSF for job scheduling and Apptainer as the
container runtime, allowing you to run WDL workflows at scale on existing HPC
infrastructure.

This guide is intended for system administrators and power users looking to
configure Sprocket for their HPC environment. It walks through the entire
process of getting Sprocket running on an LSF cluster: installing the binary,
configuring the backend, running your first workflow, and tuning for production
use. By the end, you will have Sprocket submitting containerized WDL tasks as
LSF jobs.

> [!WARNING]
>
> The LSF + Apptainer backend is experimental, and its behavior and
> configuration may change between Sprocket releases.

## Prerequisites

Before starting, verify that your environment meets the following requirements.

- **LSF command-line tools** (10.1.0 or later) must be available on the
  login/submission node:

  ```shell
  bsub -V
  bjobs -V
  bkill -V
  ```

- **Apptainer** (1.3.6 or later) must be installed on the compute nodes where
  LSF dispatches jobs:

  ```shell
  apptainer --version
  ```

- **A shared filesystem** (e.g., Lustre, GPFS, or NFS) must be accessible from
  both the login node and the compute nodes. Sprocket writes its output
  directory to this filesystem, and the compute nodes read task scripts and
  write results back to it.

- **Network access** from compute nodes to container registries (Docker Hub,
  Quay, or your organization's private registry) is required for pulling
  container images. If your compute nodes lack outbound internet access, you
  will need to pre-pull images or configure a local registry mirror.

## Installing Sprocket

The simplest approach on an HPC cluster is to download a pre-built binary from
the [GitHub releases page](https://github.com/stjude-rust-labs/sprocket/releases)
and place it on the shared filesystem.

```shell
# Determine the latest version
VERSION=$(curl -s https://api.github.com/repos/stjude-rust-labs/sprocket/releases/latest | grep '"tag_name"' | cut -d '"' -f 4)

# Download the release (adjust the platform as needed)
curl -L -o sprocket.tar.gz "https://github.com/stjude-rust-labs/sprocket/releases/download/${VERSION}/sprocket-${VERSION}-x86_64-unknown-linux-gnu.tar.gz"

# Extract the binary
tar xzf sprocket.tar.gz

# Move it somewhere on the shared filesystem
mv sprocket /shared/software/bin/sprocket
```

Verify the installation:

```shell
sprocket --version
```

Alternatively, if a Rust toolchain is available, you can install from source:

```shell
cargo install sprocket --locked
```

> [!TIP]
>
> If your site uses [environment modules](https://modules.readthedocs.io/),
> consider creating a module file for Sprocket so users can load it with
> `module load sprocket`. [Spack](https://spack.io/) is another common option
> for managing software on HPC clusters.

## Setting up a shared configuration

For a multi-user cluster, it is common to provide a site-wide `sprocket.toml`
that all users inherit. There are two recommended approaches:

- **Executable-adjacent configuration.** Place a `sprocket.toml` in the same
  directory as the `sprocket` binary (e.g.,
  `/shared/software/bin/sprocket.toml`). Sprocket automatically loads this
  file, making it a natural fit when the binary is installed to a shared
  location.

- **Environment variable.** Set `SPROCKET_CONFIG` to point to a shared
  configuration file. This is useful when the binary is managed separately
  (e.g., installed via `cargo install`) or when you need different
  configurations for different groups of users:

  ```shell
  export SPROCKET_CONFIG=/shared/config/sprocket.toml
  ```

  If your site uses environment modules, add this export to the module file so
  it is set automatically when users run `module load sprocket`.

Users can still override settings by placing their own `sprocket.toml` in their
working directory or by passing `--config` on the command line. See the
[configuration overview](/configuration/overview) for the full load order and
precedence rules.

## Configuring the backend

The following example configures Sprocket to use LSF + Apptainer as its default
backend. This is a good starting point for a shared `sprocket.toml`:

```toml
# Enable experimental features (required for the LSF backend).
[run]
experimental_features_enabled = true

# Use the LSF + Apptainer backend.
[run.backends.default]
type = "lsf_apptainer"

# Default queue for task execution.
#
# If omitted, jobs are submitted to your cluster's default queue.
default_lsf_queue.name = "standard"
default_lsf_queue.max_cpu_per_task = 64
default_lsf_queue.max_memory_per_task = "96 GB"

# Optional: dedicated queue for short tasks.
# short_task_lsf_queue.name = "short"

# Optional: dedicated queue for GPU tasks.
# gpu_lsf_queue.name = "gpu"

# Optional: dedicated queue for FPGA tasks.
# fpga_lsf_queue.name = "fpga"

# Additional arguments passed to `bsub` when submitting jobs.
# extra_bsub_args = ["-app", "my_app_profile"]

# Maximum number of concurrent `bsub` processes the backend will spawn to
# queue tasks. Defaults to `10`. Consider raising this for large-scale
# workflow execution.
# max_concurrency = 10

# Prefix added to every LSF job name. Useful for identifying Sprocket jobs
# in `bjobs` output.
# job_name_prefix = "sprocket"

# Task monitor polling interval in seconds. Defaults to `30`.
# interval = 30

# Additional arguments passed to `apptainer exec`.
# For example, pass `--nv` to enable GPU support inside containers.
# extra_apptainer_exec_args = ["--nv"]
```

### Resource limit behavior

Each queue can declare the largest CPU and memory allocation it supports:

```toml
[run.backends.default]
default_lsf_queue.max_cpu_per_task = 64
default_lsf_queue.max_memory_per_task = "96 GB"
```

When a WDL task requests more than these limits, Sprocket's behavior is
controlled by two settings:

```toml
[run.task]
cpu_limit_behavior = "deny"
memory_limit_behavior = "deny"
```

- `"deny"` (default) — Sprocket refuses to run the task and reports an error.
- `"try_with_max"` — Sprocket clamps the request to the queue's maximum and
  attempts to run the task anyway. This does not guarantee success, but it
  avoids failing before the task has a chance to run.

If `max_cpu_per_task` and `max_memory_per_task` are not set on a queue, these
settings have no effect and Sprocket submits the task's resource request
as-is.

## Running your first workflow

Create a file called `hello.wdl`:

```wdl
version 1.3

task say_hello {
    input {
        String greeting
    }

    command <<<
        echo "~{greeting}, world!"
    >>>

    output {
        String message = read_string(stdout())
    }

    requirements {
        container: "ubuntu:latest"
    }
}
```

Run it:

```shell
sprocket run hello.wdl --target say_hello greeting="Hello"
```

Sprocket will pull the `ubuntu:latest` container image (converting it to an
Apptainer SIF file), submit a job via `bsub`, poll `bjobs` until the job
completes, and collect the outputs. You can monitor the LSF job while it runs:

```shell
bjobs -a
```

Once the run completes, the output directory will contain:

```
out/
├── sprocket.db
└── runs/
    └── say_hello/
        └── <timestamp>/
            ├── output.log
            ├── inputs.json
            ├── outputs.json
            └── attempts/
                └── 0/
                    ├── command
                    ├── stdout
                    ├── stderr
                    └── work/
```

## Production considerations

### Output directory placement

Place the output directory on the shared filesystem so that both the login node
and compute nodes can access it. Use the `-o` flag to specify the location:

```shell
sprocket run workflow.wdl --target main -o /shared/results/my-project
```

### Concurrency

The `max_concurrency` setting controls how many `bsub` processes the backend
will spawn concurrently to queue tasks. The default is `10`, which you may want
to raise for large-scale workflow execution:

```toml
[run.backends.default]
max_concurrency = 10
```

The `run.workflow.scatter.concurrency` setting controls how many elements within a
`scatter` block are evaluated concurrently. The default is `1000`:

```toml
run.workflow.scatter.concurrency = 1000
```

Setting scatter concurrency too high can put pressure on the scheduler by
queueing a large number of jobs at once. Note that each scattered task may
itself request multiple CPUs, so the actual resource consumption can be a
multiple of this number.

### Container image caching

Sprocket pulls container images and converts them to SIF files in an
`apptainer-images/` directory inside each run's timestamped directory. A given
image is only pulled once within a run, but each new run pulls all of its
images fresh. For workflows that use many large images, you can pre-pull
images to a shared location using `apptainer pull` and reference the local SIF
path in your WDL `container` declarations:

```shell
apptainer pull /shared/containers/ubuntu_latest.sif docker://ubuntu:latest
```

### Provenance database

The `sprocket.db` SQLite database lives in the output directory and records
every run, task, and session. SQLite works over shared filesystems, but for
heavily concurrent workloads, back up the database regularly. See the
[provenance tracking](/concepts/provenance) documentation for details.

### Failure mode

The `run.fail` setting controls what happens when a task fails:

- `"slow"` (default) — Sprocket waits for all currently running tasks to
  complete before exiting.
- `"fast"` — Sprocket cancels all running tasks immediately via `bkill` and
  exits.

```toml
[run]
fail = "fast"
```

## Monitoring and troubleshooting

### Checking job status

While a workflow is running, you can use `bjobs` to see the LSF jobs that
Sprocket has submitted:

```shell
bjobs -a
```

If you set `job_name_prefix` in your configuration, you can filter `bjobs`
output to show only Sprocket jobs:

```shell
bjobs -J "sprocket*"
```

### Inspecting run output

Each task attempt writes its files to
`out/runs/<target>/<timestamp>/attempts/<n>/`:

| File | Contents |
|------|----------|
| `command` | The shell script that was executed inside the container |
| `stdout` | Standard output from the task |
| `stderr` | Standard error from the task |
| `work/` | The task's working directory, containing any output files |

When troubleshooting a failed task, start with `stderr` and `command` to
understand what ran and what went wrong. See the [provenance
tracking](/concepts/provenance) documentation for a full description of the
run directory structure.

### Common issues

- **Job pending indefinitely.** The task's resource request (CPU or memory)
  may exceed what the queue can provide. Check with `bjobs -l <jobid>` and
  compare against your queue limits. Consider setting
  `cpu_limit_behavior = "try_with_max"` or adjusting the queue's
  `max_cpu_per_task` and `max_memory_per_task`.

- **Container pull failure.** Compute nodes may lack network access to the
  container registry. Check whether the nodes can reach the registry, or
  pre-pull the image and reference a local path.

- **Permission errors.** The shared filesystem must be writable by the user
  running Sprocket and by the LSF jobs on the compute nodes. Verify that
  directory permissions are consistent across nodes.

- **Apptainer not found on compute nodes.** Ensure Apptainer is installed and
  on the `PATH` for LSF jobs. If Apptainer is provided via an environment
  module, it must be loaded in the user's environment before running
  `sprocket run` so that the job inherits the correct `PATH`.

### Getting help

If you run into problems or have feedback, join the [OpenWDL
Slack](https://join.slack.com/t/openwdl/shared_invite/zt-ctmj4mhf-cFBNxIiZYs6SY9HgM9UAVw)
and reach out in the `#sprocket` channel.
