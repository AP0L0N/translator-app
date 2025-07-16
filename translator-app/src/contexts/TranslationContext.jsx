import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import languagesConfig from '../../config/languages.json';

// Action types
const TRANSLATION_ACTIONS = {
  SET_CURRENT_LANGUAGE: 'SET_CURRENT_LANGUAGE',
  SET_TRANSLATIONS: 'SET_TRANSLATIONS',
  ADD_TRANSLATION: 'ADD_TRANSLATION',
  UPDATE_TRANSLATION: 'UPDATE_TRANSLATION',
  DELETE_TRANSLATION: 'DELETE_TRANSLATION',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  SET_TEXT_NODES: 'SET_TEXT_NODES',
  SET_CURRENT_PAGE_URL: 'SET_CURRENT_PAGE_URL'
};

// Initial state
const initialState = {
  currentLanguage: languagesConfig.defaultLanguage,
  languages: languagesConfig.languages,
  translations: {},
  textNodes: [],
  currentPageUrl: '',
  isLoading: false,
  error: null,
  isAuthenticated: false,
  user: null
};

// Reducer
function translationReducer(state, action) {
  switch (action.type) {
    case TRANSLATION_ACTIONS.SET_CURRENT_LANGUAGE:
      return {
        ...state,
        currentLanguage: action.payload
      };
    
    case TRANSLATION_ACTIONS.SET_TRANSLATIONS:
      return {
        ...state,
        translations: {
          ...state.translations,
          [action.payload.language]: action.payload.translations
        }
      };
    
    case TRANSLATION_ACTIONS.ADD_TRANSLATION:
      const newTranslation = {
        ...action.payload,
        nodeId: action.payload.nodeId || uuidv4(),
        lastModified: new Date().toISOString(),
        version: 1,
        status: 'pending'
      };
      
      return {
        ...state,
        translations: {
          ...state.translations,
          [state.currentLanguage]: [
            ...(state.translations[state.currentLanguage] || []),
            newTranslation
          ]
        }
      };
    
    case TRANSLATION_ACTIONS.UPDATE_TRANSLATION:
      return {
        ...state,
        translations: {
          ...state.translations,
          [state.currentLanguage]: state.translations[state.currentLanguage]?.map(
            translation => 
              translation.nodeId === action.payload.nodeId
                ? {
                    ...translation,
                    ...action.payload,
                    lastModified: new Date().toISOString(),
                    version: translation.version + 1
                  }
                : translation
          ) || []
        }
      };
    
    case TRANSLATION_ACTIONS.DELETE_TRANSLATION:
      return {
        ...state,
        translations: {
          ...state.translations,
          [state.currentLanguage]: state.translations[state.currentLanguage]?.filter(
            translation => translation.nodeId !== action.payload
          ) || []
        }
      };
    
    case TRANSLATION_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case TRANSLATION_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case TRANSLATION_ACTIONS.SET_AUTHENTICATED:
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user || null
      };
    
    case TRANSLATION_ACTIONS.SET_TEXT_NODES:
      return {
        ...state,
        textNodes: action.payload
      };
    
    case TRANSLATION_ACTIONS.SET_CURRENT_PAGE_URL:
      return {
        ...state,
        currentPageUrl: action.payload
      };
    
    default:
      return state;
  }
}

// Create context
const TranslationContext = createContext();

// Provider component
export function TranslationProvider({ children }) {
  const [state, dispatch] = useReducer(translationReducer, initialState);

  // Load translations from localStorage or API
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        dispatch({ type: TRANSLATION_ACTIONS.SET_LOADING, payload: true });
        
        // Load translations for each language
        for (const language of state.languages) {
          try {
            // First try localStorage
            const stored = localStorage.getItem(`translations_${language.code}`);
            if (stored) {
              const translations = JSON.parse(stored);
              dispatch({
                type: TRANSLATION_ACTIONS.SET_TRANSLATIONS,
                payload: { language: language.code, translations }
              });
            } else {
              // Fallback to loading from public folder
              const response = await fetch(`/translations/${language.code}.json`);
              if (response.ok) {
                const translations = await response.json();
                dispatch({
                  type: TRANSLATION_ACTIONS.SET_TRANSLATIONS,
                  payload: { language: language.code, translations }
                });
              }
            }
          } catch (error) {
            console.warn(`Failed to load translations for ${language.code}:`, error);
          }
        }
      } catch (error) {
        dispatch({ type: TRANSLATION_ACTIONS.SET_ERROR, payload: error.message });
      } finally {
        dispatch({ type: TRANSLATION_ACTIONS.SET_LOADING, payload: false });
      }
    };

    loadTranslations();
  }, []);

  // Save translations to localStorage whenever they change
  useEffect(() => {
    Object.entries(state.translations).forEach(([language, translations]) => {
      if (translations && translations.length > 0) {
        localStorage.setItem(`translations_${language}`, JSON.stringify(translations));
      }
    });
  }, [state.translations]);

  const value = {
    ...state,
    dispatch,
    actions: TRANSLATION_ACTIONS
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

// Custom hook
export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}