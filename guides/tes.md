---
title: Run with TES
description: "An end-to-end guide to running Sprocket workflows against a GA4GH Task Execution Service (TES) endpoint."
---

<!-- Sources: https://www.ga4gh.org/product/task-execution-service-tes/ (accessed 2026-09-24), https://github.com/stjude-rust-labs/sprocket/blob/v0.33.0/crates/wdl-engine/src/backend/tes.rs@v0.33.0, https://github.com/stjude-rust-labs/sprocket/blob/v0.33.0/crates/wdl-engine/src/config.rs@v0.33.0 -->

## Run with TES

With the [Task Execution Service (TES)](https://www.ga4gh.org/product/task-execution-service-tes/)
backend, Sprocket evaluates your WDL locally and submits each task to a remote TES server, which
executes the task on cloud batch infrastructure, Kubernetes, or an HPC cluster depending on the
server implementation.

### Prerequisites

- **A GA4GH TES server** you can reach over the network, along with its URL. The
  [TES backend reference](/reference/backends/tes) lists several compatible TES servers, including
  Planetary, Funnel, Poiesis, and TESK.

- **Credentials for that server**, if it requires them. Sprocket supports basic authentication,
  bearer tokens, and OAuth device code flow (see [Authentication](#authentication)).

- **A cloud storage location** that both you and the TES server can read and write. Sprocket uploads
  inputs to it and asks the server to write outputs back to it. Sprocket supports
  [Azure Blob Storage](/reference/storage/azure), [Amazon S3](/reference/storage/s3), and
  [Google Cloud Storage](/reference/storage/gcs); see [cloud storage](/reference/storage/overview)
  for the URL forms of each.

- **Sprocket installed locally** (see [installation](/getting-started/installation)). Only
  Sprocket's own evaluation runs on your machine, so a laptop is enough.

- **Container images from a registry.** The TES backend rejects local `.sif` files and other image
  sources it cannot resolve, so every task must use a registry-based image such as `ubuntu:latest`.
  See [containers](/concepts/containers).

### How data moves

Because task execution is remote, Sprocket does not hand local paths to the TES server:

- **Inputs.** Local `File` and `Directory` inputs are uploaded under the `inputs` URL you configure,
  and the server is given those locations. Inputs that are already remote URLs (`http://`,
  `https://`, or a [cloud storage URL](/reference/storage/overview#cloud-storage-urls)) are passed
  through without transferring any data.

- **Outputs.** The server uploads each task's outputs under a unique prefix of the `outputs` URL you
  configure. Sprocket downloads an output only when evaluation actually needs its contents, and
  passes the remote location straight through when one task's output is another task's input.

Uploads are deduplicated by a Blake3 digest of the content, so re-running with the same inputs does
not re-upload them. The [TES backend reference](/reference/backends/tes#task-inputs) describes both
paths in detail.

### Authentication

The TES backend supports three authentication schemes:

- **Basic authentication** with a username and password.
- **A token sent in the HTTP `Authorization` header**, configured with `type = "bearer"`.
- **OAuth device authorization** using an OAuth service.

Storage credentials are separate from TES credentials. Configure them with the environment variables
described on each storage page (for example `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` for
Amazon S3), or in the `run.storage` section of `sprocket.toml`.

::: warning Important
If you put a password, token, or storage key in `sprocket.toml`, restrict the file on Unix systems
with `chmod 0600 sprocket.toml`.
:::

### Configuring the backend

The following `sprocket.toml` submits every task to a TES server and stages data through Amazon S3:

```toml
[run.backends.default]
type = "tes"
# The task execution service API endpoint.
service = "https://tes.example.org"
# Where Sprocket uploads inputs. The path must end with a slash.
inputs = "s3://my-bucket/sprocket/inputs/"
# Where the TES server uploads outputs. The path must end with a slash.
outputs = "s3://my-bucket/sprocket/outputs/"
# How often, in seconds, Sprocket polls the server for task status.
interval = 30
# How many times to retry a failed request to the TES server.
retries = 3

# If the server requires basic authentication:
[run.backends.default.auth]
type = "basic"
username = "<username>"
password = "<password>"
```

Sprocket validates this section before the run starts:

- `service`, `inputs`, and `outputs` are all required.
- `service` must use HTTPS unless you also set `insecure = true`.
- `inputs` and `outputs` must use a supported cloud storage URL scheme, and both paths must end with
  a slash.
- `max_concurrency`, if set, cannot be zero.

To use token authentication instead, replace the `auth` table with:

```toml
[run.backends.default.auth]
type = "bearer"
token = "<token>"
```

To use OAuth authentication instead, replace the `auth` table with:

```toml
[run.backends.default.auth]
type = "oauth"
# The OAuth client identifier for the service being accessed.
client_id = "<client-identifier>"
# The optional OAuth client secret.
client_secret = "<client-secret>"
# The optional audience for the service being accessed; defaults to the base 
# URL of the task execution service.
audience = "<audience>"
# The authorization endpoint for the OAuth service.
authorization = "<authorization-url>"
# The token endpoint for the OAuth service.
token = "<token-url>"
# The list of scopes to request for authorization.
#
# For example, a scope of `offline_access` is common for acquiring an OAuth 
# refresh token.
scopes = ["<scope1>", "<scope2>", "..."]
# Whether or not a refresh token is required; if `true` and the OAuth token 
# endpoint does not issue a refresh token, an error is returned.
#
# Sprocket will automatically handle refreshing an access token if a refresh 
# token was issued by the OAuth service.
#
# Note: this setting is ignored for `[server.engine...]` configuration sections 
# as it is always required for the `dev server` command.
require_refresh = false
```

Every key the backend accepts is listed in the
[configuration file reference](/reference/configuration#run-backends-name-tes), and the narrative
description lives on the [TES backend reference](/reference/backends/tes#configuration) page.

### Running a workflow

Once `sprocket.toml` is configured, `sprocket run` uses the TES backend automatically:

```shell
sprocket run workflow.wdl --target main sample="NA12878"
```

Inputs may be local paths or cloud storage URLs, and the two can be mixed:

```shell
sprocket run workflow.wdl --target main reads=s3://my-bucket/reads/NA12878.bam
```

See [inputs and targets](/concepts/inputs) for the full set of ways to supply inputs, including JSON
and YAML files with the `@` prefix.

### Monitoring a run

Sprocket polls the TES server for task status every `interval` seconds (`30` by default).
`max_concurrency` limits how many API requests the backend sends concurrently (`10` by default).

Transient network or server errors are retried `retries` times (`0` by default). This setting only
covers TES API requests; WDL task retries are configured separately with `run.task.retries` and a
task's `maxRetries` requirement (see [retries](/reference/cli/run#retries)).

Progress is reported at the command line and written to `output.log` in the run directory. Add `-v`
for more detail, or inspect queued tasks through your TES server's interface.

### Outputs

Local run metadata is written to `out/runs/<target>/<timestamp>/` (`inputs.json`, `outputs.json`,
`output.log`, and `calls/`). See [provenance tracking](/concepts/provenance) for the full layout.

Because the TES server writes task outputs to cloud storage, `File` outputs in `outputs.json` are
cloud storage URLs rather than local paths. Sprocket downloads an output file only when workflow
evaluation reads its contents, so completed runs leave output files in cloud storage unless a
downstream expression reads them.

### GPUs

The TES backend does not support GPU acceleration. If a task needs a GPU, use the
[Docker backend](/reference/backends/docker) or an HPC backend ([LSF](/reference/backends/lsf) or
[Slurm](/reference/backends/slurm)) with Apptainer. Disk type hints are also ignored by this
backend.

### Troubleshooting

- **Configuration is rejected before the run starts.** Check the validation rules above; a missing
  trailing slash on `inputs` or `outputs` and an `http://` `service` URL without `insecure = true`
  are common causes.

- **A task fails immediately with an image error.** The TES backend cannot use local SIF files.
  Point the task's `container` at a registry image.

- **Uploads or downloads fail.** Check both your local storage credentials and the TES server's own
  permissions to read the `inputs` prefix and write the `outputs` prefix.

- **A task stays queued.** Scheduling belongs to the TES server; check its interface or server logs
  to see why the task is waiting.

For general run failures, see [troubleshooting](/guides/troubleshooting) or ask in `#sprocket` on
the OpenWDL Slack; see [community and support](/about/community).
