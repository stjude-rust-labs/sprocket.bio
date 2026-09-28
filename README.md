# sprocket.bio

The source for [sprocket.bio](https://sprocket.bio), the website and documentation
for [Sprocket](https://github.com/stjude-rust-labs/sprocket). The site is built with
[VitePress](https://vitepress.dev) and deployed to GitHub Pages.

## Develop

You need [Node.js](https://nodejs.org) and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm docs:dev
```

The dev server prints a local URL and reloads as you edit. The site configuration
downloads the WDL grammar from the
[sprocket-vscode](https://github.com/stjude-rust-labs/sprocket-vscode) repository
when it starts, so you need network access.

To build and serve the production site:

```sh
pnpm docs:build
pnpm docs:preview
```

## Layout

| Path                       | Contents                                                   |
| -------------------------- | ---------------------------------------------------------- |
| `index.md`                 | The homepage                                               |
| `getting-started/`         | Introduction, installation, and the guided tour            |
| `concepts/`                | Explanations of how Sprocket works                         |
| `guides/`                  | Guides for HPC and TES backends, migration, and fixes      |
| `integrations/`            | Editor, GitHub Action, and Python integrations             |
| `reference/`               | CLI, configuration, lint rule, and backend reference pages |
| `about/`                   | Project status, philosophy, and community                  |
| `public/`                  | Static assets, served from the site root                   |
| `.vitepress/config.mts`    | Site configuration, navigation, and sidebar                |
| `.vitepress/redirects.mts` | Redirects from old URLs                                    |
| `.vitepress/theme/`        | The custom theme, components, and styles                   |
| `scripts/`                 | Checks and generators (see below)                          |

## Scripts

| Command                            | What it does                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| `pnpm docs:dev`                    | Starts the dev server                                                              |
| `pnpm docs:build`                  | Builds the site into `.vitepress/dist`                                             |
| `pnpm docs:preview`                | Serves the built site                                                              |
| `pnpm docs:a11y`                   | Runs pa11y-ci against every built page in light and dark mode                      |
| `pnpm docs:check-redirects`        | Checks that every old URL redirects to a page and anchor that exist                |
| `pnpm reference /path/to/sprocket` | Regenerates `reference/configuration.md` and `reference/lint-rules.md` from a Sprocket binary |
| `pnpm og:image`                    | Renders `public/og-image.png` with a local Chrome (set `CHROME_PATH` to override)  |

Run `pnpm docs:build` before `pnpm docs:a11y` or `pnpm docs:check-redirects`,
because both check the built site.

## Contributing

Open a pull request against `main`. CI builds the site, checks the redirects, and
runs the accessibility checks on every pull request. Pushes to `main` deploy the
site after those checks pass.

Documentation for unreleased Sprocket features goes on the `next` branch. See
[RELEASE.md](RELEASE.md) for the steps to follow after a Sprocket release.
