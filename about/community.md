---
title: Community and Support
description: "Where to ask questions, report issues, and contribute to Sprocket."
---

# Community and Support

Sprocket is developed in the open, and there are several places to ask
questions, report problems, or get involved.

## Getting help

- **[OpenWDL Slack](https://join.slack.com/t/openwdl/shared_invite/zt-ctmj4mhf-cFBNxIiZYs6SY9HgM9UAVw)**—the
  `#sprocket` channel is the best place for general questions and conversation
  about Sprocket and WDL.
- **[GitHub Issues](https://github.com/stjude-rust-labs/sprocket/issues)**—for
  reporting bugs or problems you encounter.
- **[GitHub Discussions](https://github.com/stjude-rust-labs/sprocket/discussions)**—for
  broader questions, ideas, and everything else.

## Reporting problems and ideas

Which repository an issue belongs in depends on the part of the project it
concerns.

- [`stjude-rust-labs/sprocket`](https://github.com/stjude-rust-labs/sprocket/issues)
  — the `sprocket` command line tool, the execution engine, and configuration.
- [`stjude-rust-labs/wdl`](https://github.com/stjude-rust-labs/wdl/issues) — the
  `wdl` family of crates, including validation and
  [lint rules](/reference/lint-rules). New rule ideas are welcome here.
- [`stjude-rust-labs/sprocket-vscode`](https://github.com/stjude-rust-labs/sprocket-vscode/issues)
  — the [Visual Studio Code extension](/integrations/vscode).
- [`stjude-rust-labs/sprocket.nvim`](https://github.com/stjude-rust-labs/sprocket.nvim)
  — the [Neovim plugin](/integrations/neovim).

Larger design changes are discussed as RFCs in
[`stjude-rust-labs/rfcs`](https://github.com/stjude-rust-labs/rfcs). For
example, the design of Sprocket's
[provenance tracking](/concepts/provenance) is described in
[RFC #3](https://github.com/stjude-rust-labs/rfcs/pull/3).

## Contributing

Contributions are welcome. Sprocket has been architected from the beginning to
maximize the potential for any interested party to contribute effectively, and
the practices that make that possible—no code ownership, required documentation
for public members, a common commit message style, `CHANGELOG.md` entries, and a
comprehensive test suite—are described in the
[philosophy](/about/philosophy#community-focused-codebase). Start from the
contributing guidelines in the repository you want to work on:
[`sprocket`](https://github.com/stjude-rust-labs/sprocket) for the command line
tool and engine, or [`wdl`](https://github.com/stjude-rust-labs/wdl) for the
crates.

If you plan to run Sprocket on Windows and hit problems,
[report the issue](https://github.com/stjude-rust-labs/sprocket/issues)—native
Windows support is something the project cares about, as described in
[goal-adjacent](/about/philosophy#goal-adjacent).
