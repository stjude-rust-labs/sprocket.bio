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

## Timing

All JSON durations are expressed in milliseconds.

| Field | Meaning |
| --- | --- |
| Run wall time | Time from the run starting until it reaches a terminal status |
| Attempt wall time | Time from the attempt starting execution until it completes |
| Queue time | Time from creating the attempt until execution starts; includes evaluation, input localization, and backend queuing |
| Scheduler-pending time | Time from backend submission until execution starts |

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

Do not confuse the two CPU measurements:

- **Allocated CPU time** is the resolved CPU count multiplied by attempt wall time. It is reported
  in core-milliseconds and reflects reserved capacity, not CPU cycles consumed.
- **CPU time** under resource utilization is cumulative CPU consumed as reported by a backend or by
  Sprocket's optional in-task measurement.

Run totals include allocated CPU time for successful, failed, and retried attempts. They also
include execution time lost to preempted attempts.

### Resource utilization sources

Resource utilization is best effort. Different execution backends expose different measurements, and
`utilization` is `null` when no source reports data.

| Source | Enablement | Measurements | Limitations |
| --- | --- | --- | --- |
| LSF | Automatic | Scheduler-reported memory and CPU | Availability depends on cluster accounting |
| Slurm | Automatic | Scheduler-reported memory and CPU | Availability depends on `sacct` accounting |
| Docker | Set a positive `resource_usage_interval` | Sampled peak and average memory, cumulative CPU | Local containers only; short tasks may finish before the first sample |
| Engine measurement | Set `measure_resource_usage = true` | CPU time and, for containers, peak cgroup memory | Adds a small measurement wrapper to the task command |
| TES metadata | Set `resource_usage_metadata = true` | Measurements reported by a compatible TES server | Key support depends on the server |

Sprocket also measures disk usage in local task work directories. If more than one source reports
the same field, a non-null engine measurement takes precedence. Fields reported only by a backend,
such as average memory, are preserved.

### Measuring from inside the task

Enable portable in-task measurement for local or server runs:

```toml
[run.task]
measure_resource_usage = true

[server.engine.task]
measure_resource_usage = true
```

The setting defaults to `false`. When enabled, Sprocket wraps the task command with a portable shell
shim that attempts to record CPU time and, in containerized environments, peak cgroup memory. CPU
measurement requires Linux procfs at `/proc`, and peak-memory measurement requires a readable cgroup
v1 or v2 peak counter. The shim does not require additional tools in the container and can run with
remote backends such as TES, but unavailable platform counters produce no measurement.

By default, the shim writes `.sprocket_usage` in the task's work directory. Sprocket removes the
file after collecting it on local file systems. Backends may redirect it: TES exports a separate
`usage` object outside the task's exported work directory, which may remain in remote storage.

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
- optional collection is disabled;
- a task completes before the first sampling interval;
- no TES metadata key was reported; or
- the run predates collection of that field.

Compare runs only when their backend, Sprocket version, and collection settings are compatible.
