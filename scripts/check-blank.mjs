import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = async name => readFile(path.join(root, name), 'utf8');
const json = async name => JSON.parse((await read(name)).replace(/^\uFEFF?\s*\/\*[\s\S]*?\*\/\s*/, ''));
const checkColors = (source, name) => {
  for (const [, hex] of source.matchAll(/#([0-9a-fA-F]{6})\b/g)) {
    assert.equal(hex.slice(0, 2).toLowerCase(), hex.slice(2, 4).toLowerCase(), `${name}: colored default #${hex}`);
    assert.equal(hex.slice(2, 4).toLowerCase(), hex.slice(4, 6).toLowerCase(), `${name}: colored default #${hex}`);
  }
};

const data = await json('config/settings_data.json');
const schema = await json('config/settings_schema.json');
assert.equal(schema[0].theme_name, 'Blank NAVEGaid Theme');
assert.equal(data.current.logo, '');
assert.equal(data.current.favicon, '');
assert.equal(data.current.show_recommendation_in_cart, false);
assert.deepEqual(data.current.product_recommendations, []);
assert.deepEqual(Object.keys(data.current.sections).sort(), ['main-password-footer', 'main-password-header']);

for (const [name, settings] of Object.entries({ current: data.current, ...data.presets })) {
  for (const [key, value] of Object.entries(settings)) {
    if (/^social_.*_link$/.test(key)) assert.equal(value, '', `${name}.${key}`);
    if (/^type_.*font$/.test(key)) assert.equal(value, 'assistant_n4', `${name}.${key}`);
  }
  for (const scheme of Object.values(settings.color_schemes)) {
    assert.equal(scheme.settings.background_gradient, '', `${name}: gradient`);
    for (const [key, value] of Object.entries(scheme.settings)) {
      if (key === 'background_gradient') continue;
      assert.match(value, /^#(?:FFFFFF|111111|F5F5F5|E5E5E5)$/, `${name}: ${key}`);
    }
  }
}

const index = await json('templates/index.json');
assert.equal(index.order.length, 1);
assert.equal(index.sections[index.order[0]].type, 'custom-liquid');
assert.equal(index.sections[index.order[0]].disabled, true);
assert.deepEqual(index.sections[index.order[0]].settings, {});
for (const [file, expected] of [
  ['sections/header-group.json', 'header'],
  ['sections/footer-group.json', 'footer'],
]) {
  const group = await json(file);
  assert.equal(group.order.length, 1);
  assert.equal(group.sections[group.order[0]].type, expected);
  assert.deepEqual(group.sections[group.order[0]].blocks, {});
}
const footer = await json('sections/footer-group.json');
assert.equal(footer.sections.footer.settings.newsletter_enable, false);
assert.equal(footer.sections.footer.settings.show_social, false);

for (const directory of ['templates', 'templates/customers', 'sections']) {
  for (const file of await readdir(path.join(root, directory))) {
    if (!file.endsWith('.json')) continue;
    const source = await read(`${directory}/${file}`);
    assert.doesNotMatch(source, /shopify:\/\/|skincare|serum|litter[ -]?robot|nave\.co/i, `${directory}/${file}: demo content`);
    checkColors(source, `${directory}/${file}`);
  }
}
const assets = await readdir(path.join(root, 'assets'));
assert.deepEqual(assets.filter(name => /\.(?:jpe?g|png|webp|gif|avif)$/i.test(name)), [], 'bundled raster media');
for (const file of assets.filter(name => /\.(?:css|svg|liquid)$/.test(name))) checkColors(await read(`assets/${file}`), `assets/${file}`);
checkColors(await read('layout/theme.liquid'), 'layout/theme.liquid');
checkColors(await read('config/settings_schema.json'), 'config/settings_schema.json');
for (const directory of ['sections', 'blocks', 'snippets']) {
  for (const file of await readdir(path.join(root, directory))) {
    if (!file.endsWith('.liquid')) continue;
    const source = await read(`${directory}/${file}`);
    checkColors(source, `${directory}/${file}`);
    assert.doesNotMatch(source, /nave-design-image|nave-(?:product|about|community|contact|collection|philosophy)/i, `${directory}/${file}: bundled image reference`);
    const lines = source.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('placeholder_svg_tag')) {
        assert.match(lines.slice(Math.max(0, i - 2), i + 1).join('\n'), /request\.design_mode/, `${directory}/${file}: storefront placeholder`);
      }
    }
  }
}
console.log('Blank theme defaults and media fallbacks valid.');
