export function generateHTMLReport(translations, metadata, screenshots, imagesFolder) {
  const timestamp = new Date().toLocaleString()
  const totalTranslations = Object.keys(translations).length
  
  // Convert base64 screenshots to files and add to zip
  Object.keys(screenshots).forEach((originalText, index) => {
    const screenshot = screenshots[originalText]
    if (screenshot) {
      // Extract base64 data
      const base64Data = screenshot.split(',')[1]
      const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
      imagesFolder.file(`screenshot_${index + 1}.png`, imageBuffer)
    }
  })
  
  // Generate translation cards HTML
  const translationCards = Object.keys(translations).map((originalText, index) => {
    const translation = translations[originalText]
    const meta = metadata[originalText] || {}
    const screenshot = screenshots[originalText]
    const hasScreenshot = screenshot && screenshot.length > 0
    
    const screenshotHtml = hasScreenshot 
      ? `<img src="images/screenshot_${index + 1}.png" alt="Screenshot" class="screenshot">`
      : '<div class="no-screenshot">No screenshot available</div>'
    
    return `
      <div class="translation-card" data-search="${originalText.toLowerCase()} ${translation.toLowerCase()}">
        <div class="translation-content">
          <div class="translation-header">
            <div class="text-section">
              <div class="original-text">
                <strong>Original:</strong><br>
                ${originalText}
              </div>
              <div class="translated-text">
                <strong>Translation:</strong><br>
                ${translation}
              </div>
            </div>
            <div class="screenshot-section">
              ${screenshotHtml}
            </div>
          </div>
          <div class="metadata">
            <div><strong>XPath:</strong> <span class="xpath">${meta.xpath || 'N/A'}</span></div>
            <div><strong>Page:</strong> <a href="${meta.uri || '#'}" class="uri" target="_blank">${meta.uri || 'N/A'}</a></div>
          </div>
        </div>
      </div>
    `
  }).join('')
  
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
        
        .screenshot-section {
            margin-left: 20px;
            text-align: center;
        }
        
        .screenshot {
            max-width: 300px;
            max-height: 200px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            border: 2px solid #e1e5e9;
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
        
        .no-screenshot {
            color: #999;
            font-style: italic;
        }
        
        .hidden {
            display: none;
        }
        
        @media (max-width: 768px) {
            .translation-header {
                flex-direction: column;
            }
            
            .screenshot-section {
                margin-left: 0;
                margin-top: 15px;
            }
            
            .screenshot {
                max-width: 100%;
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
                <div class="stat-number">${Object.keys(screenshots).filter(k => screenshots[k]).length}</div>
                <div>Screenshots Captured</div>
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
            ${translationCards}
        </div>
    </div>
    
    <script>
        // Search functionality
        const searchInput = document.getElementById('searchInput')
        const translationCards = document.querySelectorAll('.translation-card')
        
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase()
            
            translationCards.forEach(card => {
                const searchData = card.getAttribute('data-search')
                if (searchData.includes(searchTerm)) {
                    card.classList.remove('hidden')
                } else {
                    card.classList.add('hidden')
                }
            })
        })
        
        // Add some nice animations
        document.addEventListener('DOMContentLoaded', function() {
            const cards = document.querySelectorAll('.translation-card')
            cards.forEach((card, index) => {
                card.style.opacity = '0'
                card.style.transform = 'translateY(20px)'
                
                setTimeout(() => {
                    card.style.transition = 'opacity 0.5s, transform 0.5s'
                    card.style.opacity = '1'
                    card.style.transform = 'translateY(0)'
                }, index * 100)
            })
        })
    </script>
</body>
</html>`
} 