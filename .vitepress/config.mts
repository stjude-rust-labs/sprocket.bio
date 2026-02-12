import { defineConfig } from "vitepress";
import axios from 'axios';

const grammarUrl = "https://raw.githubusercontent.com/stjude-rust-labs/sprocket-vscode/refs/heads/main/syntaxes/wdl.tmGrammar.json";

export default defineConfig({
  title: "Sprocket | St. Jude Rust Labs",
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
        text: "v0.21.0",
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
        text: "Concepts",
        items: [
          { text: "Provenance Tracking", link: "/concepts/provenance", docFooterText: "Concepts &gt; Provenance Tracking" },
        ],
      },
      {
        text: "Configuration",
        items: [
          { text: "Overview", link: "/configuration/overview", docFooterText: "Configuration &gt; Overview" },
          {
            text: "Execution Backends",
            collapsed: true,
            items: [
              { text: "Overview", link: "/configuration/backends/overview", docFooterText: "Configuration &gt; Backends &gt; Overview" },
              { text: "Docker (Local)", link: "/configuration/backends/docker", docFooterText: "Configuration &gt; Backends &gt; Docker" },
              { text: "Task Execution Service", link: "/configuration/backends/tes", docFooterText: "Configuration &gt; Backends &gt; TES" },
              { text: "LSF + Apptainer", link: "/configuration/backends/lsf", docFooterText: "Configuration &gt; Backends &gt; LSF + Apptainer" },
              { text: "Slurm + Apptainer", link: "/configuration/backends/slurm", docFooterText: "Configuration &gt; Backends &gt; Slurm + Apptainer" },
              { text: "Generic", link: "/configuration/backends/generic", docFooterText: "Configuration &gt; Backends &gt; Generic" },
            ],
          },
          {
            text: "Cloud Storage",
            collapsed: true,
            items: [
              { text: "Overview", link: "/configuration/storage/overview", docFooterText: "Configuration &gt; Cloud Storage &gt; Overview" },
              { text: "Azure Blob Storage", link: "/configuration/storage/azure", docFooterText: "Configuration &gt; Cloud Storage &gt; Azure" },
              { text: "Amazon AWS S3", link: "/configuration/storage/s3", docFooterText: "Configuration &gt; Cloud Storage &gt; S3" },
              { text: "Google Cloud Storage", link: "/configuration/storage/gcs", docFooterText: "Configuration &gt; Cloud Storage &gt; GCS" },
            ],
          },
          { text: "Call Cache", link: "/configuration/cache", docFooterText: "Configuration &gt; Call Cache" },
        ],
      },
      {
        text: "End-to-end Guides",
        items: [
          { text: "LSF + Apptainer", link: "/guides/lsf", docFooterText: "End-to-end Guides &gt; LSF + Apptainer" },
          { text: "Slurm + Apptainer", link: "/guides/slurm", docFooterText: "End-to-end Guides &gt; Slurm + Apptainer" },
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
          { text: "doc", link: "/subcommands/doc", docFooterText: "Experimental Commands &gt; doc" },
          { text: "lock", link: "/subcommands/lock", docFooterText: "Experimental Commands &gt; lock" },
          { text: "server", link: "/subcommands/server", docFooterText: "Experimental Commands &gt; server" },
          { text: "test", link: "/subcommands/test", docFooterText: "Experimental Commands &gt; test" },
        ]
      },
      {
        text: "Editor Integrations",
        items: [{ text: "Visual Studio Code", link: "/vscode/getting-started", docFooterText: "Editor Integrations &gt; Visual Studio Code" }],
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
