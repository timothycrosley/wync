import React, { useState, useRef, useCallback, useEffect } from 'react';
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

function ActivityPalette({ 
  activities, 
  selectedActivityId, 
  onSelectActivity, 
  onRemoveActivity, 
  onUpdateActivityColor,
  onAddActivity // Add new prop for adding activities
}) {
  // Filter out the 'Empty' activity from the visible palette
  const displayActivities = activities.filter(a => a.id !== 'empty');

  // State to manage which color picker is open { activityId: string | null }
  const [pickerActivityId, setPickerActivityId] = useState(null);
  
  // State for renaming activities
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityInput, setNewActivityInput] = useState(''); // For the add activity form
  
  // Ref to store the long press timer
  const longPressTimerRef = useRef(null);
  // Ref to prevent click after long press opens picker
  const didLongPressRef = useRef(false); 

  // State for the long press progress
  const [longPressProgress, setLongPressProgress] = useState(null);
  
  // Effect to animate the long press progress
  useEffect(() => {
    if (longPressProgress !== null) {
      // Add the long-press-active class to the body to trigger CSS animations
      document.body.classList.add('long-press-active');
      
      // Clear the class when longPressProgress is null
      return () => {
        document.body.classList.remove('long-press-active');
      };
    }
  }, [longPressProgress]);

  // Define a function to update activity names
  const onRenameActivity = useCallback((activityId, newName) => {
    // Find the activity in the array
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    
    // Call onUpdateActivityColor with the same color to update the name
    const updatedActivity = { ...activity, name: newName };
    // We need to access the activity's color but keep the name change
    onUpdateActivityColor(activityId, activity.color, newName);
  }, [activities, onUpdateActivityColor]);

  const handleRemoveClick = (e, activityId) => {
    e.stopPropagation(); // Prevent selecting the activity when clicking remove
    clearTimeout(longPressTimerRef.current); // Cancel long press if remove is clicked
    setPickerActivityId(null); // Close picker if open
    onRemoveActivity(activityId);
  };

  // --- Long Press Handlers --- 
  const handleMouseDown = useCallback((activityId) => {
    // Ignore if we're in edit mode
    if (editingActivityId) return;
    
    didLongPressRef.current = false; // Reset flag
    clearTimeout(longPressTimerRef.current); // Clear any existing timer
    
    // Start showing the long press progress
    setLongPressProgress(activityId);
    
    longPressTimerRef.current = setTimeout(() => {
      didLongPressRef.current = true; // Set flag: long press occurred
      
      // Generate a random color first
      const activity = activities.find(a => a.id === activityId);
      if (activity) {
        // Generate a random color and apply it
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
        onUpdateActivityColor(activityId, randomColor);
      }
      
      // Then open the color picker to allow further customization
      setPickerActivityId(activityId);
      setLongPressProgress(null); // Hide progress indicator
    }, 500); // 500ms delay for long press
  }, [activities, editingActivityId, onUpdateActivityColor]);

  const clearLongPressTimer = useCallback(() => {
    clearTimeout(longPressTimerRef.current);
    setLongPressProgress(null); // Hide progress indicator
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

  // --- Rename Handlers ---
  const handleDoubleClick = useCallback((e, activity) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Skip for 'empty' activity
    if (activity.id === 'empty') return;
    
    setEditingActivityId(activity.id);
    setNewActivityName(activity.name);
  }, []);
  
  const handleNameChange = useCallback((e) => {
    setNewActivityName(e.target.value);
  }, []);
  
  const handleNameSave = useCallback(() => {
    if (editingActivityId && newActivityName.trim()) {
      onRenameActivity(editingActivityId, newActivityName.trim());
    }
    setEditingActivityId(null);
  }, [editingActivityId, newActivityName, onRenameActivity]);
  
  const handleNameKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setEditingActivityId(null);
    }
  }, [handleNameSave]);
  
  const handleNameBlur = useCallback(() => {
    handleNameSave();
  }, [handleNameSave]);
  // --- End Rename Handlers ---

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

  // Handler for adding a new activity
  const handleAddActivity = (e) => {
    e.preventDefault();
    if (!newActivityInput.trim()) return;
    onAddActivity(newActivityInput.trim());
    setNewActivityInput(''); // Clear input after adding
  };

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
        <span className="eraser-icon">
          {/* Better eraser symbol */}
          &#x232B;
        </span>
        Clear Cell
      </div>
      
      {/* Add new activity form */}
      <div className="add-activity-container">
        <form onSubmit={handleAddActivity} className="add-activity-form-inline">
          <input
            type="text"
            value={newActivityInput}
            onChange={(e) => setNewActivityInput(e.target.value)}
            placeholder="New activity"
            className="add-activity-input"
          />
          <button type="submit" className="add-activity-button">+</button>
        </form>
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
              className={`activity-item ${selectedActivityId === activity.id ? 'selected' : ''} ${longPressProgress === activity.id ? 'long-press-in-progress' : ''}`}
              onMouseDown={() => handleMouseDown(activity.id)}
              onMouseUp={() => handleMouseUp(activity.id)}
              onMouseLeave={handleMouseLeave} 
              onDoubleClick={(e) => handleDoubleClick(e, activity)}
              style={{ 
                backgroundColor: activity.color, 
                color: textColor
              }}
              title={`${activity.name} (Click=Select, DblClick=Rename, LongPress=Random Color & Picker)`}
            >
              {editingActivityId === activity.id ? (
                <input
                  type="text"
                  value={newActivityName}
                  onChange={handleNameChange}
                  onKeyDown={handleNameKeyDown}
                  onBlur={handleNameBlur}
                  autoFocus
                  className="activity-name-input"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="activity-name">{activity.name}</span>
              )}
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
      <p className="palette-instructions">Click=Select. DblClick=Rename. Long Press=Random Color & Picker.</p>
    </div>
  );
}

export default ActivityPalette;
