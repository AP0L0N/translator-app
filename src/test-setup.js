import { vi } from 'vitest';
import 'vitest-dom/extend-expect';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

global.localStorage = localStorageMock;

// Mock sessionStorage
global.sessionStorage = localStorageMock;

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    hostname: 'localhost',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true
});

// Mock window.scrollY
Object.defineProperty(window, 'scrollY', {
  value: 0,
  writable: true
});

// Mock CSS computedStyle
global.getComputedStyle = vi.fn(() => ({
  display: 'block',
  visibility: 'visible',
  opacity: '1'
}));

// Mock DOM methods
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-1234'),
    getRandomValues: vi.fn(arr => arr.map(() => Math.floor(Math.random() * 256)))
  }
});

// Mock import.meta.env
vi.stubGlobal('import.meta', {
  env: {
    VITE_TARGET_WEBSITE_URL: 'http://localhost:3000',
    VITE_DEBUG_MODE: 'false',
    MODE: 'test'
  }
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  document.body.innerHTML = '';
});