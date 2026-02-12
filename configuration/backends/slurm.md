# Slurm + Apptainer backend

Sprocket contains an experimental High-Performance Computing (HPC) backend
targeting environments that use [Slurm 25.05.0 or
later](https://slurm.schedmd.com/archive/slurm-25.05.0/) for job scheduling and
[Apptainer 1.3.6 or later](https://apptainer.org/docs/user/1.3/) as a container
runtime.

> [!WARNING]
>
> This backend is experimental, and its behavior and configuration may change
> substantially between Sprocket releases.

For a step-by-step walkthrough of setting up Sprocket on a Slurm cluster, see the
[Slurm + Apptainer guide](/guides/slurm).

To execute WDL workflows and tasks using the Slurm + Apptainer backend, you must
be running Sprocket on a Linux system with the Slurm command-line tools available
locally. The nodes where Slurm dispatches jobs must have the Apptainer
command-line tools available. With these prerequisites met, add configuration
like the following example to your
[`sprocket.toml`](../../overview.md#Backend-configuration) to execute tasks
using the HPC:

```toml
# The Slurm + Apptainer backend requires explicitly opting into experimental
# features.
run.experimental_features_enabled = true

# Set the default backend to Slurm + Apptainer.
run.backends.default.type = "slurm_apptainer"

# The Slurm partition used by default for task execution.
#
# This parameter is optional. If it's absent and no other applicable
# partitions are specified, jobs will be submitted to your Slurm cluster's
# default partition.
run.backends.default.default_slurm_partition.name = "gpu"
# The largest number of CPUs and memory that can be reserved for a single job
# on this partition.
#
# These parameters are optional, and should be set according to site-specific
# information about the hosts available to dispatch work from the partition.
# They can also be set for the other types of partitions, but this example
# leaves them unconstrained by default.
run.backends.default.default_slurm_partition.max_cpu_per_task = 64
run.backends.default.default_slurm_partition.max_memory_per_task = "96 GB"

# The Slurm partition used for short tasks.
#
# This parameter is optional, and overrides `default_slurm_partition`.
run.backends.default.short_task_slurm_partition.name = "short"

# The Slurm partition used for GPU tasks.
#
# This parameter is optional, and overrides `default_slurm_partition` and
# `short_task_slurm_partition`.
run.backends.default.gpu_slurm_partition.name = "gpu"

# The Slurm partition used for FPGA tasks.
#
# This parameter is optional, and overrides `default_slurm_partition` and
# `short_task_slurm_partition`.
run.backends.default.fpga_slurm_partition.name = "fpga"

# Additional command-line arguments to pass to `sbatch` when submitting jobs
# to Slurm.
run.backends.default.extra_sbatch_args = ["--time=60"]

```

If you run into problems or have other feedback, please reach out to us in the
[#sprocket channel on the WDL Slack][sprocket-slack].

### Known issues

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
