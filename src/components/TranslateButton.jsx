import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import { findTranslation } from '../services/translationService';

const TranslateButton = ({ 
  textNode, 
  onTranslate, 
  visible, 
  position 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef(null);
  
  const { 
    currentLanguage, 
    translations, 
    isAuthenticated 
  } = useTranslation();

  // Don't render if not authenticated
  if (!isAuthenticated) return null;

  const currentTranslations = translations[currentLanguage] || [];
  const existingTranslation = findTranslation(currentTranslations, textNode?.nodeId);
  const hasTranslation = !!existingTranslation;

  const getButtonStyle = () => {
    if (!position || !visible) return { display: 'none' };

    return {
      position: 'absolute',
      top: position.top,
      left: position.left,
      zIndex: 9999,
      pointerEvents: 'auto',
      transform: 'translate(-50%, -100%)',
      marginTop: '-8px',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.2s ease-in-out',
      display: visible ? 'block' : 'none'
    };
  };

  const getButtonClass = () => {
    let baseClass = 'btn btn-sm shadow-sm border-0';
    
    if (hasTranslation) {
      switch (existingTranslation.status) {
        case 'approved':
          return `${baseClass} btn-success`;
        case 'pending':
          return `${baseClass} btn-warning`;
        case 'needs_review':
          return `${baseClass} btn-danger`;
        default:
          return `${baseClass} btn-info`;
      }
    }
    
    return `${baseClass} btn-outline-primary`;
  };

  const getButtonIcon = () => {
    if (hasTranslation) {
      switch (existingTranslation.status) {
        case 'approved':
          return 'bi-check-circle-fill';
        case 'pending':
          return 'bi-clock-fill';
        case 'needs_review':
          return 'bi-exclamation-triangle-fill';
        default:
          return 'bi-translate';
      }
    }
    
    return 'bi-translate';
  };

  const getTooltipText = () => {
    if (hasTranslation) {
      const status = existingTranslation.status;
      return `Translation: ${status} • Click to edit`;
    }
    
    return 'Click to translate this text';
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onTranslate?.(textNode);
  };

  return (
    <div 
      ref={buttonRef}
      className="translator-widget-button"
      style={getButtonStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        className={getButtonClass()}
        onClick={handleClick}
        title={getTooltipText()}
        style={{
          fontSize: '11px',
          padding: '4px 8px',
          minWidth: 'auto',
          whiteSpace: 'nowrap'
        }}
      >
        <i className={`bi ${getButtonIcon()} me-1`}></i>
        {hasTranslation ? 'Edit' : 'Translate'}
      </button>
      
      {/* Enhanced tooltip on hover */}
      {isHovered && (
        <div 
          className="tooltip-custom"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '5px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 10000,
            pointerEvents: 'none'
          }}
        >
          <div className="fw-bold">
            {hasTranslation ? 'Edit Translation' : 'Add Translation'}
          </div>
          {hasTranslation && (
            <div className="small">
              Status: {existingTranslation.status} • 
              v{existingTranslation.version}
            </div>
          )}
          <div className="small text-muted">
            Language: {currentLanguage.toUpperCase()}
          </div>
          
          {/* Tooltip arrow */}
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid rgba(0, 0, 0, 0.9)'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default TranslateButton;