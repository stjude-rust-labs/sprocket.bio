# High-Performance Computing (HPC) Backends

Sprocket contains an experimental High-Performance Computing (HPC) backend
targeting environments that use [LSF
10.1.0](https://www.ibm.com/docs/en/spectrum-lsf/10.1.0) for job scheduling and
[Apptainer 1.3.6](https://apptainer.org/docs/user/1.3/) as a container runtime.

## LSF + Apptainer

> [!WARNING]
>
> This backend is experimental, and its behavior and configuration may change
> substantially between Sprocket releases.

To execute WDL workflows and tasks using the LSF + Apptainer backend, you must
be running Sprocket on a Linux system with the LSF command-line tools available
locally. The nodes where LSF dispatches jobs must have the Apptainer
command-line tools available. With these prerequisites met, add configuration
like the following example to your
[`sprocket.toml`](../../overview.md#Backend-configuration) to execute tasks
using the HPC:

```toml
# The LSF + Apptainer backend requires explicitly opting into experimental
# features.
run.experimental_features_enabled = true

# Set the default backend to LSF + Apptainer.
run.backends.default.type = "lsf_apptainer"

# The LSF queue used by default for task execution.
#
# This parameter is optional. If it's absent and no other applicable queues
# are specified, jobs will be submitted to your LSF cluster's default queue.
run.backends.default.default_lsf_queue = "standard"

# The LSF queue used for short tasks.
#
# This parameter is optional, and overrides `default_lsf_queue`.
run.backends.default.short_task_lsf_queue = "short"

# The LSF queue used for GPU tasks.
#
# This parameter is optional, and overrides `default_lsf_queue` and
# `short_task_lsf_queue`.
run.backends.default.gpu_lsf_queue = "gpu"

# The LSF queue used for FPGA tasks.
#
# This parameter is optional, and overrides `default_lsf_queue` and
# `short_task_lsf_queue`.
run.backends.default.fpga_lsf_queue = "fpga"

# Additional command-line arguments to pass to `bsub` when submitting jobs to
# LSF.
run.backends.default.extra_bsub_args = ["-app", "my_app_profile"]

# The maximum number of subtasks each `scatter` will try executing at once.
#
# This is *not* a direct limit on the total number of concurrent tasks, but
# can affect the number of jobs that get queued at one time.
run.backends.default.max_scatter_concurrency = 100

# Additional command-line arguments to pass to `apptainer exec` when executing
# tasks.
run.backends.default.extra_apptainer_exec_args = ["--hostname=\"my_host\""]

# The directory where Apptainer `.sif` images will be cached.
#
# This must be a location that is accessible from both the node where Sprocket
# is running and any nodes where LSF may dispatch a job for execution. In many
# cluster configurations, this means that `/tmp` will *not* work.
run.backends.default.apptainer_images_dir = "/home/myuser/.cache/sprocket-apptainer-images"
```

If you run into problems or have other feedback, please reach out to us in the
[#sprocket channel on the WDL Slack][sprocket-slack].

### Known issues

- Much of the error reporting is based on best-effort inspection of the output
  of CLI tools and dumping output to files. Error messages presented at the
  command line will likely be less informative than inspecting the various
  output files left behind in the `runs` directory after a failure.

- Docker-style OCI images are converted to Apptainer's `.sif` format once upon
  first use in order to avoid issues where large scatters would encounter
  network failures and rate limiting with certain container registries. These
  images are currently left behind in a temp directory, and must be periodically
  deleted in order to not continue consuming disk space.

- There are only basic controls and limits applied to LSF jobs: scatter
  concurrency factor, CPU per task, and memory per task. This has a couple
  impacts worth noting:
    - The backend may attempt to schedule tasks which will be forever pending
      due to an unsatisfiable CPU or memory request. Using LSF tooling such as
      [`bjobs`](https://www.ibm.com/docs/en/spectrum-lsf/10.1.0?topic=reference-bjobs)
      can help identify when a task is pending for an inordinate amount of time.
    - Too-high scatter concurrency or other task count explosions may overwhelm
      the LSF queues and cause impact to the cluster depending on how it's
      administered. Raise this setting with caution, and note that each
      scattered task may itself request multiple CPUs, which LSF may see as
      multiple tasks.

- Development and testing of this backend has taken place on a single HPC
  cluster with specific versions and configurations of the relevant tools. It is
  likely that other configurations will behave slightly differently. Reports of
  these types of issues are greatly appreciated in [#sprocket channel on the WDL
  Slack][sprocket-slack].

## Future plans

The Sprocket development roadmap includes support for
[SLURM](https://hpc-wiki.info/hpc/SLURM) as an alternate job scheduling system,
and mix-and-matchable configurations of job schedulers and container runtimes.

[sprocket-slack]: https://join.slack.com/t/openwdl/shared_invite/zt-ctmj4mhf-cFBNxIiZYs6SY9HgM9UAVw
