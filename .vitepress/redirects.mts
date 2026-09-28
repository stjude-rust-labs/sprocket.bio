// Every URL the docs used to publish, and where it goes now. `config.mts`
// writes a stub at each `from` during `buildEnd`, and `scripts/check-redirects.mjs`
// checks the result against the built site.
//
// Paths are extensionless and start with a slash, matching the site's clean URLs.
// `anchors` maps an old heading id to its destination; a heading that kept both
// its id and its page is covered by `same()`. Anything listed explicitly moved
// to a different page or a different id.

export interface Redirect {
  /** The old URL, extensionless and rooted, e.g. `/subcommands/run`. */
  from: string;
  /** The page that replaces it. */
  to: string;
  /**
   * Old heading id (without `#`) to its destination path, optionally with its
   * own `#id`. Ids that are absent keep their hash on `to`.
   */
  anchors?: Record<string, string>;
}

/** Maps each id onto the same id on `to`. */
function same(to: string, ids: string[]): Record<string, string> {
  return Object.fromEntries(ids.map((id) => [id, `${to}#${id}`]));
}

export const redirects: Redirect[] = [
  {
    from: "/overview",
    to: "/getting-started/introduction",
    anchors: {
      "project-goals": "/about/philosophy#project-goals",
      "high-performance-workflow-execution-engine": "/about/philosophy#high-performance-workflow-execution-engine",
      "modern-development-tools": "/about/philosophy#modern-development-tools",
      "community-focused-codebase": "/about/philosophy#community-focused-codebase",
      "open-tailored-standard": "/about/philosophy#open-tailored-standard",
      "simple-and-accessible-user-experience": "/about/philosophy#simple-and-accessible-user-experience",
      "goal-adjacent": "/about/philosophy#goal-adjacent",
      "non-goals": "/about/philosophy#non-goals",
      naming: "/about/philosophy#naming",
    },
  },
  {
    from: "/project-status",
    to: "/about/project-status",
    anchors: {
      ...same("/about/project-status", ["project-status", "stability-across-the-project", "release-cadence", "upgrading-between-versions"]),
      "getting-help": "/about/community#community-and-support",
    },
  },
  {
    from: "/installation",
    to: "/getting-started/installation",
    anchors: {
      ...same("/getting-started/installation", ["installation", "package-managers", "homebrew", "direct-download", "docker-images", "build-from-source", "crates-io", "github", "nix-flake"]),
      "shell-completions": "/reference/cli/completions#sprocket-completions",
      "enabling-completions": "/reference/cli/completions#enabling-completions",
    },
  },
  {
    from: "/quickstart-checklist",
    to: "/getting-started/checklist",
    anchors: {
      ...same("/getting-started/checklist", ["checklist", "development-environment", "code-quality", "running-workflows", "community"]),
    },
  },
  {
    from: "/guided-tour",
    to: "/getting-started/guided-tour",
    anchors: {
      ...same("/getting-started/guided-tour", ["guided-tour", "ensuring-high-quality-code", "exploring-lint-and-validation-rules", "linting-and-validation", "continuous-integration", "code-editor-integration", "generating-input-templates", "running-tasks-and-workflows", "conclusion"]),
    },
  },
  {
    from: "/configuration/overview",
    to: "/concepts/configuration",
    anchors: {
      ...same("/concepts/configuration", ["configuration", "options", "load-order", "system-wide-configuration-locations", "resolving-effective-configuration", "incremental-application", "skipping-configuration-search", "global-options", "ignoring-wdl-files-and-directories", "overriding-task-cpu-and-memory-requirements", "check-lint-configuration", "evaluation-cache-capacities", "sprocket-dev-doc-configuration", "module-configuration"]),
      "task-retries": "/reference/cli/run#retries",
    },
  },
  {
    from: "/configuration/cache",
    to: "/concepts/call-caching",
    anchors: {
      ...same("/concepts/call-caching", ["call-cache", "enabling-the-call-cache", "call-cache-directory", "the-cacheable-hint", "disabling-the-call-cache-for-a-run", "content-digests", "call-cache-lookup", "call-cache-invalidation", "cache-exclusion-options", "logged-messages"]),
    },
  },
  {
    from: "/configuration/backends/overview",
    to: "/reference/backends/overview",
    anchors: {
      ...same("/reference/backends/overview", ["execution-backends", "backend-configuration"]),
      "container-protocol-support": "/concepts/containers#container-protocol-support",
      "protocol-details": "/concepts/containers#protocol-details",
    },
  },
  {
    from: "/configuration/backends/docker",
    to: "/reference/backends/docker",
    anchors: {
      ...same("/reference/backends/docker", ["docker-execution-backend", "configuration", "resource-mapping", "local-mode", "swarm-mode", "gpu-support"]),
    },
  },
  {
    from: "/configuration/backends/lsf",
    to: "/reference/backends/lsf",
    anchors: {
      ...same("/reference/backends/lsf", ["lsf-apptainer-backend", "conditional-bsub-arguments", "example", "known-issues"]),
    },
  },
  {
    from: "/configuration/backends/slurm",
    to: "/reference/backends/slurm",
    anchors: {
      ...same("/reference/backends/slurm", ["slurm-apptainer-backend", "conditional-sbatch-arguments", "example", "known-issues"]),
    },
  },
  {
    from: "/configuration/backends/tes",
    to: "/reference/backends/tes",
    anchors: {
      ...same("/reference/backends/tes", ["task-execution-service-tes-backend", "authentication", "task-inputs", "task-outputs", "configuration", "gpu-support"]),
    },
  },
  {
    from: "/configuration/storage/overview",
    to: "/reference/storage/overview",
    anchors: {
      ...same("/reference/storage/overview", ["cloud-storage", "cloud-storage-urls", "azure-blob-storage-urls", "google-cloud-storage-urls"]),
      "amazon-aws-s3-urls": "/reference/storage/overview#amazon-s3-urls",
    },
  },
  {
    from: "/configuration/storage/azure",
    to: "/reference/storage/azure",
    anchors: {
      ...same("/reference/storage/azure", ["azure-blob-storage", "supported-azure-blob-storage-urls", "authentication", "environment-variables-recommended", "command-line-options", "configuration"]),
    },
  },
  {
    from: "/configuration/storage/gcs",
    to: "/reference/storage/gcs",
    anchors: {
      ...same("/reference/storage/gcs", ["google-cloud-storage", "supported-google-cloud-storage-urls", "authentication", "environment-variables-recommended", "command-line-options", "configuration-file"]),
    },
  },
  {
    from: "/configuration/storage/s3",
    to: "/reference/storage/s3",
    anchors: {
      ...same("/reference/storage/s3", ["authentication", "environment-variables-recommended", "command-line-options", "configuration-file", "default-region"]),
      "aws-s3": "/reference/storage/s3#amazon-s3",
      "supported-aws-s3-urls": "/reference/storage/s3#supported-amazon-s3-urls",
    },
  },
  {
    from: "/subcommands/analyzer",
    to: "/reference/cli/analyzer",
    anchors: {
      ...same("/reference/cli/analyzer", ["sprocket-analyzer", "configuration", "code-lenses", "transports"]),
    },
  },
  {
    from: "/subcommands/check-lint",
    to: "/reference/cli/check-lint",
    anchors: {
      ...same("/reference/cli/check-lint", ["sprocket-check-and-sprocket-lint", "exceptions", "source-comments", "sprocket-toml", "cli-arguments", "baselines", "generating-a-baseline", "stale-entries", "editor-integration", "filtering-lint-rules", "rule-configuration"]),
    },
  },
  {
    from: "/subcommands/config",
    to: "/reference/cli/config",
    anchors: {
      ...same("/reference/cli/config", ["sprocket-config"]),
    },
  },
  {
    from: "/subcommands/format",
    to: "/reference/cli/format",
    anchors: {
      ...same("/reference/cli/format", ["sprocket-format", "line-fitting", "preserving-source-style", "input-formatting", "trailing-commas"]),
    },
  },
  {
    from: "/subcommands/inputs",
    to: "/reference/cli/inputs",
    anchors: {
      ...same("/reference/cli/inputs", ["sprocket-inputs", "options"]),
    },
  },
  {
    from: "/subcommands/run",
    to: "/reference/cli/run",
    anchors: {
      ...same("/reference/cli/run", ["sprocket-run", "execution-backends", "targets", "retries", "output-directory", "interrupting-a-run"]),
      inputs: "/concepts/inputs#inputs",
      "array-inputs": "/concepts/inputs#array-inputs",
      "an-example": "/getting-started/guided-tour#running-tasks-and-workflows",
    },
  },
  {
    from: "/subcommands/validate",
    to: "/reference/cli/validate",
    anchors: {
      ...same("/reference/cli/validate", ["sprocket-validate"]),
    },
  },
  {
    from: "/subcommands/doc",
    to: "/reference/cli/dev/doc",
    anchors: {
      ...same("/reference/cli/dev/doc", ["sprocket-dev-doc", "module-workspaces", "structs", "meta-sections", "example", "enums", "example-1", "documentation-comments", "preamble-comments", "meta-entries", "description", "help", "category", "external-help", "warning", "parameter-meta-entries", "inputs", "outputs", "configuration", "index-page", "external-links", "search-metadata", "theming", "custom-logos", "light-dark-mode", "custom-html", "custom-themes", "experimental-features", "documentation-comment-support"]),
    },
  },
  {
    from: "/subcommands/lock",
    to: "/reference/cli/dev/lock",
    anchors: {
      ...same("/reference/cli/dev/lock", ["sprocket-dev-lock", "overview"]),
    },
  },
  {
    from: "/subcommands/module",
    to: "/reference/cli/dev/module",
    anchors: {
      ...same("/reference/cli/dev/module", ["sprocket-dev-module", "commands", "create-a-module", "add-and-lock-dependencies", "verify-and-trust-modules", "configuration"]),
    },
  },
  {
    from: "/subcommands/server",
    to: "/reference/cli/dev/server",
    anchors: {
      ...same("/reference/cli/dev/server", ["sprocket-dev-server", "overview", "starting-the-server", "command-line-options", "configuration", "configuration-options", "managing-runs", "status", "inspect", "cancel", "retry", "output-directory", "security-considerations"]),
      "rest-api": "/reference/rest-api#rest-api",
      server: "/reference/rest-api#server",
      runs: "/reference/rest-api#runs",
      sessions: "/reference/rest-api#sessions",
      tasks: "/reference/rest-api#tasks",
      "example-usage": "/reference/rest-api#example-usage",
      "starting-the-server-1": "/reference/rest-api#starting-the-server",
      "submitting-a-workflow": "/reference/rest-api#submitting-a-workflow",
      "checking-run-status": "/reference/rest-api#checking-run-status",
    },
  },
  {
    from: "/subcommands/submit",
    to: "/reference/cli/dev/server-submit",
    anchors: {
      ...same("/reference/cli/dev/server-submit", ["sprocket-dev-server-submit", "usage", "example", "command-line-options", "configuration"]),
    },
  },
  {
    from: "/subcommands/test",
    to: "/reference/cli/dev/test",
    anchors: {
      ...same("/reference/cli/dev/test", ["sprocket-dev-test", "how-to-write-unit-tests", "where-test-definitions-are-located", "what-test-yaml-looks-like", "assertions", "output-assertions", "how-to-use-test-fixtures", "specifying-groups-of-inputs", "tagging-tests", "running-unit-tests", "filtering-which-tests-run", "generating-a-test-schema"]),
    },
  },
  {
    from: "/vscode/getting-started",
    to: "/integrations/vscode",
    anchors: {
      "getting-started": "/integrations/vscode",
      ...same("/integrations/vscode", ["installation", "automatically-installing-sprocket", "manually-installing-sprocket", "known-issues"]),
    },
  },
  {
    from: "/python-bindings",
    to: "/integrations/python",
    anchors: {
      ...same("/integrations/python", ["python-bindings", "installation", "documentation"]),
    },
  },
];

export default redirects;
