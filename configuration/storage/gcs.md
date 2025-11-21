# Google Cloud Storage

Sprocket supports transferring files to and from [Google Cloud Storage](https://cloud.google.com/storage).

## Supported AWS S3 URLs

The following cloud storage URLs for Google Cloud Storage are supported:

* `gs` schemed URLs in the form `gs://<bucket>/<object>`.
* `https` schemed URLs in the form `https://<bucket>.storage.googleapis.com/<object>`.
* `https` schemed URLs in the form `https://storage.googleapis.com/<bucket>/<object>`.

## Authentication

Sprocket supports authentication to Google Cloud Storage using HMAC keys.

Follow these instructions for [creating a new HMAC key for a service account](https://cloud.google.com/storage/docs/authentication/hmackeys).

### Environment variables (recommended)

Use the `GOOGLE_HMAC_ACCESS_KEY` and `GOOGLE_HMAC_SECRET` environment variables
to configure Google Cloud Storage authentication in Sprocket.

This overrides any Google Cloud Storage authentication settings in `sprocket.toml`.

### Command line options

Use the `--google-hmac-access-key` and `--google-hmac-secret` options to the
`sprocket run` command to configure Google Cloud Storage authentication in
Sprocket.

This overrides any Google Cloud Storage authentication settings in `sprocket.toml`.

### Configuration file

Google Cloud Storage authentication can be configured with the `run.storage.s3.auth`
section in `sprocket.toml`:

```toml
[run.storage.google.auth]
access_key = "<access-key>"
secret = "<secret>"
```

::: warning
On Unix operating systems, it is recommended that your `sprocket.toml` has an
access permission of `0600` if it contains secrets like a Google Cloud Storage HMAC authentication secret.
:::
