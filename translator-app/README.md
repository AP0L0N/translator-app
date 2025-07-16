# Translation Widget

This is a React-based widget for managing website text translations in-context.

## Setup

1. Install dependencies: `npm install`
2. Run development server: `npm run dev` (for testing in a local environment)
3. Build the widget: `npm run build` - This generates `dist/widget.iife.js` which can be renamed to `widget.js`

## Usage

- Include the widget on the target website with `<script src="path/to/widget.js"></script>`.
- Log in with password 'secret' (change in code for production).
- Hover over text elements to see the Translate button.
- Use the settings panel to switch languages, export/import translations.

## Configuration

- Languages: Edit `config/languages.json`
- Target URL: Set in `.env` (for dev purposes)

## Sharing Translations

- Use export to download JSON files per language.
- Share with partners, they can import back.

For more details, see the code.