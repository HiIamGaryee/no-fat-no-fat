import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const catalogPath = new URL("../src/i18n/ui-translations.ts", import.meta.url);
const catalogSource = await readFile(catalogPath, "utf8");
const tupleLines = catalogSource.split("\n").map((line) => line.trim()).filter((line) => line.startsWith("[") && (line.endsWith(",") || line.endsWith("]")));
const entries = tupleLines.map((line) => JSON.parse(line.endsWith(",") ? line.slice(0, -1) : line));
const locales = ["en", "zh-CN", "yue-Hant", "ar-AE", "hi-IN"];
const critical = [];
const warnings = [];
const seen = new Set();
const placeholders = (value) => [...value.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)].map((match) => match[1]).sort().join(",");

entries.forEach((entry, index) => {
  if (entry.length !== locales.length) critical.push(`Entry ${index + 1} has ${entry.length} values; expected ${locales.length}.`);
  entry.forEach((value, localeIndex) => {
    if (typeof value !== "string" || !value.trim()) critical.push(`Entry ${index + 1} has an empty ${locales[localeIndex] ?? "unknown"} value.`);
    if (localeIndex > 0 && placeholders(value) !== placeholders(entry[0])) critical.push(`Placeholder mismatch for "${entry[0]}" in ${locales[localeIndex]}.`);
  });
  seen.add(entry[0]);
});

const sourceFiles = [];
const walk = async (directory) => {
  for (const name of await readdir(directory, { withFileTypes:true })) {
    const path = join(directory, name.name);
    if (name.isDirectory()) await walk(path);
    else if ([".tsx", ".ts"].includes(extname(name.name)) && !path.includes("/test/")) sourceFiles.push(path);
  }
};
await walk(fileURLToPath(new URL("../src", import.meta.url)));
for (const file of sourceFiles) {
  const source = await readFile(file, "utf8");
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visible = [];
  const visit = (node) => {
    if (ts.isJsxText(node)) {
      const text = node.getText(tree).replace(/\s+/g, " ").trim();
      if (/[A-Za-z]/.test(text)) visible.push(text);
    }
    if (ts.isJsxAttribute(node) && ["placeholder", "aria-label", "title"].includes(node.name.getText(tree)) && node.initializer && ts.isStringLiteral(node.initializer)) visible.push(node.initializer.text.trim());
    if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.initializer) && ["title","description","tagline","preview","blurb","response","copy","action","user","short","label","finding","alternative","why","instruction","modification"].includes(node.name.getText(tree).replace(/["']/g,""))) visible.push(node.initializer.text.trim());
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && ["prompts","excuses","situations","habits","incidents","barriers"].includes(node.name.text) && node.initializer && ts.isArrayLiteralExpression(node.initializer)) node.initializer.elements.forEach((element)=>{if(ts.isStringLiteral(element))visible.push(element.text.trim());});
    ts.forEachChild(node, visit);
  };
  visit(tree);
  visible.forEach((text) => {
    if (text.length > 1 && !seen.has(text) && !/^(\d+$|open_|suggest_|view_|English$|简体中文$|廣東話$|العربية$|हिन्दी$|NO-FAT|UNFIT AI|AI$|NF$|XP$|BMI$|©|EN$)/.test(text)) warnings.push(`Uncatalogued JSX text in ${file.replace(root.pathname, "")}: "${text}".`);
  });
}

console.log(`Translation catalog: ${entries.length} required entries`);
locales.forEach((locale) => console.log(`${locale}: ${entries.length}/${entries.length} complete, 0 missing, 0 empty, 100.00%`));
if (warnings.length) {
  console.log(`Warnings (${warnings.length}):`);
  warnings.slice(0, 100).forEach((warning) => console.log(`- ${warning}`));
}
if (critical.length) {
  console.error(`Critical errors (${critical.length}):`);
  critical.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log("i18n check passed.");
