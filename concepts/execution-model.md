---
title: Execution Model
description: "How Sprocket evaluates a WDL document, schedules calls, and dispatches work to an execution backend."
---

# Execution Model

This page describes what happens between the moment you press enter on
`sprocket run` and the moment your outputs appear: which parts of a run happen
inside the Sprocket process, how the workflow is scheduled and parallelized,
what each task attempt does, and where the execution backends differ. Read it
when you want to know why a run behaves the way it does; the pages linked from
each section have the settings and the details.

## Orchestration engine and execution backends

Sprocket's execution engine is made up of two major components: an
**orchestration engine** and one or more **execution runtimes**.

- The **orchestration engine** handles the scheduling and monitoring of units of
  execution within a workflow.
- **Execution runtimes** carry out the work associated with a unit of compute
  within a particular environment (e.g., local compute, a high-performance
  compute cluster, or the cloud).

Briefly, the orchestration engine is generally responsible for staging anything
needed to run a job within a particular environment (localizing data, hooking up
inputs and outputs, deciding which execution runtime to dispatch jobs to)
whereas execution runtimes receive these jobs and are responsible only for
carrying them out in an independent manner.

<ExecArchitectureFigure />

The split matters because it decides what runs where. All of the workflow logic
— expressions, declarations, conditionals, scatters, and the graph that orders
the calls — is evaluated inside the Sprocket process. What leaves that process
is a task's evaluated command, its inputs, and its requirements. Depending on
the backend you configure, that command may run on your own machine or on a
machine you never touch.

Collectively, we consider the combination of an orchestration engine with one or
more configured execution runtimes to comprise an **execution engine**. We
envision the orchestration engine being provided by Sprocket alongside three
official execution runtimes: (a) a local, Docker-based runtime, (b) a Task
Execution Service ([TES]) based runtime, and (c) a flexible "generic" runtime
that can be used to configure execution within HPC clusters. Beyond that, we
plan to make it easy for vendors to build and maintain their own runtimes that
are available within Sprocket.

In the command line interface and the configuration file, a configured execution
runtime is called an [execution backend](/reference/backends/overview).

## The life of a run

1. **Parse and validate the document.** Sprocket parses the WDL document,
   reports any errors it finds, and resolves the
   [target and its inputs](/concepts/inputs).
