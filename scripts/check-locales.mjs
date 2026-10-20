import ts from "typescript";
import { readFileSync, readdirSync } from "node:fs";
import { featureSchemas } from "../src/lib/feature-types.ts";
const dictionary = JSON.parse(
  readFileSync(new URL("../src/data/translations.json", import.meta.url), "utf8"),
);
const missing = new Set();
for (const label of ["Reminders", "Motivation", "Memberships", "Community", "Marketplace"]) {
  if (!dictionary[label]?.bs || !dictionary[label]?.de)
    missing.add(`Notification category: ${label}`);
}
const configMessages = {
  "src/components/strata/session.tsx": ["rpeAnchors", "cardioEffortAnchors"],
  "src/lib/session-state.ts": ["DOW"],
  "src/routes/app.progress.tsx": ["DOW"],
  "src/components/strata/extra-programs.tsx": ["contextLabels", "frequencyLabels", "units"],
  "src/components/strata/feature-config.ts": ["featureNames", "featureHints"],
  "src/components/strata/directory.tsx": ["labels"],
  "src/lib/workspaces.ts": ["accountRoleLabels"],
  "src/components/strata/onboarding-more.tsx": ["activityLabels", "descriptions"],
  "src/components/strata/account-workspaces.tsx": ["descriptions"],
  "src/components/strata/availability-booking.tsx": ["weekdays"],
  "src/components/strata/starting-point.tsx": ["genderLabels", "experienceLabels"],
};
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
    requireConfig(
      node.initializer,
      file,
      allStrings || key === "title" || key === "body" || key === "description",
    );
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
        pathname === "src/components/strata/client-overview.tsx" &&
        ts.isJsxExpression(node) &&
        node.expression &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "weekday"
      )
        missing.add(`${pathname}: translate generated weekday before rendering`);
      if (
        pathname === "src/components/strata/cardio-fields.tsx" &&
        ts.isPropertyAssignment(node) &&
        node.name.getText(source) === "label"
      )
        requireExpression(node.initializer, pathname);
      if (pathname === "src/lib/cardio.ts" && ts.isReturnStatement(node) && node.expression)
        requireExpression(node.expression, pathname);
      // Direct/conditional JSX string expressions bypass Message even when a dictionary key exists.
      if (
        [
          "src/components/strata/client-overview.tsx",
          "src/components/strata/progress-weight.tsx",
          "src/routes/app.progress.tsx",
        ].includes(pathname) &&
        ts.isJsxExpression(node) &&
        node.expression &&
        !ts.isJsxAttribute(node.parent)
      ) {
        const inspectRendered = (expression) => {
          if (ts.isStringLiteral(expression) && /[A-Za-z].*\s+[A-Za-z]/.test(expression.text))
            missing.add(`${pathname}: untranslated rendered literal: ${expression.text}`);
          else if (ts.isConditionalExpression(expression)) {
            inspectRendered(expression.whenTrue);
            inspectRendered(expression.whenFalse);
          } else if (ts.isParenthesizedExpression(expression))
            inspectRendered(expression.expression);
          else if (
            ts.isBinaryExpression(expression) &&
            [
              ts.SyntaxKind.AmpersandAmpersandToken,
              ts.SyntaxKind.BarBarToken,
              ts.SyntaxKind.QuestionQuestionToken,
            ].includes(expression.operatorToken.kind)
          )
            inspectRendered(expression.right);
        };
        inspectRendered(node.expression);
      }
      if (
        pathname === "src/lib/progress.ts" &&
        ts.isFunctionDeclaration(node) &&
        node.name?.text === "progressMilestones"
      ) {
        const visitReturns = (child) => {
          if (ts.isReturnStatement(child) && child.expression)
            requireConfig(child.expression, pathname, true);
          else ts.forEachChild(child, visitReturns);
        };
        visitReturns(node);
      }
      if (
        pathname === "src/components/strata/feature-config.ts" &&
        ts.isVariableDeclaration(node) &&
        node.initializer &&
        node.name.getText(source) === "featureSections"
      )
        requireConfig(node.initializer, pathname);
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
          [
            "startingActions",
            "organizationStartingActions",
            "genderLabels",
            "experienceLabels",
          ].includes(node.name.getText(source))) ||
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
        ts.isVariableDeclaration(node) &&
        node.initializer &&
        configMessages[pathname]?.includes(node.name.getText(source))
      )
        requireConfig(node.initializer, pathname, true);
      if (
        [
          "src/components/strata/exercise-guide.tsx",
          "src/components/strata/exercise-library.tsx",
        ].includes(pathname) &&
        ts.isArrayLiteralExpression(node) &&
        node.elements[0] &&
        ts.isStringLiteral(node.elements[0]) &&
        [
          "Setup",
          "How to move",
          "Coaching cues",
          "Common mistakes",
          "Equipment",
          "Difficulty",
          "Movement",
        ].includes(node.elements[0].text)
      )
        requireConfig(node, pathname, true);
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
function schemaMessages(schema, field = "") {
  const d = schema._def;
  if (d.innerType) schemaMessages(d.innerType, field);
  if (d.schema) schemaMessages(d.schema, field);
  if (d.typeName === "ZodObject")
    for (const [key, value] of Object.entries(d.shape())) {
      if (key === "starter_id") continue;
      requireMessage(
        key
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        "schema field",
      );
      schemaMessages(value, key);
    }
  if (d.typeName === "ZodEnum" && !["language", "currency", "mime"].includes(field))
    for (const value of d.values)
      requireMessage(
        value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        "schema choice",
      );
  if (d.typeName === "ZodArray") schemaMessages(d.type, field);
}
Object.values(featureSchemas).forEach((schema) => schemaMessages(schema));
const exerciseRows = JSON.parse(
  readFileSync(new URL("../src/data/exercises.json", import.meta.url), "utf8"),
);
for (const entry of exerciseRows)
  for (const label of [entry.category, ...(entry.muscles ?? [])])
    requireMessage(label, "exercise category/muscle");
