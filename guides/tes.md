---
title: Run with TES
description: "An end-to-end guide to running Sprocket workflows against a GA4GH Task Execution Service (TES) endpoint."
---

<!-- Sources: https://www.ga4gh.org/product/task-execution-service-tes/ (accessed 2026-09-24), https://github.com/stjude-rust-labs/sprocket/blob/v0.31.0/crates/wdl-engine/src/backend/tes.rs@v0.31.0, https://github.com/stjude-rust-labs/sprocket/blob/v0.31.0/crates/wdl-engine/src/config.rs@v0.31.0 -->

# Run with TES

With the [Task Execution Service
(TES)](https://www.ga4gh.org/product/task-execution-service-tes/) backend,
Sprocket evaluates your WDL locally and submits each task to a remote TES
server, which runs the task somewhere else: a cloud batch service, a Kubernetes
cluster, or an HPC cluster, depending on the implementation.

This guide walks through the whole path: what you need, how Sprocket moves data
through cloud storage, how to authenticate, a working `sprocket.toml`, running
a workflow, and what to check while it runs.

## Prerequisites

- **A GA4GH TES server** you can reach over the network, along with its URL.
  The [TES backend reference](/reference/backends/tes) lists implementations
  that Sprocket's documentation points at; Sprocket talks to any of them
  through the same API.

- **Credentials for that server**, if it requires them. Sprocket supports basic
  authentication and bearer tokens (see [Authentication](#authentication)).

- **A cloud storage location** that both you and the TES server can read and
  write. Sprocket uploads inputs to it and asks the server to write outputs
  back to it. Sprocket supports [Azure Blob Storage](/reference/storage/azure),
  [Amazon S3](/reference/storage/s3), and [Google Cloud
  Storage](/reference/storage/gcs); see [cloud
  storage](/reference/storage/overview) for the URL forms of each.

- **Sprocket installed locally** (see [installation](/getting-started/installation)).
  Only Sprocket's own evaluation runs on your machine, so a laptop is enough.

- **Container images from a registry.** The TES backend rejects local `.sif`
  files and other image sources it cannot resolve, so every task must use a
  registry-based image such as `ubuntu:latest`. See
  [containers](/concepts/containers).

## How data moves

Because task execution is remote, Sprocket does not hand local paths to the TES
server:

- **Inputs.** Local `File` and `Directory` inputs are uploaded under the
  `inputs` URL you configure, and the server is given those locations. Inputs
  that are already remote URLs (`http://`, `https://`, or a [cloud storage
  URL](/reference/storage/overview#cloud-storage-urls)) are passed through
  without transferring any data.

- **Outputs.** The server uploads each task's outputs under a unique prefix of
  the `outputs` URL you configure. Sprocket downloads an output only when
  evaluation actually needs its contents, and passes the remote location
  straight through when one task's output is another task's input.

Uploads are deduplicated by a Blake3 digest of the content, so re-running with
the same inputs does not re-upload them. The
[TES backend reference](/reference/backends/tes#task-inputs) describes both
paths in detail.

## Authentication

The TES backend supports two schemes:

- **Basic authentication** with a username and password.
- **A token sent in the HTTP `Authorization` header**, configured with
  `type = "bearer"`. Sprocket does not perform an OAuth exchange; obtain the
  token by other means and put its value in the configuration.

Storage credentials are separate from TES credentials. Configure them with the
environment variables described on each storage page (for example
`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` for Amazon S3), or in the
`run.storage` section of `sprocket.toml`.

::: warning Important
If you put a password, token, or storage key in `sprocket.toml`, restrict the
file on Unix systems with `chmod 0600 sprocket.toml`.
:::

## Configuring the backend

The following `sprocket.toml` submits every task to a TES server and stages
data through Amazon S3:

```toml
[run.backends.default]
type = "tes"
# The URL of the TES API server.
url = "https://tes.example.org"
# Where Sprocket uploads inputs. The path must end with a slash.
inputs = "s3://my-bucket/sprocket/inputs/"
# Where the TES server uploads outputs. The path must end with a slash.
outputs = "s3://my-bucket/sprocket/outputs/"
# How often, in seconds, Sprocket polls the server for task status.
interval = 5
# How many times to retry a failed request to the TES server.
retries = 3

# If the server requires basic authentication:
[run.backends.default.auth]
type = "basic"
username = "<username>"
password = "<password>"
```

Sprocket validates this section before the run starts:

- `url`, `inputs`, and `outputs` are all required.
- `url` must use HTTPS unless you also set `insecure = true`.
- `inputs` and `outputs` must use a supported cloud storage URL scheme, and
  both paths must end with a slash.
- `max_concurrency`, if set, cannot be zero.

For a token instead of a username and password, replace the `auth` table:

```toml
[run.backends.default.auth]
type = "bearer"
token = "<token>"
```

Every key the backend accepts is listed in the [configuration file
reference](/reference/configuration#run-backends-name-tes), and the narrative
description lives on the [TES backend
reference](/reference/backends/tes#configuration) page.

## Running a workflow

Run a workflow exactly as you would locally; the backend choice is
configuration, not a command-line change:

```shell
sprocket run workflow.wdl --target main sample="NA12878"
```

Inputs may be local paths or cloud storage URLs, and the two can be mixed:

```shell
sprocket run workflow.wdl --target main reads=s3://my-bucket/reads/NA12878.bam
```

See [inputs and targets](/concepts/inputs) for the full set of ways to supply
inputs, including JSON and YAML files with the `@` prefix.

## Monitoring a run

Sprocket polls the TES server for task status every `interval` seconds. The
default is 1 second, which is responsive but chatty; raise it for long-running
tasks or servers that rate-limit. `max_concurrency` bounds how many requests
the backend has in flight at once (10 by default).

Transient network or server errors are retried `retries` times (no retries by
default). This is separate from WDL task retries, which are configured with
`run.task.retries` and a task's `maxRetries` value; see
[retries](/reference/cli/run#retries).

Progress is reported at the command line and written to `output.log` in the run
directory. Add `-v` for more detail, or use the server implementation's own
interface to see the queued tasks.

## Outputs

Run artifacts land in the usual place: `out/runs/<target>/<timestamp>/`, with
`inputs.json`, `outputs.json`, `output.log`, and a per-call directory tree. See
[provenance tracking](/concepts/provenance) for the full layout.

Because the TES server writes task outputs to cloud storage, `File` outputs in
`outputs.json` are cloud storage URLs rather than local paths. Sprocket
downloads a file only when evaluation needs its contents, so a completed run
usually leaves its data in the bucket. Fetch what you need from there with your
cloud provider's tooling.

## GPUs

The TES backend does not support GPU acceleration. If a task needs a GPU, use
the [Docker backend](/reference/backends/docker) or an HPC backend
([LSF](/reference/backends/lsf) or [Slurm](/reference/backends/slurm)) with
Apptainer. Disk type hints are also ignored by this backend.

## Troubleshooting

- **Configuration is rejected before the run starts.** Re-read the validation
  rules above; a missing trailing slash on `inputs` or `outputs` and a plain
  HTTP `url` without `insecure = true` are the common causes.

- **A task fails immediately with an image error.** The TES backend cannot use
  local SIF files. Point the task's `container` at a registry image.

- **Uploads or downloads fail.** Check the storage credentials and that the TES
  server itself is authorized to read the `inputs` prefix and write the
  `outputs` prefix. Sprocket's credentials and the server's are not the same
  thing.

- **A task stays queued.** That scheduling decision belongs to the TES
  implementation; use its interface or logs to find out why.

For anything that is not specific to TES, see
[troubleshooting](/guides/troubleshooting). If you are still stuck, ask in the
places listed under [community and support](/about/community).
