# Project Status

Sprocket is currently in the `0.x` release series. Until the Sprocket executable
reaches `1.0`, any of its interfaces may change or be removed without advance
notice. Established commands are relatively settled, but configuration is still
evolving. You should read the release notes before upgrading. The `wdl` and
`wdl-*` Rust crates and any separately released Python bindings are governed
separately, as described [below](#executable-and-package-versions).

The executable's compatibility policy takes effect with its `1.0` release. The
[Sprocket compatibility policy](https://github.com/stjude-rust-labs/sprocket/blob/main/COMPATIBILITY.md)
is the normative source; this page summarizes what users should expect.

## Compatibility from `1.0`

From executable `1.0`, Sprocket treats these documented, non-experimental
interfaces as stable:

- command syntax and behavior for commands outside `sprocket dev` that are not
  otherwise marked experimental;
- exit statuses and whether output is written to stdout or stderr;
- `sprocket.toml` keys, their value types, their defaults, and their documented
  meanings;
- the `/api/v1` API; its server must graduate from `sprocket dev` before
  Sprocket `1.0` can ship;
- explicitly documented machine-readable JSON, including the documented
  `inputs.json` and `outputs.json` formats produced by stable commands; and
- documented `--index-on` behavior on stable commands.

Do not parse human-readable output. Its wording, layout, colors, progress
indicators, diagnostics, and log messages may change without deprecation. Use
documented machine-readable JSON, exit statuses, and stable APIs for automation.
Other experimental, undocumented, or independently governed interfaces are not
covered by the executable's policy. Examples include `sprocket dev`, `/api/v1`
while its server remains under `dev`, `module.json` and `module-lock.json` while
module commands remain under `dev`, test definitions while `test` remains under
`dev`, WDL 1.4 support, configuration marked experimental, the `wdl` and
`wdl-*` Rust crates, any separately released Python bindings, the internal
`runs/` layout, `_latest`, task attempt directories, and the `sprocket.db`
schema.

The `sprocket.db` schema is internal and is not backward compatible. Sprocket
may change it when a bundled forward migration can safely upgrade existing
databases while preserving user data and supported command behavior. Direct
querying, editing, and downgrade compatibility are unsupported. Use Sprocket
commands and APIs, or request a supported interface if one is missing. A
database migrated by a newer Sprocket release may not work with an older
release.

A stable interface may be removed only after at least 90 days have passed since
the release that first deprecated it and no earlier than the second minor
executable release after that release. Outside the policy's urgent-exception
process, removal does not occur in a patch release. See the normative policy for
the complete deprecation process.

## Executable and package versions

The Sprocket executable does not use Semantic Versioning to signal compatibility.
Patch releases contain fixes and compatible corrections. Minor releases may add
compatible features and remove features whose full deprecation period has
elapsed. Major version numbers mark broader functionality or product-purpose
milestones and do not necessarily mean that stable interfaces break.

The `wdl` and `wdl-*` Rust crates and any separately released Python bindings
follow Semantic Versioning according to their own versions. The executable's
`1.0` release does not freeze their APIs. We do not advise or expect external
users to depend on the root `sprocket` Rust crate, and that use is unsupported.
Its API is experimental because it shares the executable's version and is
outside those package guarantees.

## Release cadence

Sprocket follows a **three-week release cycle**, with new versions shipping on
every third Wednesday. You can track upcoming and past releases on the
[GitHub releases page](https://github.com/stjude-rust-labs/sprocket/releases).

## Upgrading between versions

We document changes in the CHANGELOGs for both
[Sprocket](https://github.com/stjude-rust-labs/sprocket/blob/main/CHANGELOG.md)
and its [associated crates](https://github.com/stjude-rust-labs/sprocket/tree/main/crates).
These changes are surfaced in the
[release notes](https://github.com/stjude-rust-labs/sprocket/releases), so you
can scan for changes that affect your use of Sprocket. Before upgrading, read the
release notes for every version you are skipping.

## Getting help

If you run into trouble or have questions about a change, there are a few places
to reach out.

- **[OpenWDL Slack](https://join.slack.com/t/openwdl/shared_invite/zt-ctmj4mhf-cFBNxIiZYs6SY9HgM9UAVw)**—the
  best place for general questions and conversation about Sprocket and WDL.
- **[GitHub Issues](https://github.com/stjude-rust-labs/sprocket/issues)**—for
  reporting bugs or problems you encounter.
- **[GitHub Discussions](https://github.com/stjude-rust-labs/sprocket/discussions)**—for
  broader questions, ideas, and everything else.
