# Running Sprocket on a Slurm cluster

Sprocket is a workflow execution engine for the [Workflow Description
Language](https://openwdl.org) (WDL). It can dispatch individual task executions
to an HPC cluster using Slurm for job scheduling and Apptainer as the container
runtime, allowing you to run WDL workflows at scale on existing HPC
infrastructure.

This guide walks through the entire process of getting Sprocket running on a
Slurm cluster: installing the binary, configuring the backend, running your
first workflow, and tuning for production use. By the end, you will have
Sprocket submitting containerized WDL tasks as Slurm jobs.

> [!WARNING]
>
> The Slurm + Apptainer backend is experimental, and its behavior and
> configuration may change between Sprocket releases.

## Prerequisites

Before starting, verify that your environment meets the following requirements.

**Slurm command-line tools** must be available on the login/submission node:

```shell
sbatch --version
squeue --version
scancel --version
```

**Apptainer** must be installed on the compute nodes where Slurm dispatches
jobs. You can verify this by submitting a quick test job:

```shell
srun apptainer --version
```

**A shared filesystem** (e.g., Lustre, GPFS, or NFS) must be accessible from
both the login node and the compute nodes. Sprocket writes its output directory
to this filesystem, and the compute nodes read task scripts and write results
back to it.

**Network access** from compute nodes to container registries (Docker Hub, Quay,
or your organization's private registry) is required for pulling container
images. If your compute nodes lack outbound internet access, you will need to
pre-pull images or configure a local registry mirror.

## Installing Sprocket

The simplest approach on an HPC cluster is to download a pre-built binary from
the [GitHub releases page](https://github.com/stjude-rust-labs/sprocket/releases)
and place it on the shared filesystem.

```shell
# Download the latest release (adjust the URL for your platform)
curl -L -o sprocket https://github.com/stjude-rust-labs/sprocket/releases/latest/download/sprocket-x86_64-unknown-linux-gnu

# Make it executable
chmod +x sprocket

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
> If your site uses environment modules, consider creating a module file for
> Sprocket so users can load it with `module load sprocket`. Place the binary in
> the module's `bin/` directory and set up the `PATH` accordingly.

## Setting up a shared configuration

For a multi-user cluster, it is common to provide a site-wide `sprocket.toml`
that all users inherit. There are two recommended approaches:

**Executable-adjacent configuration.** Place a `sprocket.toml` in the same
directory as the `sprocket` binary (e.g., `/shared/software/bin/sprocket.toml`).
Sprocket automatically loads this file, making it a natural fit when the binary
is installed to a shared location.

**Environment variable.** Set `SPROCKET_CONFIG` to point to a shared
configuration file. This is useful when the binary is managed separately (e.g.,
installed via `cargo install`) or when you need different configurations for
different groups of users:

```shell
export SPROCKET_CONFIG=/shared/config/sprocket.toml
```

If your site uses environment modules, add this export to the module file so it
is set automatically when users run `module load sprocket`.

Users can still override settings by placing their own `sprocket.toml` in their
working directory or by passing `--config` on the command line. See the
[configuration overview](/configuration/overview) for the full load order and
precedence rules.

## Configuring the backend

The following example configures Sprocket to use Slurm + Apptainer as its
default backend. This is a good starting point for a shared `sprocket.toml`:

```toml
# Enable experimental features (required for the Slurm backend).
run.experimental_features_enabled = true

# Use the Slurm + Apptainer backend.
run.backends.default.type = "slurm_apptainer"

# Default partition for task execution.
#
# If omitted, jobs are submitted to your cluster's default partition.
run.backends.default.default_slurm_partition.name = "compute"
run.backends.default.default_slurm_partition.max_cpu_per_task = 64
run.backends.default.default_slurm_partition.max_memory_per_task = "96 GB"

# Optional: dedicated partition for short tasks.
# run.backends.default.short_task_slurm_partition.name = "short"

# Optional: dedicated partition for GPU tasks.
# run.backends.default.gpu_slurm_partition.name = "gpu"

# Optional: dedicated partition for FPGA tasks.
# run.backends.default.fpga_slurm_partition.name = "fpga"

# Additional arguments passed to `sbatch` when submitting jobs.
# For example, set a default time limit for all jobs.
# run.backends.default.extra_sbatch_args = ["--time=60"]

# Maximum number of subtasks each `scatter` executes concurrently.
# This is not a hard limit on total concurrent tasks but affects how many
# jobs get queued at once.
# run.backends.default.max_scatter_concurrency = 200

# Additional arguments passed to `apptainer exec`.
# For example, pass `--nv` to enable GPU support inside containers.
# run.backends.default.extra_apptainer_exec_args = ["--nv"]
```

### Resource limit behavior

When a WDL task requests more CPU or memory than the partition allows,
Sprocket's behavior is controlled by two settings:

```toml
[run.task]
cpu_limit_behavior = "deny"
memory_limit_behavior = "deny"
```

- `"deny"` (default) — Sprocket refuses to run the task and reports an error.
- `"try_with_max"` — Sprocket clamps the request to the partition's maximum and
  attempts to run the task anyway. This does not guarantee success, but it
  avoids failing before the task has a chance to run.

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
Apptainer SIF file), submit a job via `sbatch`, wait for the job to complete,
and collect the outputs. You can monitor the Slurm job while it runs:

```shell
squeue -u $USER
```

Once the run completes, the output directory will contain:

```
out/
├── sprocket.db
├── output.log
└── runs/
    └── say_hello/
        └── <timestamp>/
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

### Scatter concurrency

The `max_scatter_concurrency` setting controls how many subtasks within a
`scatter` block are submitted to Slurm at once. Setting this too high can
overwhelm the scheduler or violate fair-share policies. Start conservatively
and increase based on your cluster's capacity:

```toml
run.backends.default.max_scatter_concurrency = 200
```

Note that each scattered task may itself request multiple CPUs, so the actual
resource consumption can be a multiple of this number.

### Container image caching

Apptainer images are cached per-run under the output directory. If you run the
same workflow repeatedly with different inputs, each run pulls its own copy of
the container image. For large images or frequent runs, consider pre-pulling
images to a shared location on the filesystem.

### Provenance database

The `sprocket.db` SQLite database lives in the output directory and records
every run, task, and session. SQLite works over shared filesystems, but for
heavily concurrent workloads, back up the database regularly. See the
[provenance tracking](/concepts/provenance) documentation for details.

### Failure mode

The `run.fail` setting controls what happens when a task fails:

- `"slow"` (default) — Sprocket waits for all currently running tasks to
  complete before exiting.
- `"fast"` — Sprocket cancels all running tasks immediately via `scancel` and
  exits.

```toml
[run]
fail = "fast"
```

## Monitoring and troubleshooting

### Checking job status

While a workflow is running, you can use `squeue` to see the Slurm jobs that
Sprocket has submitted:

```shell
squeue -u $USER
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
understand what ran and what went wrong.

### Common issues

**Job pending indefinitely.** The task's resource request (CPU or memory) may
exceed what the partition can provide. Check with `scontrol show job <jobid>`
and compare against your partition limits. Consider setting
`cpu_limit_behavior = "try_with_max"` or adjusting the partition's
`max_cpu_per_task` and `max_memory_per_task`.

**Container pull failure.** Compute nodes may lack network access to the
container registry. Check whether the nodes can reach the registry, or
pre-pull the image and reference a local path.

**Permission errors.** The shared filesystem must be writable by the user
running Sprocket and by the Slurm jobs on the compute nodes. Verify that
directory permissions are consistent across nodes.

**Apptainer not found on compute nodes.** Ensure Apptainer is installed and on
the `PATH` for Slurm jobs. If it is provided via an environment module, you may
need to load it in the job environment using `extra_sbatch_args` (e.g.,
`["--export=ALL"]`).

### Getting help

If you run into problems or have feedback, join the [OpenWDL
Slack](https://join.slack.com/t/openwdl/shared_invite/zt-ctmj4mhf-cFBNxIiZYs6SY9HgM9UAVw)
and reach out in the `#sprocket` channel.
