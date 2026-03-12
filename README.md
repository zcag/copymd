# CopyMD

Add a "Copy as Markdown" button to any website. One script tag.

Lets your readers copy page content as clean Markdown for AI tools (ChatGPT, Claude, Gemini, etc.) with a single click. Shows approximate token count.

## Install

Add before `</body>`:

```html
<script src="https://zcag.github.io/copymd/copymd.js" defer></script>
```

A floating button appears. Click it → page content is converted to Markdown → copied to clipboard.

## What it does

- Extracts main content (skips nav, sidebar, footer, ads)
- Converts headings, lists, tables, code blocks, images, links to Markdown
- Adds page title and source URL as header
- Shows approximate token count on copy
- Works on any page — blogs, docs, knowledge bases, tutorials

## Options

Customize with `data-` attributes:

```html
<script src="https://zcag.github.io/copymd/copymd.js"
  data-position="bottom-left"
  data-theme="light"
  data-label="Copy for AI"
  defer></script>
```

| Attribute | Values | Default |
|-----------|--------|---------|
| `data-position` | `bottom-right` `bottom-left` `top-right` `top-left` | `bottom-right` |
| `data-theme` | `dark` `light` | `dark` |
| `data-label` | Any text | `Copy as MD` |
| `data-branding` | `true` `false` | `true` |

## Why add this to your site?

Readers are already copying your content into AI tools. This gives them a clean way to do it — properly formatted Markdown with source attribution, instead of messy clipboard paste.

## Details

- ~12KB, no dependencies, no external requests
- Works on all modern browsers
- Doesn't interfere with your existing JS
- Skips invisible elements, nav, forms, and other non-content
- Handles tables, code blocks with language detection, nested lists

## License

MIT
