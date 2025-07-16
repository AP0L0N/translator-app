import { v4 as uuidv4 } from 'uuid';

// Selectors for text-containing elements
const TEXT_SELECTORS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
  'span', 'div', 'a', 'button', 'label', 
  'td', 'th', 'li', 'blockquote', 'figcaption',
  'caption', 'legend', 'summary', 'details'
];

// Elements to exclude from translation
const EXCLUDE_SELECTORS = [
  'script', 'style', 'noscript', 'meta', 'title',
  'code', 'pre', '.no-translate', '[data-no-translate]',
  '.translator-widget', '.translator-widget *'
];

/**
 * Generate a unique identifier for a DOM element
 * @param {Element} element - The DOM element
 * @param {string} text - The text content
 * @returns {string} Unique identifier
 */
export function generateNodeId(element, text) {
  // Try to use existing ID
  if (element.id) {
    return `id-${element.id}`;
  }
  
  // Use class names if available
  if (element.className && typeof element.className === 'string') {
    const cleanClasses = element.className.trim().replace(/\s+/g, '-');
    if (cleanClasses) {
      return `class-${cleanClasses}-${text.slice(0, 20).replace(/\s+/g, '-')}`;
    }
  }
  
  // Use tag name + text snippet
  const tagName = element.tagName.toLowerCase();
  const textSnippet = text.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-');
  
  // Get element position in parent
  const siblings = Array.from(element.parentNode?.children || []);
  const index = siblings.indexOf(element);
  
  return `${tagName}-${index}-${textSnippet}`;
}

/**
 * Get XPath for an element
 * @param {Element} element - The DOM element
 * @returns {string} XPath string
 */
export function getElementXPath(element) {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  const parts = [];
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let nb = 0;
    let hasFollowing = false;
    let hasPreceding = false;
    
    for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) {
        hasPreceding = true;
        nb++;
      }
    }
    
    for (let sibling = element.nextSibling; sibling; sibling = sibling.nextSibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) {
        hasFollowing = true;
        break;
      }
    }
    
    if (hasPreceding || hasFollowing) {
      parts.push(element.nodeName.toLowerCase() + '[' + (nb + 1) + ']');
    } else {
      parts.push(element.nodeName.toLowerCase());
    }
    
    element = element.parentNode;
  }
  
  return parts.length ? '/' + parts.reverse().join('/') : '';
}

/**
 * Check if an element should be excluded from translation
 * @param {Element} element - The DOM element
 * @returns {boolean} True if should be excluded
 */
export function shouldExcludeElement(element) {
  // Check if element matches exclude selectors
  for (const selector of EXCLUDE_SELECTORS) {
    if (element.matches && element.matches(selector)) {
      return true;
    }
  }
  
  // Check if any parent has no-translate class or attribute
  let current = element;
  while (current && current !== document.body) {
    if (current.classList?.contains('no-translate') || 
        current.hasAttribute?.('data-no-translate') ||
        current.classList?.contains('translator-widget')) {
      return true;
    }
    current = current.parentNode;
  }
  
  return false;
}

/**
 * Check if text is meaningful for translation
 * @param {string} text - The text content
 * @returns {boolean} True if text is meaningful
 */
export function isMeaningfulText(text) {
  if (!text || typeof text !== 'string') return false;
  
  const trimmed = text.trim();
  
  // Too short
  if (trimmed.length < 2) return false;
  
  // Only whitespace, numbers, or special characters
  if (!/[a-zA-Z]/.test(trimmed)) return false;
  
  // Common non-translatable patterns
  const skipPatterns = [
    /^\d+$/, // Only numbers
    /^[^\w\s]+$/, // Only special characters
    /^(ok|yes|no)$/i, // Very common short words
    /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i, // Email addresses
    /^(https?:\/\/|www\.)/i, // URLs
  ];
  
  return !skipPatterns.some(pattern => pattern.test(trimmed));
}

/**
 * Extract all translatable text nodes from the page
 * @param {Document|Element} root - Root element to search from
 * @returns {Array} Array of text node objects
 */
