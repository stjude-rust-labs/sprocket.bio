---
description: "The current stability of Sprocket's commands and features, its release cadence, and how to upgrade between versions."
---

# Project Status

Sprocket is in the `0.x` release series. Until the executable reaches `1.0`, any
of its interfaces can change or be removed without advance notice. Established
commands are relatively settled, but configuration is still evolving, so read
the release notes before upgrading.

From `1.0`, the executable follows the
[Sprocket compatibility policy](https://github.com/stjude-rust-labs/sprocket/blob/main/COMPATIBILITY.md),
which is the normative source. This page summarizes what to expect.

## Compatibility from `1.0`

These documented, non-experimental interfaces are stable:

- command syntax and behavior for commands outside `sprocket dev` that are not
  otherwise marked experimental;
- exit statuses and whether output is written to stdout or stderr;
- `sprocket.toml` keys, their value types, their defaults, and their documented
  meanings;
- the `/api/v1` API (its server must graduate from `sprocket dev` before
  Sprocket `1.0` can ship);
- explicitly documented machine-readable JSON, including the documented
  `inputs.json` and `outputs.json` formats produced by stable commands; and
- documented `--index-on` behavior on stable commands.

Do not parse human-readable output. Its wording, layout, colors, progress
indicators, diagnostics, and log messages may change without deprecation. Use
documented machine-readable JSON, exit statuses, and stable APIs for automation.

The following are not covered by the executable's policy:

- `sprocket dev` commands, including `/api/v1` while its server remains under
  `dev`, `module.json` and `module-lock.json` while module commands remain
  under `dev`, and test definitions while `test` remains under `dev`;
- WDL 1.4 support and configuration marked experimental;
- the `wdl` and `wdl-*` Rust crates and any separately released Python
  bindings, which are governed separately (see
  [below](#executable-and-package-versions)); and
- the `runs/` layout, `_latest`, task attempt directories, and the `sprocket.db`
  schema.

The `sprocket.db` schema is not backward compatible. Sprocket may change it
whenever a bundled forward migration can safely upgrade existing databases while
preserving user data and supported command behavior. Direct querying, editing,
and downgrades are unsupported. Use Sprocket commands and APIs, or request a
supported interface if one is missing. A database migrated by a newer release may
not work with an older one.

A stable interface is removed only after at least 90 days have passed since the
release that first deprecated it and no earlier than the second minor executable
release after that release. Outside the policy's urgent-exception process,
removal does not occur in a patch release. See the policy for the complete
deprecation process.

## Executable and package versions

The Sprocket executable does not use Semantic Versioning to signal compatibility.
Patch releases contain fixes and compatible corrections. Minor releases may add
compatible features and remove features whose deprecation period has elapsed.
Major versions mark broader functionality or product-purpose milestones and do
not necessarily mean that stable interfaces break.

The `wdl` and `wdl-*` Rust crates and any separately released Python bindings
follow Semantic Versioning according to their own versions, and the executable's
`1.0` release does not freeze their APIs. The root `sprocket` Rust crate shares
the executable's version, but its API is experimental and depending on it is
unsupported.

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

If you run into trouble or have questions about a change, see
[Community and Support](/about/community) for the places to reach the project.
