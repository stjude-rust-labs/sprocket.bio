# Azure Blob Storage

Sprocket supports transferring files to and from [Azure Blob Storage](https://azure.microsoft.com/en-us/products/storage/blobs).

## Supported Azure Blob Storage URLs

The following cloud storage URLs for Azure Blob Storage are supported:

* `az` schemed URLs in the form `az://<account>/<container>/<blob>`.
* `https` schemed URLs in the form `https://<account>.blob.core.windows.net/<container>/<blob>`.

## Authentication

Sprocket currently supports authentication to Azure Blob Storage using [SAS tokens](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview).

Follow these instructions to create a [SAS token for your storage container](https://learn.microsoft.com/en-us/azure/ai-services/translator/document-translation/how-to-guides/create-sas-tokens?tabs=Containers).

::: tip
Create a SAS token with an expiration date that is sufficient for your workflow
run, but not an expiration date that expires too far into the future in case
the SAS token is leaked.
:::

### Configuration

Azure Blob Store authentication can be configured with the `run.storage.azure.auth`
section in `sprocket.toml`:

```toml
[run.storage.azure.auth.<account>]
<container> = "<sas-token>"
<container> = "<sas-token>"
```

Where `account` is the Azure Storage account name, `container` is the name of
the blob storage container, and `sas-token` is the SAS token generated for the
storage container.

::: warning
On Unix operating systems, it is recommended that your `sprocket.toml` has an
access permission of `0600` if it contains secrets like SAS tokens.
:::

## Use with TES Backend

Currently Sprocket sends SAS tokens through to the TES API server as query
string parameters in input and output URLS.

This grants the TES API server read and write access to the storage containers,
as well as anyone that get access to the TES task's input and output URLs.

::: danger
:warning: Only use Azure SAS token authentication with a TES API server you trust to secure the input and output URLs.
:::

::: info
In the future, Sprocket will be extended to support shared key authentication and will no longer append SAS tokens to the URLs.
:::

### Permissions

For use with TES backend `inputs` and `outputs` URLs, the configured SAS token must have the following permissions:

* `Read`
* `Create`
* `Write`
* `List`
