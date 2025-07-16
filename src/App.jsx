import React, { useState, useEffect } from 'react';
import { TranslationProvider } from './contexts/TranslationContext';
import TranslationWidget from './components/TranslationWidget';

function App() {
  const [showWidget, setShowWidget] = useState(false);
  const [demoContent, setDemoContent] = useState('chipolo');

  useEffect(() => {
    // Create the widget container
    const container = document.createElement('div');
    container.id = 'translator-widget-root';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 999999;
    `;
    document.body.appendChild(container);

    return () => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, []);

  const demoPages = {
    chipolo: {
      title: 'Chipolo Demo',
      content: (
        <div>
          <header className="bg-primary text-white py-4 mb-4">
            <div className="container">
              <h1 className="display-4">Welcome to Chipolo</h1>
              <p className="lead">Never lose your things again with Chipolo Bluetooth trackers</p>
            </div>
          </header>
          
          <div className="container">
            <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
              <div className="container-fluid">
                <a className="navbar-brand" href="#">Chipolo</a>
                <div className="navbar-nav">
                  <a className="nav-link" href="#">Products</a>
                  <a className="nav-link" href="#">Features</a>
                  <a className="nav-link" href="#">Support</a>
                  <a className="nav-link" href="#">About</a>
                </div>
              </div>
            </nav>

            <div className="row">
              <div className="col-md-8">
                <h2>Our Products</h2>
                <div className="row">
                  <div className="col-md-6 mb-4">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Chipolo ONE</h5>
                        <p className="card-text">The loudest Bluetooth item finder that helps you find your keys, wallet, bag or anything else.</p>
                        <button className="btn btn-primary">Learn More</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-4">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Chipolo CARD</h5>
                        <p className="card-text">Thin as two credit cards, CARD fits perfectly in your wallet and helps you find it when lost.</p>
                        <button className="btn btn-primary">Learn More</button>
                      </div>
                    </div>
                  </div>
                </div>

                <h3>Why Choose Chipolo?</h3>
                <ul className="list-group list-group-flush mb-4">
                  <li className="list-group-item">Loudest ring on the market - up to 120dB</li>
                  <li className="list-group-item">Works with Apple Find My and Google Find My Device</li>
                  <li className="list-group-item">Water resistant design</li>
                  <li className="list-group-item">Long-lasting battery life</li>
                  <li className="list-group-item">Easy to use mobile app</li>
                </ul>

                <div className="alert alert-info">
                  <h4 className="alert-heading">Special Offer!</h4>
                  <p>Get 20% off your first order when you sign up for our newsletter.</p>
                  <hr />
                  <p className="mb-0">Limited time offer. Terms and conditions apply.</p>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card">
                  <div className="card-header">
                    <h5>Customer Reviews</h5>
                  </div>
                  <div className="card-body">
                    <blockquote className="blockquote mb-3">
                      <p>"Amazing product! I never lose my keys anymore."</p>
                      <footer className="blockquote-footer">Sarah Johnson</footer>
                    </blockquote>
                    <blockquote className="blockquote mb-3">
                      <p>"The sound is incredibly loud and the app is very user-friendly."</p>
                      <footer className="blockquote-footer">Mike Chen</footer>
                    </blockquote>
                    <blockquote className="blockquote">
                      <p>"Perfect for my wallet. So thin and works perfectly."</p>
                      <footer className="blockquote-footer">Emma Davis</footer>
                    </blockquote>
                  </div>
                </div>

                <div className="card mt-4">
                  <div className="card-header">
                    <h5>Quick Links</h5>
                  </div>
                  <div className="list-group list-group-flush">
                    <a href="#" className="list-group-item list-group-item-action">Download App</a>
                    <a href="#" className="list-group-item list-group-item-action">User Manual</a>
                    <a href="#" className="list-group-item list-group-item-action">Warranty Info</a>
                    <a href="#" className="list-group-item list-group-item-action">Contact Support</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="bg-dark text-white mt-5 py-4">
            <div className="container">
              <div className="row">
                <div className="col-md-6">
                  <h5>Chipolo</h5>
                  <p>Making sure you never lose your important items again.</p>
                </div>
                <div className="col-md-3">
                  <h6>Company</h6>
                  <ul className="list-unstyled">
                    <li><a href="#" className="text-light">About Us</a></li>
                    <li><a href="#" className="text-light">Careers</a></li>
                    <li><a href="#" className="text-light">Press</a></li>
                  </ul>
                </div>
                <div className="col-md-3">
                  <h6>Support</h6>
                  <ul className="list-unstyled">
                    <li><a href="#" className="text-light">Help Center</a></li>
                    <li><a href="#" className="text-light">Contact Us</a></li>
                    <li><a href="#" className="text-light">Privacy Policy</a></li>
                  </ul>
                </div>
              </div>
              <hr className="my-4" />
              <p className="text-center mb-0">&copy; 2025 Chipolo. All rights reserved.</p>
            </div>
          </footer>
        </div>
      )
    },
    simple: {
      title: 'Simple Page Demo',
      content: (
        <div className="container py-5">
          <h1>Simple Demo Page</h1>
          <p className="lead">This is a simple demo page to test the translation widget.</p>
          
          <h2>Features</h2>
          <ul>
            <li>Hover over any text to see translate buttons</li>
            <li>Click translate buttons to open translation modal</li>
            <li>Use the settings panel to manage translations</li>
            <li>Support for multiple languages</li>
          </ul>

          <h3>Sample Content</h3>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          
          <div className="alert alert-primary">
            <strong>Note:</strong> This widget is designed for internal translation management.
          </div>

          <h4>Instructions</h4>
          <ol>
            <li>Login with demo credentials (username: translator, password: demo123)</li>
            <li>Hover over text elements to see translate buttons</li>
            <li>Click translate buttons to add or edit translations</li>
            <li>Use the floating settings button to manage languages and export/import</li>
          </ol>
        </div>
      )
    }
  };

  return (
    <div className="app">
      {/* Demo Control Panel */}
      <div className="demo-control-panel bg-light border-bottom p-3">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h5 className="mb-0">
                <i className="bi bi-gear-fill me-2"></i>
                Translation Widget Demo
              </h5>
              <small className="text-muted">Testing environment for the translation widget</small>
            </div>
            <div className="col-md-6">
              <div className="d-flex gap-2 justify-content-end">
                <select 
                  className="form-select form-select-sm"
                  value={demoContent}
                  onChange={(e) => setDemoContent(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="chipolo">Chipolo Demo</option>
                  <option value="simple">Simple Page</option>
                </select>
                
                <button
                  className={`btn btn-sm ${showWidget ? 'btn-danger' : 'btn-success'}`}
                  onClick={() => setShowWidget(!showWidget)}
                >
                  <i className={`bi bi-${showWidget ? 'eye-slash' : 'eye'} me-1`}></i>
                  {showWidget ? 'Hide Widget' : 'Show Widget'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="demo-content">
        {demoPages[demoContent].content}
      </div>

      {/* Translation Widget */}
      {showWidget && (
        <TranslationProvider>
          <TranslationWidget />
        </TranslationProvider>
      )}

      {/* Demo Instructions */}
      <div className="position-fixed bottom-0 start-0 m-3">
        <div className="card shadow" style={{ width: '300px' }}>
          <div className="card-header">
            <h6 className="mb-0">
              <i className="bi bi-info-circle me-2"></i>
              Demo Instructions
            </h6>
          </div>
          <div className="card-body small">
            <p><strong>Demo Credentials:</strong></p>
            <ul className="mb-2">
              <li>Username: <code>translator</code></li>
              <li>Password: <code>demo123</code></li>
            </ul>
            <p><strong>Keyboard Shortcuts:</strong></p>
            <ul className="mb-0">
              <li><kbd>Ctrl+Shift+T</kbd> - Toggle Settings</li>
              <li><kbd>Esc</kbd> - Close Modals</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
