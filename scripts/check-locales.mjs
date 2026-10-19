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
function requireExpression(node, file) {
  if (ts.isStringLiteral(node)) requireMessage(node.text, file);
  else if (ts.isConditionalExpression(node)) {
    requireExpression(node.whenTrue, file);
    requireExpression(node.whenFalse, file);
  } else if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node))
    requireExpression(node.expression, file);
}
function requireConfig(node, file, allStrings = false) {
  if (ts.isStringLiteral(node) && allStrings) requireMessage(node.text, file);
  else if (ts.isPropertyAssignment(node)) {
    const key = node.name.getText().replaceAll('"', "");
    requireConfig(node.initializer, file, allStrings || key === "title" || key === "body");
  } else if (ts.isArrayLiteralExpression(node))
    node.elements.forEach((child) => requireConfig(child, file, allStrings));
  else if (ts.isObjectLiteralExpression(node))
    node.properties.forEach((child) => requireConfig(child, file, allStrings));
  else if (ts.isAsExpression(node)) requireConfig(node.expression, file, allStrings);
}
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
        node.arguments[0]
      )
        requireExpression(node.arguments[0], pathname);
      if (
        ts.isVariableDeclaration(node) &&
        node.initializer &&
        ((pathname === "src/lib/onboarding.ts" &&
          ["startingActions", "genderLabels", "experienceLabels"].includes(
            node.name.getText(source),
          )) ||
          (pathname === "src/components/strata/onboarding.tsx" &&
            ["roles", "steps", "goalOptions", "title"].includes(node.name.getText(source))))
      ) {
        if (node.name.getText(source) === "title") requireExpression(node.initializer, pathname);
        else
          requireConfig(
            node.initializer,
            pathname,
            ["steps", "goalOptions", "genderLabels", "experienceLabels"].includes(
              node.name.getText(source),
            ),
          );
      }
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