const guidance = JSON.parse(
  readFileSync(new URL("../src/data/exercise-guidance.json", import.meta.url), "utf8"),
);
for (const entry of Object.values(guidance)) {
  for (const label of [...(entry.equipment ?? []), entry.difficulty, entry.movement].filter(
    Boolean,
  ))
    requireMessage(label, "exercise metadata");
}
for (const label of [
  "owner",
  "moderator",
  "member",
  "manager",
  "staff",
  "active",
  "paused",
  "ended",
  "interest",
  "gym",
  "club",
  "challenge",
  "education",
  "warmup",
  "main",
  "cooldown",
])
  requireMessage(label, "workspace/group/program labels");
// English plural suffixes are intentionally omitted in complete BS/DE phrases.
const omittedSuffix = {
  "{p0}: {p1} session{p2}": "p2",
  "{p0}session{p1}· {p2}": "p1",
  "{p0} from {p1} · {p2} set{p3}": "p3",
  "{p0} glass{p1}, {p2} ml": "p1",
  "{p0} set{p1} not done": "p1",
  "{p0} logged set{p1} will be lost.": "p1",
  "{p0}warm-up set {p1}not counted or saved.": "p1",
  "{p0} new personal record{p1}": "p1",
};
for (const label of [
  "Specialty",
  "Languages",
  "Sports",
  "Education",
  "Credential claims",
  "Equipment",
  "Amenities",
  "Atmosphere",
  "Website",
  "Map",
  "Virtual tour",
])
  requireMessage(label, "directory labels");
const placeholders = (value) =>
  [...value.matchAll(/\{([^{}]+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join(",");
for (const [source, translations] of Object.entries(dictionary))
  for (const language of ["bs", "de"])
    if (
      translations[language] &&
      placeholders(source.replace(`{${omittedSuffix[source]}}`, "")) !==
        placeholders(translations[language])
    )
      missing.add(`Placeholder mismatch ${language}: ${source}`);
if (missing.size) {
  console.error([...missing].join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `Complete Bosnian/German coverage for explicit render messages and schema fields (${Object.keys(dictionary).length} catalogue entries).`,
  );
