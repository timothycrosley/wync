import React, { useState, useCallback, useEffect } from 'react';
import './TimeSlotCell.css'; // Create CSS next

function TimeSlotCell({ 
  timeSlot, 
  personId, 
  activity, 
  onUpdateDirect, 
  onEnter, 
  onClick,
  selectedActivityColor 
}) {
  const [isHoveringLocal, setIsHoveringLocal] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHoveringLocal(true);
    console.log(`Mouse Enter Cell (${personId}, ${timeSlot.display}) - Calling onEnter`);
    
    // We now handle all Tab key logic in App.js through onEnter
    onEnter(personId, timeSlot.value);
  }, [onEnter, personId, timeSlot]);

  const handleMouseLeave = useCallback(() => {
    setIsHoveringLocal(false);
  }, []);

  const handleCellMouseDown = useCallback((e) => {
    console.log(`Mouse Down Cell (${personId}, ${timeSlot.display}) - Calling onUpdateDirect`);
    onUpdateDirect(personId, timeSlot.value);
    // Prevent default behavior to avoid text selection during dragging
    e.preventDefault();
  }, [onUpdateDirect, personId, timeSlot]);

  const handleCellClick = useCallback((e) => {
    // Skip if Tab key is pressed to avoid duplicate updates
    if (document.body.classList.contains('tab-key-pressed')) {
      return;
    }
    
    // In case of a regular click (not drag), call the onClick handler directly
    if (onClick) {
      onClick(personId, timeSlot.value);
    }
    // Prevent default behavior
    e.preventDefault();
  }, [onClick, personId, timeSlot]);

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
      style={{ 
        ...cellStyle, 
        '--selected-activity-color': selectedActivityColor,
        color: textColor 
       }}
      data-person-id={personId}
      data-time-slot={timeSlot.value}
      onMouseDown={handleCellMouseDown}
      onClick={handleCellClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={`${activity ? activity.name : 'Empty'} at ${timeSlot.display}`}
    >
      <span className="cell-activity-name">
        {activity && activity.id !== 'empty' ? activity.name : ''}
      </span>
    </div>
  );
}

export default React.memo(TimeSlotCell);