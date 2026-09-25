import { defineConfigWithTheme } from "vitepress";
import type { SprocketThemeConfig } from "./theme/types";
import axios from 'axios';
import taskLists from 'markdown-it-task-lists';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { redirects } from "./redirects.mts";

// The current Sprocket release, shown in the nav and used on the homepage.
const sprocketVersion = "0.31.0";

const grammarUrl = "https://raw.githubusercontent.com/stjude-rust-labs/sprocket-vscode/refs/heads/main/syntaxes/wdl.tmGrammar.json";

const siteUrl = "https://sprocket.bio";
const siteDescription =
  "Sprocket is an open-source bioinformatics workflow engine built on the Workflow Description Language (WDL). Run locally, then scale to HPC or the cloud.";

// The social preview image. Regenerate it with `pnpm og:image`.
const ogImage = {
  url: `${siteUrl}/og-image.png`,
  width: "1200",
  height: "630",
  alt: "Sprocket: The Bioinformatics Workflow Engine. Open source and built on WDL.",
};

// Maps a page's source path to its public, extensionless URL.
function pageUrl(page: string) {
  const path = page.replace(/(^|\/)index\.md$/, "$1").replace(/\.md$/, "");
  return `${siteUrl}/${path}`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// True when an extensionless path resolves to a page in the built site.
function pageExists(outDir: string, path: string) {
  return existsSync(join(outDir, `${path}.html`)) || existsSync(join(outDir, path, "index.html"));
}

function pageTitle(outDir: string, path: string) {
  const file = existsSync(join(outDir, `${path}.html`)) ? join(outDir, `${path}.html`) : join(outDir, path, "index.html");
  return /<title>([^<]*)<\/title>/.exec(readFileSync(file, "utf8"))?.[1] ?? path;
}

// Builds the HTML written at an old URL. The redirect runs in JavaScript so the
// hash can be mapped through `anchors` first; the meta refresh is the fallback
// for browsers with scripting turned off.
function redirectStub(to: string, title: string, anchors: Record<string, string>) {
  const script = [
    "(function(){",
    `var to=${JSON.stringify(to)},anchors=${JSON.stringify(anchors)};`,
    "var hash=location.hash.replace(/^#/,'');",
    "var dest=hash&&Object.prototype.hasOwnProperty.call(anchors,hash)?anchors[hash]:to+(hash?'#'+hash:'');",
    "var cut=dest.indexOf('#');",
    "var path=cut<0?dest:dest.slice(0,cut),fragment=cut<0?'':dest.slice(cut);",
    "location.replace(path+location.search+fragment);",
    "})()",
  ].join("");
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>Moved: ${escapeHtml(title)}</title>`,
    '<meta name="robots" content="noindex">',
    `<meta name="sprocket-redirect" content="${escapeHtml(to)}">`,
    `<link rel="canonical" href="${escapeHtml(siteUrl + to)}">`,
    `<noscript><meta http-equiv="refresh" content="0; url=${escapeHtml(to)}"></noscript>`,
    `<script>${script}</script>`,
    "</head>",
    "<body>",
    "<main>",
    "<h1>This page has moved</h1>",
    `<p><a href="${escapeHtml(to)}">Go to the new page</a></p>`,
    "</main>",
    "</body>",
    "</html>",
    "",
  ].join("");
}

// Writes a stub at every old URL. The whole map is validated before anything is
// written so a bad entry fails the build instead of shipping a broken redirect.
async function writeRedirects(outDir: string) {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const { from, to } of redirects) {
    if (!from.startsWith("/") || !to.startsWith("/")) {
      errors.push(`${from} -> ${to}: both paths must start with "/"`);
      continue;
    }
    if (seen.has(from)) errors.push(`${from}: duplicate redirect source`);
    seen.add(from);
    if (existsSync(join(outDir, `${from}.html`)) || existsSync(join(outDir, from, "index.html"))) {
      errors.push(`${from}: a real page is already built at this URL`);
    }
    // A bare directory is fine (the public folder can hold assets below an old
    // page's path); GitHub Pages resolves `/foo` to `foo.html` first.
    if (existsSync(join(outDir, from)) && !statSync(join(outDir, from)).isDirectory()) {
      errors.push(`${from}: a public file is already served at this URL`);
    }
    if (!pageExists(outDir, to)) errors.push(`${from}: the destination ${to} does not exist`);
  }

  if (errors.length) {
    throw new Error(`Invalid redirect map in .vitepress/redirects.mts:\n  ${errors.join("\n  ")}`);
  }

  for (const { from, to, anchors } of redirects) {
    const html = redirectStub(to, pageTitle(outDir, to), anchors ?? {});
    const file = join(outDir, `${from}.html`);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
    // When public assets live below the old path, the host may resolve the URL
    // to the directory instead of the sibling HTML file, so cover both.
    if (existsSync(join(outDir, from)) && statSync(join(outDir, from)).isDirectory()) {
      await writeFile(join(outDir, from, "index.html"), html);
    }
  }

  console.log(`Wrote ${redirects.length} redirect stubs.`);
}

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Sprocket",
  description: siteDescription,
  url: siteUrl,
  image: ogImage.url,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "macOS, Linux, Windows",
  softwareVersion: sprocketVersion,
  license: [
    "https://github.com/stjude-rust-labs/sprocket/blob/main/LICENSE-APACHE",
    "https://github.com/stjude-rust-labs/sprocket/blob/main/LICENSE-MIT",
  ],
  sameAs: ["https://github.com/stjude-rust-labs/sprocket"],
  author: {
    "@type": "Organization",
    name: "St. Jude Rust Labs",
    url: "https://github.com/stjude-rust-labs",
    parentOrganization: {
      "@type": "Organization",
      name: "St. Jude Children's Research Hospital",
      url: "https://www.stjude.org",
    },
  },
};

export default defineConfigWithTheme<SprocketThemeConfig>({
  title: "Sprocket | St. Jude Rust Labs",
  description: siteDescription,
  srcExclude: ["README.md", "RELEASE.md"],
  cleanUrls: true,
  head: [
    ["link", { rel: "icon", type: "image/png", href: "/favicon.png" }],
    ["link", { rel: "apple-touch-icon", href: "/apple-touch-icon.png" }],
    ["meta", { name: "theme-color", content: "#070a19" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "Sprocket" }],
    ["meta", { property: "og:locale", content: "en_US" }],
    ["meta", { property: "og:image", content: ogImage.url }],
    ["meta", { property: "og:image:type", content: "image/png" }],
    ["meta", { property: "og:image:width", content: ogImage.width }],
    ["meta", { property: "og:image:height", content: ogImage.height }],
    ["meta", { property: "og:image:alt", content: ogImage.alt }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:image", content: ogImage.url }],
    ["meta", { name: "twitter:image:alt", content: ogImage.alt }],
  ],
  transformHead({ page, title, description }) {
    // VitePress emits the description unescaped, so it is set here instead.
    const head: [string, Record<string, string>, string?][] = [
      ["meta", { name: "description", content: description }],
      ["meta", { property: "og:title", content: title }],
      ["meta", { property: "og:description", content: description }],
      ["meta", { name: "twitter:title", content: title }],
      ["meta", { name: "twitter:description", content: description }],
    ];
    if (page === "404.md") return head;

    const url = pageUrl(page);
    head.push(
      ["link", { rel: "canonical", href: url }],
      ["meta", { property: "og:url", content: url }],
    );
    if (page === "index.md") {
      head.push(["script", { type: "application/ld+json" }, JSON.stringify(softwareJsonLd)]);
    }
    return head;
  },
  sitemap: {
    hostname: siteUrl,
    // Match the extensionless canonical URLs.
    transformItems: (items) => items.map((item) => ({ ...item, url: item.url.replace(/\.html$/, "") })),
  },
  themeConfig: {
    sprocketVersion,
    nav: [
      { text: "Documentation", link: "/getting-started/introduction" },
      {
        text: `v${sprocketVersion}`,
        items: [
          {
            text: "Changelog",
            link: "https://github.com/stjude-rust-labs/sprocket/blob/main/CHANGELOG.md",
          },
        ],
      },
    ],
    sidebar: [
      {
        text: "Get Started",
        items: [
          { text: "Introduction", link: "/getting-started/introduction", docFooterText: "Get Started &gt; Introduction" },
          { text: "Installation", link: "/getting-started/installation", docFooterText: "Get Started &gt; Installation" },
          { text: "Guided Tour", link: "/getting-started/guided-tour", docFooterText: "Get Started &gt; Guided Tour" },
          { text: "Adoption Checklist", link: "/getting-started/checklist", docFooterText: "Get Started &gt; Adoption Checklist" },
        ],
      },
      {
        text: "Concepts",
        items: [
          { text: "Execution Model", link: "/concepts/execution-model", docFooterText: "Concepts &gt; Execution Model" },
          { text: "Inputs and Targets", link: "/concepts/inputs", docFooterText: "Concepts &gt; Inputs and Targets" },
          { text: "Configuration", link: "/concepts/configuration", docFooterText: "Concepts &gt; Configuration" },
          { text: "Containers", link: "/concepts/containers", docFooterText: "Concepts &gt; Containers" },
          { text: "Call Caching", link: "/concepts/call-caching", docFooterText: "Concepts &gt; Call Caching" },
          { text: "Provenance Tracking", link: "/concepts/provenance", docFooterText: "Concepts &gt; Provenance Tracking" },
        ],
      },
      {
        text: "Guides",
        items: [
          { text: "Run on Slurm", link: "/guides/slurm", docFooterText: "Guides &gt; Run on Slurm" },
          { text: "Run on LSF", link: "/guides/lsf", docFooterText: "Guides &gt; Run on LSF" },
          { text: "Run with TES", link: "/guides/tes", docFooterText: "Guides &gt; Run with TES" },
          { text: "Troubleshooting", link: "/guides/troubleshooting", docFooterText: "Guides &gt; Troubleshooting" },
          { text: "Migrating from Cromwell or miniwdl", link: "/guides/migrating", docFooterText: "Guides &gt; Migrating from Cromwell or miniwdl" },
        ],
      },
      {
        text: "Commands",
        items: [
          {
            text: "Develop",
            collapsed: false,
            items: [
              { text: "analyzer", link: "/reference/cli/analyzer", docFooterText: "Commands &gt; Develop &gt; analyzer" },
              { text: "check/lint", link: "/reference/cli/check-lint", docFooterText: "Commands &gt; Develop &gt; check/lint" },
              { text: "explain", link: "/reference/cli/explain", docFooterText: "Commands &gt; Develop &gt; explain" },
              { text: "format", link: "/reference/cli/format", docFooterText: "Commands &gt; Develop &gt; format" },
            ],
          },
          {
            text: "Run",
            collapsed: false,
            items: [
              { text: "inputs", link: "/reference/cli/inputs", docFooterText: "Commands &gt; Run &gt; inputs" },
              { text: "run", link: "/reference/cli/run", docFooterText: "Commands &gt; Run &gt; run" },
              { text: "validate", link: "/reference/cli/validate", docFooterText: "Commands &gt; Run &gt; validate" },
            ],
          },
          {
            text: "Setup",
            collapsed: false,
            items: [
              { text: "completions", link: "/reference/cli/completions", docFooterText: "Commands &gt; Setup &gt; completions" },
              { text: "config", link: "/reference/cli/config", docFooterText: "Commands &gt; Setup &gt; config" },
            ],
          },
          {
            text: "Experimental",
            collapsed: true,
            items: [
              { text: "dev doc", link: "/reference/cli/dev/doc", docFooterText: "Commands &gt; Experimental &gt; dev doc" },
              { text: "dev lock", link: "/reference/cli/dev/lock", docFooterText: "Commands &gt; Experimental &gt; dev lock" },
              { text: "dev module", link: "/reference/cli/dev/module", docFooterText: "Commands &gt; Experimental &gt; dev module" },
              { text: "dev server", link: "/reference/cli/dev/server", docFooterText: "Commands &gt; Experimental &gt; dev server" },
              { text: "dev server submit", link: "/reference/cli/dev/server-submit", docFooterText: "Commands &gt; Experimental &gt; dev server submit" },
              { text: "dev test", link: "/reference/cli/dev/test", docFooterText: "Commands &gt; Experimental &gt; dev test" },
            ],
          },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "Configuration File", link: "/reference/configuration", docFooterText: "Reference &gt; Configuration File" },
          { text: "Lint Rules", link: "/reference/lint-rules", docFooterText: "Reference &gt; Lint Rules" },
          {
            text: "Execution Backends",
            collapsed: true,
            items: [
              { text: "Backends Overview", link: "/reference/backends/overview", docFooterText: "Reference &gt; Execution Backends &gt; Overview" },
              { text: "Docker (Local)", link: "/reference/backends/docker", docFooterText: "Reference &gt; Execution Backends &gt; Docker" },
              { text: "Task Execution Service", link: "/reference/backends/tes", docFooterText: "Reference &gt; Execution Backends &gt; TES" },
              { text: "LSF + Apptainer", link: "/reference/backends/lsf", docFooterText: "Reference &gt; Execution Backends &gt; LSF + Apptainer" },
              { text: "Slurm + Apptainer", link: "/reference/backends/slurm", docFooterText: "Reference &gt; Execution Backends &gt; Slurm + Apptainer" },
            ],
          },
          {
            text: "Cloud Storage",
            collapsed: true,
            items: [
              { text: "Storage Overview", link: "/reference/storage/overview", docFooterText: "Reference &gt; Cloud Storage &gt; Overview" },
              { text: "Azure Blob Storage", link: "/reference/storage/azure", docFooterText: "Reference &gt; Cloud Storage &gt; Azure Blob Storage" },
              { text: "Amazon S3", link: "/reference/storage/s3", docFooterText: "Reference &gt; Cloud Storage &gt; Amazon S3" },
              { text: "Google Cloud Storage", link: "/reference/storage/gcs", docFooterText: "Reference &gt; Cloud Storage &gt; Google Cloud Storage" },
            ],
          },
          { text: "REST API", link: "/reference/rest-api", docFooterText: "Reference &gt; REST API" },
          { text: "Glossary", link: "/reference/glossary", docFooterText: "Reference &gt; Glossary" },
        ],
      },
      {
        text: "Integrations",
        items: [
          { text: "Visual Studio Code", link: "/integrations/vscode", docFooterText: "Integrations &gt; Visual Studio Code" },
          { text: "Neovim", link: "/integrations/neovim", docFooterText: "Integrations &gt; Neovim" },
          { text: "GitHub Action", link: "/integrations/github-action", docFooterText: "Integrations &gt; GitHub Action" },
          { text: "Python", link: "/integrations/python", docFooterText: "Integrations &gt; Python" },
        ],
      },
      {
        text: "About",
        items: [
          { text: "Philosophy", link: "/about/philosophy", docFooterText: "About &gt; Philosophy" },
          { text: "Project Status", link: "/about/project-status", docFooterText: "About &gt; Project Status" },
          { text: "Community and Support", link: "/about/community", docFooterText: "About &gt; Community and Support" },
        ],
      },
    ],
    editLink: {
      pattern: "https://github.com/stjude-rust-labs/sprocket.bio/edit/main/:path",
      text: "Edit this page on GitHub",
    },
    search: { provider: "local" },
    socialLinks: [
      { icon: "github", link: "https://github.com/stjude-rust-labs/sprocket" },
    ],
  },
  markdown: {
    theme: { light: 'github-light-default', dark: 'github-dark-default' },
    container: {
      infoLabel: 'Info',
      noteLabel: 'Note',
      tipLabel: 'Tip',
      warningLabel: 'Warning',
      dangerLabel: 'Danger',
      detailsLabel: 'Details',
      importantLabel: 'Important',
      cautionLabel: 'Caution',
    },
    shikiSetup: async (shiki) => {
      const response = await axios.get(grammarUrl);
      await shiki.loadLanguage(response.data);
    },
    config: (md) => {
      md.use(taskLists, { label: true });
    },
  },
  appearance: 'dark',
  lastUpdated: true,
  async buildEnd(siteConfig) {
    await writeRedirects(siteConfig.outDir);
  },
});
