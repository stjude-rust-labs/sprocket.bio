---
title: Execution Model
description: "How Sprocket evaluates a WDL document, schedules calls, and dispatches work to an execution backend."
---

## Execution Model

When you run `sprocket run`, Sprocket parses and evaluates the WDL workflow inside its own process
and dispatches individual task commands to a selected
[execution backend](/reference/backends/overview). `sprocket dev server` uses the same execution
engine and output layout.

### Orchestration engine and execution backends

Sprocket's **execution engine** combines two parts:

- The **orchestration engine** evaluates workflow logic, stages data, connects inputs and outputs,
  and schedules and monitors task calls.
- **Execution runtimes** (configured in `sprocket.toml` and on the CLI as
  [execution backends](/reference/backends/overview)) run individual task commands in a target
  environment: locally with Docker (`docker`, the default) or on the host (`local`), remotely
  through a Task Execution Service ([TES]) server (`tes`), or on an HPC cluster with Apptainer
  (`lsf_apptainer` and `slurm_apptainer`, both experimental).

<ExecArchitectureFigure />

Expressions, declarations, conditionals, scatters, and call dependencies all run inside the Sprocket
process. Only each task's evaluated command, inputs, and resource requirements are handed to the
selected backend.

### The life of a run

1. **Parse and validate the document.** Sprocket parses the WDL document, reports any errors, and
   resolves the [target and its inputs](/concepts/inputs).
