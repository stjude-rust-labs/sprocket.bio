---
description: "Understand the timing, retries, resource utilization, and data movement recorded for Sprocket workflow runs."
---

# Execution Metrics

Sprocket records execution metrics for each run, WDL call, and task attempt. Use these metrics to
investigate retries and scheduler delays, compare requested resources with observed utilization, and
review how much data Sprocket transferred.

Metrics are available in three places:

- Local [`sprocket run`](/reference/cli/run) executions normally write `metrics.json` beside the
  run's `outputs.json`.
- [`sprocket dev server metrics`](/reference/cli/dev/server#metrics) renders a report for a
  server-managed run.
- The server exposes the same data from
  [`GET /api/v1/runs/{uuid}/metrics`](/reference/rest-api#runs).

The server command and REST API remain experimental while they are under `sprocket dev`.

## Reading a metrics report

A report contains a run summary, calls with their execution attempts, and totals across all
attempts. The formatted server command emphasizes commonly useful values:

```console
$ sprocket dev server metrics happy-dolphin-42
Run `happy-dolphin-42` (00000000-0000-0000-0000-000000000000): completed, wall 1m23s

  align (subworkflow--align) (2 attempts)
    #0   completed    wall    45.5s  queued    300ms  4 cpu, 8.0 GiB  exit 137  retried: unacceptable exit code 137
    #1   completed    wall    37.0s  queued    150ms  4 cpu, 8.0 GiB  peak 11.2 GiB, cpu 5m24s

2 attempts total: 1 retried, 0 cached, 0 preempted
allocated cpu 5m30s
transferred 2.0 GiB down, 512.0 MiB up
```

Use `--json` to see every reported field and its native unit.

### Runs, calls, and attempts

A **run** is one execution of a task or workflow. A **call** is one invocation of a WDL task within
that run. Each time Sprocket tries to execute a call is an **attempt**, including attempts that
fail, are preempted, or are retried.

Each call has two identifiers:

- `call_id` is the fully qualified WDL call path and is unique within the run. Levels are joined
  with `--`, as in `subworkflow--align`.
- `name` is the final component, such as `align`. It is easier to read but may not be unique when
  different subworkflows call tasks with the same name.

Attempts are numbered from zero. A backend-local resubmission with a `~<n>` suffix remains part of
the same logical attempt; it does not increment the attempt number.

### Report fields

The JSON report has three top-level objects: `run`, `calls`, and `totals`.

| Object | Fields |
| --- | --- |
| `run` | `uuid`, `name`, `status`, `wall_time_ms`, `backend`, `sprocket_version`, `transfer` (`downloaded_bytes`, `uploaded_bytes`) |
| Each entry in `calls` | `call_id`, `name`, `attempts` |
| Each entry in `attempts` | `name`, `attempt`, `status`, `exit_status`, `wall_time_ms`, `queued_ms`, `pending_ms`, `allocated_cpu_time_ms`, `constraints`, `retry_cause`, `utilization`, `logs` |
| `totals` | `attempts`, `retries`, `cached`, `preempted`, `allocated_cpu_time_ms`, `preemption_wasted_ms` |

`run.backend` identifies the execution backend the run used:

- `name` is the configured backend name, such as `default`.
- `type` is the backend type, such as `docker`, `tes`, or `slurm_apptainer`.
- `info` holds non-secret settings that vary by type:
  - local: CPU and memory limits;
  - TES: the service URL without credentials, plus `max_concurrency`;
  - LSF and Slurm: `max_concurrency` and the configured queue or partition names.

  Docker reports an empty `info` object.

`backend` is `null` for runs that never started or that were recorded before backends were tracked.

`run.sprocket_version` is the version of Sprocket that produced the report. In `metrics.json`, that
is the version that executed the run. From the server, it is the version of the server answering the
request, which may be newer than the version that executed an older run.

## Timing

All JSON durations are expressed in milliseconds.

| Field | Meaning |
| --- | --- |
| Run wall time (`run.wall_time_ms`) | Time from the run starting until it reaches a terminal status |
| Attempt wall time (`wall_time_ms`) | Time from the attempt starting execution until it completes |
| Queue time (`queued_ms`) | Time from creating the attempt until execution starts; includes evaluation, input localization, and backend queuing |
| Scheduler-pending time (`pending_ms`) | Time from backend submission until execution starts |

Scheduler-pending time is a subset of queue time. It may be unavailable when a backend does not
report submission time or for attempts recorded before submission times were tracked.

For a run or attempt that has not completed, some durations are `null`. Live server results may lag
task activity by up to one 250-millisecond persistence interval.

## Allocated and consumed resources

Resolved constraints describe what Sprocket asked the backend to provide, including the container,
CPU, memory, GPU, FPGA, and disk requirements. They also record the resolved retry policy and
curated `preemptible`, `max_cpu`, and `max_memory` hints. CPU values are counts, while memory and
disk values are bytes. Observed utilization describes what the task consumed, when a measurement
source is available.

| Object | Fields |
| --- | --- |
| `constraints` | `container`, `cpu`, `memory`, `gpu`, `fpga`, `disks`, `max_retries`, `preemptible`, `max_cpu`, `max_memory` |
| `utilization` | `max_memory`, `avg_memory`, `disk_used` (bytes); `cpu_time_ms`, `user_cpu_time_ms`, `system_cpu_time_ms` (milliseconds) |

Each `utilization` field is present only when a source reported it.

Do not confuse the two CPU measurements:

- **Allocated CPU time** is the resolved CPU count multiplied by attempt wall time. It is reported
  in core-milliseconds and reflects reserved capacity, not CPU cycles consumed.
- **CPU time** under resource utilization is cumulative CPU consumed as reported by a backend or by
  Sprocket's cgroup fallback.

Run totals include allocated CPU time for successful, failed, and retried attempts. They also
include execution time lost to preempted attempts.

### Resource utilization sources

Resource utilization is best effort. Different execution backends expose different measurements, and
`utilization` is `null` when no source reports data.

| Source | Enablement | Measurements | Limitations |
| --- | --- | --- | --- |
| LSF | Automatic | Scheduler-reported memory and CPU | Availability depends on cluster accounting |
| Slurm | Automatic | Scheduler-reported memory and CPU | Availability depends on `sacct` accounting |
| Docker | Automatic; sampled every second by default (`resource_usage_interval`) | Sampled peak and average memory, cumulative CPU | Local containers only; short tasks may finish before the first sample; `0` disables sampling |
| TES metadata | Set `resource_usage_metadata = true` | Measurements reported by a compatible TES server | Key support depends on the server |
| Cgroup fallback | Automatic for Docker Swarm and TES; `cgroup_usage = false` disables | Total, user, and system CPU time; peak cgroup memory | Used only when the backend reports no native usage; requires cgroup v2 |

Sprocket also measures the size of local task work directories as `disk_used`. This is the size
when the task finishes, not a high-water mark.

Memory values from different sources measure different things:

- Docker samples exclude inactive file cache.
- Cgroup fallback peaks include page cache.
- LSF, Slurm, and TES report whatever their scheduler or server calculates.

Average memory is not comparable across backends either. Docker reports the unweighted mean of its
samples, while the other sources define their own averages.

### Cgroup fallback

Docker Swarm services and TES tasks have no native usage source by default. For these backends,
Sprocket wraps each task command in a small `/bin/sh` script that runs the original command and then
records the task's cgroup v2 counters: total, user, and system CPU time from `cpu.stat`, and peak
memory from `memory.peak`.

Sprocket uses the recording only when the backend reported no native usage for the attempt. Native
usage always wins, including native values of zero, and the two are never mixed. With TES, native
usage means metadata read through `resource_usage_metadata`.

The recording needs:

- `/bin/sh` in the container;
- a private, task-scoped cgroup v2 namespace; and
- readable `cpu.stat` and `memory.peak` files.

When any of these is missing, the attempt reports no fallback usage and the task still runs
normally. The recording is stored outside the task's work directory and does not affect call-cache
keys:

- Docker Swarm writes it under the attempt directory.
- TES uploads it to a `usage-<n>/` directory beside the task's outputs, where it may remain.

To turn the fallback off and run the task command unwrapped, set `cgroup_usage = false` on the
backend:

```toml
[run.backends.default]
type = "tes"
# ...
cgroup_usage = false
```

See the backend pages for additional measurements and configuration:

- [Docker resource sampling](/reference/backends/docker#resource-utilization)
- [LSF scheduler accounting](/reference/backends/lsf#resource-utilization)
- [Slurm scheduler accounting](/reference/backends/slurm#resource-utilization)
- [TES resource metadata](/reference/backends/tes#resource-utilization)

## Retries, caching, and preemption

Each attempt records its status, exit status, resolved constraints, retry cause, and a reference to
its logs. Run totals distinguish:

- attempts that were retried;
- calls served from the call cache;
- attempts preempted by a backend; and
- execution time lost when preempted work had to be repeated.

A retry count is not the same as an attempt count: the initial attempt is not a retry. See
[Retries](/reference/cli/run#retries) for configuration.

## Data movement

The run summary reports bytes downloaded while localizing inputs and uploaded while delocalizing
outputs. These totals are a proxy for data movement, not a cloud-provider billing figure. They count
successful transfers whose sizes were known when the transfer began; provider-side copies, unknown
sizes, and billing-specific adjustments may not be represented.

## Why values may be missing

A missing or `null` value is expected when:

- the run or attempt has not reached the lifecycle point needed to calculate it;
- the call was served from the call cache and never reached a backend;
- the backend or scheduler does not expose the measurement;
- optional collection is disabled, or the cgroup fallback was disabled or unsupported;
- a task completes before the first sampling interval;
- no TES metadata key was reported; or
- the run predates collection of that field.

Compare runs only when their backend, Sprocket version, and collection settings are compatible.
Check `run.backend` to confirm that two runs used the same backend before comparing them.
