/**
 * Translation Service
 * Handles translation CRUD operations, import/export, and synchronization
 */

/**
 * Find translation by node ID and language
 * @param {Array} translations - Array of translations
 * @param {string} nodeId - Node identifier
 * @returns {Object|null} Translation object or null
 */
export function findTranslation(translations, nodeId) {
  return translations.find(t => t.nodeId === nodeId) || null;
}

/**
 * Check if a translation exists
 * @param {Array} translations - Array of translations
 * @param {string} nodeId - Node identifier
 * @returns {boolean} True if translation exists
 */
export function hasTranslation(translations, nodeId) {
  return findTranslation(translations, nodeId) !== null;
}

/**
 * Get translation statistics for a language
 * @param {Array} translations - Array of translations
 * @param {Array} textNodes - Array of text nodes on the page
 * @returns {Object} Statistics object
 */
export function getTranslationStats(translations = [], textNodes = []) {
  const total = textNodes.length;
  const translated = translations.length;
  const pending = translations.filter(t => t.status === 'pending').length;
  const approved = translations.filter(t => t.status === 'approved').length;
  const needsReview = translations.filter(t => t.status === 'needs_review').length;
  
  return {
    total,
    translated,
    untranslated: total - translated,
    pending,
    approved,
    needsReview,
    progress: total > 0 ? Math.round((translated / total) * 100) : 0
  };
}

/**
 * Export translations to JSON
 * @param {Object} translations - Translations object (all languages)
 * @param {string} language - Specific language to export (optional)
 * @returns {string} JSON string
 */
export function exportTranslations(translations, language = null) {
  if (language) {
    return JSON.stringify(translations[language] || [], null, 2);
  }
  
  return JSON.stringify(translations, null, 2);
}

/**
 * Export translations to CSV
 * @param {Array} translations - Array of translations
 * @param {string} language - Language code
 * @returns {string} CSV string
 */
export function exportTranslationsToCSV(translations, language) {
  const headers = [
    'Node ID',
    'Original Text',
    'Translated Text',
    'Status',
    'Page URL',
    'Last Modified',
    'Version'
  ];
  
  const rows = translations.map(t => [
    t.nodeId,
    `"${t.originalText.replace(/"/g, '""')}"`,
    `"${t.translatedText.replace(/"/g, '""')}"`,
    t.status,
    t.pageUrl,
    t.lastModified,
    t.version
  ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Import translations from JSON
 * @param {string} jsonString - JSON string to import
 * @returns {Array} Array of translation objects
 */
export function importTranslationsFromJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate structure
    if (Array.isArray(data)) {
      return data.filter(validateTranslation);
    } else if (typeof data === 'object') {
      // Handle object with language keys
      const allTranslations = [];
      Object.values(data).forEach(translations => {
        if (Array.isArray(translations)) {
          allTranslations.push(...translations.filter(validateTranslation));
        }
      });
      return allTranslations;
    }
    
    return [];
  } catch (error) {
    console.error('Error importing JSON:', error);
    throw new Error('Invalid JSON format');
  }
}

/**
 * Import translations from CSV
 * @param {string} csvString - CSV string to import
 * @returns {Array} Array of translation objects
 */
export function importTranslationsFromCSV(csvString) {
  try {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least header and one data row');
    }
    
    const headers = parseCSVRow(lines[0]);
    const translations = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVRow(lines[i]);
      if (values.length === headers.length) {
        const translation = {
          nodeId: values[0],
          originalText: values[1],
          translatedText: values[2],
          status: values[3] || 'pending',
          pageUrl: values[4],
          lastModified: values[5] || new Date().toISOString(),
          version: parseInt(values[6]) || 1
        };
        
        if (validateTranslation(translation)) {
          translations.push(translation);
        }
      }
    }
    
    return translations;
  } catch (error) {
    console.error('Error importing CSV:', error);
    throw new Error('Invalid CSV format');
  }
}

/**
 * Parse a CSV row, handling quoted values
 * @param {string} row - CSV row string
 * @returns {Array} Array of values
 */
function parseCSVRow(row) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values;
}

/**
 * Validate translation object structure
 * @param {Object} translation - Translation object to validate
 * @returns {boolean} True if valid
 */
function validateTranslation(translation) {
  return (
    translation &&
    typeof translation === 'object' &&
    typeof translation.nodeId === 'string' &&
    typeof translation.originalText === 'string' &&
    typeof translation.translatedText === 'string' &&
    translation.nodeId.length > 0 &&
    translation.originalText.length > 0
  );
}

/**
 * Merge imported translations with existing ones
 * @param {Array} existing - Existing translations
 * @param {Array} imported - Imported translations
 * @param {string} strategy - Merge strategy ('overwrite', 'skip', 'merge')
 * @returns {Array} Merged translations
 */
