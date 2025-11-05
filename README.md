# Website Translation Widget

A self-contained, embeddable translation widget built with Vue 3 and Vuetify 3. It lets translators click any on‑page text, edit its translation in a modal, and immediately preview the result. Translations are stored locally in the browser and can be exported/imported.

## What’s inside (feature highlights)

- Live Preview mode (on by default) applying translations immediately
- Click-to-edit modal with original text, translation, extra note, and “Mark for removal”
- Show borders around untranslated content for quick scanning
- Disable/restore interactive elements while the widget is active (safe editing)
- JSON export and import of translations (with metadata)
- HTML report export summarizing the current translation set
- Custom translations not bound to a specific element
- Deep-link navigation to a specific element via URL parameters
- Input/textarea placeholder translation support
- Robust handling of dynamically added content (MutationObserver)
- Keyboard shortcuts for fast workflows

## Quick Start

### 1) Development (recommended for local changes)

```bash
cd translator-app
npm install
npm run dev
```

Open the local dev URL shown in your terminal.

### 2) Production build

```bash
npm run build
```

The build produces:
- `dist/translation-widget.iife.js` (JavaScript bundle)
- `dist/translation-widget.css` (styles)

Include both on any page you want to translate:

```html
<!-- In <head> -->
<link rel="stylesheet" href="translation-widget.css">

<!-- Before </body> -->
<script src="translation-widget.iife.js"></script>
```

Once included, the floating widget appears (top-left by default). You can also show/hide it with Shift+Space.

## How to use (overview)

1. Show the widget: click the floating Translate button or press Shift+Space.
2. Ensure “Preview Mode” is on to see live updates.
3. Click any text element to open the modal.
4. Enter your translation. Optionally add an Extra note or mark the original for removal.
5. Save (click Save or press Ctrl+Enter / Cmd+Enter).
6. Use “Show Untranslated Borders” to highlight remaining untranslated content.
7. Export/Import JSON at any time. Export an HTML report for sharing.
8. Add “Custom” translations for strings that don’t exist on the current page.
9. If needed, clear all translations (requires typing CONFIRM).

For translator-oriented step-by-step instructions, see:
- `intructions/english.md`
- `intructions/slovenian.md`

## Keyboard shortcuts

- Shift+Space: Toggle widget visibility
- Ctrl+Enter (Cmd+Enter on macOS): Save in the modal or custom dialog
- Esc: Close/cancel dialogs

## Export / Import

### JSON Export

Click “Export JSON” to download `translations.json`. Each entry includes content and metadata:

```json
[
  {
    "originalText": "Welcome to our website!",
    "translatedText": "Willkommen auf unserer Webseite!",
    "extraNote": "Homepage hero",
    "markForRemoval": false,
    "xpath": "/html/body/main/h1",
    "uri": "https://example.com/page",
    "isCustom": false
  }
]
```

Notes:
- `isCustom` is true if the translation is not bound to a specific element.
- `xpath` and `uri` are provided when the text is associated with a page element.

### JSON Import

Click “Import JSON” and select a file containing an array of objects with at least `originalText` and `translatedText`.

- When metadata fields (`xpath`, `uri`) are present, they are imported as well.
- After a successful import, if Preview Mode is on, the page updates immediately.

### HTML Report Export

Click “Export HTML” to download a formatted HTML report generated from the current translations and metadata (via `generateHTMLReport`).

## Deep-link navigation

You can directly navigate and highlight an element when the page loads using URL params:

- `tw_navigate=true` (enable navigation)
- `tw_xpath` (preferred) – the element XPath
- `tw_text` – original text fallback when XPath is missing or fails
- `tw_note` – an optional note shown in a tooltip near the highlighted element

Example:

```
https://example.com/page?tw_navigate=true&tw_xpath=/html/body/main/h1&tw_text=Welcome&tw_note=Please%20check%20terminology
```

On load, the widget attempts to find the element by XPath, falls back to searching by text if needed, scrolls it into view, and briefly highlights it (showing the optional note).

## How it works (technical)

The widget core logic lives in `src/TranslationWidget.vue` and the edit dialog in `src/TranslationModal.vue`.

- Preview Mode: When enabled, the widget identifies translatable elements and applies translations found in localStorage. Disabling preview reverts all elements to their original text.
- Element set: Elements with text content are targeted (e.g., `p`, `h1`–`h6`, `span`, `a`, `li`, `button`, `th`, `td`, `div`, `section`, `article`, `aside`, `header`, `footer`, `main`, `nav`, `small`, `label`) and inputs/textareas via `placeholder`.
- Dynamic content: A `MutationObserver` tracks DOM changes; new content is scanned and translated automatically when Preview Mode is on.
- Interaction safety: While the widget is visible, links/buttons are visually dimmed and prevented from navigating/submitting (with hrefs/click handlers restored when the widget hides). Absolutely positioned elements keep pointer events off to avoid blocking text nodes below.
- Original text capture: Original values (including placeholders) are cached so the widget can revert precisely.
- Alpine.js compatibility: If an element has `x-*` attributes, the widget uses its current rendered text when opening the modal.

## Storage and data format

The widget uses localStorage:

- `VUE_TRANSLATIONS_APP_DATA` – object map of `originalText -> translationValue`
  - `translationValue` can be a string (legacy) or an object:
    ```json
    {
      "translatedText": "...",
      "extraNote": "...",
      "markForRemoval": false
    }
    ```
- `VUE_TRANSLATIONS_APP_METADATA` – per-originalText metadata with `xpath` and `uri` when bound to an element

The export process normalizes legacy strings to the object format so downstream tools receive a consistent schema.

## Custom translations (not bound to the page)

Use “Add Custom” to store a translation pair that isn’t present in the current DOM. These entries are exported with `isCustom: true` and have no XPath/URI.

## Clearing all translations

Click “Clear translations” to remove both storage keys. You must type `CONFIRM` to proceed. The page reloads after clearing.

## Supported elements (detection summary)

- Textual elements: `p`, `h1`–`h6`, `span`, `a`, `li`, `button`, `th`, `td`, `div`, `section`, `article`, `aside`, `header`, `footer`, `main`, `nav`, `small`, `label`
- Inputs with placeholders: `input[placeholder]`, `textarea[placeholder]`
- Elements inside `<script>` or `<style>` are ignored
- The widget’s own DOM (class `.translation-widget`) is ignored

## Development & scripts

```bash
# Install
npm install

# Start dev server
npm run dev

# Build production assets
npm run build
```

Open the dev URL to test locally, or include the built `dist` files in any page to run the widget in production-like environments.

## Troubleshooting

- The widget doesn’t show: Ensure both the CSS and JS are loaded on the page and no CSP blocks inline scripts/styles required by Vuetify.
- Clicks navigate away while editing: Make sure the widget is visible; when visible, interactive elements are disabled and safe to click for editing.
- Import fails: Confirm the file is valid JSON and is an array of objects with `originalText` and `translatedText` at minimum.
- No changes after import: Ensure Preview Mode is enabled.

## License & support

This project is open source. Use, modify, and distribute as needed. For issues or questions, open an issue in the repository or contact the maintainers.


