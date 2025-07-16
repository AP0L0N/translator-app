import { configureStore } from '@reduxjs/toolkit';
import translationReducer from './translationSlice';

const store = configureStore({
  reducer: {
    translations: translationReducer,
  },
});

export { store };