import { defineConfig } from "vitepress";
import axios from 'axios';

const grammarUrl = "https://raw.githubusercontent.com/stjude-rust-labs/sprocket-vscode/refs/heads/main/syntaxes/wdl.tmGrammar.json";

export default defineConfig({
  title: "Sprocket",
  description:
    "A bioinformatics workflow engine built on top of the Workflow Description Language (WDL)",
  themeConfig: {
    logo: {
      light: "/sprocket-logo.png",
      dark: "/sprocket-logo-dark.png",
    },
    siteTitle: "",
    nav: [
      { text: "Documentation", link: "/overview" },
      {
        text: "v0.17.0",
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
        text: "Getting Started",
        items: [
          { text: "Overview", link: "/overview", docFooterText: "Getting Started &gt; Overview" },
          { text: "Installation", link: "/installation", docFooterText: "Getting Started &gt; Installation" },
          { text: "Guided Tour", link: "/guided-tour", docFooterText: "Getting Started &gt; Guided Tour" },
        ],
      },
      {
        text: "Configuration",
        items: [
          { text: "Overview", link: "/configuration/overview", docFooterText: "Configuration &gt; Configuration" },
          {
            text: "Execution Backends",
            items: [
              { text: "Overview", link: "/configuration/backends/overview", docFooterText: "Configuration &gt; Backends &gt; Overview" },
              { text: "Docker", link: "/configuration/backends/docker", docFooterText: "Configuration &gt; Backends &gt; Docker" },
              { text: "Task Execution Service (TES)", link: "/configuration/backends/tes", docFooterText: "Configuration &gt; Backends &gt; TES" },
              { text: "High Performance Computing (HPC)", link: "/configuration/backends/hpc", docFooterText: "Configuration &gt; Backends &gt; HPC" },
              { text: "Generic", link: "/configuration/backends/generic", docFooterText: "Configuration &gt; Backends &gt; Generic" },
            ],
          },
          {
            text: "Cloud Storage",
            items: [
              { text: "Overview", link: "/configuration/storage/overview", docFooterText: "Configuration &gt; Cloud Storage &gt; Overview" },
              { text: "Azure Blob Storage", link: "/configuration/storage/azure", docFooterText: "Configuration &gt; Cloud Storage &gt; Azure" },
              { text: "AWS S3", link: "/configuration/storage/s3", docFooterText: "Configuration &gt; Cloud Storage &gt; S3" },
              { text: "Google Cloud Storage", link: "/configuration/storage/gcs", docFooterText: "Configuration &gt; Cloud Storage &gt; GCS" },
            ],
          },
        ],
      },
      {
        text: "Commands",
        items: [
          { text: "analyzer", link: "/subcommands/analyzer", docFooterText: "Commands &gt; analyzer" },
          { text: "check/lint", link: "/subcommands/check-lint", docFooterText: "Commands &gt; check/lint" },
          { text: "config", link: "/subcommands/config", docFooterText: "Commands &gt; config" },
          { text: "format", link: "/subcommands/format", docFooterText: "Commands &gt; format" },
          { text: "inputs", link: "/subcommands/inputs", docFooterText: "Commands &gt; inputs" },
          { text: "run", link: "/subcommands/run", docFooterText: "Commands &gt; run" },
          { text: "validate", link: "/subcommands/validate", docFooterText: "Commands &gt; validate" },
        ],
      },
      {
        text: "Experimental Commands", collapsed: true, items: [
          { text: "doc", link: "/subcommands/doc",  docFooterText: "Experimental Commands &gt; doc" },
          { text: "lock", link: "/subcommands/lock", docFooterText: "Experimental Commands &gt; lock" },
        ]
      },
      {
        text: "Visual Studio Code Extension",
        items: [{ text: "Getting Started", link: "/vscode/getting-started", docFooterText: "Extension &gt; Getting Started" }],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/stjude-rust-labs/sprocket" },
    ],
  },
  markdown: {
    theme: 'github-dark',
    shikiSetup: async (shiki) => {
      const response = await axios.get(grammarUrl);
      await shiki.loadLanguage(response.data);
    }
  },
  appearance: 'dark'
});
