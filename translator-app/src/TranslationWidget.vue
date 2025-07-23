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
      <v-card-title class="drag-handle">
        <v-icon>mdi-translate</v-icon>
        Translation Widget
        <v-spacer></v-spacer>
        <v-btn
          icon
          size="small"
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
            @change="onPreviewModeChange"
          ></v-switch>
        </div>
        
        <v-btn
          color="primary"
          block
          @click="exportTranslations"
        >
          <v-icon left>mdi-download</v-icon>
          Export Translations
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Show/hide toggle button when widget is hidden -->
    <v-btn
      v-show="!showWidget"
      class="toggle-button"
      color="primary"
      fab
      small
      @click="toggleWidget"
    >
      <v-icon>mdi-translate</v-icon>
    </v-btn>

    <!-- Edit icons for hoverable elements -->
    <div
      v-for="(icon, index) in editIcons"
      :key="index"
      class="edit-icon"
      :style="{ left: icon.x + 'px', top: icon.y + 'px' }"
    >
      <v-btn
        size="small"
        color="primary"
        icon
        @click="openEditModal(icon.element)"
      >
        <v-icon size="16">mdi-pencil</v-icon>
      </v-btn>
    </div>

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
import { ref, onMounted, onUnmounted } from 'vue'
import TranslationModal from './TranslationModal.vue'

// We'll import TranslationManager class locally to avoid circular imports
// This is a copy of the class from main.js for use in the component
class TranslationManager {
  constructor() {
    this.observer = null
    this.previewMode = false
    this.originalTexts = new Map()
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

  saveTranslation(originalText, translatedText, element) {
    const translations = this.getTranslations()
    const metadata = this.getMetadata()
    
    translations[originalText] = translatedText
    
    if (!metadata[originalText]) {
      metadata[originalText] = {
        xpath: this.getXPath(element),
        uri: window.location.href
      }
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
    }
  }

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
}

export default {
  name: 'TranslationWidget',
  components: {
    TranslationModal
  },
  setup() {
    // Reactive data
    const showWidget = ref(true)
    const previewMode = ref(false)
    const position = ref({ x: 20, y: 20 })
    const isDragging = ref(false)
    const dragOffset = ref({ x: 0, y: 0 })
    const editIcons = ref([])
    const showModal = ref(false)
    const selectedText = ref('')
    const selectedElement = ref(null)
    const existingTranslation = ref('')

    // Translation manager instance
    const translationManager = new TranslationManager()

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
      if (!showWidget.value) {
        hideEditIcons()
      }
    }

    // Preview mode toggle
    const onPreviewModeChange = (enabled) => {
      translationManager.togglePreviewMode(enabled)
      if (enabled) {
        translationManager.startObserving()
      } else {
        translationManager.stopObserving()
      }
    }

    // Export functionality
    const exportTranslations = () => {
      translationManager.exportTranslations()
    }

    // Edit icons management
    const showEditIcon = (element, event) => {
      if (!showWidget.value) return
      
      const rect = element.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
      
      editIcons.value = [{
        element,
        x: rect.right + scrollLeft + 5,
        y: rect.top + scrollTop
      }]
    }

    const hideEditIcons = () => {
      editIcons.value = []
    }

    // Modal functionality
    const openEditModal = (element) => {
      selectedElement.value = element
      selectedText.value = element.textContent.trim()
      
      const translations = translationManager.getTranslations()
      existingTranslation.value = translations[selectedText.value] || ''
      
      showModal.value = true
      hideEditIcons()
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
          selectedElement.value.textContent = translatedText
        }
      }
      
      showModal.value = false
      selectedElement.value = null
      selectedText.value = ''
      existingTranslation.value = ''
    }

    // Add hover listeners to translatable elements
    const addHoverListeners = () => {
      const elements = translationManager.getTranslatableElements()
      
      elements.forEach(element => {
        element.addEventListener('mouseenter', (event) => {
          showEditIcon(element, event)
        })
        
        element.addEventListener('mouseleave', () => {
          // Delay hiding to allow clicking the edit icon
          setTimeout(hideEditIcons, 100)
        })
      })
    }

    // Remove hover listeners (for cleanup)
    const removeHoverListeners = () => {
      const elements = translationManager.getTranslatableElements()
      elements.forEach(element => {
        element.removeEventListener('mouseenter', showEditIcon)
        element.removeEventListener('mouseleave', hideEditIcons)
      })
    }

    // Lifecycle hooks
    onMounted(() => {
      addHoverListeners()
      
      // Re-add listeners when new content is added
      const observer = new MutationObserver(() => {
        setTimeout(addHoverListeners, 100)
      })
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      })
    })

    onUnmounted(() => {
      removeHoverListeners()
      translationManager.stopObserving()
    })

    return {
      showWidget,
      previewMode,
      position,
      editIcons,
      showModal,
      selectedText,
      existingTranslation,
      startDrag,
      toggleWidget,
      onPreviewModeChange,
      exportTranslations,
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

.edit-icon {
  position: absolute;
  z-index: 999998;
  pointer-events: auto;
}

/* Ensure the widget styles don't conflict with host page */
.translation-widget * {
  box-sizing: border-box;
}
</style>