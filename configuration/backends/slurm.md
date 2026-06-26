# Slurm + Apptainer backend

Sprocket contains a High-Performance Computing (HPC) backend targeting 
environments that use [Slurm 25.05.0 or later](https://slurm.schedmd.com/archive/slurm-25.05.0/)
for job scheduling and [Apptainer 1.3.6 or later](https://apptainer.org/docs/user/1.3/)
as a container runtime.

For a step-by-step walkthrough of setting up Sprocket on a Slurm cluster, see 
the [Slurm + Apptainer guide](/guides/slurm).

To execute WDL workflows and tasks using the Slurm + Apptainer backend, you must
be running Sprocket on a Linux system with the Slurm command-line tools 
available locally. The nodes where Slurm dispatches jobs must have the Apptainer
command-line tools available. With these prerequisites met, add configuration
like the following example to your [`sprocket.toml`](../../overview.md#Backend-configuration)
to execute tasks using the HPC:

```toml
# Set the default backend to Slurm + Apptainer.
[run.backends.default]
type = "slurm_apptainer"

# The Slurm partition used by default for task execution.
#
# This parameter is optional. If it's absent and no other applicable
# partitions are specified, jobs will be submitted to your Slurm cluster's
# default partition.
default_slurm_partition.name = "gpu"
# The largest number of CPUs and memory that can be reserved for a single job
# on this partition.
#
# These parameters are optional, and should be set according to site-specific
# information about the hosts available to dispatch work from the partition.
# They can also be set for the other types of partitions, but this example
# leaves them unconstrained by default.
default_slurm_partition.max_cpu_per_task = 64
default_slurm_partition.max_memory_per_task = "96 GB"

# The Slurm partition used for short tasks.
#
# This parameter is optional, and overrides `default_slurm_partition`.
short_task_slurm_partition.name = "short"

# The Slurm partition used for GPU tasks.
#
# This parameter is optional, and overrides `default_slurm_partition` and
# `short_task_slurm_partition`.
gpu_slurm_partition.name = "gpu"

# The Slurm partition used for FPGA tasks.
#
# This parameter is optional, and overrides `default_slurm_partition` and
# `short_task_slurm_partition`.
fpga_slurm_partition.name = "fpga"


# The maximum number of concurrent Slurm operations the backend will perform.
# Defaults to `10`. Consider raising this for large-scale workflow execution.
max_concurrency = 10

# Prefix added to every Slurm job name. Useful for identifying Sprocket jobs
# in `squeue` output (e.g., `squeue -n "sprocket*"`).
job_name_prefix = "sprocket"

# Task monitor polling interval in seconds. Defaults to `30`.
interval = 30

# Settings related to `sbatch`.
[run.backends.default.sbatch]
# Additional command-line arguments to pass to `sbatch` when submitting jobs
# to Slurm.
args = ["--time=60"]

# Settings related to `apptainer`.
[run.backends.default.apptainer]

# Additional command-line arguments to pass to `apptainer exec` when executing
# tasks.
extra_args = ["--hostname=\"my_host\""]

# Path to the Apptainer (or Singularity) executable. Defaults to `"apptainer"`.
# Set to `"singularity"` or a full path if the executable is not on `PATH`.
executable = "apptainer"

# Shared directory for caching pulled `.sif` images across runs. When unset,
# images are stored per-run and not shared.
image_cache_dir = "/shared/containers/cache"
```

If you run into problems or have other feedback, please reach out to us in the
[#sprocket channel on the WDL Slack][sprocket-slack].

## Conditional `sbatch` Arguments

The Slurm + Apptainer backend supports conditional arguments to `sbatch` when 
queuing a task.

The `sbatch.conditional` setting of the backend is a collection of conditional 
arguments and may be specified using the [array of tables](https://toml.io/en/v1.0.0-rc.2#array-of-tables)
syntax, like so:

```toml
[[run.backends.default.sbatch.conditional]]
condition = "<expr>"
args = ["<arg>", "..."]
```

The `condition` is a WDL expression that is evaluated in the context of an 
individual task and must be of type `Boolean`.

If the expression evaluates to `true`, the provided arguments (via the `args` 
array) are applied to the `sbatch` command when queuing the task.

Conditional arguments are evaluated in the order defined in the configuration 
and only the first conditional arguments that evaluates to `true` is applied to 
the `sbatch` command.

The `condition` WDL expression has access to the following variables relating 
to the task being evaluated:

| Name     | Type      | Description                                                                                                                                 |
|----------|-----------|---------------------------------------------------------------------------------------------------------------------------------------------|
| `cpu`    | `Float`   | `cpu` requirement or default (1) if not present                                                                                             |
| `memory` | `Int`     | `memory` requirement (in bytes) or default (2 GiB) if not present, in bytes                                                                 |
| `gpu`    | `Boolean` | `gpu` requirement or default (false) if not present                                                                                         |
| `fpga`   | `Boolean` | `fpga` requirement or default (false) if not present                                                                                        |
| `disks`  | `Int`     | the sum of all `disk` requirements (in bytes) or default (1 GiB) if not present                                                             |
| `hint`   | `Object`  | the task's hints section; _note: accessing a non-existent key for the object will result in a `None` value rather than an evaluation error_ |

The expression is statically analyzed when configuration is loaded to catch 
syntax errors and most type errors prior to evaluating tasks.

#### Example

An example conditional argument that checks for more than requesting at least 
64 CPUs and 16 GiB of memory to apply a fictitious `sbatch` argument:

```toml
[[run.backends.default.sbatch.conditional]]
condition = "cpu >= 64 && memory >= 17179869184"
args = ["--some-sbatch-arg"]
```

## Known issues

- Much of the error reporting is based on best-effort inspection of the output
  of CLI tools and dumping output to files. Error messages presented at the
  command line will likely be less informative than inspecting the various
  output files left behind in the `runs` directory after a failure.

- There are only basic controls and limits applied to Slurm jobs: scatter
  concurrency factor, CPU per task, and memory per task. This has a couple
  impacts worth noting:
    - The backend may attempt to schedule tasks which will be forever pending
      due to an unsatisfiable CPU or memory request. Using Slurm tooling such as
      [`squeue`](https://slurm.schedmd.com/archive/slurm-25.05.0/squeue.html)
      can help identify when a task is pending for an inordinate amount of time.
    - Too-high scatter concurrency or other task count explosions may overwhelm
      the Slurm partitions and cause impact to the cluster depending on how it's
      administered. Raise this setting with caution, and note that each
      scattered task may itself request multiple CPUs, which Slurm may see as
      multiple tasks.

- Development and testing of this backend has taken place on a single HPC
  cluster with specific versions and configurations of the relevant tools. It is
  likely that other configurations will behave slightly differently. Reports of
  these types of issues are greatly appreciated in [#sprocket channel on the WDL
  Slack][sprocket-slack].

[sprocket-slack]: https://join.slack.com/t/openwdl/shared_invite/zt-ctmj4mhf-cFBNxIiZYs6SY9HgM9UAVw
