import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import TranslationWidget from './TranslationWidget.vue'

// Storage keys for the translation data
export const STORAGE_KEYS = {
  DATA: 'VUE_TRANSLATIONS_APP_DATA',
  METADATA: 'VUE_TRANSLATIONS_APP_METADATA'
}

// Utility function to generate XPath for an element
export function getXPath(element) {
  if (element === document.body) {
    return '/html/body'
  }
  
  let ix = 0
  const siblings = element.parentNode.childNodes
  
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i]
    if (sibling === element) {
      const tagName = element.tagName.toLowerCase()
      return getXPath(element.parentNode) + '/' + tagName + '[' + (ix + 1) + ']'
    }
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      ix++
    }
  }
}

// Translation data manager
export class TranslationManager {
  constructor() {
    this.observer = null
    this.previewMode = false
    this.originalTexts = new Map()
  }

  // Get translations from localStorage
  getTranslations() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.DATA) || '{}')
    } catch {
      return {}
    }
  }

  // Get metadata from localStorage
  getMetadata() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.METADATA) || '{}')
    } catch {
      return {}
    }
  }

  // Save translation and metadata
  saveTranslation(originalText, translatedText, element) {
    const translations = this.getTranslations()
    const metadata = this.getMetadata()
    
    translations[originalText] = translatedText
    
    if (!metadata[originalText]) {
      metadata[originalText] = {
        xpath: getXPath(element),
        uri: window.location.href
      }
    }
    
    localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(translations))
    localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(metadata))
  }

  // Export translations as JSON
  exportTranslations() {
    const translations = this.getTranslations()
    const metadata = this.getMetadata()
    
    const exportData = Object.keys(translations).map(originalText => ({
      originalText,
      translatedText: translations[originalText],
      xpath: metadata[originalText]?.xpath || '',
      uri: metadata[originalText]?.uri || window.location.href
    }))
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'translations.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Get translatable elements
  getTranslatableElements() {
    const selectors = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'li', 'button', 'th', 'td']
    const elements = []
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        // Skip if inside script or style tags
        if (element.closest('script') || element.closest('style')) return
        
        // Only include elements with direct text content (not just child elements)
        const directText = Array.from(element.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .map(node => node.textContent.trim())
          .join(' ')
          .trim()
        
        if (directText.length > 0) {
          elements.push(element)
        }
      })
    })
    
    return elements
  }

  // Store original text content
  storeOriginalText(element) {
    const text = element.textContent.trim()
    if (!this.originalTexts.has(element)) {
      this.originalTexts.set(element, text)
    }
  }

  // Apply translation to element
  applyTranslation(element) {
    const originalText = this.originalTexts.get(element) || element.textContent.trim()
    const translations = this.getTranslations()
    const translation = translations[originalText]
    
    if (translation) {
      element.textContent = translation
    }
  }

  // Revert element to original text
  revertTranslation(element) {
    const originalText = this.originalTexts.get(element)
    if (originalText) {
      element.textContent = originalText
    }
  }

  // Toggle preview mode
  togglePreviewMode(enabled) {
    this.previewMode = enabled
    const elements = this.getTranslatableElements()
    
    elements.forEach(element => {
      this.storeOriginalText(element)
      if (enabled) {
        this.applyTranslation(element)
      } else {
        this.revertTranslation(element)
      }
    })
  }

  // Start observing DOM changes
  startObserving() {
    if (this.observer) return
    
    this.observer = new MutationObserver((mutations) => {
      if (!this.previewMode) return
      
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check the added node and its descendants
            const elements = [node, ...node.querySelectorAll('*')]
            elements.forEach(el => {
              if (this.getTranslatableElements().includes(el)) {
                this.storeOriginalText(el)
                this.applyTranslation(el)
              }
            })
          }
        })
      })
    })
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  // Stop observing
  stopObserving() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }
}

// Initialize the widget when the script loads
function initializeWidget() {
  // Prevent multiple initializations
  if (window.translationWidget) {
    return
  }

  // Create a container for the widget
  const widgetContainer = document.createElement('div')
  widgetContainer.id = 'translation-widget-container'
  document.body.appendChild(widgetContainer)

  // Create Vuetify instance
  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: 'light'
    }
  })

  // Create and mount the Vue app
  const app = createApp(TranslationWidget)
  app.use(vuetify)
  
  const instance = app.mount(widgetContainer)
  
  // Store reference to prevent re-initialization
  window.translationWidget = instance
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWidget)
} else {
  initializeWidget()
}