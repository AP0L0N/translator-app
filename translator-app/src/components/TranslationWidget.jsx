import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../contexts/TranslationContext';
import { isAuthenticated, getCurrentUser, initAuth } from '../utils/authUtils';
import { 
  extractTextNodes, 
  createDOMObserver, 
  startDOMObservation, 
  stopDOMObservation 
} from '../utils/textNodeUtils';
import AuthModal from './AuthModal';
import TranslationModal from './TranslationModal';
import TranslateButton from './TranslateButton';
import SettingsPanel from './SettingsPanel';

const TranslationWidget = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [selectedTextNode, setSelectedTextNode] = useState(null);
  const [hoveredTextNode, setHoveredTextNode] = useState(null);
  const [buttonPosition, setButtonPosition] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const widgetRef = useRef(null);
  const observerRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const buttonTimeoutRef = useRef(null);

  const {
    isAuthenticated: authState,
    textNodes,
    dispatch,
    actions
  } = useTranslation();

  // Initialize authentication
  useEffect(() => {
    initAuth();
    
    // Check if user is already authenticated
    const user = getCurrentUser();
    if (user) {
      dispatch({
        type: actions.SET_AUTHENTICATED,
        payload: { isAuthenticated: true, user }
      });
    } else if (!showAuthModal) {
      // Show auth modal if not authenticated
      setShowAuthModal(true);
    }
  }, [dispatch, actions, showAuthModal]);

  // Extract text nodes when page loads or changes
  const updateTextNodes = useCallback(() => {
    try {
      const nodes = extractTextNodes();
      dispatch({ type: actions.SET_TEXT_NODES, payload: nodes });
      dispatch({ type: actions.SET_CURRENT_PAGE_URL, payload: window.location.href });
    } catch (error) {
      console.error('Error extracting text nodes:', error);
    }
  }, [dispatch, actions]);

  // Setup DOM observation
  useEffect(() => {
    if (!authState) return;

    // Initial extraction
    updateTextNodes();

    // Setup observer for DOM changes
    observerRef.current = createDOMObserver(updateTextNodes);
    startDOMObservation(observerRef.current);

    return () => {
      if (observerRef.current) {
        stopDOMObservation(observerRef.current);
      }
    };
  }, [authState, updateTextNodes]);

  // Setup hover listeners
  useEffect(() => {
    if (!authState || textNodes.length === 0) return;

    const handleMouseOver = (event) => {
      const target = event.target;
      
      // Find if this element or its parents are in our text nodes
      const textNode = textNodes.find(node => 
        node.element === target || node.element.contains(target)
      );

      if (textNode && textNode !== hoveredTextNode) {
        clearTimeout(hoverTimeoutRef.current);
        
        hoverTimeoutRef.current = setTimeout(() => {
          setHoveredTextNode(textNode);
          
          const rect = textNode.element.getBoundingClientRect();
          setButtonPosition({
            top: rect.top + window.scrollY,
            left: rect.left + rect.width / 2
          });
          
          setIsVisible(true);
        }, 300); // Delay to prevent flickering
      }
    };

    const handleMouseOut = (event) => {
      const target = event.target;
      const relatedTarget = event.relatedTarget;
      
      // Check if we're moving to the translate button
      if (relatedTarget?.closest('.translator-widget-button')) {
        return;
      }
      
      // Check if we're still within the same text element
      const textNode = textNodes.find(node => 
        node.element === target || node.element.contains(target)
      );
      
      if (textNode && (!relatedTarget || !textNode.element.contains(relatedTarget))) {
        clearTimeout(hoverTimeoutRef.current);
        clearTimeout(buttonTimeoutRef.current);
        
        buttonTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
          setHoveredTextNode(null);
          setButtonPosition(null);
        }, 500);
      }
    };

    // Add listeners to text elements
    textNodes.forEach(textNode => {
      textNode.element.addEventListener('mouseover', handleMouseOver);
      textNode.element.addEventListener('mouseout', handleMouseOut);
    });

    return () => {
      // Cleanup listeners
      textNodes.forEach(textNode => {
        if (textNode.element) {
          textNode.element.removeEventListener('mouseover', handleMouseOver);
          textNode.element.removeEventListener('mouseout', handleMouseOut);
        }
      });
      clearTimeout(hoverTimeoutRef.current);
      clearTimeout(buttonTimeoutRef.current);
    };
  }, [authState, textNodes, hoveredTextNode]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+Shift+T to toggle settings panel
      if (event.ctrlKey && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        if (authState) {
          setShowSettingsPanel(prev => !prev);
        }
      }
      
      // Escape to close modals
      if (event.key === 'Escape') {
        setShowTranslationModal(false);
        setShowSettingsPanel(false);
        if (!authState) {
          setShowAuthModal(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [authState]);

  // Listen for authentication events
  useEffect(() => {
    const handleLogout = () => {
      dispatch({
        type: actions.SET_AUTHENTICATED,
        payload: { isAuthenticated: false, user: null }
      });
      setShowAuthModal(true);
      setShowSettingsPanel(false);
      setShowTranslationModal(false);
    };

    const handleSessionExpired = () => {
      handleLogout();
    };

    const handleOAuthSuccess = (event) => {
      const user = event.detail;
      dispatch({
        type: actions.SET_AUTHENTICATED,
        payload: { isAuthenticated: true, user }
      });
      setShowAuthModal(false);
    };

    window.addEventListener('translator-logout', handleLogout);
    window.addEventListener('translator-session-expired', handleSessionExpired);
    window.addEventListener('translator-oauth-success', handleOAuthSuccess);

    return () => {
      window.removeEventListener('translator-logout', handleLogout);
      window.removeEventListener('translator-session-expired', handleSessionExpired);
      window.removeEventListener('translator-oauth-success', handleOAuthSuccess);
    };
  }, [dispatch, actions]);

  const handleTranslateClick = (textNode) => {
    setSelectedTextNode(textNode);
    setShowTranslationModal(true);
    setIsVisible(false); // Hide the button when modal opens
  };

  const handleAuthSuccess = (user) => {
    setShowAuthModal(false);
    // Text nodes will be extracted automatically via useEffect
  };

  const handleTranslationSave = (translation) => {
    // Translation is already saved via the modal's dispatch
    setShowTranslationModal(false);
    setSelectedTextNode(null);
  };

  // Render floating action button for settings
  const renderFloatingActionButton = () => {
    if (!authState) return null;

    return (
      <div
        className="translator-widget-fab"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9998,
          pointerEvents: 'auto'
        }}
      >
        <button
          type="button"
          className="btn btn-primary btn-lg rounded-circle shadow"
          onClick={() => setShowSettingsPanel(true)}
          title="Translation Settings (Ctrl+Shift+T)"
          style={{
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <i className="bi bi-gear-fill"></i>
        </button>
      </div>
    );
  };

  // Don't render anything if the widget container doesn't exist
  const widgetContainer = document.getElementById('translator-widget-root');
  if (!widgetContainer) {
    console.warn('Translation widget container not found');
    return null;
  }

  return createPortal(
    <div ref={widgetRef} className="translator-widget">
      {/* Translate Button */}
      {hoveredTextNode && isVisible && (
        <TranslateButton
          textNode={hoveredTextNode}
          onTranslate={handleTranslateClick}
          visible={isVisible}
          position={buttonPosition}
        />
      )}

      {/* Floating Action Button */}
      {renderFloatingActionButton()}

      {/* Authentication Modal */}
      <AuthModal
        show={showAuthModal}
        onHide={() => !authState ? null : setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Translation Modal */}
      <TranslationModal
        show={showTranslationModal}
        onHide={() => setShowTranslationModal(false)}
        textNode={selectedTextNode}
        onSave={handleTranslationSave}
      />

      {/* Settings Panel */}
      <SettingsPanel
        show={showSettingsPanel}
        onHide={() => setShowSettingsPanel(false)}
      />

      {/* Widget CSS */}
      <style>
        {`
          .translator-widget {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: #212529;
            box-sizing: border-box;
          }
          
          .translator-widget *,
          .translator-widget *::before,
          .translator-widget *::after {
            box-sizing: border-box;
          }
          
          .translator-widget-button {
            pointer-events: auto;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
          }
          
          .translator-widget-fab {
            animation: fadeInUp 0.3s ease-out;
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .translator-widget .modal-backdrop {
            background-color: rgba(0, 0, 0, 0.5);
          }
          
          .translator-widget .offcanvas {
            width: 400px !important;
            max-width: 90vw !important;
          }
          
          .translator-widget .nav-tabs .nav-link {
            border: none;
            color: #6c757d;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
          }
          
          .translator-widget .nav-tabs .nav-link.active {
            color: #0d6efd;
            background-color: transparent;
            border-bottom: 2px solid #0d6efd;
          }
        `}
      </style>
    </div>,
    widgetContainer
  );
};

export default TranslationWidget;