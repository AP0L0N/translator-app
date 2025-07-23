# Website Translation Widget

A self-contained, embeddable website translation widget built with Vue.js 3 and Vuetify 3. This widget allows translators to hover over text elements on any website, edit them in a modal, and see live previews of their translations.

## Features

- 🖱️ **Hover to Edit**: Hover over any text element to see an edit icon
- ✏️ **Translation Modal**: Click to open a clean modal with original text and translation input
- 👁️ **Live Preview**: Toggle preview mode to see translations applied in real-time
- 💾 **Local Storage**: All translations are saved locally in the browser
- 📄 **Export Functionality**: Download translations as a JSON file
- 🔄 **Dynamic Content Support**: Automatically detects and handles dynamically added content
- 🎯 **Element Targeting**: Supports p, h1-h6, span, a, li, button, th, td elements
- 📊 **XPath Generation**: Generates unique XPaths for precise element identification

## Quick Start

### 1. Include the Widget Files

Add these two lines to your website's HTML:

```html
<!-- Include the CSS -->
<link rel="stylesheet" href="path/to/translation-widget.css">

<!-- Include the JavaScript (place before closing </body> tag) -->
<script src="path/to/translation-widget.iife.js"></script>
```

### 2. That's it!

The widget will automatically initialize when the page loads. You'll see a floating translation panel in the top-left corner.

## How to Use

### For Translators

1. **Hover over text**: Move your mouse over any text element (headings, paragraphs, buttons, links, etc.)
2. **Click the edit icon**: A small pencil icon will appear - click it
3. **Enter translation**: In the modal, enter your translation in the textarea
4. **Save**: Click "Save Translation" or press Ctrl+Enter (Cmd+Enter on Mac)
5. **Preview**: Toggle "Preview Mode" to see your translations applied to the page
6. **Export**: Click "Export Translations" to download your work as a JSON file

### Preview Mode

When preview mode is enabled:
- All translated text is immediately replaced on the page
- New content added to the page is automatically translated if a translation exists
- Toggle off to see the original text

### Export Format

The exported JSON file contains an array of translation objects:

```json
[
  {
    "originalText": "Welcome to our website!",
    "translatedText": "Willkommen auf unserer Webseite!",
    "xpath": "/html/body/main/h1",
    "uri": "https://example.com/page"
  }
]
```

## Development

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Setup

```bash
# Clone or download the project
cd translator-app

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Build Output

The build process creates:
- `dist/translation-widget.iife.js` - The main JavaScript bundle
- `dist/translation-widget.css` - The CSS styles

### Development Testing

1. Run `npm run dev` to start the development server
2. Open the local URL shown in terminal
3. Test the widget functionality on the development page

### Production Testing

1. Run `npm run build` to create the production files
2. Open `public/test-page.html` in a web browser
3. The page includes the built widget files and demonstrates all features

## Technical Details

### Browser Support

- Modern browsers with ES6+ support
- Chrome 60+, Firefox 60+, Safari 12+, Edge 79+

### Storage

The widget uses two localStorage keys:
- `VUE_TRANSLATIONS_APP_DATA`: Translation pairs (original → translated text)
- `VUE_TRANSLATIONS_APP_METADATA`: Element metadata (XPath and URI information)

### Supported Elements

The widget automatically detects these HTML elements:
- Headings: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- Text: `p`, `span`
- Interactive: `a`, `button`
- Lists: `li`
- Tables: `th`, `td`

Elements inside `<script>` or `<style>` tags are automatically ignored.

### XPath Generation

Each translation is associated with a unique XPath that identifies the exact element location. This enables:
- Precise element targeting
- Export functionality with element context
- Future import capabilities

## Integration Examples

### Basic Integration

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="translation-widget.css">
</head>
<body>
    <h1>Your Website Content</h1>
    <p>Any text content here can be translated.</p>
    
    <script src="translation-widget.iife.js"></script>
</body>
</html>
```

### Advanced Integration

```html
<!-- With custom positioning -->
<style>
.translation-control-panel {
    top: 100px !important;
    left: 50px !important;
}
</style>

<script src="translation-widget.iife.js"></script>
```

## Customization

### Styling

The widget uses scoped styles to prevent conflicts, but you can override them:

```css
/* Change widget position */
.translation-control-panel {
    top: 20px !important;
    right: 20px !important;
    left: auto !important;
}

/* Customize colors */
.translation-control-panel .v-card-title {
    background: #your-brand-color !important;
}
```

### Widget Behavior

You can access the widget instance after initialization:

```javascript
// Access the widget instance
const widget = window.translationWidget;

// The TranslationManager is also available
// Note: This is for advanced use cases
```

## FAQ

**Q: Does this widget work on any website?**
A: Yes, it's designed to work on any website. Simply include the CSS and JS files.

**Q: Are translations stored online?**
A: No, all translations are stored locally in your browser's localStorage.

**Q: Can I import existing translations?**
A: Currently, the widget supports export only. Import functionality can be added in future versions.

**Q: Does it work with dynamically loaded content?**
A: Yes, the widget uses MutationObserver to detect new content and automatically makes it translatable.

**Q: Can I customize which elements are translatable?**
A: The element types are defined in the `getTranslatableElements()` method in `main.js`. You can modify this list as needed.

## License

This project is open source. Feel free to modify and distribute according to your needs.

## Support

For issues, questions, or contributions, please refer to the project repository or contact the development team.