2. **Evaluate the workflow.** Sprocket builds a dependency graph of the workflow and evaluates it in
   the Sprocket process. Task calls are dispatched to the backend, while declarations, conditionals,
   scatters, and subworkflow calls run in-process; see [workflow evaluation](#workflow-evaluation).
3. **Prepare each call.** For each task call, Sprocket evaluates the requirements, hints, and
   command, then stages inputs. Remote `File` and `Directory` inputs (`http://`, `https://`,
   `az://`, `s3://`, or `gs://`) are downloaded locally for every backend except TES, whose server
   fetches remote URLs itself; see [cloud storage](/reference/storage/overview).
4. **Look the call up in the call cache.** When the [call cache](/concepts/call-caching) is enabled
   and a previous successful execution matches, Sprocket reuses the cached result instead of
   re-running the task.
5. **Run the command on the backend.** A run uses one selected
   [execution backend](/reference/backends/overview) (Docker by default). Containerized backends run
   the command inside the task's [container](/concepts/containers); the `local` backend runs it
   directly on the host.
6. **Monitor and retry.** Sprocket tracks each dispatched task and retries failed tasks up to the
   task's `maxRetries` (or `max_retries`) setting or `run.task.retries`; see
   [retries](/reference/cli/run#retries).
7. **Record outputs and provenance.** Outputs, logs, and each task attempt are written under the
   [output directory](/reference/cli/run#output-directory), and the run is recorded in a SQLite
   [provenance database](/concepts/provenance).

### Workflow evaluation

Sprocket builds a dependency graph from the workflow's inputs, declarations, calls, scatters,
conditionals, and outputs, and evaluates each node once its dependencies finish. Execution order
follows data dependencies rather than declaration order in the file.

```wdl
version 1.3

workflow demo {
    input {
        Array[File] items
        File config
    }

    call describe { items }

    scatter (item in items) {
        call process { item, config }
    }

    call combine { results = process.result }

    output {
        File report = combine.report
        File summary = describe.summary
    }
}
```

<ExecWorkflowGraphFigure />

Inputs, declarations, and outputs are evaluated inline as the graph is walked. Calls, scatters, and
conditionals are spawned as concurrent work, so every call whose dependencies are satisfied makes
progress at the same time: in the workflow above, `describe` and the scatter over `items` both start
as soon as the workflow inputs are evaluated, and `combine` waits only for the scatter.

Calling a subworkflow evaluates that workflow's dependency graph in the same Sprocket process; only
task calls are sent to the execution backend.

Scatters and conditionals are evaluated as subgraphs. A scatter evaluates its body once per array
element and gathers the results into arrays; a conditional evaluates its body only when the
condition is true and produces optional values otherwise.

::: info Scatter concurrency
`run.workflow.scatter.concurrency` sets how many elements of a single scatter Sprocket processes at
a time; it defaults to [1000](/reference/configuration#run-workflow-scatter-concurrency) and must be
greater than zero. Independent scatters each get their own budget, and nested scatters multiply:
with a concurrency of 10, a scatter inside a scatter evaluates up to 100 elements at once, and each
one needs its own scopes, so nested scatters use memory exponentially. This setting limits how many
scatter elements Sprocket evaluates concurrently; the backend controls how many tasks execute at
once.
:::

### Task execution

To run a task call, Sprocket evaluates the task's inputs and private declarations once, then runs an
attempt loop.

<ExecTaskAttemptFigure />

#### Attempts

Every attempt re-evaluates the `requirements`, `hints`, `runtime`, and `command` sections, so a
command or requirement that references `task.attempt` gets a fresh value on each retry.

The `task` variable, including `task.attempt`, becomes available at different points depending on
the WDL version:

- **WDL 1.2:** once the requirements and hints have been evaluated, in time for `command` and
  `output` expressions.
- **WDL 1.3:** also while `requirements`, `hints`, and `runtime` are being evaluated, so a task can
  request more memory on a retry.

#### Call cache and execution

Inputs are localized next for backends that use local paths; see
[how backends differ](#how-backends-differ).

When the [call cache](/concepts/call-caching) is enabled and the task is cacheable, each attempt
looks up a cache entry by document URI, task name, input values, and backend, then checks that the
evaluated command, container, shell, requirements, hints, and input file contents still match. On a
valid hit, Sprocket skips execution and reuses the cached result (if a command or requirement
changes with `task.attempt`, an entry from a different attempt is invalidated rather than reused).
On a miss or invalidated entry, the backend runs the command under `attempts/<n>/` in the run
directory alongside the evaluated `command` file, `stdout`, `stderr`, and the task's `work/`
directory.

#### Success, failure, and retries

Success and failure are decided by the exit code. A task can declare a `return_codes` (or
`returnCodes`) requirement to say which codes count as success:

| `return_codes` | Succeeds when the exit code is |
| --- | --- |
| `"*"` | Anything |
| An integer | That integer |
| An array of integers | Any code in the array |
| Not set | `0` |

When a task fails and has retries left, Sprocket starts another attempt in its own `attempts/<n>/`
directory; when no retries remain, the task errors and the run fails. Retries exclude the initial
attempt and come from the task's `max_retries` (or `maxRetries`) requirement, falling back to
`run.task.retries`; see [retries](/reference/cli/run#retries).

After a fresh execution succeeds, Sprocket remaps container symlinks in the working directory back
to host paths and updates the call cache entry (cache hits skip this write). It then evaluates the
task's `output` section from the execution or cached result.

As attempts move through this pipeline, Sprocket records their timing, resolved constraints, retry
causes, and any resource utilization reported by the engine or backend. See
[Execution Metrics](/concepts/execution-metrics) for the collection sources and field semantics.

### How backends differ

Backends differ in where commands run, how tasks are isolated, who stages remote inputs, and how
concurrency is bounded:

| Backend | Runs on | Container | Remote inputs | Limited by |
| --- | --- | --- | --- | --- |
| [`local`](/reference/configuration#run-backends-name-local) | Your machine | None | Sprocket downloads | Host CPU, memory |
| [`docker`](/reference/backends/docker) | Your machine | Docker | Sprocket downloads | Host CPU, memory |
| [`tes`](/reference/backends/tes) | TES server | Server's choice | Server fetches | `max_concurrency` |
| [`lsf_apptainer`](/reference/backends/lsf) | LSF node | Apptainer | Sprocket downloads | `max_concurrency` |
| [`slurm_apptainer`](/reference/backends/slurm) | Slurm node | Apptainer | Sprocket downloads | `max_concurrency` |

- **`local`** runs the command as a shell process directly on the host, with no container isolation.
  Use it only with WDL you trust.
- **`local` and `docker`** track the host's CPU and memory and queue tasks until enough capacity is
  free (in Docker Swarm mode, Docker schedules placement instead). A task requesting more CPU or
  memory than the backend has fails by default; set
  [`run.task.cpu_limit_behavior`](/reference/configuration#run-task-cpu-limit-behavior) or
  [`run.task.memory_limit_behavior`](/reference/configuration#run-task-memory-limit-behavior) to
  `"try_with_max"` to clamp the request instead.
- **`tes`** submits tasks to a TES server. Remote inputs are passed as URLs; local inputs are
  uploaded to the configured cloud storage prefix. `max_concurrency` caps concurrent API requests
  (`10` by default).
- **`lsf_apptainer` and `slurm_apptainer`** submit jobs via `bsub` and `sbatch`. `max_concurrency`
  caps concurrent submission processes (`10` by default); the cluster scheduler places and bounds
  running jobs. Both are experimental and require `run.experimental_features_enabled = true`.

Docker is the default backend when none is configured.

### Failures and cancellation

When a task exhausts its retries, `run.fail` controls what happens to tasks that are still running:
`"slow"` (the default) waits for outstanding tasks to finish before exiting, and `"fast"` cancels
them immediately. Pressing Ctrl-C follows the same modes; see
[interrupting a run](/reference/cli/run#interrupting-a-run).

### Outputs and provenance

Each run writes a timestamped directory under the
[output directory](/reference/cli/run#output-directory) containing `inputs.json`, `outputs.json`,
`output.log`, and per-call `attempts/<n>/` directories, and records the execution in `sprocket.db`.
Local `sprocket run` executions also attempt a best-effort write of `metrics.json`. See
[provenance tracking](/concepts/provenance) for the full layout.

The `sprocket.db` schema and the internal layout of `runs/` may change in any release; query run
history through Sprocket's commands or [REST API](/reference/rest-api) rather than reading those
files directly.

[TES]: https://www.ga4gh.org/product/task-execution-service-tes
