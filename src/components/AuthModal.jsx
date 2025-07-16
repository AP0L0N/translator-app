import React, { useState, useEffect } from 'react';
import { authenticateUser, createOAuthUrl } from '../utils/authUtils';
import { useTranslation } from '../contexts/TranslationContext';

const AuthModal = ({ show, onHide, onAuthSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { dispatch, actions } = useTranslation();

  useEffect(() => {
    if (show) {
      setError('');
      setUsername('');
      setPassword('');
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const user = await authenticateUser(username, password);
      if (user) {
        dispatch({ 
          type: actions.SET_AUTHENTICATED, 
          payload: { isAuthenticated: true, user } 
        });
        onAuthSuccess?.(user);
        onHide();
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    const oauthUrl = createOAuthUrl(provider, redirectUri);
    window.location.href = oauthUrl;
  };

  if (!show) return null;

  return (
    <div className="modal show" style={{ display: 'block' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-shield-lock me-2"></i>
              Translation Widget Login
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onHide}
              disabled={isLoading}
            ></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}
              
              <div className="mb-3">
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-person"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="Enter your username"
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
              </div>
              
              <div className="alert alert-info" role="alert">
                <small>
                  <strong>Demo Credentials:</strong><br />
                  Username: <code>translator</code> Password: <code>demo123</code><br />
                  Username: <code>admin</code> Password: <code>admin123</code>
                </small>
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="d-flex flex-column w-100">
                <div className="d-flex gap-2 mb-3">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onHide}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-fill"
                    disabled={isLoading || !username || !password}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Sign In
                      </>
                    )}
                  </button>
                </div>
                
                <div className="text-center">
                  <small className="text-muted">or sign in with</small>
                </div>
                
                <div className="d-flex gap-2 mt-2">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm flex-fill"
                    onClick={() => handleOAuthLogin('google')}
                    disabled={isLoading}
                  >
                    <i className="bi bi-google me-1"></i>
                    Google
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm flex-fill"
                    onClick={() => handleOAuthLogin('github')}
                    disabled={isLoading}
                  >
                    <i className="bi bi-github me-1"></i>
                    GitHub
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;