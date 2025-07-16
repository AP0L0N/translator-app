import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  languages: [],
  currentLanguage: '',
  translations: {},
  isAuthenticated: false,
};

const translationSlice = createSlice({
  name: 'translations',
  initialState,
  reducers: {
    setLanguages: (state, action) => {
      state.languages = action.payload;
    },
    setCurrentLanguage: (state, action) => {
      state.currentLanguage = action.payload;
    },
    loadTranslations: (state, action) => {
      const { lang, data } = action.payload;
      state.translations[lang] = data;
    },
    addOrUpdateTranslation: (state, action) => {
      const { lang, translation } = action.payload;
      if (!state.translations[lang]) state.translations[lang] = [];
      const index = state.translations[lang].findIndex(t => t.nodeId === translation.nodeId && t.pageUrl === translation.pageUrl);
      if (index !== -1) {
        const existing = state.translations[lang][index];
        if (existing.translatedText !== translation.translatedText) {
          if (!existing.versions) existing.versions = [];
          existing.versions.push({ translatedText: existing.translatedText, lastModified: existing.lastModified });
        }
        state.translations[lang][index] = { ...translation, versions: existing.versions || [] };
      } else {
        state.translations[lang].push(translation);
      }
    },
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
  },
});

export const { setLanguages, setCurrentLanguage, loadTranslations, addOrUpdateTranslation, setAuthenticated } = translationSlice.actions;
export default translationSlice.reducer;