# Azure Blob Storage

Sprocket supports transferring files to and from [Azure Blob Storage](https://azure.microsoft.com/en-us/products/storage/blobs).

## Supported Azure Blob Storage URLs

The following cloud storage URLs for Azure Blob Storage are supported:

* `az` schemed URLs in the form `az://<account>/<container>/<blob>`.
* `https` schemed URLs in the form `https://<account>.blob.core.windows.net/<container>/<blob>`.

## Authentication

Sprocket supports authentication to Azure Blob Storage using shared key
authentication.

Follow these instructions for [viewing your account keys](https://learn.microsoft.com/en-us/azure/storage/common/storage-account-keys-manage#view-account-access-keys).

### Environment variables (recommended)

Use the `AZURE_ACCOUNT_NAME` and `AZURE_ACCESS_KEY` environment variables
to configure Azure Blob Storage authentication in Sprocket.

This overrides any Azure Blob Storage authentication settings in `sprocket.toml`.

### Command line options

Use the `--azure-account-name` and `--azure-access-key` options to the
`sprocket run` command to configure Azure Storage authentication in Sprocket.

This overrides any Azure Blob Storage authentication settings in `sprocket.toml`.

### Configuration

Azure Blob Store authentication can be configured with the `run.storage.azure.auth`
section in `sprocket.toml`:

```toml
[run.storage.azure.auth]
account_name = "<account-name>"
access_key = "<access-key>"
```

Where `account-name` is the Azure Storage account name and `access-key` is the
account's access key.

::: warning
On Unix operating systems, it is recommended that your `sprocket.toml` has an
access permission of `0600` if it contains secrets like an Azure Storage
account key.
:::