export function mergeTranslations(existing, imported, strategy = 'merge') {
  const existingMap = new Map(existing.map(t => [t.nodeId, t]));
  const result = [...existing];
  
  imported.forEach(importedTranslation => {
    const existingTranslation = existingMap.get(importedTranslation.nodeId);
    
    if (!existingTranslation) {
      // New translation, always add
      result.push({
        ...importedTranslation,
        lastModified: new Date().toISOString(),
        version: 1
      });
    } else {
      // Translation exists, apply strategy
      switch (strategy) {
        case 'overwrite':
          const index = result.findIndex(t => t.nodeId === importedTranslation.nodeId);
          result[index] = {
            ...importedTranslation,
            lastModified: new Date().toISOString(),
            version: existingTranslation.version + 1
          };
          break;
          
        case 'skip':
          // Do nothing, keep existing
          break;
          
        case 'merge':
        default:
          // Only update if imported has newer modification date or different content
          if (importedTranslation.translatedText !== existingTranslation.translatedText) {
            const index = result.findIndex(t => t.nodeId === importedTranslation.nodeId);
            result[index] = {
              ...existingTranslation,
              translatedText: importedTranslation.translatedText,
              lastModified: new Date().toISOString(),
              version: existingTranslation.version + 1,
              status: 'needs_review'
            };
          }
          break;
      }
    }
  });
  
  return result;
}

/**
 * Create a backup of current translations
 * @param {Object} translations - All translations
 * @returns {string} Backup timestamp
 */
export function createTranslationBackup(translations) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupKey = `translator_backup_${timestamp}`;
  
  try {
    localStorage.setItem(backupKey, JSON.stringify(translations));
    
    // Keep only last 5 backups
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('translator_backup_'))
      .sort()
      .reverse();
    
    backupKeys.slice(5).forEach(key => {
      localStorage.removeItem(key);
    });
    
    return timestamp;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw new Error('Failed to create backup');
  }
}

/**
 * Get available backups
 * @returns {Array} Array of backup objects
 */
export function getAvailableBackups() {
  const backupKeys = Object.keys(localStorage)
    .filter(key => key.startsWith('translator_backup_'))
    .sort()
    .reverse();
  
  return backupKeys.map(key => {
    const timestamp = key.replace('translator_backup_', '');
    const date = new Date(timestamp.replace(/-/g, ':'));
    
    return {
      key,
      timestamp,
      date: date.toLocaleString(),
      size: localStorage.getItem(key)?.length || 0
    };
  });
}

/**
 * Restore translations from backup
 * @param {string} backupKey - Backup key to restore
 * @returns {Object} Restored translations
 */
export function restoreFromBackup(backupKey) {
  try {
    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      throw new Error('Backup not found');
    }
    
    return JSON.parse(backupData);
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw new Error('Failed to restore backup');
  }
}

/**
 * Generate translation report
 * @param {Object} translations - All translations
 * @param {Array} languages - Available languages
 * @returns {Object} Report data
 */
export function generateTranslationReport(translations, languages) {
  const report = {
    summary: {
      totalLanguages: languages.length,
      translatedLanguages: 0,
      totalTranslations: 0
    },
    languages: {},
    generatedAt: new Date().toISOString()
  };
  
  languages.forEach(language => {
    const languageTranslations = translations[language.code] || [];
    const stats = getTranslationStats(languageTranslations);
    
    report.languages[language.code] = {
      name: language.name,
      nativeName: language.nativeName,
      ...stats
    };
    
    report.summary.totalTranslations += stats.translated;
    if (stats.translated > 0) {
      report.summary.translatedLanguages++;
    }
  });
  
  return report;
}

/**
 * Search translations
 * @param {Array} translations - Array of translations
 * @param {string} query - Search query
 * @returns {Array} Filtered translations
 */
export function searchTranslations(translations, query) {
  if (!query || !query.trim()) {
    return translations;
  }
  
  const searchTerm = query.toLowerCase().trim();
  
  return translations.filter(translation => 
    translation.originalText.toLowerCase().includes(searchTerm) ||
    translation.translatedText.toLowerCase().includes(searchTerm) ||
    translation.nodeId.toLowerCase().includes(searchTerm) ||
    translation.pageUrl.toLowerCase().includes(searchTerm)
  );
}

/**
 * Sort translations
 * @param {Array} translations - Array of translations
 * @param {string} field - Field to sort by
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {Array} Sorted translations
 */
export function sortTranslations(translations, field, direction = 'asc') {
  const sorted = [...translations].sort((a, b) => {
    let aVal = a[field];
    let bVal = b[field];
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
}

/**
 * Download file with given content
 * @param {string} content - File content
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type
 */
export function downloadFile(content, filename, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}