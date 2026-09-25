import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

const schemas = new Map();
for (const dir of ['sections', 'blocks']) {
  for (const name of await readdir(path.join(root, dir))) {
    if (!name.endsWith('.liquid')) continue;
    const source = await readFile(path.join(root, dir, name), 'utf8');
    const match = source.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
    if (match) schemas.set(`${dir}/${name.slice(0, -7)}`, JSON.parse(match[1]));
  }
}
const issues = [];
const check = (settings, values, where) => {
  for (const [id, value] of Object.entries(values ?? {})) {
    const setting = settings?.find(item => item.id === id);
    if (!setting) {
      issues.push(`${where}.${id}: unknown setting`);
      continue;
    }
    if (['select', 'radio'].includes(setting.type) && !setting.options?.some(option => option.value === value)) issues.push(`${where}.${id}: ${JSON.stringify(value)} not in options`);
    if (setting.type === 'range' && (typeof value !== 'number' || value < setting.min || value > setting.max)) issues.push(`${where}.${id}: ${JSON.stringify(value)} out of range`);
    if (setting.type === 'checkbox' && typeof value !== 'boolean') issues.push(`${where}.${id}: ${JSON.stringify(value)} not boolean`);
  }
};
for (const [key, schema] of schemas) {
  if (!schema) continue;
  for (const setting of [...schema.settings ?? [], ...schema.blocks?.flatMap(block => block.settings ?? []) ?? []]) {
    if (setting.default === undefined) continue;
    check([setting], { [setting.id]: setting.default }, `${key} default`);
  }
  if (!key.startsWith('sections/')) continue;
  const visit = (block, where) => {
    const blockSchema = schema.blocks?.find(item => item.type === block.type) ?? schemas.get(`blocks/${block.type}`);
    if (!blockSchema) issues.push(`${where}: missing block type ${block.type}`);
    check(blockSchema?.settings, block.settings, where);
    for (const [index, child] of (block.blocks ?? []).entries()) visit(child, `${where}.blocks[${index}]`);
  };
  for (const [index, preset] of (schema.presets ?? []).entries()) {
    check(schema.settings, preset.settings, `${key}.presets[${index}]`);
    for (const [b, block] of (preset.blocks ?? []).entries()) visit(block, `${key}.presets[${index}].blocks[${b}]`);
  }
}

for (const dir of ['templates', 'templates/customers', 'sections']) {
  for (const name of await readdir(path.join(root, dir))) {
    if (!name.endsWith('.json')) continue;
    const source = await readFile(path.join(root, dir, name), 'utf8');
    const document = JSON.parse(source.replace(/^\uFEFF?\s*\/\*[\s\S]*?\*\/\s*/, ''));
    if (!document.sections) continue;
    for (const [id, section] of Object.entries(document.sections)) {
      const where = `${dir}/${name}.sections.${id}`;
      const sectionSchema = schemas.get(`sections/${section.type}`);
      if (!sectionSchema) {
        issues.push(`${where}: missing section type ${section.type}`);
        continue;
      }
      check(sectionSchema.settings, section.settings, where);
      for (const [blockId, block] of Object.entries(section.blocks ?? {})) {
        const blockSchema = sectionSchema.blocks?.find(item => item.type === block.type) ?? schemas.get(`blocks/${block.type}`);
        if (!blockSchema) issues.push(`${where}.blocks.${blockId}: missing block type ${block.type}`);
        check(blockSchema?.settings, block.settings, `${where}.blocks.${blockId}`);
      }
    }
  }
}
console.log(issues.join('\n') || 'No invalid defaults or preset values.');
if (issues.length) process.exitCode = 1;
