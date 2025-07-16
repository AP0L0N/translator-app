import CryptoJS from 'crypto-js';

// Demo users for development (replace with real authentication in production)
const DEMO_USERS = [
  {
    id: '1',
    username: 'translator',
    password: 'demo123', // In production, this would be hashed
    name: 'Demo Translator',
    role: 'translator',
    permissions: ['translate', 'export', 'import']
  },
  {
    id: '2',
    username: 'admin',
    password: 'admin123', // In production, this would be hashed
    name: 'Demo Admin',
    role: 'admin',
    permissions: ['translate', 'export', 'import', 'manage_users', 'bulk_edit']
  }
];

const AUTH_STORAGE_KEY = 'translator_auth';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Hash a password (demo implementation - use proper hashing in production)
 * @param {string} password - Plain text password
 * @returns {string} Hashed password
 */
function hashPassword(password) {
  return CryptoJS.SHA256(password).toString();
}

/**
 * Authenticate user with username and password
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object|null>} User object if authenticated, null otherwise
 */
export async function authenticateUser(username, password) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Find user (in production, this would be an API call)
  const user = DEMO_USERS.find(u => 
    u.username === username && u.password === password
  );
  
  if (user) {
    const authData = {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        permissions: user.permissions
      },
      token: generateToken(user.id),
      timestamp: Date.now()
    };
    
    // Store authentication data
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    
    return authData.user;
  }
  
  return null;
}

/**
 * Generate a demo token (use proper JWT in production)
 * @param {string} userId - User ID
 * @returns {string} Generated token
 */
function generateToken(userId) {
  const payload = {
    userId,
    timestamp: Date.now()
  };
  
  return CryptoJS.AES.encrypt(JSON.stringify(payload), 'demo-secret').toString();
}

/**
 * Verify a token (demo implementation)
 * @param {string} token - Token to verify
 * @returns {Object|null} Decoded payload if valid, null otherwise
 */
function verifyToken(token) {
  try {
    const bytes = CryptoJS.AES.decrypt(token, 'demo-secret');
    const payload = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    
    // Check if token is expired
    if (Date.now() - payload.timestamp > SESSION_DURATION) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Get current authenticated user
 * @returns {Object|null} User object if authenticated, null otherwise
 */
export function getCurrentUser() {
  try {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!authData) return null;
    
    const parsed = JSON.parse(authData);
    
    // Verify token
    const tokenPayload = verifyToken(parsed.token);
    if (!tokenPayload) {
      logout(); // Token invalid, logout
      return null;
    }
    
    // Check session expiry
    if (Date.now() - parsed.timestamp > SESSION_DURATION) {
      logout(); // Session expired
      return null;
    }
    
    return parsed.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export function isAuthenticated() {
  return getCurrentUser() !== null;
}

/**
 * Check if user has specific permission
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
export function hasPermission(permission) {
  const user = getCurrentUser();
  return user?.permissions?.includes(permission) || false;
}

/**
 * Logout current user
 */
export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  // Dispatch custom event for components to listen to
  window.dispatchEvent(new CustomEvent('translator-logout'));
}

/**
 * Refresh user session
 * @returns {boolean} True if session refreshed successfully
 */
export function refreshSession() {
  const user = getCurrentUser();
  if (!user) return false;
  
  try {
    const authData = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
    authData.timestamp = Date.now();
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    return true;
  } catch (error) {
    console.error('Error refreshing session:', error);
    return false;
  }
}

/**
 * Check if user is admin
 * @returns {boolean} True if user is admin
 */
export function isAdmin() {
  const user = getCurrentUser();
  return user?.role === 'admin';
}

/**
 * Create a demo OAuth-style authentication URL (for external partners)
 * @param {string} provider - OAuth provider name
 * @param {string} redirectUri - Redirect URI after authentication
 * @returns {string} OAuth URL
 */
export function createOAuthUrl(provider, redirectUri) {
  const params = new URLSearchParams({
    client_id: 'translator-widget',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'translate',
    state: generateToken('oauth-state')
  });
  
  // Demo OAuth URLs (replace with real providers)
  const providerUrls = {
    google: 'https://accounts.google.com/oauth/authorize',
    github: 'https://github.com/login/oauth/authorize',
    microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
  };
  
  const baseUrl = providerUrls[provider] || providerUrls.google;
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Handle OAuth callback (demo implementation)
 * @param {string} code - Authorization code from OAuth provider
 * @param {string} state - State parameter for security
 * @returns {Promise<Object|null>} User object if successful
 */
export async function handleOAuthCallback(code, state) {
  // In a real implementation, this would exchange the code for an access token
  // and fetch user information from the OAuth provider
  
  // Demo implementation
  if (code && state) {
    const demoUser = {
      id: 'oauth-user',
      username: 'external.partner',
      name: 'External Partner',
      role: 'translator',
      permissions: ['translate', 'export']
    };
    
    const authData = {
      user: demoUser,
      token: generateToken(demoUser.id),
      timestamp: Date.now()
    };
    
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    return demoUser;
  }
  
  return null;
}

/**
 * Setup session monitoring
 */
export function setupSessionMonitoring() {
  // Refresh session on user activity
  const refreshOnActivity = () => {
    if (isAuthenticated()) {
      refreshSession();
    }
  };
  
  // Listen for user activity
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(event => {
    document.addEventListener(event, refreshOnActivity, { passive: true });
  });
  
  // Periodic session check
  setInterval(() => {
    const user = getCurrentUser();
    if (!user) {
      // User session expired, clean up
      window.dispatchEvent(new CustomEvent('translator-session-expired'));
    }
  }, 60000); // Check every minute
}

/**
 * Initialize authentication system
 */
export function initAuth() {
  setupSessionMonitoring();
  
  // Check for OAuth callback parameters
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  if (code && state) {
    handleOAuthCallback(code, state).then(user => {
      if (user) {
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        window.dispatchEvent(new CustomEvent('translator-oauth-success', { detail: user }));
      }
    });
  }
}

/**
 * Get available authentication methods
 * @returns {Array} Array of available auth methods
 */
export function getAuthMethods() {
  return [
    {
      id: 'username',
      name: 'Username/Password',
      type: 'form',
      enabled: true
    },
    {
      id: 'google',
      name: 'Google OAuth',
      type: 'oauth',
      enabled: import.meta.env.VITE_GOOGLE_CLIENT_ID ? true : false
    },
    {
      id: 'github',
      name: 'GitHub OAuth',
      type: 'oauth',
      enabled: import.meta.env.VITE_GITHUB_CLIENT_ID ? true : false
    }
  ];
}