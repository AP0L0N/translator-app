import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import Widget from './Widget';
import 'bootstrap/dist/css/bootstrap.min.css';

const rootDiv = document.createElement('div');
rootDiv.id = 'translation-widget-root';
rootDiv.style.position = 'fixed';
rootDiv.style.top = '0';
rootDiv.style.left = '0';
rootDiv.style.width = '0';
rootDiv.style.height = '0';
rootDiv.style.zIndex = '9999';
document.body.appendChild(rootDiv);

const root = createRoot(rootDiv);
root.render(
  <Provider store={store}>
    <Widget />
  </Provider>
);

const style = document.createElement('style');
style.innerHTML = `
  .untranslated {
    border: 1px solid red !important;
  }
`;
document.head.appendChild(style);