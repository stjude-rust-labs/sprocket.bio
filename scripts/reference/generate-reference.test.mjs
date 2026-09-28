import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  collectConfigurationTables,
  renderConfiguration,
  renderType,
  resolveSchema,
} from "../generate-reference.mjs";

const schema = JSON.parse(
  await readFile(new URL("./schema.fixture.json", import.meta.url), "utf8"),
);

test("resolves local references and preserves sibling fields", () => {
  const resolved = resolveSchema(schema, {
    description: "A configured example.",
    $ref: "#/$defs/Example",
  });

  assert.equal(resolved.type, "object");
  assert.deepEqual(Object.keys(resolved.properties), ["name", "mode", "weights"]);
  assert.equal(resolved.description, "A configured example.");
});

test("renders an anyOf null branch as nullable", () => {
  assert.equal(
    renderType(schema, { $ref: "#/$defs/NullableString" }),
    "string, nullable",
  );
});

test("renders enum values", () => {
  assert.equal(
    renderType(schema, { $ref: "#/$defs/Mode" }),
    'one of "fast" | "safe"',
  );
});

test("renders additionalProperties as a map", () => {
  assert.equal(
    renderType(schema, { $ref: "#/$defs/Weights" }),
    "map of integer",
  );
});

test("stops safely at a recursive reference", () => {
  const recursiveSchema = {
    ...schema,
    properties: {
      tree: {
        $ref: "#/$defs/Recursive",
      },
    },
  };
  const tables = collectConfigurationTables(recursiveSchema);

  assert.equal(tables.length, 1);
  assert.deepEqual(
    tables[0].fields.map((field) => field.name),
    ["value", "child"],
  );
  assert.equal(renderType(recursiveSchema, tables[0].fields[1].node), "recursive value");
});

test("prefers config init defaults and reports schema disagreements", () => {
  const defaultSchema = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: {
      check: {
        type: "object",
        properties: {
          enabled: {
            type: "boolean",
            default: false,
            description: "Whether the check is enabled.",
          },
        },
      },
    },
  };
  const rendered = renderConfiguration(
    defaultSchema,
    "[check]\nenabled = true\n",
    "0.0.0",
  );

  assert.match(rendered.markdown, /- \*\*Default:\*\* `true`/);
  assert.deepEqual(rendered.defaultDisagreements, [
    {
      path: "check.enabled",
      schema: "false",
      initialized: "true",
    },
  ]);
});
