# Project Status

Sprocket remains a v0 project, and as such, any part of its interface is
technically subject to change between releases. In practice, however, the project
has matured to the point where the command-line interface for most established
commands (i.e., those not under the `dev` subcommand namespace) is relatively
settled. We make a conscious effort not to alter the command interface unless we
believe it is strictly necessary.

## Stability across the project

Not all areas of Sprocket are equally stable. The following gives a rough sense
of what to expect.

- **Established commands** (e.g., `run`, `check`, `lint`, `format`, `inputs`).
  These are the most stable parts of the project. Changes to their interfaces are
  infrequent and made only when we believe they meaningfully improve the user
  experience.
- **Configuration** (i.e., `Sprocket.toml`). This area is expected to undergo
  significant changes over the next several versions as we refine how backends,
  storage, and other options are configured. If you maintain configuration files
  across environments, keep an eye on the changelog when upgrading.
- **Experimental commands** (i.e., those under the `dev` subcommand namespace).
  These commands are under active development, and their interfaces may change
  substantially—or be removed entirely—between releases.

Because Sprocket is still v0, we do not currently provide advance deprecation
notices before breaking backwards compatibility for command interfaces. That said, we believe in rigorously
documenting each change so you know what to expect in each upgrade, as described
below. In this way, we believe that you can depend on Sprocket in your
workflows, even before the v1 release.

## Release cadence

Sprocket follows a **three-week release cycle**, with new versions shipping on
every third Wednesday. You can track upcoming and past releases on the
[GitHub releases page](https://github.com/stjude-rust-labs/sprocket/releases).

## Upgrading between versions

We rigorously document all changes—including breaking ones—in the changelogs for
both [Sprocket](https://github.com/stjude-rust-labs/sprocket/blob/main/CHANGELOG.md)
and its [associated crates](https://github.com/stjude-rust-labs/sprocket/tree/main/crates).
All of this is surfaced in the
[release notes](https://github.com/stjude-rust-labs/sprocket/releases), so you
can easily scan for things that affect your use of Sprocket. When upgrading, run
through the release notes for each version you are jumping across and you should
be set.

## Getting help

If you run into trouble or have questions about a change, there are a few places
to reach out.

- **[OpenWDL Slack](https://join.slack.com/t/openwdl/shared_invite/zt-ctmj4mhf-cFBNxIiZYs6SY9HgM9UAVw)**—the
  best place for general questions and conversation about Sprocket and WDL.
- **[GitHub Issues](https://github.com/stjude-rust-labs/sprocket/issues)**—for
  reporting bugs or problems you encounter.
- **[GitHub Discussions](https://github.com/stjude-rust-labs/sprocket/discussions)**—for
  broader questions, ideas, and everything else.
