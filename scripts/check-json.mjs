import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const jsonDirectories = ['config', 'locales', 'sections', 'templates'];
const liquidDirectories = ['blocks', 'sections'];
const schemaPattern = /{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/g;
let checked = 0;
let errors = 0;

async function* files(directory) {
  for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
    const relativePath = `${directory}/${entry.name}`;
    if (entry.isDirectory()) yield* files(relativePath);
    else if (entry.isFile()) yield relativePath;
  }
}

function report(message) {
  console.error(message);
  errors++;
}

async function checkSectionList(relativePath, document) {
  if (!document.sections || !document.order) return;
  const ids = Object.keys(document.sections);
  if (ids.length === 0) report(`${relativePath}: needs at least one section`);
  if (document.order.length !== ids.length || new Set(document.order).size !== ids.length || document.order.some(id => !document.sections[id])) {
    report(`${relativePath}: order must list every section exactly once`);
  }
  for (const [id, section] of Object.entries(document.sections)) {
    try {
      await access(path.join(root, 'sections', `${section.type}.liquid`));
    } catch {
      report(`${relativePath}: section ${id} references missing type ${section.type}`);
    }
    if (section.blocks) {
      const blockIds = Object.keys(section.blocks);
      const order = section.block_order ?? [];
      if (order.length !== blockIds.length || new Set(order).size !== blockIds.length || order.some(blockId => !section.blocks[blockId])) {
        report(`${relativePath}: block_order for ${id} must list every block exactly once`);
      }
    }
  }
}

for (const directory of jsonDirectories) {
  for await (const relativePath of files(directory)) {
    if (!relativePath.endsWith('.json')) continue;
    const source = await readFile(path.join(root, relativePath), 'utf8');
    // Shopify-generated JSON templates may start with a block comment.
    const json = source.replace(/^\uFEFF?\s*\/\*[\s\S]*?\*\/\s*/, '');
    try {
      const document = JSON.parse(json);
      if (directory === 'templates' || (directory === 'sections' && document.type && document.sections)) {
        await checkSectionList(relativePath, document);
      }
      checked++;
    } catch (error) {
      console.error(`${relativePath}: ${error.message}`);
      errors++;
    }
  }
}

for (const directory of liquidDirectories) {
  for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.liquid')) continue;

    const relativePath = `${directory}/${entry.name}`;
    const source = await readFile(path.join(root, relativePath), 'utf8');
    const opens = [...source.matchAll(/{%-?\s*schema\s*-?%}/g)].length;
    const closes = [...source.matchAll(/{%-?\s*endschema\s*-?%}/g)].length;
    const schemas = [...source.matchAll(schemaPattern)];
    if (opens !== schemas.length || closes !== schemas.length) {
      console.error(`${relativePath}: unmatched schema tag`);
      errors++;
    }
    for (const [, json] of schemas) {
      try {
        JSON.parse(json);
        checked++;
      } catch (error) {
        console.error(`${relativePath}: ${error.message}`);
        errors++;
      }
    }
  }
}

if (errors) {
  console.error(`${errors} JSON/schema error(s); ${checked} valid documents.`);
  process.exitCode = 1;
} else {
  console.log(`${checked} JSON/schema documents valid.`);
}
