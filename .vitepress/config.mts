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
        text: "v0.16.0",
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
          { text: "Overview", link: "/overview" },
          { text: "Installation", link: "/installation" },
          { text: "Guided Tour", link: "/guided-tour" },
        ],
      },
      {
        text: "User Guides",
        items: [
          { text: "Configuration", link: "/user-guides/configuration" },
        ],
      },
      {
        text: "Subcommands",
        items: [
          { text: "analyzer", link: "/subcommands/analyzer" },
          { text: "check/lint", link: "/subcommands/check-lint" },
          { text: "config", link: "/subcommands/config" },
          { text: "doc", link: "/subcommands/doc" },
          { text: "format", link: "/subcommands/format" },
          { text: "lock", link: "/subcommands/lock" },
        ],
      },
      {
        text: "Visual Studio Code Extension",
        items: [{ text: "Getting Started", link: "/vscode/getting-started" }],
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
