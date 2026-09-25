# Development workflow

## Prerequisites

- Node.js for the dependency-free local JSON/schema check.
- [Shopify CLI](https://shopify.dev/docs/themes/tools/cli) and access to a development store for Theme Check and browser preview.

No dependency installation or asset build is required for the storefront.

## Before editing

1. Read `PRODUCT.md` and the relevant theme files.
2. Check `git status --short --branch` and inspect existing changes.
3. Trace the section or block through its Liquid file, schema, snippets, assets, and JSON template instances.
4. Treat `config/settings_data.json` and values in `templates/*.json` as merchant state. Preserve them unless the task explicitly calls for changing that state.
5. Check the [current Shopify theme documentation](https://shopify.dev/docs/themes) before changing Liquid, schemas, templates, or theme editor behavior.

## Validate

```powershell
npm run check
git diff --check
shopify theme check
```

`npm run check` parses repository JSON and `{% schema %}` JSON, validates template section references and ordering, checks section presets against their setting definitions, and checks blank-start defaults. `shopify theme check` requires Shopify CLI and may report existing findings in imported source. Record any baseline findings separately from new ones.

For visual and editor checks, use a development theme:

```powershell
shopify theme dev --store your-store.myshopify.com
```

Check the empty homepage, product with and without catalog photos, collection, cart, search, and content pages at desktop and mobile widths. Reorder or edit changed blocks in the theme editor, then confirm saved values still render. `theme dev` replaces the current development theme for that environment; choose the intended store before running it. The inherited license gate remains a release blocker until its offline and test-bypass behavior is replaced and verified.

## Git and deployment

- Keep commits focused and review `git diff --cached` before committing.
- Do not commit ZIP exports, credentials, generated reports, or local scratch files.
- A Git push does not upload the theme to Shopify. Upload or publish only against an explicitly chosen store and theme.
- When collaborating with a Shopify-connected branch, fetch and inspect incoming editor commits before integrating; they can contain merchant changes.
