#!/usr/bin/env node

import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");

function mergeSchemas(base, overlay) {
  const merged = { ...base, ...overlay };

  if (base.properties || overlay.properties) {
    merged.properties = {
      ...(base.properties ?? {}),
      ...(overlay.properties ?? {}),
    };
  }

  if (base.required || overlay.required) {
    merged.required = [...new Set([...(base.required ?? []), ...(overlay.required ?? [])])];
  }

  delete merged.$ref;
  delete merged.allOf;
  return merged;
}

function jsonPointer(schema, pointer) {
  if (!pointer.startsWith("#/")) {
    throw new Error(`unsupported non-local schema reference: ${pointer}`);
  }

  return pointer
    .slice(2)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((value, part) => value?.[part], schema);
}

export function resolveSchema(schema, node, references = new Set()) {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return node;
  }

  let resolved = { ...node };
  if (resolved.$ref) {
    const reference = resolved.$ref;
    if (references.has(reference)) {
      return { ...resolved, $recursive: reference };
    }

    const target = jsonPointer(schema, reference);
    if (!target) {
      throw new Error(`schema reference does not exist: ${reference}`);
    }

    const nextReferences = new Set(references);
    nextReferences.add(reference);
    resolved = mergeSchemas(
      resolveSchema(schema, target, nextReferences),
      resolved,
    );
  }

  if (resolved.allOf) {
    const { allOf, ...siblings } = resolved;
    resolved = allOf.reduce(
      (result, branch) =>
        mergeSchemas(result, resolveSchema(schema, branch, new Set(references))),
      siblings,
    );
  }

  return resolved;
}

function quoteValue(value) {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  return JSON.stringify(value);
}

function typeVariants(schema, node, references = new Set()) {
  const resolved = resolveSchema(schema, node, references);
  if (!resolved || resolved.$recursive) {
    return ["recursive value"];
  }

  if (Object.hasOwn(resolved, "const")) {
    return [quoteValue(resolved.const)];
  }

  if (Array.isArray(resolved.enum)) {
    return resolved.enum.map(quoteValue);
  }

  const union = resolved.anyOf ?? resolved.oneOf;
  if (union) {
    return union.flatMap((branch) => typeVariants(schema, branch, references));
  }

  const types = Array.isArray(resolved.type)
    ? resolved.type
    : resolved.type
      ? [resolved.type]
      : [];

  return types.flatMap((type) => {
    if (type === "array") {
      return [`array of ${renderType(schema, resolved.items ?? {})}`];
    }
    if (type === "object" && resolved.additionalProperties &&
        typeof resolved.additionalProperties === "object") {
      return [`map of ${renderType(schema, resolved.additionalProperties)}`];
    }
    if (type === "object") {
      return ["table"];
    }
    return [type];
  });
}

export function renderType(schema, node) {
  const variants = [...new Set(typeVariants(schema, node))];
  const nullable = variants.includes("null");
  const values = variants.filter((value) => value !== "null");
  let rendered;

  if (values.length === 0) {
    rendered = "value";
  } else if (values.length === 1) {
    rendered = values[0];
  } else {
    rendered = `one of ${values.join(" | ")}`;
  }

  return nullable ? `${rendered}, nullable` : rendered;
}

function isObjectSchema(schema, node) {
  const resolved = resolveSchema(schema, node);
  if (resolved.type === "object") {
    return true;
  }
  return objectVariants(schema, resolved).length > 0;
}

function isObjectArray(schema, node) {
  const resolved = resolveSchema(schema, node);
  return resolved.type === "array" && isObjectSchema(schema, resolved.items);
}

function variantName(schema, variant, index) {
  const resolved = resolveSchema(schema, variant);
  const discriminator = resolved.properties?.type;
  if (discriminator) {
    const type = resolveSchema(schema, discriminator);
    if (Object.hasOwn(type, "const")) {
      return String(type.const);
    }
  }
  return resolved.title ?? `variant-${index + 1}`;
}

function objectVariants(schema, node) {
  const resolved = resolveSchema(schema, node);
  const union = resolved.oneOf ?? resolved.anyOf;
  if (!union) {
    return [];
  }

  const variants = union.flatMap((branch, index) => {
    const candidate = resolveSchema(schema, branch);
    if (candidate.type === "object") {
      return [{
        name: variantName(schema, candidate, index),
        schema: candidate,
      }];
    }
    return objectVariants(schema, candidate);
  });

  if (variants.length === 1 && variants[0].name.startsWith("variant-")) {
    variants[0].name = "";
  }
  return variants;
}

