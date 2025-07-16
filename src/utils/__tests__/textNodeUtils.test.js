import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  generateNodeId, 
  isMeaningfulText, 
  shouldExcludeElement,
  getElementXPath 
} from '../textNodeUtils';

// Mock DOM environment
global.Node = {
  ELEMENT_NODE: 1,
  TEXT_NODE: 3
};

describe('textNodeUtils', () => {
  describe('generateNodeId', () => {
    it('should use element ID when available', () => {
      const element = {
        id: 'test-id',
        tagName: 'DIV'
      };
      const text = 'Sample text';
      
      const nodeId = generateNodeId(element, text);
      expect(nodeId).toBe('id-test-id');
    });

    it('should use class names when ID not available', () => {
      const element = {
        id: '',
        className: 'test-class another-class',
        tagName: 'SPAN'
      };
      const text = 'Sample text for testing';
      
      const nodeId = generateNodeId(element, text);
      expect(nodeId).toBe('class-test-class-another-class-Sample-text-for-tes');
    });

    it('should fallback to tag name and text snippet', () => {
      const element = {
        id: '',
        className: '',
        tagName: 'P',
        parentNode: {
          children: [{ tagName: 'P' }, { tagName: 'P' }]
        }
      };
      const text = 'This is a test paragraph';
      
      const nodeId = generateNodeId(element, text);
      expect(nodeId).toMatch(/^p-\d+-This-is-a-test-paragraph$/);
    });
  });

  describe('isMeaningfulText', () => {
    it('should return true for meaningful text', () => {
      expect(isMeaningfulText('Hello world')).toBe(true);
      expect(isMeaningfulText('Product description')).toBe(true);
      expect(isMeaningfulText('Welcome to our website')).toBe(true);
    });

    it('should return false for empty or whitespace text', () => {
      expect(isMeaningfulText('')).toBe(false);
      expect(isMeaningfulText('   ')).toBe(false);
      expect(isMeaningfulText('\n\t')).toBe(false);
    });

    it('should return false for very short text', () => {
      expect(isMeaningfulText('a')).toBe(false);
      expect(isMeaningfulText('1')).toBe(false);
    });

    it('should return false for numbers only', () => {
      expect(isMeaningfulText('123')).toBe(false);
      expect(isMeaningfulText('456789')).toBe(false);
    });

    it('should return false for special characters only', () => {
      expect(isMeaningfulText('!@#$')).toBe(false);
      expect(isMeaningfulText('***')).toBe(false);
    });

    it('should return false for email addresses', () => {
      expect(isMeaningfulText('test@example.com')).toBe(false);
      expect(isMeaningfulText('user.name@domain.org')).toBe(false);
    });

    it('should return false for URLs', () => {
      expect(isMeaningfulText('https://example.com')).toBe(false);
      expect(isMeaningfulText('www.google.com')).toBe(false);
    });

    it('should return false for common short words', () => {
      expect(isMeaningfulText('ok')).toBe(false);
      expect(isMeaningfulText('yes')).toBe(false);
      expect(isMeaningfulText('no')).toBe(false);
    });
  });

  describe('shouldExcludeElement', () => {
    it('should exclude script and style elements', () => {
      const scriptElement = {
        matches: vi.fn().mockImplementation(selector => selector === 'script'),
        classList: { contains: vi.fn(() => false) },
        hasAttribute: vi.fn(() => false)
      };
      
      expect(shouldExcludeElement(scriptElement)).toBe(true);
      expect(scriptElement.matches).toHaveBeenCalledWith('script');
    });

    it('should exclude elements with no-translate class', () => {
      const element = {
        matches: vi.fn(() => false),
        classList: { contains: vi.fn(className => className === 'no-translate') },
        hasAttribute: vi.fn(() => false),
        parentNode: null
      };
      
      expect(shouldExcludeElement(element)).toBe(true);
    });

    it('should exclude elements with data-no-translate attribute', () => {
      const element = {
        matches: vi.fn(() => false),
        classList: { contains: vi.fn(() => false) },
        hasAttribute: vi.fn(attr => attr === 'data-no-translate'),
        parentNode: null
      };
      
      expect(shouldExcludeElement(element)).toBe(true);
    });

    it('should exclude translator widget elements', () => {
      const element = {
        matches: vi.fn(() => false),
        classList: { contains: vi.fn(className => className === 'translator-widget') },
        hasAttribute: vi.fn(() => false),
        parentNode: null
      };
      
      expect(shouldExcludeElement(element)).toBe(true);
    });

    it('should not exclude regular elements', () => {
      const element = {
        matches: vi.fn(() => false),
        classList: { contains: vi.fn(() => false) },
        hasAttribute: vi.fn(() => false),
        parentNode: null
      };
      
      expect(shouldExcludeElement(element)).toBe(false);
    });
  });

  describe('getElementXPath', () => {
    it('should return XPath with ID when element has ID', () => {
      const element = {
        id: 'test-element',
        nodeType: Node.ELEMENT_NODE
      };
      
      const xpath = getElementXPath(element);
      expect(xpath).toBe('//*[@id="test-element"]');
    });

    it('should generate XPath without ID', () => {
      const element = {
        id: '',
        nodeType: Node.ELEMENT_NODE,
        nodeName: 'DIV',
        previousSibling: null,
        nextSibling: null,
        parentNode: {
          nodeType: Node.ELEMENT_NODE,
          nodeName: 'BODY',
          previousSibling: null,
          nextSibling: null,
          parentNode: null
        }
      };
      
      const xpath = getElementXPath(element);
      expect(xpath).toBe('/body/div');
    });
  });
});

describe('DOM Integration Tests', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
  });

  it('should handle real DOM elements', () => {
    // Create test elements
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = `
      <h1>Main Title</h1>
      <p class="content">This is a paragraph with meaningful content.</p>
      <span class="no-translate">Don't translate this</span>
      <script>console.log('script content');</script>
    `;
    document.body.appendChild(container);

    const h1 = container.querySelector('h1');
    const p = container.querySelector('p');
    const span = container.querySelector('span');
    const script = container.querySelector('script');

    // Test generateNodeId with real elements
    expect(generateNodeId(h1, 'Main Title')).toBe('class--Main-Title');
    expect(generateNodeId(p, 'This is a paragraph')).toBe('class-content-This-is-a-paragrap');

    // Test shouldExcludeElement with real elements
    expect(shouldExcludeElement(h1)).toBe(false);
    expect(shouldExcludeElement(p)).toBe(false);
    expect(shouldExcludeElement(span)).toBe(true); // has no-translate class
    expect(shouldExcludeElement(script)).toBe(true); // is script element

    // Test isMeaningfulText with real content
    expect(isMeaningfulText(h1.textContent)).toBe(true);
    expect(isMeaningfulText(p.textContent)).toBe(true);
  });
});