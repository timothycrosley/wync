import React, { useState, useCallback } from 'react';
import './TimeSlotCell.css'; // Create CSS next

function TimeSlotCell({ 
  timeSlot, 
  personId, 
  activity, 
  onUpdate, // Renamed prop
  onEnter, // Use new prop from PersonColumn
  selectedActivityColor, 
  // isMouseDown, // Removed prop
  // onCellMouseDown // Remove prop 
}) {
  const [isHoveringLocal, setIsHoveringLocal] = useState(false);

  // Handler when mouse enters this specific cell
  const handleMouseEnter = () => {
    setIsHoveringLocal(true);
    // Directly call the onEnter handler passed from App (via parents)
    // This handler will check the ref in App.js
    console.log(`Mouse Enter Cell (${personId}, ${timeSlot}) - Calling onEnter`); // --- DEBUG LOG --- 
    onEnter(personId, timeSlot);
  };

  // Handler when mouse leaves this specific cell
  const handleMouseLeave = useCallback(() => {
    setIsHoveringLocal(false);
  }, []);

  // Handler for mouse down specifically on this cell (for single click update)
  const handleCellMouseDown = useCallback(() => {
    // Directly update this cell when clicked.
    // The global listener in App.js handles setting the isMouseDownRef for drag purposes.
    onUpdate(personId, timeSlot);
  }, [onUpdate, personId, timeSlot]);

  const cellStyle = {
    // Base background is the assigned activity color (or white for empty)
    backgroundColor: activity ? activity.color : '#FFFFFF',
    // Show the selected activity color as a preview *only* when hovering over this specific cell
    // We achieve this using CSS hover state instead of JS state for better performance
    //border: activity && activity.id !== 'empty' ? '1px solid rgba(0,0,0,0.1)' : 'none', // Handled by CSS now
  };

  // Add a class if the cell is considered 'empty' for potential different styling
  const cellClassName = `time-slot-cell ${activity && activity.id === 'empty' ? 'empty-cell' : ''}`;

  // Determine text color based on background brightness for better contrast
  const getTextColor = (bgColor) => {
    if (!bgColor || bgColor === '#FFFFFF') return '#AAA'; // Lighter text for empty cells
    const color = bgColor.substring(1); // strip #
    const rgb = parseInt(color, 16);   // convert rrggbb to decimal
    const r = (rgb >> 16) & 0xff;  // extract red
    const g = (rgb >>  8) & 0xff;  // extract green
    const b = (rgb >>  0) & 0xff;  // extract blue
    // Calculate luminance (per WCAG standard)
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 140 ? 'white' : '#333'; // Use white text on dark backgrounds
  };

  const textColor = getTextColor(activity?.color);

  return (
    <div
      className={cellClassName}
      // Add the selected color as a CSS custom property for hover effect
      style={{ 
        ...cellStyle, 
        '--selected-activity-color': selectedActivityColor,
        color: textColor // Set text color dynamically
       }}
      onMouseDown={handleCellMouseDown} // ADDED back for single click
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={`${activity ? activity.name : 'Empty'} at ${timeSlot}`}
    >
      {/* Display activity name if not empty */} 
      <span className="cell-activity-name">
        {activity && activity.id !== 'empty' ? activity.name : ''}
      </span>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders during drag, 
// especially as isMouseDown state changes frequently at the App level.
// Only re-render if the cell's own data (activity, selected color, etc.) changes.
export default React.memo(TimeSlotCell); // Restore memoization

// export default TimeSlotCell; // Export directly
