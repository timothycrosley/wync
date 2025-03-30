import React, { useState, useEffect } from 'react';
import './InfoPopover.css';

function InfoPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Check localStorage on component mount to see if we should show the popover
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('wynkHasSeenIntro') === 'true';
    if (!hasSeenIntro) {
      setIsOpen(true);
      // Don't mark as seen immediately - only when they check the box and close
    }
  }, []);

  const handleTogglePopover = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
    
    // Save preference if "Don't show again" is checked
    if (dontShowAgain) {
      localStorage.setItem('wynkHasSeenIntro', 'true');
    }
  };

  const handleDontShowChange = (e) => {
    setDontShowAgain(e.target.checked);
  };

  return (
    <>
      {/* Help button to open popover */}
      <button 
        className="info-button" 
        onClick={handleTogglePopover}
        title="About Wynk"
      >
        ?
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="info-popover-overlay" onClick={(e) => {
          // Close when clicking outside the popover
          if (e.target.className === 'info-popover-overlay') {
            handleClose();
          }
        }}>
          <div className="info-popover">
            <button className="close-button" onClick={handleClose}>×</button>
            
            <div className="popover-content">
              <img 
                src={`${process.env.PUBLIC_URL}/logo512.png`}
                alt="Wynk Logo" 
                className="app-logo"
              />
              
              <h1 className="app-name">Wynk</h1>
              <p className="app-slogan">The way We Sync!</p>
              
              <div className="app-description">
                <p>Welcome to Wynk, your scheduling solution for team and family coordination!</p>
                <p>With Wynk, you can:</p>
                <ul>
                  <li>Create multiple schedules for different scenarios</li>
                  <li>Select activities and apply them to time slots, like painting on a schedule canvas</li>
                  <li>Customize activities with colors</li>
                  <li>Export and import schedules to share with others</li>
                </ul>
                <p>Get started by adding people, creating activities, and applying them to the schedule grid.</p>
              </div>
              
              <div className="dont-show-again">
                <label>
                  <input 
                    type="checkbox" 
                    checked={dontShowAgain}
                    onChange={handleDontShowChange}
                  />
                  Don't show this again
                </label>
              </div>
              
              <button className="start-button" onClick={handleClose}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default InfoPopover; 