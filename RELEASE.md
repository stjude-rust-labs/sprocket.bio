# Release Process

After a new Sprocket release, perform the following steps:

1. Merge the `next` branch into `main` if there are pending documentation changes.
2. Review the new release's changelog and update any documentation affected by the
   release that isn't already covered by a pull request. This includes new or
   changed subcommands, CLI flags, configuration options, and features, as well as
   regenerating any embedded `sprocket <command> --help` output that has changed.
3. Update the Sprocket version in `.vitepress/config.mts`.
4. Update the version references in `installation.md`.
5. Commit and push to `main`.
