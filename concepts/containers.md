---
title: Containers
description: "How Sprocket runs tasks in containers, which container protocols each backend supports, and how images are pinned and cached."
---

## Containers

Sprocket runs each task inside a container, using the image that the task requests in its
`container` requirement (or `runtime` section for WDL versions before 1.2). Which container
technology actually runs the image depends on the [execution backend](/reference/backends/overview):
the Docker backend runs images with Docker on the local machine, the LSF and Slurm backends run them
with Apptainer on cluster nodes, and a TES server runs them however it is configured to.

```wdl
requirements {
    container: "ubuntu:22.04"
}
```

When a task does not specify an image, Sprocket uses its own default container.

### Container protocol support

Different execution backends support different container image protocols. The table below summarizes
which protocols are supported by each backend.

| Protocol              | Docker |  TES  | LSF + Apptainer | Slurm + Apptainer |
| --------------------- | :----: | :---: | :-------------: | :---------------: |
| `docker://`           |   ✓    |   ✓   |        ✓        |         ✓         |
| `library://`          |        |   ✓   |        ✓        |         ✓         |
| `oras://`             |        |   ✓   |        ✓        |         ✓         |
| `file://` (local SIF) |        |       |        ✓        |         ✓         |

#### Protocol details

- **[`docker://`](https://docs.docker.com/reference/cli/docker/image/pull/)** — OCI/Docker registry
  images (e.g., `docker://ubuntu:22.04` or simply `ubuntu:22.04`). This is the default protocol when
  no scheme is specified.
- **[`library://`](https://apptainer.org/docs/user/main/library_api.html)** — Sylabs Cloud Library
  images (e.g., `library://sylabs/default/alpine:3.18`). Supported by Apptainer-based backends and
  TES servers that support Sylabs Library references.
- **[`oras://`](https://oras.land/docs/quickstart)** — OCI Registry As Storage images (e.g.,
  `oras://ghcr.io/org/image:tag`). Supported by Apptainer-based backends and TES servers that
  support ORAS.
- **`file://`** — Local Apptainer/Singularity `.sif` files (e.g., `file:///path/to/image.sif`). Only
  supported by Apptainer-based backends where the file is accessible from the execution environment.

Because `docker://` is the default, `ubuntu:22.04` and `docker://ubuntu:22.04` refer to the same
image, and a bare image reference works on every backend.

### Pinning images

A tag such as `ubuntu:latest` is _mutable_: the image it points at can be replaced at any time, so
two runs months apart can run different software. A digest (e.g., `ubuntu@sha256:...`) always refers
to one specific image.

Sprocket's `MutableContainerTag` lint rule flags mutable tags and suggests the digest form instead:

```txt
note[MutableContainerTag]: container URI uses a mutable tag
   ┌─ example.wdl:18:20
   │
18 │         container: "ubuntu:latest"
   │                    ^^^^^^^^^^^^^^^
   │
   = fix: replace the mutable tag with its SHA256 equivalent (e.g., `ubuntu@sha256:foobar` instead of `ubuntu:latest`)
```

::: warning Important
The [call cache](/concepts/call-caching) will not detect changes to the _image_ used for a task's
execution. If the task's container requirement uses a mutable tag, the image behind that tag can
change without invalidating the cache entry. Pinning images by digest avoids that class of surprise.
:::

The experimental [`sprocket dev lock`](/reference/cli/dev/lock) command reads the literal
`container` value of each task in your WDL documents, fetches the manifest checksum for each image
from its registry, and records them in a `sprocket.lock` file, so that human-readable tags can be
resolved to immutable digests. There is currently no consumer for that file; `run` is expected to
use it in the future.

### Image caching

With the Docker backend, images are stored by Docker itself, so a pulled image is available to later
runs on the same machine.

The Apptainer-based backends (LSF and Slurm) pull images and convert them to SIF files in
`cache/images` inside the output directory. Runs that use the same output directory reuse these
images. To use another location, such as a directory shared across users, set `image_cache_dir` in
the backend's `apptainer` table. A relative path is relative to the output directory:

```toml
[run.backends.default.apptainer]
image_cache_dir = "/shared/containers/cache"
```

See the [LSF](/reference/backends/lsf) and [Slurm](/reference/backends/slurm) backend references for
the rest of the Apptainer settings, and [provenance tracking](/concepts/provenance) for where
`cache/` sits in the output directory.
