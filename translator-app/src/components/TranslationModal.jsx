import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import { findTranslation } from '../services/translationService';
import { updateElementText, revertElementText } from '../utils/textNodeUtils';

const TranslationModal = ({ 
  show, 
  onHide, 
  textNode, 
  onSave,
  onPreview,
  onRevert 
}) => {
  const [translatedText, setTranslatedText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [status, setStatus] = useState('pending');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  
  const { 
    currentLanguage, 
    languages, 
    translations, 
    dispatch, 
    actions,
    user 
  } = useTranslation();

  useEffect(() => {
    if (show && textNode) {
      setTargetLanguage(currentLanguage);
      setError('');
      setIsPreviewing(false);
      
      // Load existing translation if available
      const currentTranslations = translations[currentLanguage] || [];
      const existing = findTranslation(currentTranslations, textNode.nodeId);
      
      if (existing) {
        setTranslatedText(existing.translatedText);
        setStatus(existing.status);
      } else {
        setTranslatedText('');
        setStatus('pending');
      }
    }
  }, [show, textNode, currentLanguage, translations]);

  const handlePreview = () => {
    if (!translatedText.trim() || !textNode) return;
    
    try {
      updateElementText(textNode.element, translatedText, textNode.originalText);
      setIsPreviewing(true);
      onPreview?.(translatedText);
    } catch (err) {
      setError('Failed to preview translation');
    }
  };

  const handleRevertPreview = () => {
    if (!textNode) return;
    
    try {
      revertElementText(textNode.element);
      setIsPreviewing(false);
      onRevert?.();
    } catch (err) {
      setError('Failed to revert preview');
    }
  };

  const handleSave = async () => {
    if (!translatedText.trim() || !textNode) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const translation = {
        nodeId: textNode.nodeId,
        originalText: textNode.originalText,
        translatedText: translatedText.trim(),
        pageUrl: textNode.pageUrl,
        status: status
      };
      
      // Check if translation exists
      const currentTranslations = translations[targetLanguage] || [];
      const existing = findTranslation(currentTranslations, textNode.nodeId);
      
      if (existing) {
        dispatch({
          type: actions.UPDATE_TRANSLATION,
          payload: translation
        });
      } else {
        dispatch({
          type: actions.ADD_TRANSLATION,
          payload: translation
        });
      }
      
      onSave?.(translation);
      onHide();
    } catch (err) {
      setError('Failed to save translation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    // Revert preview if active
    if (isPreviewing) {
      handleRevertPreview();
    }
    
    setTargetLanguage(newLanguage);
    
    // Load existing translation for new language
    const langTranslations = translations[newLanguage] || [];
    const existing = findTranslation(langTranslations, textNode?.nodeId);
    
    if (existing) {
      setTranslatedText(existing.translatedText);
      setStatus(existing.status);
    } else {
      setTranslatedText('');
      setStatus('pending');
    }
  };

  const handleClose = () => {
    if (isPreviewing) {
      handleRevertPreview();
    }
    onHide();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'bg-success';
      case 'pending': return 'bg-warning';
      case 'needs_review': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getTranslationHistory = () => {
    if (!textNode) return [];
    
    const allHistory = [];
    
    // Get translation history from all languages for this node
    Object.entries(translations).forEach(([lang, langTranslations]) => {
      const translation = findTranslation(langTranslations, textNode.nodeId);
      if (translation) {
        allHistory.push({
          ...translation,
          language: lang,
          languageName: languages.find(l => l.code === lang)?.name || lang
        });
      }
    });
    
    return allHistory.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
  };

  if (!show || !textNode) return null;

  const currentTranslations = translations[targetLanguage] || [];
  const existingTranslation = findTranslation(currentTranslations, textNode.nodeId);
  const translationHistory = getTranslationHistory();
  const canEdit = user?.permissions?.includes('translate');

  return (
    <div className="modal show" style={{ display: 'block' }} tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center">
              <i className="bi bi-translate me-2"></i>
              Edit Translation
              {existingTranslation && (
                <span className={`badge ${getStatusBadgeClass(existingTranslation.status)} ms-2`}>
                  {existingTranslation.status}
                </span>
              )}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={handleClose}
              disabled={isSaving}
            ></button>
          </div>
          
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}
            
            {isPreviewing && (
              <div className="alert alert-info" role="alert">
                <i className="bi bi-eye me-2"></i>
                Preview is active. The text on the page has been temporarily replaced.
              </div>
            )}
            
            {/* Language Selection */}
            <div className="mb-3">
              <label htmlFor="targetLanguage" className="form-label">
                Target Language
              </label>
              <select
                id="targetLanguage"
                className="form-select"
                value={targetLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={isSaving}
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Original Text */}
            <div className="mb-3">
              <label className="form-label">Original Text</label>
              <div className="form-control-plaintext bg-light p-3 rounded">
                <strong>{textNode.originalText}</strong>
              </div>
              <small className="text-muted">
                Node ID: <code>{textNode.nodeId}</code> | 
                Page: <code>{textNode.pageUrl}</code>
              </small>
            </div>
            
            {/* Translation Input */}
            <div className="mb-3">
              <label htmlFor="translatedText" className="form-label">
                Translated Text
                {!canEdit && (
                  <span className="badge bg-warning ms-2">Read Only</span>
                )}
              </label>
              <textarea
                id="translatedText"
                className="form-control"
                rows="4"
                value={translatedText}
                onChange={(e) => setTranslatedText(e.target.value)}
                placeholder="Enter translation here..."
                disabled={isSaving || !canEdit}
              />
              <div className="form-text">
                {translatedText.length} characters
              </div>
            </div>
            
            {/* Status Selection */}
            {canEdit && (
              <div className="mb-3">
                <label htmlFor="status" className="form-label">Status</label>
                <select
                  id="status"
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={isSaving}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="needs_review">Needs Review</option>
                </select>
              </div>
            )}
            
            {/* Translation History */}
            {translationHistory.length > 0 && (
              <div className="mb-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <i className={`bi bi-chevron-${showHistory ? 'up' : 'down'} me-1`}></i>
                  Translation History ({translationHistory.length})
                </button>
                
                {showHistory && (
                  <div className="mt-2">
                    <div className="list-group">
                      {translationHistory.map((hist, index) => (
                        <div key={`${hist.language}-${index}`} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <strong>{hist.languageName}</strong>
                              <span className={`badge ${getStatusBadgeClass(hist.status)} ms-2`}>
                                {hist.status}
                              </span>
                              <p className="mb-1 mt-2">{hist.translatedText}</p>
                              <small className="text-muted">
                                v{hist.version} • {new Date(hist.lastModified).toLocaleString()}
                              </small>
                            </div>
                            {canEdit && hist.language === targetLanguage && (
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => setTranslatedText(hist.translatedText)}
                              >
                                Use This
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <div className="d-flex gap-2 w-100">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              
              {canEdit && (
                <>
                  {isPreviewing ? (
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={handleRevertPreview}
                      disabled={isSaving}
                    >
                      <i className="bi bi-arrow-counterclockwise me-1"></i>
                      Revert Preview
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-info"
                      onClick={handlePreview}
                      disabled={isSaving || !translatedText.trim()}
                    >
                      <i className="bi bi-eye me-1"></i>
                      Preview
                    </button>
                  )}
                  
                  <button
                    type="button"
                    className="btn btn-primary flex-fill"
                    onClick={handleSave}
                    disabled={isSaving || !translatedText.trim()}
                  >
                    {isSaving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-1"></i>
                        Save Translation
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationModal;