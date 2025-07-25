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
          <v-label class="text-subtitle-1 font-weight-medium mb-2">
            Translation
          </v-label>
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
import { ref, watch } from 'vue'

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
    }
  },
  emits: ['update:modelValue', 'save'],
  setup(props, { emit }) {
    const translatedText = ref('')

    // Watch for existing translation changes and update the input
    watch(
      () => props.existingTranslation,
      (newVal) => {
        translatedText.value = newVal
      },
      { immediate: true }
    )

    // Reset when modal opens
    watch(
      () => props.modelValue,
      (isOpen) => {
        if (isOpen) {
          translatedText.value = props.existingTranslation
        }
      }
    )

    const save = () => {
      if (translatedText.value.trim()) {
        emit('save', translatedText.value.trim())
      }
    }

    const cancel = () => {
      emit('update:modelValue', false)
      translatedText.value = props.existingTranslation
    }

    return {
      translatedText,
      save,
      cancel
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