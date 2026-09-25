# Blank NAVEGaid Theme

Blank NAVEGaid Theme is a Shopify Online Store 2.0 starting point with merchant-editable sections, theme blocks, and storefront templates. It installs with an empty homepage, a plain header and footer, no demo media or copy, and monochrome colors. Catalog images appear only when the merchant supplies them. The [Fluid documentation](https://doc.navegaid.com/theme/fluid/welcome) describes the retained section library.

This repository starts from the theme files in `NAVEGaid-Shopify-Theme-main.zip` supplied on 2026-09-25. The archive came from [DEV-NAVEGaid/NAVEGaid-Shopify-Theme](https://github.com/DEV-NAVEGaid/NAVEGaid-Shopify-Theme). Its SHA-256 is `189723B817E0D0461DC12AEBECCF9591F508E8B0146A6FF5BF9B780D95F5B71C`. This repository has an independent local Git history. The ZIP is retained locally and excluded from Git and Shopify uploads.

## Start here

1. Read [PRODUCT.md](PRODUCT.md) for product goals and boundaries.
2. Read [DEVELOPMENT.md](DEVELOPMENT.md) for the local workflow and checks.

Run the local check with Node.js:

```powershell
npm run check
```

For a store preview, install and authenticate the [Shopify CLI](https://shopify.dev/docs/themes/tools/cli), then run `shopify theme dev --store your-store.myshopify.com` from this folder. `shopify theme dev` uses a development theme for preview. Run `shopify theme check` for Shopify's theme linting when the CLI is available. The inherited license gate is unchanged and requires release work before this variant is sold or published.

## Theme layout

| Path | Purpose |
| --- | --- |
| `layout/` | Storefront document shells |
| `templates/` | Page composition and saved section settings |
| `sections/` | Merchant-configurable page sections |
| `blocks/` | Reusable theme editor blocks |
| `snippets/` | Reusable Liquid rendering units |
| `assets/` | Styles, scripts, fonts, and images |
| `config/` | Global setting definitions and saved settings |
| `locales/` | Storefront and editor translations |

The Markdown files, `scripts/`, and `package.json` are repository tooling. `.shopifyignore` excludes them from theme uploads.
