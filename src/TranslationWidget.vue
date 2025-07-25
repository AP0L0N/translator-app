<template>
  <div class="translation-widget">
    <!-- Main floating control panel -->
    <v-card
      v-show="showWidget"
      class="translation-control-panel"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
      elevation="8"
      @mousedown="startDrag"
    >
      <v-card-title class="drag-handle" style="display: flex; align-items: center; justify-content: space-between;">
        <v-icon>mdi-translate</v-icon>
        Translation Widget
        <v-spacer></v-spacer>
        <v-btn
          icon
          size="small"
          class="translation-widget-button"
          @click="toggleWidget"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <div class="d-flex align-center mb-3">
          <v-switch
            v-model="previewMode"
            color="primary"
            label="Preview Mode"
          ></v-switch>
        </div>
        
        <v-btn
          color="primary"
          block
          class="mb-2 translation-widget-button"
          @click="exportTranslations"
        >
          <v-icon left>mdi-download</v-icon>
          Export JSON
        </v-btn>
        
        <v-btn
          color="success"
          block
          class="translation-widget-button"
          @click="exportTranslationsHTML"
        >
          <v-icon left>mdi-file-html-box</v-icon>
          Export HTML
        </v-btn>
        
        <v-divider class="my-3"></v-divider>
        
        <v-btn
          color="info"
          block
          class="mb-2 translation-widget-button"
          @click="importTranslations"
        >
          <v-icon left>mdi-upload</v-icon>
          Import JSON
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Show/hide toggle button when widget is hidden -->
    <v-btn
      v-show="!showWidget"
      class="toggle-button translation-widget-button"
      color="primary"
      fab
      small
      @click="toggleWidget"
    >
      <v-icon>mdi-translate</v-icon>
    </v-btn>



    <!-- Translation Modal -->
    <TranslationModal
      v-model="showModal"
      :original-text="selectedText"
      :existing-translation="existingTranslation"
      @save="onSaveTranslation"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import TranslationModal from './TranslationModal.vue'
import { generateHTMLReport } from './htmlReportGenerator.js'

// We'll import TranslationManager class locally to avoid circular imports
// This is a copy of the class from main.js for use in the component
class TranslationManager {
  constructor() {
    this.observer = null
    this.previewMode = false
    this.originalTexts = new Map()
    this.originalActions = new Map() // Store original click handlers
    this.screenshots = new Map() // Store screenshots for elements
  }

  getTranslations() {
    try {
      return JSON.parse(localStorage.getItem('VUE_TRANSLATIONS_APP_DATA') || '{}')
    } catch {
      return {}
    }
  }

  getMetadata() {
    try {
      return JSON.parse(localStorage.getItem('VUE_TRANSLATIONS_APP_METADATA') || '{}')
    } catch {
      return {}
    }
  }

  getScreenshots() {
    try {
      return JSON.parse(localStorage.getItem('VUE_TRANSLATIONS_APP_SCREENSHOTS') || '{}')
    } catch {
      return {}
    }
  }

  async captureScreenshot(element) {
    try {
      // Import html2canvas dynamically to avoid bundle size issues
      const html2canvas = (await import('html2canvas')).default
      
      // Temporarily hide any modals or overlays that might interfere
      const modals = document.querySelectorAll('.v-overlay, .v-dialog, .modal, [role="dialog"], .translation-widget .v-dialog')
      const originalStyles = []
      
      modals.forEach(modal => {
        originalStyles.push(modal.style.display)
        modal.style.display = 'none'
      })
      
      // Get element bounds
      const rect = element.getBoundingClientRect()
      
      // Create a 600x400 viewport centered on the element
      const width = 600
      const height = 400
      const x = Math.max(0, rect.left + rect.width / 2 - width / 2)
      const y = Math.max(0, rect.top + rect.height / 2 - height / 2)
      
      // Capture the screenshot
      const canvas = await html2canvas(document.body, {
        x: x,
        y: y,
        width: width,
        height: height,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })
      
      // Restore modal visibility
      modals.forEach((modal, index) => {
        modal.style.display = originalStyles[index] || ''
      })
      
      // Convert to base64
      return canvas.toDataURL('image/png')
    } catch (error) {
      console.warn('Failed to capture screenshot:', error)
      return null
    }
  }

