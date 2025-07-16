# Translation Widget

A comprehensive React-based translation management widget that can be injected into any website to enable in-context translation editing with external partner collaboration capabilities.

## Features

### 🚀 Core Functionality
- **In-Context Translation**: Hover over text elements to see translate buttons
- **Live Preview**: Preview translations directly on the page before saving
- **Multi-Language Support**: Support for multiple languages with easy configuration
- **Real-time Updates**: Dynamic text node detection as pages change

### 🔐 Authentication & Security
- **User Management**: Role-based permissions (translator, admin)
- **Session Management**: Secure authentication with session monitoring
- **OAuth Support**: Integration ready for Google, GitHub, and other providers
- **Demo Mode**: Built-in demo users for testing and development

### 📊 Translation Management
- **Version Control**: Track translation history with versioning
- **Status Tracking**: Pending, approved, and needs-review statuses
- **Import/Export**: JSON and CSV support for external collaboration
- **Backup/Restore**: Automatic backups with manual restore options
- **Bulk Operations**: Mass import/export for large translation projects

### 🎨 User Interface
- **Bootstrap 5**: Modern, responsive design
- **Intuitive UX**: Unobtrusive hover interface
- **Settings Panel**: Comprehensive management interface
- **Keyboard Shortcuts**: Power user efficiency features
- **Mobile Friendly**: Works on desktop and mobile devices

## Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd translator-app

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env file with your configuration
```

### 2. Development Mode

```bash
# Start development server
npm run dev

# Open browser to http://localhost:3000
# The demo interface will be available with toggle controls
```

### 3. Build for Production

```bash
# Build both app and widget
npm run build:all

# Or build widget only
npm run build:widget

# Or build app only
npm run build
```

### 4. Widget Integration

Add the widget to any website:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Your Website</title>
</head>
<body>
    <h1>Welcome to Our Website</h1>
    <p>This text can be translated using the widget.</p>
    
    <!-- Translation Widget -->
    <script 
        src="/path/to/widget.iife.js"
        data-target-website="https://your-website.com"
        data-debug="false">
    </script>
</body>
</html>
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Target website URL for translation widget
VITE_TARGET_WEBSITE_URL=https://chipolo.net

# Widget configuration
VITE_WIDGET_NAME=TranslatorWidget
VITE_API_BASE_URL=http://localhost:3000/api

# Authentication (for demo purposes)
VITE_DEMO_USERNAME=translator
VITE_DEMO_PASSWORD=demo123

# Language settings
VITE_DEFAULT_LANGUAGE=en
VITE_SUPPORTED_LANGUAGES=en,es,fr,de,it

# Development settings
VITE_DEV_MODE=true
VITE_DEBUG_MODE=false
```

### Language Configuration

Edit `config/languages.json` to add or modify supported languages:

```json
{
  "languages": [
    {
      "code": "en",
      "name": "English",
      "nativeName": "English",
      "uriPath": "/en",
      "flag": "🇺🇸",
      "rtl": false
    }
  ],
  "defaultLanguage": "en",
  "fallbackLanguage": "en"
}
```

### Widget Configuration Options

```javascript
// Manual initialization with custom options
window.initTranslationWidget({
    targetWebsite: 'https://your-website.com',
    debug: false,
    containerId: 'custom-widget-container',
    autoStart: true
});
```

## Usage

### Demo Credentials

The application includes demo users for testing:

- **Translator**: `translator` / `demo123`
- **Admin**: `admin` / `admin123`

### Basic Workflow

1. **Authentication**: Login with demo credentials or configure OAuth
2. **Text Detection**: Widget automatically detects translatable text elements
3. **Translation**: Hover over text → Click translate button → Edit translation
4. **Preview**: Use preview button to see changes live on the page
5. **Save**: Save translations with status (pending/approved/needs review)
6. **Management**: Use settings panel for bulk operations and language switching

### Keyboard Shortcuts

- `Ctrl+Shift+T` - Toggle settings panel
- `Esc` - Close modals and panels

## Architecture

### Project Structure

