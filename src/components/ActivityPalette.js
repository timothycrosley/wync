import React, { useState, useRef, useCallback } from 'react';
import { SketchPicker } from 'react-color'; // Import the color picker
import './ActivityPalette.css'; // We'll create this CSS file next

// Helper function copied from TimeSlotCell.js
const getTextColor = (bgColor) => {
  // Basic check for invalid color
  if (!bgColor || typeof bgColor !== 'string') return '#333'; 
  
  // Handle white/transparent case specifically for palette
  if (bgColor === '#FFFFFF') return '#333'; 

  const color = bgColor.substring(1); // strip #
  try {
    const rgb = parseInt(color, 16);   // convert rrggbb to decimal
    const r = (rgb >> 16) & 0xff;  // extract red
    const g = (rgb >>  8) & 0xff;  // extract green
    const b = (rgb >>  0) & 0xff;  // extract blue
    // Calculate luminance (per WCAG standard)
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 140 ? 'white' : '#333'; // Use white text on dark backgrounds
  } catch (e) {
    console.error("Error parsing color:", bgColor, e);
    return '#333'; // Default color on error
  }
};

function ActivityPalette({ activities, selectedActivityId, onSelectActivity, onRemoveActivity, onUpdateActivityColor }) {
  // Filter out the 'Empty' activity from the visible palette
  const displayActivities = activities.filter(a => a.id !== 'empty');

  // State to manage which color picker is open { activityId: string | null }
  const [pickerActivityId, setPickerActivityId] = useState(null);
  
  // Ref to store the long press timer
  const longPressTimerRef = useRef(null);
  // Ref to prevent click after long press opens picker
  const didLongPressRef = useRef(false); 

  const handleRemoveClick = (e, activityId) => {
    e.stopPropagation(); // Prevent selecting the activity when clicking remove
    clearTimeout(longPressTimerRef.current); // Cancel long press if remove is clicked
    setPickerActivityId(null); // Close picker if open
    onRemoveActivity(activityId);
  };

  // --- Long Press Handlers --- 
  const handleMouseDown = useCallback((activityId) => {
    didLongPressRef.current = false; // Reset flag
    clearTimeout(longPressTimerRef.current); // Clear any existing timer
    longPressTimerRef.current = setTimeout(() => {
      didLongPressRef.current = true; // Set flag: long press occurred
      setPickerActivityId(activityId); // Open the picker for this activity
    }, 500); // 500ms delay for long press
  }, []);

  const clearLongPressTimer = useCallback(() => {
    clearTimeout(longPressTimerRef.current);
  }, []);

  const handleMouseUp = useCallback((activityId) => {
    clearLongPressTimer(); // Always clear timer on mouse up
    // If long press flag is set, picker opened, do nothing more.
    // Otherwise (it was a short click), select the activity.
    if (!didLongPressRef.current) {
      setPickerActivityId(null); // Ensure picker is closed on short click
      onSelectActivity(activityId);
    }
    // Don't reset didLongPressRef here, let mouseDown handle it
  }, [clearLongPressTimer, onSelectActivity]);

  // Also clear timer if mouse leaves the element
  const handleMouseLeave = useCallback(() => {
    clearLongPressTimer();
    // Don't close picker or reset pending color if mouse leaves briefly
    // while picker is open (e.g., moving to picker itself)
  }, [clearLongPressTimer]);
  // --- End Long Press Handlers ---

  // Handler for color picker changes
  const handleColorChangeComplete = useCallback((color, activityId) => {
    onUpdateActivityColor(activityId, color.hex); // Update color directly
  }, [onUpdateActivityColor]);

  // Handler to close the picker, checks if click was directly on the cover
  const handlePickerClose = useCallback((e) => {
     // Only close if the click event originated directly on the cover element
     if (e.target === e.currentTarget) {
        setPickerActivityId(null);
     }
     // Otherwise, do nothing (click was likely inside the picker popover)
  }, []);

  return (
    <div className="activity-palette">
      <h3>Activities</h3>
      {/* Option to explicitly select 'Empty' to clear cells */}
       <div
        key="empty"
        className={`activity-item empty-item ${selectedActivityId === 'empty' ? 'selected' : ''}`}
        onClick={() => onSelectActivity('empty')}
        style={{ color: '#333' }}
      >
        Clear Cell
      </div>
      {/* Display other activities with remove buttons */}
      {displayActivities.map(activity => {
        // Calculate text color for this activity
        const textColor = getTextColor(activity.color);

        return (
          <div 
            key={activity.id} 
            className="activity-item-wrapper"
          >
            {/* Activity Item itself */}
            <div
              className={`activity-item ${selectedActivityId === activity.id ? 'selected' : ''}`}
              onMouseDown={() => handleMouseDown(activity.id)}
              onMouseUp={() => handleMouseUp(activity.id)}
              onMouseLeave={handleMouseLeave} 
              onDoubleClick={() => onUpdateActivityColor(activity.id)} 
              style={{ 
                backgroundColor: activity.color, 
                color: textColor
              }}
              title={`${activity.name} (Click=Select, DblClick=Random Color, LongPress=Choose Color)`}
            >
              <span className="activity-name">{activity.name}</span>
              <button 
                onClick={(e) => handleRemoveClick(e, activity.id)} 
                className="remove-button activity-remove-button" 
                title="Remove Activity"
              >
                ×
              </button>
            </div>
           
            {/* Conditionally render Cover and Popover as siblings */} 
            {pickerActivityId === activity.id && (
              <>
                {/* Cover is rendered first, positioned behind by CSS z-index */}
                <div className="color-picker-cover" onClick={handlePickerClose}/>
                
                {/* Popover is rendered second, positioned above by CSS z-index */}
                {/* No stopPropagation needed here now */}
                <div className="color-picker-popover"> 
                  {/* Pass the event object to handlePickerClose here too */} 
                  <button onClick={handlePickerClose} className="color-picker-close-button">×</button> 
                  {/* Add a wrapper around SketchPicker with stopPropagation */}
                  <div onClick={(e) => e.stopPropagation()}> 
                    <SketchPicker 
                      color={activity.color} 
                      onChangeComplete={(color) => handleColorChangeComplete(color, activity.id)} 
                      presetColors={[]} 
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )
      })}
      <p className="palette-instructions">Click=Select. DblClick=Random Color. Long Press=Choose Color.</p> {/* Updated instructions */}
    </div>
  );
}

export default ActivityPalette;
