# Product: Blank NAVEGaid Theme

## Purpose

Provide a brand-neutral Shopify storefront foundation. The installed theme has an empty homepage, plain header and footer, no demo media or marketing copy, and white, near-black, and gray defaults. Merchants add their own content, images, navigation, products, and colors in the editor.

## Users and core journeys

- **Merchants** assemble pages from sections and blocks, edit content and global design settings, and keep saved configurations through code updates.
- **Shoppers** browse landing pages and collections, inspect product details, search, add products to cart, and complete checkout through Shopify.
- **Theme developers** extend sections, blocks, snippets, and assets without breaking existing merchant settings or editor behavior.

## Current product surface

- Shopify Online Store 2.0 Liquid theme; no compile or bundle step.
- An empty installed homepage with a disabled section entry required by Shopify JSON templates.
- Reusable content sections for editorial storytelling, promotions, social proof, and product discovery. The [Fluid docs](https://doc.navegaid.com/theme/fluid/welcome) are the feature reference.
- Product, collection, search, cart, blog, page, and customer templates.
- Merchant controls in section and block schemas plus global settings in `config/settings_schema.json`.
- Saved merchant state in `config/settings_data.json` and JSON templates.

## Product requirements

1. Keep common content and styling choices editable in the theme editor. Use theme blocks when merchant reordering or nesting is required; use snippets for stable rendering reuse.
2. Preserve existing section types, block types, setting IDs, and valid saved values unless a deliberate migration is part of the task.
3. Support responsive layouts, keyboard access, readable content, and appropriately sized media.
4. Keep storefront JavaScript scoped so multiple instances and theme editor reloads work.
5. Keep the theme upload limited to Shopify theme source. Repository documentation and local tooling stay outside the uploaded theme.
6. Keep installed templates and defaults free of demo images, category copy, promotional links, and colored accents. Keep image pickers and color settings editable; render catalog media only when supplied by the merchant.

## Boundaries

Shopify owns checkout, products, customers, and store data. This repository contains the theme presentation layer. Publishing to a store and changing a live theme are separate operations from a Git commit.

The inherited NAVEGaid license identity and editor gate are unchanged for local development. The gate currently has offline behavior and a test bypass. Replace and verify that flow before selling or publishing this variant.

## Definition of done for changes

- The changed feature works in the affected templates and screen sizes.
- Existing saved settings still render and remain editable.
- `npm run check` and `git diff --check` pass; `shopify theme check` and a development-theme preview are run when access is available. Preview product, collection, cart, search, content, and image-free catalog states with real store data.
- The change is documented when it alters the product surface or contributor workflow.