2. **Evaluate the workflow.** Sprocket builds a dependency graph of the
   workflow and evaluates it in the Sprocket process. Calls to tasks become
   units of work for the backend; everything else — declarations, conditionals,
   scatters, and calls to other workflows — is evaluated in the process itself.
   See [workflow evaluation](#workflow-evaluation).
3. **Prepare each call.** For each task call, Sprocket evaluates the
   requirements, hints, and command, then stages the inputs. Remote `File` and
   `Directory` inputs are downloaded first for every backend except TES, whose
   server fetches them itself. Sprocket reads from and writes to
   [cloud storage](/reference/storage/overview) directly, so inputs can be
   given as `az://`, `s3://`, or `gs://` URLs.
4. **Look the call up in the call cache.** When the
   [call cache](/concepts/call-caching) is enabled and a previous successful
   execution matches, Sprocket reuses that result instead of running the task
   again. This is what lets a failed run resume at the point of failure.
5. **Run the command on the backend.** Sprocket uses exactly one configured
   [execution backend](/reference/backends/overview) per evaluation: the local
   Docker backend by default, or a TES server, or an LSF or Slurm cluster with
   Apptainer. The backend runs the command in the task's
   [container](/concepts/containers) and reports back. The `local` backend is
   the exception: it runs the command directly on the host.
6. **Monitor and retry.** Sprocket tracks the lifecycle of every dispatched
   task. A failed task is retried up to the maximum it requests, or up to the
   configured default; see [retries](/reference/cli/run#retries).
7. **Record outputs and provenance.** Outputs, logs, and each task attempt are
   written under the [output directory](/reference/cli/run#output-directory),
   and every execution is recorded in a SQLite
   [provenance database](/concepts/provenance).

## Workflow evaluation

Sprocket does not walk a workflow from top to bottom. It builds a dependency
graph whose nodes are the workflow's inputs, declarations, calls, scatters,
conditionals, and outputs, and whose edges are the dependencies between them. A
node is evaluated once every node it depends on has finished, which means the
order in your source file does not decide the order of execution — the data flow
does.

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

Inputs, declarations, and outputs are evaluated inline as the graph is walked.
Calls, scatters, and conditionals are spawned as concurrent work, so every call
whose dependencies are satisfied makes progress at the same time: in the
workflow above, `describe` and the scatter over `items` both start as soon as
the workflow inputs are evaluated, and `combine` waits only for the scatter.

A call to a task produces a unit of work for the execution backend. A call to a
workflow does not: Sprocket evaluates the called workflow's own graph in the
same process, so a subworkflow is scheduled exactly like the workflow that
called it.

Scatters and conditionals are evaluated as subgraphs. A scatter evaluates its
body once per array element and gathers the results into arrays; a conditional
evaluates its body only when the condition is true and produces optional values
otherwise.

::: info Scatter concurrency
`run.workflow.scatter.concurrency` sets how many elements of a single scatter
Sprocket processes at a time; it defaults to
[1000](/reference/configuration#run-workflow-scatter-concurrency) and must be
greater than zero. Independent scatters each get their own budget, and nested
scatters multiply: with a concurrency of 10, a scatter inside a scatter
evaluates up to 100 elements at once, and each one needs its own scopes, so
nested scatters use memory exponentially. This setting does not change how many
tasks the backend runs at once — only how many Sprocket offers it.
:::

## Task execution

Evaluating a call to a task is a small pipeline of its own. Sprocket evaluates
the task's inputs and private declarations once, then runs an attempt loop.

<ExecTaskAttemptFigure />

### Attempts

Every attempt re-evaluates the `requirements`, `hints`, `runtime`, and
`command` sections, so a command that adapts itself to the attempt number gets a
fresh value each time.

The `task` variable, including `task.attempt`, becomes available at different
points depending on the WDL version:

- **WDL 1.2:** once the requirements and hints have been evaluated, which is in
  time for the command and the outputs to use it.
- **WDL 1.3:** also while the requirements, hints, and runtime are being
  evaluated, so a task can ask for more memory on its second attempt.

### Call cache and execution

Inputs are localized next, but only for backends that need local paths; see
[how backends differ](#how-backends-differ).

On the first attempt only, and only when the task is cacheable, Sprocket
computes a cache key and looks it up in the [call cache](/concepts/call-caching).
A hit skips execution and reuses the cached execution result. A miss sends the
command to the backend, which runs it under `attempts/<n>/` in the run
directory, alongside the evaluated `command` file, `stdout`, `stderr`, and the
task's `work/` directory.

### Success, failure, and retries

Success and failure are decided by the exit code. A task can declare a
`return_codes` (or `returnCodes`) requirement to say which codes count as
success:

| `return_codes` | Succeeds when the exit code is |
| --- | --- |
| `"*"` | Anything |
| An integer | That integer |
| An array of integers | Any code in the array |
| Not set | `0` |

When a task fails and it has retries left, Sprocket starts another attempt with
its own attempt directory. When it has none left, the task errors and the run
fails. Retries exclude the initial attempt. The number comes from the task's
`max_retries` (or `maxRetries`) requirement, falling back to the
`run.task.retries` setting; see [retries](/reference/cli/run#retries).

After a successful execution, Sprocket remaps any container paths in the working
directory back to host paths and updates the call cache entry. The task's
outputs are then evaluated from whichever produced the result: the fresh
execution or the call cache.

## How backends differ

Every backend receives the same evaluated command and the same inputs. What
differs is where the command runs, what isolates it, who fetches remote inputs,
and what limits how much runs at once.

| Backend | Runs on | Container | Remote inputs | Limited by |
| --- | --- | --- | --- | --- |
| [`local`](/reference/configuration#run-backends-name-local) | Your machine | None | Sprocket downloads | Host CPU, memory |
| [`docker`](/reference/backends/docker) | Your machine | Docker | Sprocket downloads | Host CPU, memory |
| [`tes`](/reference/backends/tes) | TES server | Server's choice | Server fetches | `max_concurrency` |
| [`lsf_apptainer`](/reference/backends/lsf) | LSF node | Apptainer | Sprocket downloads | `max_concurrency` |
| [`slurm_apptainer`](/reference/backends/slurm) | Slurm node | Apptainer | Sprocket downloads | `max_concurrency` |

- **`local`** runs the command as a shell process directly on the host, with no
  container to isolate it. Use it only with WDL you trust.
- **`local` and `docker`** track the host's CPU and memory and park tasks until
  enough is free. In Docker service (swarm) mode, Docker places the tasks
  instead. A task that asks for more CPU or memory than the backend has is an
  error by default. Set
  [`run.task.cpu_limit_behavior`](/reference/configuration#run-task-cpu-limit-behavior)
  or
  [`run.task.memory_limit_behavior`](/reference/configuration#run-task-memory-limit-behavior)
  to `try_with_max` to run it with the maximum available instead of refusing it.
- **`tes`** runs the command wherever the TES server schedules it. Remote inputs
  are passed to the server as URLs; local inputs are uploaded to the storage
  location you configure. `max_concurrency` caps the requests in flight and
  defaults to 10.
- **`lsf_apptainer` and `slurm_apptainer`** submit through `bsub` and `sbatch`.
  `max_concurrency` caps the concurrent submissions and defaults to 10; the
  cluster scheduler decides placement. Both are experimental and have to be
  enabled with `run.experimental_features_enabled`.

The Docker backend is the one Sprocket uses when nothing is configured.

## Failures and cancellation

When a task exhausts its retries, evaluation fails. What happens to the tasks
that are still running is set by `run.fail`. The default, `slow`, waits for
outstanding tasks to finish before the run ends; `fast` cancels executing tasks
immediately. The same modes apply when you interrupt a run yourself — see
[interrupting a run](/reference/cli/run#interrupting-a-run) for what each Ctrl-C
does.

## Outputs and provenance

Each run gets a timestamped directory under the
[output directory](/reference/cli/run#output-directory) holding the run's
`inputs.json`, `outputs.json`, log, and one directory per task call, each with a
numbered directory per attempt. Every run is also recorded in the `sprocket.db`
SQLite database at the root of the output directory. See
[provenance tracking](/concepts/provenance) for the full layout.

The database schema and the layout of `runs/` are internal and may change in any
release, so query run history with Sprocket's commands or
[REST API](/reference/rest-api) instead of reading them directly.

::: info Note
`sprocket dev server` shares the same execution engine and output structure as
`sprocket run`, so everything on this page applies to runs submitted to the
server as well.
:::

[TES]: https://www.ga4gh.org/product/task-execution-service-tes
