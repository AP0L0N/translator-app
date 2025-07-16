import React from 'react';
import { createRoot } from 'react-dom/client';

import { TranslationProvider } from '../contexts/TranslationContext';
import TranslationWidget from '../components/TranslationWidget';

// Function to dynamically load CSS
function loadCSS(href, id) {
  return new Promise((resolve, reject) => {
    // Check if CSS is already loaded
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

// Widget initialization function
function initTranslationWidget(options = {}) {
  // Default configuration
  const config = {
    containerId: 'translator-widget-root',
    targetWebsite: import.meta.env.VITE_TARGET_WEBSITE_URL || window.location.origin,
    autoStart: true,
    debug: import.meta.env.VITE_DEBUG_MODE === 'true',
    ...options
  };

  if (config.debug) {
    console.log('Translation Widget: Initializing with config:', config);
  }

  // Check if we're on the target website
  const currentHost = window.location.hostname;
  const targetHost = new URL(config.targetWebsite).hostname;
  
  if (currentHost !== targetHost && !config.debug && import.meta.env.MODE !== 'development') {
    console.warn(`Translation Widget: Not loading on ${currentHost}, configured for ${targetHost}`);
    return null;
  }

  // Load required CSS files
  const cssPromises = [];
  
  // Try to load Bootstrap CSS from CDN
  cssPromises.push(
    loadCSS('https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css', 'bootstrap-css')
      .catch(() => {
        console.warn('Translation Widget: Failed to load Bootstrap CSS from CDN');
      })
  );
  
  // Try to load Bootstrap Icons from CDN
  cssPromises.push(
    loadCSS('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css', 'bootstrap-icons-css')
      .catch(() => {
        console.warn('Translation Widget: Failed to load Bootstrap Icons from CDN');
      })
  );

  // Wait for CSS to load, then initialize widget
  Promise.allSettled(cssPromises).then(() => {
    // Create widget container if it doesn't exist
    let container = document.getElementById(config.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = config.containerId;
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;
      document.body.appendChild(container);
    }

    // Create React root and render widget
    const root = createRoot(container);
    
    const WidgetApp = () => (
      <TranslationProvider>
        <TranslationWidget />
      </TranslationProvider>
    );

    root.render(<WidgetApp />);

    if (config.debug) {
      console.log('Translation Widget: Initialized successfully');
    }

    // Return control object
    const widget = {
      destroy() {
        root.unmount();
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      },
      
      config,
      
      // Expose some utility methods
      extractTextNodes() {
        return import('../utils/textNodeUtils').then(module => module.extractTextNodes());
      },
      
      exportTranslations() {
        return import('../services/translationService').then(module => {
          const translations = JSON.parse(localStorage.getItem('translations_en') || '[]');
          return module.exportTranslations({ en: translations });
        });
      }
    };

    // Store widget reference globally
    window.TranslationWidget = widget;
    
    return widget;
  });
}

// Auto-initialize if DOM is ready
function autoInit() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
    return;
  }

  // Check for configuration from script tag
  const scriptTag = document.querySelector('script[src*="widget.js"], script[src*="widget.iife.js"]');
  const scriptConfig = {};
  
  if (scriptTag) {
    // Extract configuration from data attributes
    if (scriptTag.dataset.targetWebsite) {
      scriptConfig.targetWebsite = scriptTag.dataset.targetWebsite;
    }
    if (scriptTag.dataset.debug) {
      scriptConfig.debug = scriptTag.dataset.debug === 'true';
    }
    if (scriptTag.dataset.autoStart === 'false') {
      scriptConfig.autoStart = false;
    }
  }

  // Auto-start unless explicitly disabled
  if (scriptConfig.autoStart !== false) {
    initTranslationWidget(scriptConfig);
  }
}

// Initialize when DOM is ready
autoInit();

// Expose the initialization function globally
window.initTranslationWidget = initTranslationWidget;

// Export for module usage
export default initTranslationWidget;