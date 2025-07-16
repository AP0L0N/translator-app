import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLanguages, setCurrentLanguage, loadTranslations, addOrUpdateTranslation, setAuthenticated } from './translationSlice';
import languagesData from '../config/languages.json';
import { Button, Modal, Form, Offcanvas, Overlay, Popover, Badge } from 'react-bootstrap';

const Widget = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(state => state.translations.isAuthenticated);
  const languages = useSelector(state => state.translations.languages);
  const currentLanguage = useSelector(state => state.translations.currentLanguage);
  const translations = useSelector(state => state.translations.translations);
  const [showLogin, setShowLogin] = useState(!isAuthenticated);
  const [password, setPassword] = useState('');
  const [hoveredElement, setHoveredElement] = useState(null);
  const [showPopover, setShowPopover] = useState(false);
  const [targetElement, setTargetElement] = useState(null);
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [selectedLang, setSelectedLang] = useState(currentLanguage);
  const [nodeId, setNodeId] = useState('');
  const [pageUrl, setPageUrl] = useState(window.location.href);
  const [existingTranslation, setExistingTranslation] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    dispatch(setLanguages(languagesData));
    if (languagesData.length > 0) dispatch(setCurrentLanguage(languagesData[0].code));
  }, []);

  useEffect(() => {
    languages.forEach(lang => {
      const data = localStorage.getItem(`translations_${lang.code}`);
      if (data) {
        dispatch(loadTranslations({ lang: lang.code, data: JSON.parse(data) }));
      }
    });
  }, [languages]);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState().translations;
      Object.keys(state.translations).forEach(lang => {
        localStorage.setItem(`translations_${lang}`, JSON.stringify(state.translations[lang]));
      });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const handleMouseOver = (e) => {
      if (isEditableTextNode(e.target)) {
        setHoveredElement(e.target);
      }
    };
    const handleMouseOut = () => {
      setHoveredElement(null);
    };
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const observer = new MutationObserver(highlightUntranslated);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [translations, currentLanguage]);

  useEffect(() => {
    highlightUntranslated();
  }, [translations, currentLanguage]);

  const isEditableTextNode = (el) => {
    const tags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN'];
    return tags.includes(el.tagName) && el.textContent.trim() !== '' && el.children.length === 0;
  };

  const getNodeId = (el) => {
    const path = [];
    let current = el;
    while (current && current.nodeType === 1 && current !== document) {
      let index = 1;
      let sib = current.previousSibling;
      while (sib) {
        if (sib.nodeType === 1 && sib.tagName === current.tagName) index++;
        sib = sib.previousSibling;
      }
      path.unshift(`${current.tagName.toLowerCase()}[${index}]`);
      current = current.parentNode;
    }
    return '/' + path.join('/');
  };

  const handleLogin = () => {
    if (password === 'secret') {
      dispatch(setAuthenticated(true));
      setShowLogin(false);
    } else {
      alert('Invalid password');
    }
  };

  const handleTranslateClick = (e) => {
    const text = hoveredElement.textContent.trim();
    const id = getNodeId(hoveredElement);
    const url = window.location.href;
    const lang = selectedLang || currentLanguage;
    const trans = translations[lang] || [];
    let existing = trans.find(t => t.nodeId === id && t.pageUrl === url);
    if (!existing) {
      const sameText = trans.find(t => t.originalText === text);
      if (sameText) {
        existing = { ...sameText, nodeId: id, pageUrl: url };
      }
    }
    setOriginalText(text);
    setNodeId(id);
    setPageUrl(url);
    setExistingTranslation(existing);
    setTranslatedText(existing ? existing.translatedText : '');
    setSelectedLang(lang);
    setTargetElement(hoveredElement);
    setShowPopover(true);
  };

  const handlePreview = () => {
    const original = targetElement.textContent;
    targetElement.textContent = translatedText;
    setTimeout(() => {
      targetElement.textContent = original;
    }, 5000);
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    const newTrans = {
      nodeId,
      originalText,
      translatedText,
      lastModified: now,
      pageUrl,
      versions: existingTranslation?.versions || []
    };
    dispatch(addOrUpdateTranslation({ lang: selectedLang, translation: newTrans }));
    setShowPopover(false);
    highlightUntranslated();
  };

  const handleRevert = (version) => {
    setTranslatedText(version.translatedText);
  };

  const highlightUntranslated = () => {
    const nodes = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span');
    nodes.forEach(node => {
      node.classList.remove('untranslated');
      if (isEditableTextNode(node)) {
        const id = getNodeId(node);
        const url = window.location.href;
        const trans = translations[currentLanguage] || [];
        const hasTrans = trans.some(t => t.nodeId === id && t.pageUrl === url && t.translatedText);
        if (!hasTrans) {
          node.classList.add('untranslated');
        }
      }
    });
  };

  const handleExport = (lang) => {
    const data = translations[lang] || [];
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lang}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = JSON.parse(event.target.result);
        dispatch(loadTranslations({ lang: currentLanguage, data }));
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      {hoveredElement && isAuthenticated && (
        <Button
          variant="outline-primary"
          size="sm"
          style={{
            position: 'absolute',
            top: `${hoveredElement.getBoundingClientRect().top + window.scrollY}px`,
            left: `${hoveredElement.getBoundingClientRect().right + window.scrollX}px`,
            zIndex: 10000,
          }}
          onClick={handleTranslateClick}
        >
          Translate
        </Button>
      )}
      <Overlay show={showPopover} target={targetElement} placement="right" rootClose onHide={() => setShowPopover(false)}>
        <Popover id="translate-popover">
          <Popover.Header as="h3">Translate Text</Popover.Header>
          <Popover.Body>
            <Form>
              <Form.Group>
                <Form.Label>Original Text</Form.Label>
                <Form.Control plaintext readOnly value={originalText} />
              </Form.Group>
              <Form.Group>
                <Form.Label>Translated Text</Form.Label>
                <Form.Control type="text" value={translatedText} onChange={(e) => setTranslatedText(e.target.value)} />
              </Form.Group>
              <Form.Group>
                <Form.Label>Language</Form.Label>
                <Form.Select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)}>
                  {languages.map(l => <option key={l.code} value={l.code}>{l.code}</option>)}
                </Form.Select>
              </Form.Group>
              {existingTranslation && <Badge bg="success">Already Translated</Badge>}
              <Button variant="secondary" onClick={handlePreview}>Preview</Button>
              <Button variant="primary" onClick={handleSave}>Save</Button>
              <Button variant="outline-secondary" onClick={() => setShowPopover(false)}>Cancel</Button>
              {existingTranslation && existingTranslation.versions && existingTranslation.versions.length > 0 && (
                <div>
                  <h5>Version History</h5>
                  {existingTranslation.versions.map((v, i) => (
                    <div key={i}>
                      <span>{v.lastModified}: {v.translatedText.substring(0, 50)}</span>
                      <Button size="sm" onClick={() => handleRevert(v)}>Revert</Button>
                    </div>
                  ))}
                </div>
              )}
            </Form>
          </Popover.Body>
        </Popover>
      </Overlay>
      <Modal show={showLogin} onHide={() => {}}>
        <Modal.Header>
          <Modal.Title>Login</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Form.Group>
            <Button variant="primary" onClick={handleLogin}>Login</Button>
          </Form>
        </Modal.Body>
      </Modal>
      {isAuthenticated && <Button style={{ position: 'fixed', bottom: 10, right: 10 }} onClick={() => setShowSettings(true)}>Settings</Button>}
      <Offcanvas show={showSettings} onHide={() => setShowSettings(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Settings</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form.Select value={currentLanguage} onChange={(e) => dispatch(setCurrentLanguage(e.target.value))}>
            {languages.map(l => <option key={l.code} value={l.code}>{l.code}</option>)}
          </Form.Select>
          <h5>Export</h5>
          {languages.map(l => (
            <Button key={l.code} variant="outline-primary" className="m-1" onClick={() => handleExport(l.code)}>Export {l.code}</Button>
          ))}
          <h5>Import</h5>
          <Form.Control type="file" onChange={handleImport} />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Widget;
export { getNodeId };