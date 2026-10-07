---
description: "Configure Sprocket to submit WDL tasks to a remote GA4GH Task Execution Service (TES) server."
---

# Task Execution Service (TES) Backend

The [Task Execution Service (TES)](https://www.ga4gh.org/product/task-execution-service-tes/)
backend submits tasks to a remote server using the TES API.

Implementations of the TES API include:

* [Planetary](https://github.com/stjude-rust-labs/planetary)
* [Funnel](https://github.com/ohsu-comp-bio/funnel)
* [Poiesis](https://github.com/JaeAeich/poiesis)
* [TESK](https://github.com/elixir-cloud-aai/TESK)

For an end-to-end walkthrough of configuring Sprocket against a TES server and
running a workflow on it, see the [Run with TES](/guides/tes) guide.

## Authentication

The TES backend supports three authentication schemes to communicate with the 
TES API server:

* Basic HTTP authentication (i.e. username and password)
* Bearer token (i.e. a token sent directly in the HTTP `Authorization` header)
* [OAuth device code flow](https://auth0.com/docs/get-started/authentication-and-authorization-flow/device-authorization-flow)

Note that for OAuth authentication, each invocation of Sprocket will perform 
its own device authorization upon startup; access tokens granted by the OAuth 
service are not persisted locally and will not be reused between Sprocket 
executions.

It is recommended to use OAuth authentication in conjunction with the
`dev server` command so that a single device authorization can be shared 
between many different workflow runs.

## Task inputs

As task execution is remote when using the TES backend, local inputs are
transferred to the remote server by uploading them to [cloud storage](/reference/storage/overview)
and providing the TES API server with the upload locations.

To prevent duplicate uploads of the same data, the TES backend will calculate a
[Blake3](https://github.com/BLAKE3-team/BLAKE3) digest of the input to be
transferred and uses an upload path of `file/<hex-digest>` (for `File` inputs)
or `directory/<hex-digest>` (for `Directory` inputs). If an object exists at
that path in cloud storage, it is assumed to match and the upload of the input
is skipped; Sprocket will not download the object from cloud storage to verify
that it matches the local input.

Sprocket also supports specifying paths to files and directories by remote URL
(either `http://`, `https://`, or using a [cloud storage URL](/reference/storage/overview#cloud-storage-urls)).
If an input is already a remote URL, it is passed to the TES API server without
transferring any data to cloud storage.

## Task outputs

The TES backend requests that the TES API server uploads task outputs to a
cloud storage location using a unique prefix for the task's execution.

Sprocket will not attempt to download an executed task's outputs until an
output is needed by workflow evaluation. For example, if a task outputs a
`File`, the `File` remains a remote URL to the cloud storage location of the
output. If that value is used in a `read_*` call from the WDL standard library,
Sprocket will download the file unless already cached locally.

If the task's output is used as an input to another task, the existing remote
cloud storage location is passed to the TES API server and no data is
transferred to cloud storage for the input.

## Configuration

The TES backend supports the following configuration:

```toml
[run.backends.default]
type = "tes"
# The task execution service API endpoint.
service = "<service-url>"
# The cloud storage URL where Sprocket will upload inputs; the URL must end 
# with a slash.
inputs = "<inputs-url>"
# The cloud storage URL where the TES API server will upload outputs; the URL 
# must end with a slash.
outputs = "<outputs-url>"
# The polling interval for task status updates (defaults to 30 second).
interval = 30
# The number of retries after encountering an error communicating with the TES 
# server (defaults to 0 retries).
retries = 0

# If basic authentication is required:
[run.backends.default.auth]
type = "basic"
username = "<username>"
password = "<password>"

# If bearer token authentication is required:
[run.backends.default.auth]
type = "bearer"
token = "<token>"

# If OAuth authentication is required:
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

::: warning
On Unix operating systems, it is recommended that your `sprocket.toml` has an
access permission of `0600` if it contains secrets like TES API server
passwords or tokens.
:::

The example above shows the options most runs need. For every key the backend
accepts, including `max_concurrency` and `insecure`, see the
[configuration file reference](/reference/configuration#run-backends-name-tes).

## GPU Support

GPU acceleration is not currently supported by the TES backend. If your workflow requires GPU resources, use the [Docker backend](/reference/backends/docker) or an HPC backend ([LSF](/reference/backends/lsf) or [Slurm](/reference/backends/slurm)) with Apptainer.
