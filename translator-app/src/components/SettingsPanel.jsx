import React, { useState, useRef } from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import { 
  exportTranslations, 
  exportTranslationsToCSV, 
  importTranslationsFromJSON, 
  importTranslationsFromCSV,
  mergeTranslations,
  getTranslationStats,
  createTranslationBackup,
  getAvailableBackups,
  restoreFromBackup,
  downloadFile
} from '../services/translationService';
import { logout, hasPermission } from '../utils/authUtils';

const SettingsPanel = ({ show, onHide }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [importStrategy, setImportStrategy] = useState('merge');
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const fileInputRef = useRef(null);
  
  const {
    currentLanguage,
    languages,
    translations,
    textNodes,
    user,
    dispatch,
    actions
  } = useTranslation();

  const handleLanguageChange = (languageCode) => {
    dispatch({ type: actions.SET_CURRENT_LANGUAGE, payload: languageCode });
  };

  const handleExportJSON = (language = null) => {
    setIsExporting(true);
    try {
      const content = exportTranslations(translations, language);
      const filename = language 
        ? `translations-${language}-${new Date().toISOString().split('T')[0]}.json`
        : `translations-all-${new Date().toISOString().split('T')[0]}.json`;
      
      downloadFile(content, filename, 'application/json');
      setSuccessMessage('Translations exported successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setImportError('Failed to export translations');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = (language) => {
    setIsExporting(true);
    try {
      const langTranslations = translations[language] || [];
      const content = exportTranslationsToCSV(langTranslations, language);
      const filename = `translations-${language}-${new Date().toISOString().split('T')[0]}.csv`;
      
      downloadFile(content, filename, 'text/csv');
      setSuccessMessage('Translations exported successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setImportError('Failed to export translations');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportError('');

    try {
      const content = await file.text();
      let importedTranslations;

      if (file.name.endsWith('.json')) {
        importedTranslations = importTranslationsFromJSON(content);
      } else if (file.name.endsWith('.csv')) {
        importedTranslations = importTranslationsFromCSV(content);
      } else {
        throw new Error('Unsupported file format. Please use JSON or CSV.');
      }

      if (importedTranslations.length === 0) {
        throw new Error('No valid translations found in the file.');
      }

      // Create backup before importing
      createTranslationBackup(translations);

      // Merge with existing translations
      const existing = translations[currentLanguage] || [];
      const merged = mergeTranslations(existing, importedTranslations, importStrategy);

      dispatch({
        type: actions.SET_TRANSLATIONS,
        payload: { language: currentLanguage, translations: merged }
      });

      setSuccessMessage(`Successfully imported ${importedTranslations.length} translations!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      setImportError(error.message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBackupRestore = (backupKey) => {
    try {
      const restoredTranslations = restoreFromBackup(backupKey);
      
      // Restore all translations
      Object.entries(restoredTranslations).forEach(([language, langTranslations]) => {
        dispatch({
          type: actions.SET_TRANSLATIONS,
          payload: { language, translations: langTranslations }
        });
      });

      setSuccessMessage('Backup restored successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setImportError('Failed to restore backup');
    }
  };

  const handleLogout = () => {
    logout();
    dispatch({ 
      type: actions.SET_AUTHENTICATED, 
      payload: { isAuthenticated: false, user: null } 
    });
    onHide();
  };

  const getLanguageStats = () => {
    return languages.map(lang => {
      const langTranslations = translations[lang.code] || [];
      const stats = getTranslationStats(langTranslations, textNodes);
      return {
        ...lang,
        ...stats
      };
    });
  };

  const renderOverviewTab = () => {
    const stats = getLanguageStats();
    const totalStats = stats.reduce((acc, lang) => ({
      total: Math.max(acc.total, lang.total),
      translated: acc.translated + lang.translated,
      approved: acc.approved + lang.approved,
      pending: acc.pending + lang.pending,
      needsReview: acc.needsReview + lang.needsReview
    }), { total: 0, translated: 0, approved: 0, pending: 0, needsReview: 0 });

    return (
      <div>
        <h6>Translation Overview</h6>
        
        {/* Global Stats */}
        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title">Global Statistics</h6>
            <div className="row text-center">
              <div className="col">
                <div className="h4 text-primary">{totalStats.total}</div>
                <small className="text-muted">Text Nodes</small>
              </div>
              <div className="col">
                <div className="h4 text-success">{totalStats.approved}</div>
                <small className="text-muted">Approved</small>
              </div>
              <div className="col">
                <div className="h4 text-warning">{totalStats.pending}</div>
                <small className="text-muted">Pending</small>
              </div>
              <div className="col">
                <div className="h4 text-danger">{totalStats.needsReview}</div>
                <small className="text-muted">Needs Review</small>
              </div>
            </div>
          </div>
        </div>

        {/* Language Stats */}
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">Languages</h6>
          </div>
          <div className="list-group list-group-flush">
            {stats.map(lang => (
              <div key={lang.code} className="list-group-item">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{lang.flag} {lang.name}</strong>
                    <br />
                    <small className="text-muted">{lang.nativeName}</small>
                  </div>
                  <div className="text-end">
                    <div className="progress mb-1" style={{ width: '100px', height: '6px' }}>
                      <div 
                        className="progress-bar" 
                        style={{ width: `${lang.progress}%` }}
                      ></div>
                    </div>
                    <small className="text-muted">
                      {lang.translated}/{lang.total} ({lang.progress}%)
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderLanguagesTab = () => {
    return (
      <div>
        <h6>Language Settings</h6>
        
        <div className="mb-3">
          <label className="form-label">Current Language</label>
          <select
            className="form-select"
            value={currentLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name} ({lang.nativeName})
              </option>
            ))}
          </select>
        </div>

        <div className="list-group">
          {languages.map(lang => {
            const langTranslations = translations[lang.code] || [];
            const stats = getTranslationStats(langTranslations, textNodes);
            const isActive = lang.code === currentLanguage;
            
            return (
              <div 
                key={lang.code} 
                className={`list-group-item ${isActive ? 'active' : ''}`}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{lang.flag} {lang.name}</strong>
                    <br />
                    <small className={isActive ? 'text-light' : 'text-muted'}>
                      {stats.translated} translations • {stats.progress}% complete
                    </small>
                  </div>
                  <button
                    className={`btn btn-sm ${isActive ? 'btn-light' : 'btn-outline-primary'}`}
                    onClick={() => handleLanguageChange(lang.code)}
                    disabled={isActive}
                  >
                    {isActive ? 'Current' : 'Switch'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderImportExportTab = () => {
    const canImportExport = hasPermission('export') || hasPermission('import');
    
    if (!canImportExport) {
      return (
        <div className="alert alert-warning">
          <i className="bi bi-shield-exclamation me-2"></i>
          You don't have permission to import or export translations.
        </div>
      );
    }

    return (
      <div>
        <h6>Import & Export</h6>
        
        {/* Export Section */}
        <div className="card mb-3">
          <div className="card-header">
            <h6 className="mb-0">Export Translations</h6>
          </div>
          <div className="card-body">
            <div className="row g-2">
              <div className="col-12">
                <button
                  className="btn btn-outline-primary w-100"
                  onClick={() => handleExportJSON()}
                  disabled={isExporting}
                >
                  <i className="bi bi-download me-2"></i>
                  Export All Languages (JSON)
                </button>
              </div>
              <div className="col-6">
                <button
                  className="btn btn-outline-success w-100"
                  onClick={() => handleExportJSON(currentLanguage)}
                  disabled={isExporting}
                >
                  <i className="bi bi-download me-2"></i>
                  JSON ({currentLanguage.toUpperCase()})
                </button>
              </div>
              <div className="col-6">
                <button
                  className="btn btn-outline-info w-100"
                  onClick={() => handleExportCSV(currentLanguage)}
                  disabled={isExporting}
                >
                  <i className="bi bi-download me-2"></i>
                  CSV ({currentLanguage.toUpperCase()})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div className="card mb-3">
          <div className="card-header">
            <h6 className="mb-0">Import Translations</h6>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Import Strategy</label>
              <select
                className="form-select"
                value={importStrategy}
                onChange={(e) => setImportStrategy(e.target.value)}
              >
                <option value="merge">Merge (update only different translations)</option>
                <option value="overwrite">Overwrite (replace existing translations)</option>
                <option value="skip">Skip (keep existing translations)</option>
              </select>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              className="form-control"
              accept=".json,.csv"
              onChange={handleFileImport}
              disabled={isImporting}
            />
            
            <div className="form-text">
              Supports JSON and CSV files. A backup will be created automatically.
            </div>
          </div>
        </div>

        {/* Backup Section */}
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">Backups</h6>
          </div>
          <div className="card-body">
            <button
              className="btn btn-outline-warning w-100 mb-3"
              onClick={() => {
                const timestamp = createTranslationBackup(translations);
                setSuccessMessage(`Backup created: ${timestamp}`);
                setTimeout(() => setSuccessMessage(''), 3000);
              }}
            >
              <i className="bi bi-archive me-2"></i>
              Create Backup
            </button>
            
            <div className="list-group">
              {getAvailableBackups().map(backup => (
                <div key={backup.key} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{backup.date}</strong>
                      <br />
                      <small className="text-muted">
                        {Math.round(backup.size / 1024)} KB
                      </small>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleBackupRestore(backup.key)}
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAccountTab = () => {
    return (
      <div>
        <h6>Account</h6>
        
        <div className="card mb-3">
          <div className="card-body">
            <div className="d-flex align-items-center mb-3">
              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
                   style={{ width: '48px', height: '48px' }}>
                <i className="bi bi-person-fill text-white"></i>
              </div>
              <div>
                <h6 className="mb-0">{user?.name}</h6>
                <small className="text-muted">@{user?.username}</small>
                <br />
                <span className="badge bg-secondary">{user?.role}</span>
              </div>
            </div>
            
            <div className="mb-3">
              <strong>Permissions:</strong>
              <div className="mt-1">
                {user?.permissions?.map(permission => (
                  <span key={permission} className="badge bg-light text-dark me-1">
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <button
          className="btn btn-outline-danger w-100"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right me-2"></i>
          Sign Out
        </button>
      </div>
    );
  };

  if (!show) return null;

  return (
    <div className="offcanvas offcanvas-end show" style={{ visibility: 'visible' }} tabIndex="-1">
      <div className="offcanvas-header">
        <h5 className="offcanvas-title">
          <i className="bi bi-gear me-2"></i>
          Translation Settings
        </h5>
        <button 
          type="button" 
          className="btn-close" 
          onClick={onHide}
        ></button>
      </div>
      
      <div className="offcanvas-body">
        {/* Status Messages */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible" role="alert">
            <i className="bi bi-check-circle me-2"></i>
            {successMessage}
          </div>
        )}
        
        {importError && (
          <div className="alert alert-danger alert-dismissible" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {importError}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setImportError('')}
            ></button>
          </div>
        )}
        
        {/* Tabs */}
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="bi bi-bar-chart me-1"></i>
              Overview
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'languages' ? 'active' : ''}`}
              onClick={() => setActiveTab('languages')}
            >
              <i className="bi bi-globe me-1"></i>
              Languages
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'import-export' ? 'active' : ''}`}
              onClick={() => setActiveTab('import-export')}
            >
              <i className="bi bi-arrow-down-up me-1"></i>
              Import/Export
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <i className="bi bi-person me-1"></i>
              Account
            </button>
          </li>
        </ul>
        
        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'languages' && renderLanguagesTab()}
          {activeTab === 'import-export' && renderImportExportTab()}
          {activeTab === 'account' && renderAccountTab()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;