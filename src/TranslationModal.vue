<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600px"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5">
        <v-icon class="mr-3">mdi-translate</v-icon>
        Edit Translation
      </v-card-title>

      <v-card-text>
        <div class="mb-4">
          <v-label class="text-subtitle-1 font-weight-medium mb-2">
            Original Text
          </v-label>
          <v-card
            variant="outlined"
            class="pa-3 bg-grey-lighten-5"
          >
            <div class="text-body-1">{{ originalText }}</div>
          </v-card>
        </div>

        <div>
          <div class="d-flex align-center justify-space-between mb-2">
            <v-label class="text-subtitle-1 font-weight-medium">
              Translation
            </v-label>
            <v-btn
              color="secondary"
              variant="text"
              size="small"
              :disabled="!!translatedText.trim() || !originalText.trim()"
              @click="copyOriginal"
              class="translation-widget-button"
            >
              <v-icon left size="small">mdi-content-copy</v-icon>
              Copy original
            </v-btn>
          </div>
          <v-textarea
            v-model="translatedText"
            placeholder="Enter your translation here..."
            variant="outlined"
            rows="4"
            auto-grow
            counter
            @keydown.ctrl.enter="save"
            @keydown.meta.enter="save"
          ></v-textarea>
        </div>

        <!-- Extra Note Field -->
        <div class="mt-4">
          <v-label class="text-subtitle-1 font-weight-medium mb-2">
            Extra Note (Optional)
          </v-label>
          <v-textarea
            v-model="extraNote"
            placeholder="Add any additional notes about this translation..."
            variant="outlined"
            rows="2"
            auto-grow
            counter
          ></v-textarea>
        </div>

        <!-- Mark for Removal Checkbox -->
        <div class="mt-4">
          <v-checkbox
            v-model="markForRemoval"
            color="warning"
            label="Mark this text for removal"
            hide-details
          ></v-checkbox>
        </div>

        <div class="text-caption text-grey">
          <v-icon size="small" class="mr-1">mdi-lightbulb-outline</v-icon>
          Tip: Press Ctrl+Enter (or Cmd+Enter) to save quickly
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="grey"
          variant="text"
          @click="cancel"
          class="translation-widget-button"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :disabled="!translatedText.trim()"
          @click="save"
          class="translation-widget-button"
        >
          <v-icon left>mdi-content-save</v-icon>
          Save Translation
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref, watch, onMounted, onUnmounted } from 'vue'

export default {
  name: 'TranslationModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    originalText: {
      type: String,
      default: ''
    },
    existingTranslation: {
      type: String,
      default: ''
    },
    extraNote: {
      type: String,
      default: ''
    },
    markForRemoval: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'save'],
  setup(props, { emit }) {
    const translatedText = ref('')
    const extraNote = ref('')
    const markForRemoval = ref(false)

    // Watch for existing translation changes and update the input
    watch(
      () => props.existingTranslation,
      (newVal) => {
        translatedText.value = newVal
      },
      { immediate: true }
    )

    // Watch for extra note changes and update the input
    watch(
      () => props.extraNote,
      (newVal) => {
        extraNote.value = newVal || ''
      },
      { immediate: true }
    )

    // Watch for mark for removal changes and update the input
    watch(
      () => props.markForRemoval,
      (newVal) => {
        markForRemoval.value = newVal || false
      },
      { immediate: true }
    )

    // Reset when modal opens
    watch(
      () => props.modelValue,
      (isOpen) => {
        if (isOpen) {
          translatedText.value = props.existingTranslation
          extraNote.value = props.extraNote || ''
          markForRemoval.value = props.markForRemoval || false
        }
      }
    )

    const save = () => {
      if (translatedText.value.trim()) {
        emit('save', {
          translatedText: translatedText.value.trim(),
          extraNote: extraNote.value.trim(),
          markForRemoval: markForRemoval.value
        })
      }
    }

    const cancel = () => {
      emit('update:modelValue', false)
      translatedText.value = props.existingTranslation
      extraNote.value = props.extraNote || ''
      markForRemoval.value = props.markForRemoval || false
    }

    const copyOriginal = () => {
      if (!translatedText.value.trim() && props.originalText.trim()) {
        translatedText.value = props.originalText
      }
    }

    // ESC key handler
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        cancel()
      }
    }

    onMounted(() => {
      document.addEventListener('keydown', handleEscKey)
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleEscKey)
    })

    return {
      translatedText,
      extraNote,
      markForRemoval,
      save,
      cancel,
      copyOriginal
    }
  }
}
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.v-card-title {
  background: linear-gradient(45deg, #1976d2, #42a5f5);
  color: white;
}

.text-caption {
  margin-top: 8px;
}
</style>