function selectObjectVariant(schema, unionNode, variantNode) {
  const base = { ...resolveSchema(schema, unionNode) };
  delete base.oneOf;
  delete base.anyOf;
  return mergeSchemas(base, resolveSchema(schema, variantNode));
}

function tableId(path, variant) {
  return [path, variant]
    .filter(Boolean)
    .join("-")
    .replaceAll("<name>", "name")
    .replaceAll("[]", "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function fieldId(path, variant, name) {
  return `${tableId(path, variant)}-${name}`
    .replace(/[^A-Za-z0-9]+/g, "-")
    .toLowerCase();
}

export function collectConfigurationTables(schema) {
  const tables = [];

  function visit(path, source, options = {}, depth = 0) {
    if (depth > 30) {
      throw new Error(`schema nesting is too deep at ${path}`);
    }

    const references = new Set(options.references ?? []);
    if (source?.$ref) {
      references.add(source.$ref);
    }

    let node = resolveSchema(schema, source);
    if (options.array) {
      if (node.items?.$ref) {
        references.add(node.items.$ref);
      }
      node = resolveSchema(schema, node.items);
    }

    const variants = objectVariants(schema, node);
    if (variants.length > 0) {
      for (const variant of variants) {
        const variantLabel = [options.variant, variant.name]
          .filter(Boolean)
          .join(" / ");
        visit(path, selectObjectVariant(schema, node, variant.schema), {
          ...options,
          variant: variantLabel,
          references,
        }, depth + 1);
      }
      return;
    }

    const fields = [];
    const nested = [];
    for (const [name, property] of Object.entries(node.properties ?? {})) {
      const recursiveReference =
        property?.$ref && references.has(property.$ref);
      if (recursiveReference) {
        const { $ref, ...siblings } = property;
        fields.push({
          name,
          node: { ...siblings, $recursive: $ref },
          required: (node.required ?? []).includes(name),
        });
      } else if (isObjectArray(schema, property)) {
        nested.push({ name, node: property, array: true });
      } else if (isObjectSchema(schema, property)) {
        nested.push({ name, node: property, array: false });
      } else {
        fields.push({
          name,
          node: resolveSchema(schema, property),
          required: (node.required ?? []).includes(name),
        });
      }
    }

    const mapValue =
      node.type === "object" &&
      node.additionalProperties &&
      typeof node.additionalProperties === "object"
        ? node.additionalProperties
        : null;

    tables.push({
      path,
      variant: options.variant,
      array: Boolean(options.array),
      description: node.description ?? source.description ?? "",
      fields,
      mapValue,
    });

    if (mapValue) {
      const mapVariants = objectVariants(schema, mapValue);
      if (mapVariants.length > 0) {
        for (const variant of mapVariants) {
          visit(
            `${path}.<name>`,
            selectObjectVariant(schema, mapValue, variant.schema),
            { variant: variant.name, references },
            depth + 1,
          );
        }
      } else if (
        isObjectSchema(schema, mapValue) &&
        !(mapValue.$ref && references.has(mapValue.$ref))
      ) {
        visit(
          `${path}.<name>`,
          mapValue,
          { references },
          depth + 1,
        );
      }
    }

    for (const child of nested) {
      visit(
        `${path}.${child.name}${child.array ? "[]" : ""}`,
        child.node,
        { array: child.array, variant: options.variant, references },
        depth + 1,
      );
    }
  }

  for (const [name, node] of Object.entries(schema.properties ?? {})) {
    visit(name, node);
  }

  return tables;
}

function parseTomlDefaults(source) {
  const defaults = new Map();
  let table = "";
  const lines = source.replaceAll("\r\n", "\n").split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const tableMatch = line.match(/^\[\[?([^\]]+)\]\]?$/);
    if (tableMatch) {
      table = tableMatch[1];
      continue;
    }

    const assignment = line.match(/^([A-Za-z0-9_-]+)\s*=\s*(.*)$/);
    if (!assignment) {
      continue;
    }

    let value = assignment[2];
    let bracketDepth =
      (value.match(/\[/g) ?? []).length - (value.match(/\]/g) ?? []).length;
    while (bracketDepth > 0 && index + 1 < lines.length) {
      index += 1;
      const continuation = lines[index].trim();
      value += ` ${continuation}`;
      bracketDepth +=
        (continuation.match(/\[/g) ?? []).length -
        (continuation.match(/\]/g) ?? []).length;
    }
    value = value.replace(/,\s*\]$/, "]");
    defaults.set(table ? `${table}.${assignment[1]}` : assignment[1], value);
  }

  return defaults;
}

