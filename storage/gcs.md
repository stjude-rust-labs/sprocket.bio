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

### Configuration

Google Cloud Storage authentication can be configured with the `run.storage.google.auth`
section in `sprocket.toml`:

```toml
[run.storage.google.auth]
access_key = "<access-key>"
secret = "<secret>"
```

Additionally, the `--google-hmac-access-key` and the `--google-hmac-secret` CLI
options to `sprocket run` or the `GOOGLE_HMAC_ACCESS_KEY` and
`GOOGLE_HMAC_SECRET` environment variables can be used to override the
authentication settings from configuration.