export function extractTextNodes(root = document) {
  const textNodes = [];
  const processedTexts = new Set(); // To avoid duplicates
  
  // Get all elements that might contain text
  const elements = root.querySelectorAll(TEXT_SELECTORS.join(', '));
  
  elements.forEach(element => {
    if (shouldExcludeElement(element)) return;
    
    // Get direct text content (not from children)
    const textContent = getDirectTextContent(element);
    
    if (!isMeaningfulText(textContent)) return;
    
    const trimmedText = textContent.trim();
    
    // Skip if we've already processed this exact text
    if (processedTexts.has(trimmedText)) return;
    processedTexts.add(trimmedText);
    
    const nodeId = generateNodeId(element, trimmedText);
    const xpath = getElementXPath(element);
    
    textNodes.push({
      nodeId,
      element,
      originalText: trimmedText,
      xpath,
      tagName: element.tagName.toLowerCase(),
      pageUrl: window.location.href,
      boundingRect: element.getBoundingClientRect(),
      isVisible: isElementVisible(element)
    });
  });
  
  return textNodes;
}

/**
 * Get direct text content of an element (excluding children)
 * @param {Element} element - The DOM element
 * @returns {string} Direct text content
 */
function getDirectTextContent(element) {
  let text = '';
  
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
    }
  }
  
  return text.trim();
}

/**
 * Check if an element is visible
 * @param {Element} element - The DOM element
 * @returns {boolean} True if visible
 */
function isElementVisible(element) {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0' &&
         element.offsetWidth > 0 && 
         element.offsetHeight > 0;
}

/**
 * Find element by node ID
 * @param {string} nodeId - The node identifier
 * @param {Array} textNodes - Array of text node objects
 * @returns {Element|null} The found element
 */
export function findElementByNodeId(nodeId, textNodes) {
  const textNode = textNodes.find(node => node.nodeId === nodeId);
  return textNode ? textNode.element : null;
}

/**
 * Update text content of an element
 * @param {Element} element - The DOM element
 * @param {string} newText - The new text content
 * @param {string} originalText - The original text content
 */
export function updateElementText(element, newText, originalText) {
  if (!element || !newText) return;
  
  // Store original text as data attribute for reverting
  if (!element.hasAttribute('data-original-text')) {
    element.setAttribute('data-original-text', originalText);
  }
  
  // Find and replace text nodes
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    if (node.textContent.trim()) {
      textNodes.push(node);
    }
  }
  
  // Replace text in the first meaningful text node
  if (textNodes.length > 0) {
    textNodes[0].textContent = newText;
  }
}

/**
 * Revert element text to original
 * @param {Element} element - The DOM element
 */
export function revertElementText(element) {
  if (!element) return;
  
  const originalText = element.getAttribute('data-original-text');
  if (originalText) {
    updateElementText(element, originalText, originalText);
    element.removeAttribute('data-original-text');
  }
}

/**
 * Create a mutation observer to watch for DOM changes
 * @param {Function} callback - Callback function when mutations occur
 * @returns {MutationObserver} The observer instance
 */
export function createDOMObserver(callback) {
  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    
    mutations.forEach((mutation) => {
      // Check for added/removed nodes
      if (mutation.type === 'childList') {
        if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
          shouldUpdate = true;
        }
      }
      
      // Check for text content changes
      if (mutation.type === 'characterData') {
        shouldUpdate = true;
      }
    });
    
    if (shouldUpdate) {
      // Debounce the callback
      clearTimeout(observer._debounceTimer);
      observer._debounceTimer = setTimeout(callback, 500);
    }
  });
  
  return observer;
}

/**
 * Start observing DOM changes
 * @param {MutationObserver} observer - The observer instance
 * @param {Element} target - Target element to observe
 */
export function startDOMObservation(observer, target = document.body) {
  observer.observe(target, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

/**
 * Stop observing DOM changes
 * @param {MutationObserver} observer - The observer instance
 */
export function stopDOMObservation(observer) {
  observer.disconnect();
  if (observer._debounceTimer) {
    clearTimeout(observer._debounceTimer);
  }
}