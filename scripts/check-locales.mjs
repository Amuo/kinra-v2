import ts from "typescript";
import { readFileSync, readdirSync } from "node:fs";
import { featureSchemas } from "../src/lib/feature-types.ts";
const dictionary = JSON.parse(
  readFileSync(new URL("../src/data/translations.json", import.meta.url), "utf8"),
);
const missing = new Set();
const requireMessage = (source, file) => {
  if (/[A-Za-z]/.test(source) && (!dictionary[source]?.bs || !dictionary[source]?.de))
    missing.add(`${file}: ${source}`);
};
for (const dir of ["src/routes", "src/components/strata", "src/components/ui", "src/lib"]) {
  for (const file of readdirSync(new URL(`../${dir}`, import.meta.url)).filter((f) =>
    /\.tsx?$/.test(f),
  )) {
    const pathname = `${dir}/${file}`;
    const source = ts.createSourceFile(
      pathname,
      readFileSync(new URL(`../${pathname}`, import.meta.url), "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    function visit(node) {
      if (
        ts.isCallExpression(node) &&
        ["tr", "t"].includes(node.expression.getText(source)) &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      )
        requireMessage(node.arguments[0].text, pathname);
      if (
        ts.isJsxAttribute(node) &&
        node.name.getText(source) === "source" &&
        node.initializer &&
        ts.isStringLiteral(node.initializer)
      )
        requireMessage(node.initializer.text, pathname);
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
function schemaMessages(schema) {
  const d = schema._def;
  if (d.innerType) schemaMessages(d.innerType);
  if (d.schema) schemaMessages(d.schema);
  if (d.typeName === "ZodObject")
    for (const [key, value] of Object.entries(d.shape())) {
      requireMessage(
        key
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        "schema field",
      );
      schemaMessages(value);
    }
  if (d.typeName === "ZodArray") schemaMessages(d.type);
}
Object.values(featureSchemas).forEach(schemaMessages);
if (missing.size) {
  console.error([...missing].join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `Complete Bosnian/German coverage for explicit render messages and schema fields (${Object.keys(dictionary).length} catalogue entries).`,
  );
