# Task Execution Service (TES) Backend

The [Task Execution Service (TES)](https://www.ga4gh.org/product/task-execution-service-tes/)
backend submits tasks to a remote server using the TES API.

Implementations of the TES API include:

* [Funnel](https://github.com/ohsu-comp-bio/funnel)
* [Poiesis](https://github.com/JaeAeich/poiesis)
* [TESK](https://github.com/elixir-cloud-aai/TESK)

## Authentication

The TES backend supports two authentication schemes to communicate with the TES
API server:

* Basic HTTP authentication (i.e. username and password)
* Bearer token

The TES backend does not currently support authentication schemes such as
OAuth; if the TES API server requires a bearer token, the token itself must be
derived through external means and specified verbatim in Sprocket's
configuration.

## Task Inputs

As task execution is remote when using the TES backend, local inputs are
transferred to the remote server by uploading them to [cloud storage](/storage/overview.md)
and providing the TES API server with the upload locations.

To prevent duplicate uploads of the same data, the TES backend will calculate a
[Blake3](https://github.com/BLAKE3-team/BLAKE3) digest of the input to be
transferred and uses an upload path of `file/<hex-digest>` (for `File` inputs)
or `directory/<hex-digest>` (for `Directory` inputs). If an object exists at
that path in cloud storage, it is assumed to match and the upload of the input
is skipped; Sprocket will not download the object from cloud storage to verify
that it matches the local input.

Sprocket also supports specifying paths to files and directories by remote URL
(either `http://`, `https://`, or using a [cloud storage URL](/storage/overview.md#cloud-storage-urls)).
If an input is already a remote URL, it is passed to the TES API server without
transferring any data to cloud storage.

## Task Outputs

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
# The URL of the TES API server
url = "<tes-server-url>"
# The cloud storage URL where Sprocket will upload inputs
inputs = "<cloud-storage-url>"
# The cloud storage URL where the TES API server will upload outputs
outputs = "<cloud-storage-url>"
# The polling interval for task status updates (defaults to 60 seconds)
interval = 60

# If basic authentication is required:
[run.backends.default.auth]
type = "basic"
username = "<username>"
password = "<password>"

# If bearer token authentication is required:
[run.backends.default.auth]
type = "bearer"
token = "<token>"
```
