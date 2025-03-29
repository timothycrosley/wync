import React, { useCallback, useState, useEffect, useRef } from 'react';
import PersonColumn from './PersonColumn';
import './ScheduleGrid.css'; // We'll create this CSS file next

function ScheduleGrid({ 
  people, 
  timeSlots, 
  schedule, 
  activities, 
  onCellUpdateDirect,
  onCellEnter,
  onCellClick,
  selectedActivityColor, 
  onRemovePerson,
  onRenamePerson
}) {
  const [summaryHeight, setSummaryHeight] = useState(100);
  const summarySpaceRef = useRef(null);
  
  // Observe all activity-summary elements to find the tallest one
  useEffect(() => {
    // Instead of trying to micromanage heights with ResizeObserver,
    // let's use a MutationObserver to detect when content changes
    // and then calculate heights more directly
    
    const recalculateHeights = () => {
      // Get all summary elements
      const summaryElements = document.querySelectorAll('.activity-summary');
      if (!summaryElements.length) return;
      
      // First, reset any previously set height to let content determine natural height
      summaryElements.forEach(el => {
        el.style.height = 'auto';
        el.style.minHeight = '100px';
      });
      
      // Small delay to let the DOM update with natural heights
      setTimeout(() => {
        // Calculate the maximum height
        let maxHeight = 100; // minimum height
        summaryElements.forEach(el => {
          const height = el.scrollHeight;
          if (height > maxHeight) {
            maxHeight = height;
          }
        });
        
        // Set the summary space height
        if (summarySpaceRef.current) {
          summarySpaceRef.current.style.height = `${maxHeight}px`;
        }
        
        // Ensure all summary elements have the same height
        summaryElements.forEach(el => {
          el.style.minHeight = `${maxHeight}px`;
        });
      }, 0);
    };
    
    // Set up a MutationObserver to detect content changes in any summary element
    const observer = new MutationObserver(recalculateHeights);
    
    // Observe all summary sections for content changes
    const summaryElements = document.querySelectorAll('.activity-summary');
    summaryElements.forEach(el => {
      observer.observe(el, { 
        childList: true,    // observe direct child additions/removals
        subtree: true,      // observe all descendants
        characterData: true // observe text changes
      });
    });
    
    // Initial calculation
    recalculateHeights();
    
    // Recalculate on window resize too
    window.addEventListener('resize', recalculateHeights);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', recalculateHeights);
    };
  }, [people]); // Re-run when people changes

  const getActivityById = useCallback((id) => {
    return activities.find(a => a.id === id) || { id: 'empty', name: 'Empty', color: '#FFFFFF' };
  }, [activities]);

  // Prevent default drag behavior which can interfere
  const handleDragStart = (e) => {
    e.preventDefault();
    return false;
  }

  // Prevent text selection during drag
  const handleSelectStart = (e) => {
    e.preventDefault();
    return false;
  }

  return (
    <div 
      className="schedule-grid-container"
      onDragStart={handleDragStart}
      onSelectStart={handleSelectStart}
      onMouseDown={(e) => e.preventDefault()}
    >
        <div className="schedule-grid grid-aligned">
            {/* Time Slot Labels Column */}
            <div className="time-slots-column column-aligned">
                <div className="header-cell time-header-cell">Time</div> {/* Header for time */}
                <div className="summary-space" ref={summarySpaceRef}></div> {/* Space for summaries */}
                {timeSlots.map(slot => (
                    <div key={slot.value} className="time-slot-label">
                        {slot.display}
                    </div>
                ))}
            </div>

            {/* Person Columns */}
            {people.map(person => (
                <PersonColumn
                    key={person.id}
                    person={person}
                    timeSlots={timeSlots}
                    schedule={schedule[person.id] || {}}
                    getActivityById={getActivityById}
                    onCellUpdateDirect={onCellUpdateDirect}
                    onCellEnter={onCellEnter}
                    onCellClick={onCellClick}
                    selectedActivityColor={selectedActivityColor}
                    onRemovePerson={onRemovePerson}
                    onRenamePerson={onRenamePerson}
                />
            ))}
        </div>
    </div>

  );
}

export default ScheduleGrid;
