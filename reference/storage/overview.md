---
description: "Sprocket reads and writes workflow files directly from Azure Blob Storage, Amazon S3, and Google Cloud Storage."
---

# Cloud Storage

Sprocket has built-in support for transferring files to and from the following
cloud storage services:

* [Azure Blob Storage](/reference/storage/azure)
* [Amazon S3](/reference/storage/s3)
* [Google Cloud Storage](/reference/storage/gcs)

::: warning
Sprocket will ingress and egress data to cloud storage as-needed for workflow
evaluation.

Please be aware that this might incur data transfer costs for your organization.

Only run workflows in an environment that is authorized to receive and transmit
protected data.
:::

## Cloud storage URLs

Sprocket supports specifying a cloud storage location using cloud-specific URLs.

### Azure Blob Storage URLs

The following cloud storage URLs for Azure Blob Storage are supported:

* `az` schemed URLs in the form `az://<account>/<container>/<blob>`.
* `https` schemed URLs in the form `https://<account>.blob.core.windows.net/<container>/<blob>`.

See the documentation for [Azure Blob Storage](/reference/storage/azure) for
information on authenticating with Azure.

### Amazon S3 URLs

The following cloud storage URLs for Amazon S3 are supported:

* `s3` schemed URLs in the form `s3://<bucket>/<object>` (note: uses the
  [configured default region](/reference/storage/s3#default-region)).
* `https` schemed URLs in the form `https://<bucket>.s3.<region>.amazonaws.com/<object>`.
* `https` schemed URLs in the form `https://<region>.s3.amazonaws.com/<bucket>/<object>`.

See the documentation for [Amazon S3](/reference/storage/s3) for information on
authenticating with Amazon S3.

### Google Cloud Storage URLs

The following cloud storage URLs for Google Cloud Storage are supported:

* `gs` schemed URLs in the form `gs://<bucket>/<object>`.
* `https` schemed URLs in the form `https://<bucket>.storage.googleapis.com/<object>`.
* `https` schemed URLs in the form `https://storage.googleapis.com/<bucket>/<object>`.

See the documentation for [Google Cloud Storage](/reference/storage/gcs) for
information on authenticating with Google Cloud Storage.
