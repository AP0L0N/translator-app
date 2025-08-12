export function generateHTMLReport(translations, metadata) {
  // Helper function to escape HTML characters
  const escapeHtml = (text) => {
    if (typeof text !== 'string') return String(text)
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
  
  const timestamp = new Date().toLocaleString()
  const totalTranslations = Object.keys(translations).length

  // Build categorized lists: element-bound vs custom (no xpath/uri metadata)
  const allKeys = Object.keys(translations)
  const elementBoundKeys = allKeys.filter(k => metadata[k]?.xpath && metadata[k]?.uri)
  const customKeys = allKeys.filter(k => !(metadata[k]?.xpath && metadata[k]?.uri))
  
  // Generate translation cards HTML
  const renderCard = (originalText) => {
    const translation = translations[originalText]
    const meta = metadata[originalText] || {}
    
    // Handle both old string format and new object format
    const translationData = typeof translation === 'string' 
      ? { translatedText: translation, extraNote: '', markForRemoval: false }
      : { 
          translatedText: translation?.translatedText || '', 
          extraNote: translation?.extraNote || '', 
          markForRemoval: translation?.markForRemoval || false 
        }
    
    // Escape HTML characters
    const escapedOriginalText = escapeHtml(originalText)
    const escapedTranslation = escapeHtml(translationData.translatedText)
    const escapedExtraNote = escapeHtml(translationData.extraNote)
    
    const navigationButton = meta.xpath && meta.uri 
      ? `<button class="navigation-btn" data-uri="${escapeHtml(meta.uri)}" data-xpath="${escapeHtml(meta.xpath)}" data-text="${escapeHtml(originalText)}" data-note="${escapeHtml(translationData.extraNote)}" onclick="navigateToElementSafe(this)">
           <span class="btn-icon">🎯</span>
           <span class="btn-text">Go to Element</span>
         </button>`
      : '<div class="no-navigation">Navigation not available</div>'
    
    const removalBadge = translationData.markForRemoval 
      ? `<div class="removal-badge">
           Marked for Removal
         </div>`
      : ''
    
    const extraNoteSection = translationData.extraNote 
      ? `<div class="extra-note">
           <strong>Note:</strong><br>
           ${escapedExtraNote}
         </div>`
      : ''
    
    return `
      <div class="translation-card ${translationData.markForRemoval ? 'marked-for-removal' : ''}" data-search="${escapeHtml(originalText.toLowerCase())} ${escapeHtml(translationData.translatedText.toLowerCase())} ${escapeHtml(translationData.extraNote.toLowerCase())}">
        <div class="translation-content">
          <div class="translation-header">
            <div class="text-section">
              <div class="original-text">
                <strong>Original:</strong><br>
                ${escapedOriginalText}
              </div>
              <div class="translated-text">
                <strong>Translation:</strong><br>
                ${escapedTranslation}
              </div>
              ${extraNoteSection}
            </div>
            <div class="navigation-section">
              ${removalBadge}
              ${navigationButton}
            </div>
          </div>
          <div class="metadata">
            <div><strong>XPath:</strong> <span class="xpath">${meta.xpath || 'N/A'}</span></div>
            <div><strong>Page:</strong> <a href="${meta.uri || '#'}" class="uri" target="_blank">${meta.uri || 'N/A'}</a></div>
          </div>
        </div>
      </div>
    `
  }

  const elementBoundCards = elementBoundKeys.map(renderCard).join('')
  const customCards = customKeys.map(renderCard).join('')
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Translation Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        
        .search-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .search-input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e5e9;
            border-radius: 6px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        .search-input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .translations-grid {
            display: grid;
            gap: 20px;
        }
        .section-title {
            margin: 16px 0 8px 0;
            font-weight: 700;
            color: #495057;
        }
        
        .translation-card {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .translation-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .translation-content {
            padding: 20px;
        }
        
        .translation-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        
        .text-section {
            flex: 1;
        }
        
        .original-text {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 10px;
            border-left: 4px solid #dc3545;
        }
        
        .translated-text {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #28a745;
        }
        
        .navigation-section {
            margin-left: 20px;
            text-align: center;
            display: flex;
            align-items: center;
        }
        
        .navigation-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        .navigation-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        
        .navigation-btn:active {
            transform: translateY(0);
        }
        
        .btn-icon {
            font-size: 16px;
        }
        
        .btn-text {
            white-space: nowrap;
        }
        
        .metadata {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e1e5e9;
            font-size: 0.9em;
            color: #666;
        }
        
        .xpath {
            font-family: monospace;
            background: #f8f9fa;
            padding: 5px 8px;
            border-radius: 4px;
            word-break: break-all;
        }
        
        .uri {
            color: #007bff;
            text-decoration: none;
        }
        
        .uri:hover {
            text-decoration: underline;
        }
        
        .no-navigation {
            color: #999;
            font-style: italic;
            padding: 12px 20px;
            border: 2px dashed #ddd;
            border-radius: 8px;
            text-align: center;
        }
        
        .hidden {
            display: none;
        }

        .removal-badge {
            background-color: #ffebee;
            color: #c62828;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.9em;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
            border: 1px solid #ef9a9a;
        }

        .extra-note {
            background-color: #e8f5e9;
            color: #2e7d32;
            padding: 10px;
            border-radius: 6px;
            margin-top: 10px;
            border-left: 4px solid #4caf50;
        }
        
        .marked-for-removal {
            border-left: 4px solid #dc3545;
            background-color: #ffebee;
        }
        
        @media (max-width: 768px) {
            .translation-header {
                flex-direction: column;
            }
            
            .navigation-section {
                margin-left: 0;
                margin-top: 15px;
                justify-content: center;
            }
            
            .navigation-btn {
                width: 100%;
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 Translation Report</h1>
            <p>Generated on ${timestamp}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${totalTranslations}</div>
                <div>Total Translations</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${elementBoundKeys.length}</div>
                <div>Element-bound</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${customKeys.length}</div>
                <div>Custom (Global)</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${new Set(Object.values(metadata).map(m => m?.uri)).size}</div>
                <div>Pages Translated</div>
            </div>
        </div>
        
        <div class="search-box">
            <input type="text" class="search-input" placeholder="Search translations..." id="searchInput">
        </div>
        
        <div class="translations-grid" id="translationsGrid">
            ${elementBoundCards ? `<h3 class="section-title">Element-bound Translations</h3>` : ''}
            ${elementBoundCards}
            ${customCards ? `<h3 class="section-title">Custom Translations</h3>` : ''}
            ${customCards}
        </div>
    </div>

    <script>
        // Search functionality
        const searchInput = document.getElementById('searchInput')
        const translationsGrid = document.getElementById('translationsGrid')
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase()
            const cards = translationsGrid.querySelectorAll('.translation-card')
            
            cards.forEach(card => {
                const searchData = card.getAttribute('data-search')
                if (searchData.includes(searchTerm)) {
                    card.classList.remove('hidden')
                } else {
                    card.classList.add('hidden')
                }
            })
        })
        
        // Navigation functionality
        function navigateToElementSafe(button) {
            try {
                const uri = button.getAttribute('data-uri')
                const xpath = button.getAttribute('data-xpath')
                const originalText = button.getAttribute('data-text')
                const extraNote = button.getAttribute('data-note')
                
                if (!uri || !xpath || !originalText) {
                    console.error('Missing navigation data')
                    alert('Navigation data is incomplete.')
                    return
                }
                
                // Create URL with navigation parameters that the translation widget can read
                const url = new URL(uri)
                url.searchParams.set('tw_navigate', 'true')
                url.searchParams.set('tw_xpath', xpath)
                url.searchParams.set('tw_text', originalText)
                url.searchParams.set('tw_note', extraNote)
                
                // Open the page with navigation parameters
                window.open(url.toString(), '_blank')
                
            } catch (error) {
                console.error('Navigation error:', error)
                alert('Failed to navigate to element. Please check if the URL is accessible.')
            }
        }
    </script>
</body>
</html>`
} 