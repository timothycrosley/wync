import React, { useState, useRef, useCallback } from 'react';
import { SketchPicker } from 'react-color'; // Import the color picker
import './ActivityPalette.css'; // We'll create this CSS file next

function ActivityPalette({ activities, selectedActivityId, onSelectActivity, onRemoveActivity, onUpdateActivityColor }) {
  // Filter out the 'Empty' activity from the visible palette
  const displayActivities = activities.filter(a => a.id !== 'empty');

  // State to manage which color picker is open { activityId: string | null }
  const [pickerActivityId, setPickerActivityId] = useState(null);
  
  // Ref to store the long press timer
  const longPressTimerRef = useRef(null);
  // Ref to prevent click after long press opens picker
  const didLongPressRef = useRef(false); 

  const [pendingColor, setPendingColor] = useState(null); // State for picker's temp color

  const handleRemoveClick = (e, activityId) => {
    e.stopPropagation(); // Prevent selecting the activity when clicking remove
    clearTimeout(longPressTimerRef.current); // Cancel long press if remove is clicked
    setPickerActivityId(null); // Close picker if open
    setPendingColor(null); // Clear pending color on remove
    onRemoveActivity(activityId);
  };

  // --- Long Press Handlers --- 
  const handleMouseDown = useCallback((activityId, currentColor) => {
    didLongPressRef.current = false; // Reset flag
    clearTimeout(longPressTimerRef.current); // Clear any existing timer
    longPressTimerRef.current = setTimeout(() => {
      didLongPressRef.current = true; // Set flag: long press occurred
      setPendingColor(currentColor); // Initialize pending color with current color
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
      setPendingColor(null); // Clear pending color
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
  const handleColorChange = useCallback((color) => {
    setPendingColor(color.hex);
  }, []);

  // Handler to close the picker
  const handlePickerClose = useCallback(() => {
     setPickerActivityId(null);
     setPendingColor(null);
  }, []);

  // Accept the pending color
  const handleAcceptColor = useCallback(() => {
    if (pickerActivityId && pendingColor) {
        onUpdateActivityColor(pickerActivityId, pendingColor);
    }
    handlePickerClose(); // Close picker after accepting
  }, [pickerActivityId, pendingColor, onUpdateActivityColor, handlePickerClose]);

  return (
    <div className="activity-palette">
      <h3>Activities</h3>
      {/* Option to explicitly select 'Empty' to clear cells */}
       <div
        key="empty"
        className={`activity-item empty-item ${selectedActivityId === 'empty' ? 'selected' : ''}`}
        onClick={() => onSelectActivity('empty')}
      >
        Clear Cell
      </div>
      {/* Display other activities with remove buttons */}
      {displayActivities.map(activity => (
        <div 
          key={activity.id} 
          className="activity-item-wrapper" // Added wrapper for positioning picker
        >
          <div
            className={`activity-item ${selectedActivityId === activity.id ? 'selected' : ''}`}
            // Long press detection handlers
            onMouseDown={() => handleMouseDown(activity.id, activity.color)} // Pass current color
            onMouseUp={() => handleMouseUp(activity.id)}
            onMouseLeave={handleMouseLeave} 
            // Double-click still works for random color
            onDoubleClick={() => onUpdateActivityColor(activity.id)} 
            style={{ backgroundColor: activity.color }}
            title={`${activity.name} (Click=Select, DblClick=Random Color, LongPress=Choose Color)`} // Updated title
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
          {/* Conditionally render color picker */} 
          {pickerActivityId === activity.id && (
             <div className="color-picker-popover"> 
               <div className="color-picker-cover" onClick={handlePickerClose}/>
               <SketchPicker 
                 color={pendingColor || activity.color} // Show pending color, fallback to activity color
                 onChange={(color) => handleColorChange(color)} // Update pending color on change
                 presetColors={[] /* Optionally hide preset colors */} 
               />
               <button onClick={handleAcceptColor} className="color-picker-accept-button">
                 Accept
               </button>
             </div>
          )}
        </div>
      ))}
      <p className="palette-instructions">Click=Select. DblClick=Random Color. Long Press=Choose Color.</p> {/* Updated instructions */}
    </div>
  );
}

export default ActivityPalette;