```
translator-app/
├── src/
│   ├── components/          # React components
│   │   ├── AuthModal.jsx
│   │   ├── TranslationModal.jsx
│   │   ├── TranslateButton.jsx
│   │   ├── SettingsPanel.jsx
│   │   └── TranslationWidget.jsx
│   ├── contexts/            # React Context providers
│   │   └── TranslationContext.jsx
│   ├── services/            # Business logic services
│   │   └── translationService.js
│   ├── utils/               # Utility functions
│   │   ├── authUtils.js
│   │   └── textNodeUtils.js
│   ├── widget/              # Widget entry point
│   │   └── index.js
│   ├── App.jsx              # Main React app
│   └── main.jsx             # App entry point
├── config/                  # Configuration files
│   └── languages.json
├── translations/            # Translation data files
│   ├── en.json
│   ├── es.json
│   └── fr.json
├── public/                  # Static assets
│   ├── demo/                # Demo files
│   └── translations/        # Public translation files
└── dist/                    # Build output
    ├── app/                 # React app build
    └── widget/              # Widget build
```

### Key Components

#### TranslationWidget
Main widget component that coordinates all functionality:
- DOM observation for text node detection
- Hover event handling
- Modal and panel management
- Authentication state management

#### TranslationContext
React Context providing global state management:
- Translation data storage
- Language management
- User authentication state
- Action dispatching

#### TextNodeUtils
Utility functions for DOM manipulation:
- Text node extraction and identification
- Element visibility detection
- XPath generation for element targeting
- DOM mutation observation

#### TranslationService
Business logic for translation operations:
- CRUD operations for translations
- Import/export functionality (JSON/CSV)
- Backup and restore operations
- Translation statistics and reporting

## API Reference

### Widget API

```javascript
// Initialize widget
const widget = window.initTranslationWidget(options);

// Widget methods
widget.destroy();                    // Remove widget
widget.extractTextNodes();           // Get current text nodes
widget.exportTranslations();         // Export current translations

// Widget events
window.addEventListener('translator-logout', handler);
window.addEventListener('translator-session-expired', handler);
window.addEventListener('translator-oauth-success', handler);
```

### Translation Data Format

```json
[
  {
    "nodeId": "unique-node-identifier",
    "originalText": "Original text from website",
    "translatedText": "Translated text",
    "lastModified": "2025-01-16T14:40:00Z",
    "pageUrl": "https://example.com/page",
    "status": "approved",
    "version": 1
  }
]
```

## Advanced Features

### Custom Authentication

Replace demo authentication with your own:

```javascript
// src/utils/authUtils.js
export async function authenticateUser(username, password) {
    // Your authentication logic here
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    if (response.ok) {
        const user = await response.json();
        return user;
    }
    
    return null;
}
```

### Custom Text Node Detection

Extend text node detection for specific elements:

```javascript
// src/utils/textNodeUtils.js
const CUSTOM_SELECTORS = [
    '[data-translatable]',
    '.translatable-content',
    // Add your selectors here
];
```

### Webhook Integration

Add webhook support for translation events:

```javascript
// src/services/translationService.js
export async function saveTranslation(translation) {
    // Save locally
    const result = await localSave(translation);
    
    // Send webhook
    if (webhookUrl) {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'translation_saved',
                data: translation
            })
        });
    }
    
    return result;
}
```

## Deployment

### Production Build

```bash
# Install dependencies
npm install

# Build for production
npm run build:all

# Serve static files
# App: dist/app/
# Widget: dist/widget/widget.iife.js
```

### CDN Deployment

```html
<!-- Include from CDN -->
<script 
    src="https://your-cdn.com/translator-widget/v1.0.0/widget.iife.js"
    data-target-website="https://your-website.com">
</script>
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:all
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use React functional components with hooks
- Follow ESLint configuration
- Add tests for new features
- Update documentation for API changes
- Use semantic commit messages

## Troubleshooting

### Common Issues

**Widget not loading:**
- Check that the script URL is correct
- Verify target website matches current domain
- Check browser console for errors

**Authentication issues:**
- Verify demo credentials are correct
- Check localStorage for existing auth data
- Clear browser cache and try again

**Text nodes not detected:**
- Check if elements have meaningful text content
- Verify elements are not excluded by selectors
- Check if MutationObserver is working

**Translation not saving:**
- Check browser localStorage quota
- Verify user has translate permissions
- Check network connectivity for API calls

### Debug Mode

Enable debug mode for detailed logging:

```html
<script 
    src="/widget.iife.js"
    data-debug="true">
</script>
```

Or via environment:

```env
VITE_DEBUG_MODE=true
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review the demo implementation
- Test with the provided demo credentials

## Roadmap

- [ ] Real-time collaboration features
- [ ] Machine translation integration
- [ ] Advanced workflow management
- [ ] Analytics and reporting dashboard
- [ ] Mobile app for translation management
- [ ] API for headless integration
- [ ] Plugin system for extensibility

---

**Built with ❤️ using React 18, Bootstrap 5, and modern web technologies.**