  saveTranslation(originalText, translatedText, element) {
    const translations = this.getTranslations()
    const metadata = this.getMetadata()
    const screenshots = this.getScreenshots()
    
    translations[originalText] = translatedText
    
    if (!metadata[originalText]) {
      metadata[originalText] = {
        xpath: this.getXPath(element),
        uri: window.location.href
      }
    }
    
    // Capture screenshot if not already captured
    if (!screenshots[originalText]) {
      // Delay screenshot capture to avoid modal overlay
      setTimeout(() => {
        this.captureScreenshot(element).then(screenshot => {
          if (screenshot) {
            screenshots[originalText] = screenshot
            localStorage.setItem('VUE_TRANSLATIONS_APP_SCREENSHOTS', JSON.stringify(screenshots))
          }
        })
      }, 500) // 0.5 second delay
    }
    
    localStorage.setItem('VUE_TRANSLATIONS_APP_DATA', JSON.stringify(translations))
    localStorage.setItem('VUE_TRANSLATIONS_APP_METADATA', JSON.stringify(metadata))
  }

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

  async exportTranslationsHTML() {
    try {
      const translations = this.getTranslations()
      const metadata = this.getMetadata()
      const screenshots = this.getScreenshots()
      
      // Create a ZIP file to contain HTML and images
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      
      // Create images folder
      const imagesFolder = zip.folder('images')
      
      // Generate HTML content
      const htmlContent = generateHTMLReport(translations, metadata, screenshots, imagesFolder)
      
      // Add HTML file to zip
      zip.file('translations_report.html', htmlContent)
      
      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'translations_with_screenshots.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Failed to export HTML:', error)
      alert('Failed to export HTML file. Please try again.')
    }
  }

  importTranslations() {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.style.display = 'none'
      
      input.onchange = (event) => {
        const file = event.target.files[0]
        if (!file) {
          reject(new Error('No file selected'))
          return
        }
        
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const importData = JSON.parse(e.target.result)
            
            // Validate the import data structure
            if (!Array.isArray(importData)) {
              throw new Error('Invalid file format. Expected an array of translation objects.')
            }
            
            const translations = this.getTranslations()
            const metadata = this.getMetadata()
            let importedCount = 0
            
            importData.forEach(item => {
              if (item.originalText && item.translatedText) {
                translations[item.originalText] = item.translatedText
                importedCount++
                
                // Import metadata if available
                if (item.xpath || item.uri) {
                  metadata[item.originalText] = {
                    xpath: item.xpath || '',
                    uri: item.uri || window.location.href
                  }
                }
              }
            })
            
            // Save to localStorage
            localStorage.setItem('VUE_TRANSLATIONS_APP_DATA', JSON.stringify(translations))
            localStorage.setItem('VUE_TRANSLATIONS_APP_METADATA', JSON.stringify(metadata))
            
            // Clean up
            document.body.removeChild(input)
            
            resolve(importedCount)
          } catch (error) {
            document.body.removeChild(input)
            reject(error)
          }
        }
        
        reader.onerror = () => {
          document.body.removeChild(input)
          reject(new Error('Failed to read file'))
        }
        
        reader.readAsText(file)
      }
      
      // Add input to DOM and trigger file selection
      document.body.appendChild(input)
      input.click()
    })
  }


  getXPath(element) {
    if (element === document.body) {
      return '/html/body'
    }
    
    let ix = 0
    const siblings = element.parentNode.childNodes
    
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i]
      if (sibling === element) {
        const tagName = element.tagName.toLowerCase()
        return this.getXPath(element.parentNode) + '/' + tagName + '[' + (ix + 1) + ']'
      }
      if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
        ix++
      }
    }
  }

  getTranslatableElements() {
    const selectors = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'li', 'button', 'th', 'td']
    const elements = []
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        if (element.closest('script') || element.closest('style')) return
        
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

  storeOriginalText(element) {
    const text = element.textContent.trim()
    if (!this.originalTexts.has(element)) {
      this.originalTexts.set(element, text)
    }
  }

  applyTranslation(element) {
    const originalText = this.originalTexts.get(element) || element.textContent.trim()
    const translations = this.getTranslations()
    const translation = translations[originalText]
    
    if (translation) {
      element.textContent = translation
    }
  }

  revertTranslation(element) {
    const originalText = this.originalTexts.get(element)
    if (originalText) {
      element.textContent = originalText
    } else {
      console.warn('No original text found for element:', element)
    }
  }

  togglePreviewMode(enabled) {
    this.previewMode = enabled
    const elements = this.getTranslatableElements()
    
    elements.forEach(element => {
      // Only store original text if we don't already have it
      if (!this.originalTexts.has(element)) {
        this.storeOriginalText(element)
      }
      
      if (enabled) {
        this.applyTranslation(element)
      } else {
        this.revertTranslation(element)
      }
    })
  }

  startObserving() {
    if (this.observer) return
    
    this.observer = new MutationObserver((mutations) => {
      if (!this.previewMode) return
      
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
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

  stopObserving() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }

  // Disable interactive elements (links, buttons) to allow translation
  disableInteractiveElements() {
    const interactiveElements = document.querySelectorAll('a, button, input[type="button"], input[type="submit"]')
    
    interactiveElements.forEach(element => {
      // Skip translation widget's own elements
      if (element.closest('.translation-widget')) {
        return
      }

      // Skip translation widget buttons
      if (element.classList.contains('translation-widget-button')) {
        return
      }
      
      // Skip elements already disabled
      if (element.hasAttribute('data-translation-disabled')) {
        return
      }
      
      // Store original click handler if it exists
      if (element.onclick || element._clickHandler) {
        this.originalActions.set(element, element.onclick || element._clickHandler)
      }
      
      // Store original href for links
      if (element.tagName === 'A' && element.href) {
        this.originalActions.set(element, { type: 'href', value: element.href })
      }
      
      // Disable the element by removing click handlers and adding visual indication
      element.onclick = null
      element.style.opacity = '0.7'
      element.style.cursor = 'pointer' // Keep pointer cursor for translation
      element.style.pointerEvents = 'none' // Prevent blocking text nodes below
      element.setAttribute('data-translation-disabled', 'true')
      
      // For links, prevent navigation
      if (element.tagName === 'A') {
        element.href = 'javascript:void(0)'
        element.target = ''
      }
      
      // For buttons, prevent form submission
      if (element.tagName === 'BUTTON') {
        element.type = 'button'
      }
    })
  }

  // Re-enable interactive elements
  enableInteractiveElements() {
    const interactiveElements = document.querySelectorAll('[data-translation-disabled="true"]')
    
    interactiveElements.forEach(element => {
      // Restore original click handler or href
      const originalAction = this.originalActions.get(element)
      if (originalAction) {
        if (typeof originalAction === 'function') {
          element.onclick = originalAction
        } else if (originalAction.type === 'href') {
          element.href = originalAction.value
        }
      }
      
      // Re-enable the element
      element.style.opacity = ''
      element.style.cursor = ''
      element.style.pointerEvents = '' // Restore original pointer-events
      element.removeAttribute('data-translation-disabled')
      
      // Restore button type if it was changed
      if (element.tagName === 'BUTTON' && element.type === 'button') {
        // We can't know the original type, so we'll leave it as button
        // This is a limitation but better than breaking functionality
      }
    })
  }
}

export default {
  name: 'TranslationWidget',
  components: {
    TranslationModal
  },
  setup() {
    // Reactive data
    const showWidget = ref(false)
    const previewMode = ref(true)
    const position = ref({ x: 20, y: 20 })
    const isDragging = ref(false)
    const dragOffset = ref({ x: 0, y: 0 })
    const showModal = ref(false)
    const selectedText = ref('')
    const selectedElement = ref(null)
    const existingTranslation = ref('')

    // Translation manager instance
    const translationManager = new TranslationManager()

    // Watch for preview mode changes
    watch(previewMode, (newValue) => {
      translationManager.togglePreviewMode(newValue)
      if (newValue) {
        translationManager.startObserving()
      } else {
        translationManager.stopObserving()
      }
    })

    // Dragging functionality
    const startDrag = (event) => {
      if (event.target.closest('.drag-handle')) {
        isDragging.value = true
        dragOffset.value = {
          x: event.clientX - position.value.x,
          y: event.clientY - position.value.y
        }
        document.addEventListener('mousemove', onDrag)
        document.addEventListener('mouseup', stopDrag)
      }
    }

    const onDrag = (event) => {
      if (isDragging.value) {
        position.value = {
          x: event.clientX - dragOffset.value.x,
          y: event.clientY - dragOffset.value.y
        }
      }
    }

    const stopDrag = () => {
      isDragging.value = false
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', stopDrag)
    }

    // Widget visibility toggle
    const toggleWidget = () => {
      showWidget.value = !showWidget.value
      
      if (showWidget.value) {
        // Widget is now active - disable interactive elements
        translationManager.disableInteractiveElements()
      } else {
        // Widget is now inactive - re-enable interactive elements
        translationManager.enableInteractiveElements()
      }
    }

    // Keyboard event handling for spacebar activation
    const handleKeydown = (event) => {
      // Only listen for spacebar when widget is disabled
      if (!showWidget.value && event.code === 'Space') {
        // Check if user is not typing in an input field, textarea, or contenteditable element
        const activeElement = document.activeElement
        const isTyping = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.contentEditable === 'true' ||
          activeElement.isContentEditable
        )
        
        // Don't activate if user is typing
        if (!isTyping) {
          event.preventDefault()
          toggleWidget()
        }
      }
    }



    // Export functionality
    const exportTranslations = () => {
      translationManager.exportTranslations()
    }

    const exportTranslationsHTML = () => {
      translationManager.exportTranslationsHTML()
    }

    const importTranslations = async () => {
      try {
        const importedCount = await translationManager.importTranslations()
        
        // Show success message
        alert(`Successfully imported ${importedCount} translations!`)
        
        // If preview mode is on, refresh the translations on the page
        if (previewMode.value) {
          const elements = translationManager.getTranslatableElements()
          elements.forEach(element => {
            translationManager.applyTranslation(element)
          })
        }
      } catch (error) {
        console.error('Import failed:', error)
        alert(`Import failed: ${error.message}`)
      }
    }

    // Click to translate functionality
    const handleElementClick = (element, event) => {
      // Skip translation widget's own elements
      if (element.closest('.translation-widget')) {
        return
      }
      
      // Only handle clicks when widget is visible and modal is not open
      if (!showWidget.value || showModal.value) {
        // Allow normal behavior when widget is hidden
        return
      }
      
      // For interactive elements, only handle clicks when widget is active
      if (element.tagName === 'A' || element.tagName === 'BUTTON' || element.tagName === 'INPUT') {
        // Check if the element is disabled by our translation system
        if (!element.hasAttribute('data-translation-disabled')) {
          // Element is not disabled, allow normal behavior
          return
        }
        
        // Element is disabled, prevent default behavior and open modal
        event.preventDefault()
        event.stopPropagation()
        openEditModal(element)
      } else {
        // For non-interactive elements, always open modal when widget is active
        openEditModal(element)
      }
    }

    // Modal functionality
    const openEditModal = (element) => {
      selectedElement.value = element
      
      // Always get the original text, not the current displayed text
      const originalText = translationManager.originalTexts.get(element) || element.textContent.trim()
      selectedText.value = originalText
      
      const translations = translationManager.getTranslations()
      existingTranslation.value = translations[originalText] || ''
      
      showModal.value = true
    }

    const onSaveTranslation = (translatedText) => {
      if (selectedElement.value && selectedText.value) {
        translationManager.saveTranslation(
          selectedText.value,
          translatedText,
          selectedElement.value
        )
        
        // If preview mode is on, apply the translation immediately
        if (previewMode.value) {
          translationManager.applyTranslation(selectedElement.value)
        }
      }
      
      showModal.value = false
      selectedElement.value = null
      selectedText.value = ''
      existingTranslation.value = ''
    }

    // Add click listeners to translatable elements
    const addClickListeners = () => {
      const elements = translationManager.getTranslatableElements()
      
      elements.forEach(element => {
        element.addEventListener('click', (event) => {
          handleElementClick(element, event)
        })
      })
    }

    // Remove click listeners (for cleanup)
    const removeClickListeners = () => {
      const elements = translationManager.getTranslatableElements()
      elements.forEach(element => {
        element.removeEventListener('click', handleElementClick)
      })
    }



    // Lifecycle hooks
    onMounted(() => {
      // Store original texts for all translatable elements BEFORE enabling preview mode
      const elements = translationManager.getTranslatableElements()
      elements.forEach(element => {
        translationManager.storeOriginalText(element)
      })
      
      addClickListeners()
      
      // Initialize preview mode (enabled by default) AFTER storing original texts
      translationManager.togglePreviewMode(true)
      translationManager.startObserving()
      
      // Only disable interactive elements if widget is actually visible
      if (showWidget.value) {
        translationManager.disableInteractiveElements()
      }
      
      // Add keyboard event listener for spacebar activation
      document.addEventListener('keydown', handleKeydown)
      
      // Re-add listeners when new content is added
      const observer = new MutationObserver(() => {
        setTimeout(() => {
          addClickListeners()
          // Also store original texts for new elements
          const newElements = translationManager.getTranslatableElements()
          newElements.forEach(element => {
            translationManager.storeOriginalText(element)
          })
          
          // Disable new interactive elements if widget is active
          if (showWidget.value) {
            translationManager.disableInteractiveElements()
          }
        }, 100)
      })
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      })
    })

    onUnmounted(() => {
      removeClickListeners()
      translationManager.stopObserving()
      translationManager.enableInteractiveElements()
      // Remove keyboard event listener
      document.removeEventListener('keydown', handleKeydown)
    })

    return {
      showWidget,
      previewMode,
      position,
      showModal,
      selectedText,
      existingTranslation,
      startDrag,
      toggleWidget,
      exportTranslations,
      exportTranslationsHTML,
      importTranslations,
      openEditModal,
      onSaveTranslation
    }
  }
}
</script>

<style scoped>
.translation-widget {
  position: relative;
  z-index: 999999;
}

.translation-control-panel {
  position: fixed;
  width: 280px;
  z-index: 999999;
  cursor: move;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
}

.translation-control-panel .drag-handle {
  cursor: move;
  user-select: none;
  font-size: 14px;
  padding: 8px 16px;
}

.toggle-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999999;
}



/* Ensure the widget styles don't conflict with host page */
.translation-widget * {
  box-sizing: border-box;
}
</style>