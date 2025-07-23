# Quick Start Guide

## Immediate Testing

### Option 1: Run the Demo Server (Recommended)

```bash
# Start the demo server
npm run demo

# Or manually:
node serve-demo.js
```

Then open your browser to:
- **Main Demo**: http://localhost:3000/demo.html
- **Test Page**: http://localhost:3000/public/test-page.html

### Option 2: Open Files Directly

If you prefer not to run a server, you can open the demo file directly:

1. Navigate to the `translator-app` directory
2. Open `demo.html` in your web browser

⚠️ **Note**: Some browsers may block local file access for the widget files. Using the demo server is recommended.

## How to Test

1. **Hover over any text** on the demo page
2. **Click the pencil icon** that appears
3. **Enter a translation** in the modal
4. **Save the translation**
5. **Toggle "Preview Mode"** to see translations applied
6. **Test dynamic content** with the "Add New Content" button
7. **Export your translations** as JSON

## Integration on Your Website

### Step 1: Copy the Built Files

Copy these files from the `dist/` directory to your website:
- `translation-widget.css`
- `translation-widget.iife.js`

### Step 2: Include in Your HTML

Add to your HTML `<head>`:
```html
<link rel="stylesheet" href="path/to/translation-widget.css">
```

Add before closing `</body>`:
```html
<script src="path/to/translation-widget.iife.js"></script>
```

### Step 3: That's It!

The widget will automatically initialize and you'll see the floating translation panel.

## Features Overview

✅ **Hover to Edit**: Hover over text elements to see edit icons  
✅ **Translation Modal**: Clean interface for entering translations  
✅ **Live Preview**: Toggle to see translations applied in real-time  
✅ **Local Storage**: All data saved locally in browser  
✅ **Export Functionality**: Download translations as JSON  
✅ **Dynamic Content**: Automatically handles new content  
✅ **Element Support**: Works with headings, paragraphs, links, buttons, lists, tables  
✅ **XPath Generation**: Precise element identification  
✅ **Responsive Design**: Works on desktop and mobile  

## Supported Elements

The widget automatically detects and makes these elements translatable:
- Headings: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- Text: `p`, `span`
- Links: `a`
- Buttons: `button`
- List items: `li`
- Table cells: `th`, `td`

## Data Storage

Translations are stored in browser localStorage:
- **Translations**: `VUE_TRANSLATIONS_APP_DATA`
- **Metadata**: `VUE_TRANSLATIONS_APP_METADATA`

## Export Format

```json
[
  {
    "originalText": "Hello World",
    "translatedText": "Hola Mundo",
    "xpath": "/html/body/main/h1",
    "uri": "https://example.com"
  }
]
```

## Troubleshooting

**Widget not appearing?**
- Check browser console for errors
- Ensure both CSS and JS files are loaded
- Verify file paths are correct

**Edit icons not showing?**
- Make sure you're hovering over supported elements
- Check that elements contain direct text content

**Translations not persisting?**
- Verify localStorage is enabled in browser
- Check for private/incognito mode restrictions

**Preview mode not working?**
- Ensure you've saved some translations first
- Check browser console for JavaScript errors

## Development

To modify the widget:

1. Edit source files in `src/`
2. Run `npm run build` to rebuild
3. Test with `npm run demo`

## Support

For issues or questions, refer to the main README.md file.