function cleanRustLinks(text) {
  return text
    .replace(/<(https?:\/\/[^>]+)>/g, "[$1]($1)")
    .replace(/<div\b[^>]*>/gi, "")
    .replace(/<\/div>/gi, "")
    .replace(/^\s*\[`[^`]+`\]:\s+\S+\s*$/gm, "")
    .replace(/\[`([^`]+)`\]\[[^\]]+\]/g, "`$1`")
    .replace(/\[`([^`]+)`\]\([^)]*(?:crate|docs\.rs)[^)]*\)/g, "`$1`")
    .replace(/\[`([^`]+)`\](?![\[(])/g, "`$1`");
}

function escapeAnglesOutsideCode(text) {
  return text
    .split(/(`[^`\n]*`)/g)
    .map((part, index) =>
      index % 2 === 0 ? part.replaceAll("<", "&lt;") : part,
    )
    .join("");
}

function escapeMustaches(text) {
  return text.replaceAll("{{", "&#123;&#123;").replaceAll("}}", "&#125;&#125;");
}

function cleanDescription(text) {
  const lines = cleanRustLinks(text ?? "")
    .replaceAll("\r\n", "\n")
    .split("\n");
  const output = [];
  let paragraph = [];
  let inFence = false;

  function flushParagraph() {
    if (paragraph.length > 0) {
      output.push(paragraph.join(" ").replace(/\s+/g, " ").trim());
      paragraph = [];
    }
  }

  for (const originalLine of lines) {
    const line = originalLine.trimEnd();
    if (line.trimStart().startsWith("```")) {
      flushParagraph();
      inFence = !inFence;
      output.push(line.trimStart());
    } else if (inFence) {
      output.push(line);
    } else if (!line.trim()) {
      flushParagraph();
      if (output.at(-1) !== "") {
        output.push("");
      }
    } else if (/^\s*(?:#{1,6}\s|[-*+]\s|\d+\.\s|>\s)/.test(line)) {
      flushParagraph();
      output.push(line.trimStart());
    } else {
      paragraph.push(line.trim());
    }
  }
  flushParagraph();

  return escapeMustaches(
    output
      .map((line) => (line.startsWith("```") ? line : escapeAnglesOutsideCode(line)))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

function constraintsFor(schema, node) {
  const constraints = [];
  const seen = new Set();

  function visit(candidate) {
    const resolved = resolveSchema(schema, candidate);
    for (const [keyword, label] of [
      ["minimum", "minimum"],
      ["exclusiveMinimum", "exclusive minimum"],
      ["maximum", "maximum"],
      ["exclusiveMaximum", "exclusive maximum"],
      ["minLength", "minimum length"],
      ["maxLength", "maximum length"],
      ["minItems", "minimum items"],
      ["maxItems", "maximum items"],
      ["pattern", "pattern"],
    ]) {
      if (Object.hasOwn(resolved, keyword)) {
        const value =
          keyword === "pattern"
            ? `\`${String(resolved[keyword]).replaceAll("`", "\\`")}\``
            : `\`${resolved[keyword]}\``;
        const item = `${label} ${value}`;
        if (!seen.has(item)) {
          seen.add(item);
          constraints.push(item);
        }
      }
    }
    if (resolved.format) {
      const item = `format \`${resolved.format}\``;
      if (!seen.has(item)) {
        seen.add(item);
        constraints.push(item);
      }
    }
    for (const branch of resolved.anyOf ?? resolved.oneOf ?? []) {
      visit(branch);
    }
  }

  visit(node);
  return constraints;
}

function defaultFor(schema, field, fullPath, defaults) {
  const resolved = resolveSchema(schema, field.node);
  const initialized = defaults.get(fullPath);
  const hasSchemaDefault = Object.hasOwn(resolved, "default");

  if (initialized !== undefined) {
    let parsedInitialized = initialized;
    try {
      parsedInitialized = JSON.parse(initialized);
    } catch {
      // Keep TOML values that are not also valid JSON in their rendered form.
    }
    const disagreement =
      hasSchemaDefault &&
      JSON.stringify(resolved.default) !== JSON.stringify(parsedInitialized);
    return {
      value: initialized,
      disagreement: disagreement
        ? {
            path: fullPath,
            schema: quoteValue(resolved.default),
            initialized,
          }
        : null,
    };
  }

  return {
    value: hasSchemaDefault ? quoteValue(resolved.default) : undefined,
    disagreement: null,
  };
}

const narrativeLinks = [
  [/^(?:run|server\.engine)\.task(?:\.|$)/, "Call caching", "/concepts/call-caching"],
  [/^(?:run|server\.engine)\.backends\.&lt;name>.*docker/, "Docker backend", "/reference/backends/docker"],
  [/^(?:run|server\.engine)\.backends\.&lt;name>.*tes/, "TES backend", "/reference/backends/tes"],
  [/^(?:run|server\.engine)\.backends\.&lt;name>.*lsf_apptainer/, "LSF backend", "/reference/backends/lsf"],
  [/^(?:run|server\.engine)\.backends\.&lt;name>.*slurm_apptainer/, "Slurm backend", "/reference/backends/slurm"],
  [/^(?:run|server\.engine)\.storage\.azure/, "Azure storage", "/reference/storage/azure"],
  [/^(?:run|server\.engine)\.storage\.s3/, "Amazon S3 storage", "/reference/storage/s3"],
  [/^(?:run|server\.engine)\.storage\.google/, "Google Cloud Storage", "/reference/storage/gcs"],
  [/^check(?:\.|$)/, "Check and lint command", "/reference/cli/check-lint"],
  [/^doc(?:\.|$)/, "Documentation command", "/reference/cli/dev/doc"],
  [/^module(?:\.|$)|^modules(?:\.|$)/, "Module commands", "/reference/cli/dev/module"],
  [/^server(?:\.|$)/, "Server command", "/reference/cli/dev/server"],
  [/^test(?:\.|$)/, "Test command", "/reference/cli/dev/test"],
  [/^run(?:\.|$)/, "Run command", "/reference/cli/run"],
];

function linksFor(table) {
  const key = `${table.path}${table.variant ? `.${table.variant}` : ""}`.replaceAll(
    "<",
    "&lt;",
  );
  const links = [];
  for (const [pattern, label, url] of narrativeLinks) {
    if (pattern.test(key) && !links.some((link) => link.url === url)) {
      links.push({ label, url });
    }
  }
  return links;
}

function tableHeading(table) {
  const brackets = table.array ? `[[${table.path.replace("[]", "")}]]` : `[${table.path}]`;
  const variant = table.variant ? ` — \`${table.variant}\`` : "";
  return `## \`${brackets}\`${variant} {#${tableId(table.path, table.variant)}}`;
}

function fieldDescription(field, table) {
  if (field.node.description) {
    return cleanDescription(field.node.description);
  }
  if (field.name === "type" && Object.hasOwn(field.node, "const")) {
    return `Selects the \`${field.node.const}\` variant for this table.`;
  }
  return `No description is provided for this key in the schema.`;
}

export function renderConfiguration(schema, defaultsSource, version) {
  const defaults = parseTomlDefaults(defaultsSource);
  const tables = collectConfigurationTables(schema);
  const defaultDisagreements = new Map();
  const lines = [
    "---",
    "title: Configuration reference",
    "description: Every option in the sprocket.toml configuration file.",
    "---",
    "",
    `<!-- Generated by scripts/generate-reference.mjs from Sprocket v${version} — do not edit by hand. -->`,
    "",
    "# Configuration reference",
    "",
    "`sprocket.toml` controls Sprocket commands and runtime behavior. `sprocket config init` prints a configuration file with the defaults, while `sprocket config schema` prints the JSON Schema used to build this page. For configuration discovery, load order, and incremental merging, see [Configuration](/concepts/configuration).",
    "",
    "Keys marked as required must be present when their containing table is configured. A default shown here comes from the schema or, when the schema omits it, from `sprocket config init`.",
    "",
  ];

  for (const table of tables) {
    lines.push(tableHeading(table), "");
    if (table.description) {
      lines.push(cleanDescription(table.description), "");
    }
    if (table.mapValue) {
      lines.push(
        `This table is a map. Replace \`<name>\` in the variant sections below with a unique configuration name.`,
        "",
      );
    }

    const links = linksFor(table);
    if (links.length > 0) {
      lines.push(
        `**See also:** ${links.map(({ label, url }) => `[${label}](${url})`).join("; ")}.`,
        "",
      );
    }

    if (table.fields.length === 0 && !table.mapValue) {
      lines.push("This table has no direct keys.", "");
    }

    for (const field of table.fields) {
      const fullPath = `${table.path.replaceAll("[]", "")}.${field.name}`;
      const selectedDefault = defaultFor(schema, field, fullPath, defaults);
      if (selectedDefault.disagreement) {
        defaultDisagreements.set(fullPath, selectedDefault.disagreement);
      }
      const constraints = constraintsFor(schema, field.node);
      lines.push(
        `### \`${field.name}\` {#${fieldId(table.path, table.variant, field.name)}}`,
        "",
        `- **Type:** ${renderType(schema, field.node)}`,
      );
      if (selectedDefault.value !== undefined) {
        lines.push(`- **Default:** \`${escapeMustaches(selectedDefault.value)}\``);
      }
      if (field.required) {
        lines.push("- **Required:** yes");
      }
      if (constraints.length > 0) {
        lines.push(`- **Constraints:** ${constraints.join("; ")}`);
      }
      lines.push("", fieldDescription(field, table), "");
    }
  }

  return {
    markdown: `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`,
    tableCount: tables.length,
    keyCount: tables.reduce((count, table) => count + table.fields.length, 0),
    tables,
    defaultDisagreements: [...defaultDisagreements.values()],
  };
}

function markdownTableText(text) {
  return escapeMustaches(cleanDescription(text))
    .replaceAll("|", "\\|")
    .replace(/\s+/g, " ")
    .trim();
}

function ruleAnchor(rule) {
  return String(rule.id).toLowerCase();
}

function renderSnippet(snippet) {
  const fence = `\`\`\`wdl\n${snippet.trimEnd()}\n\`\`\``;
  if (snippet.includes("{{") || snippet.includes("}}")) {
    return `::: v-pre\n\n${fence}\n\n:::`;
  }
  return fence;
}

function displayExampleName(name) {
  const names = {
    negative: "Problem",
    positive: "Accepted",
    revised: "Revision",
  };
  return names[name] ?? `${name[0].toUpperCase()}${name.slice(1)}`;
}

function renderDefinitions(definitions) {
  if (!definitions.trim()) {
    return "";
  }

  const lines = definitions.replaceAll("\r\n", "\n").trim().split("\n");
  if (/^#\s+Definitions\s*$/.test(lines[0])) {
    lines.shift();
    if (!lines[0]?.trim()) {
      lines.shift();
    }
  }
  let inFence = false;
  return lines
    .map((line) => {
      if (line.trimStart().startsWith("```")) {
        inFence = !inFence;
        return line;
      }
      if (inFence) {
        return line;
      }
      const heading = line.match(/^(#{1,5})(\s+.*)$/);
      return heading ? `${heading[1]}#${heading[2]}` : line;
    })
    .join("\n");
}

export function renderLintRules(rulesInput, tagsInput, definitions, version) {
  const rules = [...rulesInput].sort((left, right) =>
    left.id.localeCompare(right.id, "en"),
  );
  const tags = [...tagsInput].sort((left, right) =>
    left.name.localeCompare(right.name, "en"),
  );
  const ruleIds = new Set(rules.map((rule) => rule.id));
  const lines = [
    "---",
    "title: Lint and validation rules",
    "description: Complete reference for Sprocket lint and validation rules.",
    "---",
    "",
    `<!-- Generated by scripts/generate-reference.mjs from Sprocket v${version} — do not edit by hand. -->`,
    "",
    "# Lint and validation rules",
    "",
    "Run `sprocket explain <RULE>` for one rule or `sprocket explain --tag <TAG>` for every lint rule with a tag. Disable selected rules with configuration or lint directives; see [Exceptions](/reference/cli/check-lint#exceptions).",
    "",
    "Rules from `wdl-lint` are listed as **Lint** rules. Rules from `wdl-analysis` are listed as **Validation** rules. Validation rules do not expose lint tags.",
    "",
    "## Summary",
    "",
    "| Rule | Kind | Tags | Description |",
    "| --- | --- | --- | --- |",
  ];

  for (const rule of rules) {
    const kind = rule.source === "wdl-analysis" ? "Validation" : "Lint";
    const ruleTags = (rule.tags ?? []).length > 0 ? rule.tags.join(", ") : "—";
    lines.push(
      `| [\`${rule.id}\`](#${ruleAnchor(rule)}) | ${kind} | ${ruleTags} | ${markdownTableText(rule.description ?? "")} |`,
    );
  }

  lines.push("", "## Tags", "");
  for (const tag of tags) {
    const applicable = [...(tag.applicable_lints ?? tag.rules ?? [])].sort((a, b) =>
      a.localeCompare(b, "en"),
    );
    lines.push(
      `- **${tag.name}:** ${applicable.length > 0 ? applicable.map((id) => `[\`${id}\`](#${id.toLowerCase()})`).join(", ") : "No rules."}`,
    );
  }

  const renderedDefinitions = renderDefinitions(definitions);
  if (renderedDefinitions) {
    lines.push("", "## Definitions", "", renderedDefinitions);
  }

  for (const rule of rules) {
    const kind = rule.source === "wdl-analysis" ? "Validation" : "Lint";
    lines.push(
      "",
      `## ${rule.id} {#${ruleAnchor(rule)}}`,
      "",
      `- **Kind:** ${kind}`,
      `- **Tags:** ${(rule.tags ?? []).length > 0 ? rule.tags.join(", ") : "None"}`,
    );
    if ((rule.related ?? []).length > 0) {
      lines.push(
        `- **Related rules:** ${rule.related.map((id) => ruleIds.has(id) ? `[\`${id}\`](#${id.toLowerCase()})` : `\`${id}\``).join(", ")}`,
      );
    }
    lines.push("", cleanDescription(rule.description ?? ""));
    if (rule.explanation && rule.explanation !== rule.description) {
      lines.push("", cleanDescription(rule.explanation));
    }
    if (rule.url) {
      lines.push("", `[More information](${rule.url})`);
    }

    if ((rule.config ?? []).length > 0) {
      lines.push("", "### Configuration", "");
      for (const option of rule.config) {
        lines.push(`#### \`${option.name}\``, "");
        if (option.default !== undefined && option.default !== null) {
          lines.push(`- **Default:** \`${escapeMustaches(String(option.default))}\``, "");
        }
        lines.push(cleanDescription(option.description ?? ""), "");
      }
    }

    if ((rule.examples ?? []).length > 0) {
      lines.push("", "### Examples", "");
      rule.examples.forEach((example, exampleIndex) => {
        if (rule.examples.length > 1) {
          lines.push(`#### Example ${exampleIndex + 1}`, "");
        }
        for (const [name, value] of Object.entries(example)) {
          if (!value?.snippet) {
            continue;
          }
          lines.push(
            `**${value.label ? cleanDescription(value.label) : displayExampleName(name)}**`,
            "",
            renderSnippet(value.snippet),
            "",
          );
        }
      });
    }
  }

  return {
    markdown: `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`,
    ruleCount: rules.length,
    tagCount: tags.length,
  };
}

function command(binary, args, { optional = false } = {}) {
  const result = spawnSync(binary, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) {
    if (optional) {
      return "";
    }
    const reason =
      result.error.code === "ENOENT"
        ? `executable was not found: ${binary}`
        : result.error.message;
    throw new Error(`could not run ${binary}: ${reason}`);
  }
  if (result.status !== 0) {
    if (optional) {
      return "";
    }
    const detail = (result.stderr || result.stdout).trim();
    throw new Error(
      `command failed (${result.status}): ${binary} ${args.join(" ")}${detail ? `\n${detail}` : ""}`,
    );
  }
  return result.stdout;
}

function parseJson(output, description) {
  try {
    return JSON.parse(output);
  } catch (error) {
    throw new Error(`${description} did not return valid JSON: ${error.message}`);
  }
}

function arrayFrom(value, key, description) {
  const array = Array.isArray(value) ? value : value?.[key];
  if (!Array.isArray(array)) {
    throw new Error(`${description} returned an unexpected JSON shape`);
  }
  return array;
}

function loadRules(binary) {
  const listed = arrayFrom(
    parseJson(
      command(binary, ["explain", "--list-all-rules", "--format", "json"]),
      "rule listing",
    ),
    "rules",
    "rule listing",
  );

  return listed.map((listedRule) => {
    const id =
      typeof listedRule === "string"
        ? listedRule
        : listedRule.id ?? listedRule.name;
    if (!id) {
      throw new Error("rule listing contains a rule without an id");
    }

    const hasDetails =
      typeof listedRule === "object" &&
      typeof listedRule.description === "string" &&
      typeof listedRule.explanation === "string" &&
      Array.isArray(listedRule.examples);
    if (hasDetails) {
      return listedRule;
    }

    const detail = parseJson(
      command(binary, ["explain", id, "--format", "json"]),
      `explanation for ${id}`,
    );
    return Array.isArray(detail) ? detail[0] : detail.rule ?? detail;
  });
}

function readSprocketVersion() {
  const configPath = join(repositoryRoot, ".vitepress", "config.mts");
  const config = readFileSync(configPath, "utf8");
  const match = config.match(
    /\bconst\s+sprocketVersion\s*=\s*["']([^"']+)["']\s*;/,
  );
  if (!match) {
    throw new Error(`could not find sprocketVersion in ${configPath}`);
  }
  return match[1];
}

function checkBinaryVersion(binary, expected) {
  const output = command(binary, ["--version"]).trim();
  const match = output.match(/\bsprocket\s+v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/i);
  if (!match) {
    throw new Error(
      `could not parse the Sprocket version from ${JSON.stringify(output)}`,
    );
  }
  if (match[1] !== expected) {
    throw new Error(
      `Sprocket version mismatch: the site expects ${expected}, but ${binary} reports ${match[1]}`,
    );
  }
}

function writeAtomically(path, contents) {
  const temporary = join(dirname(path), `.${basename(path)}.${process.pid}.tmp`);
  try {
    writeFileSync(temporary, contents, "utf8");
    renameSync(temporary, path);
  } finally {
    rmSync(temporary, { force: true });
  }
}

function validateMarkdown(markdown, name) {
  if (markdown.includes("{{") || markdown.includes("}}")) {
    throw new Error(`${name} contains an unescaped Vue mustache expression`);
  }
  if (!markdown.endsWith("\n")) {
    throw new Error(`${name} does not end with a newline`);
  }
}

export function generateReference(binary) {
  const expectedVersion = readSprocketVersion();
  checkBinaryVersion(binary, expectedVersion);

  const schema = parseJson(
    command(binary, ["config", "schema"]),
    "configuration schema",
  );
  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") {
    throw new Error(
      `expected a JSON Schema 2020-12 document, received ${schema.$schema ?? "no $schema value"}`,
    );
  }

  const defaults = command(binary, ["config", "init"]);
  const rules = loadRules(binary);
  const tags = arrayFrom(
    parseJson(
      command(binary, ["explain", "--list-all-tags", "--format", "json"]),
      "tag listing",
    ),
    "tags",
    "tag listing",
  );
  const definitions = command(binary, ["explain", "--definitions"], {
    optional: true,
  });

  const configuration = renderConfiguration(schema, defaults, expectedVersion);
  const lintRules = renderLintRules(rules, tags, definitions, expectedVersion);
  validateMarkdown(configuration.markdown, "configuration reference");
  validateMarkdown(lintRules.markdown, "lint rule reference");

  if (configuration.defaultDisagreements.length > 0) {
    console.error(
      "Warning: schema defaults disagree with `sprocket config init`; using config init values:",
    );
    for (const disagreement of configuration.defaultDisagreements) {
      console.error(
        `  ${disagreement.path}: schema ${disagreement.schema}; config init ${disagreement.initialized}`,
      );
    }
  }

  const referenceDirectory = join(repositoryRoot, "reference");
  mkdirSync(referenceDirectory, { recursive: true });
  writeAtomically(
    join(referenceDirectory, "configuration.md"),
    configuration.markdown,
  );
  writeAtomically(join(referenceDirectory, "lint-rules.md"), lintRules.markdown);

  return {
    version: expectedVersion,
    tables: configuration.tableCount,
    keys: configuration.keyCount,
    rules: lintRules.ruleCount,
    tags: lintRules.tagCount,
  };
}

async function main() {
  const binary = process.argv[2] ?? process.env.SPROCKET_BIN ?? "sprocket";
  const result = generateReference(binary);
  console.log(
    `Generated reference pages for Sprocket v${result.version}: ${result.tables} tables, ${result.keys} keys, ${result.rules} rules, ${result.tags} tags.`,
  );
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  try {
    await main();
  } catch (error) {
    console.error(`Reference generation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
