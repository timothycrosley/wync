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
  onRenamePerson,
  onAddPerson
}) {
  const [summaryHeight, setSummaryHeight] = useState(100);
  const summarySpaceRef = useRef(null);
  const recalcTimeoutRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const newPersonInputRef = useRef(null);
  
  // Focus input when adding a new person
  useEffect(() => {
    if (isAddingPerson && newPersonInputRef.current) {
      newPersonInputRef.current.focus();
    }
  }, [isAddingPerson]);
  
  // Simplified approach for consistent heights across columns
  useEffect(() => {
    let isUserInteracting = false;
    let pendingUpdate = false;
    
    // Fixed height calculation that ensures consistent heights
    const recalculateHeights = (immediate = false) => {
      // Don't update during interactions unless explicitly forced
      if (isUserInteracting && !immediate) {
        pendingUpdate = true;
        return;
      }
      
      // Clear any pending timeouts
      clearTimeout(recalcTimeoutRef.current);
      
      // Delay to batch updates
      recalcTimeoutRef.current = setTimeout(() => {
        // 1. First reset all heights to auto to get natural height
        const allSummaries = document.querySelectorAll('.activity-summary');
        const summarySpace = summarySpaceRef.current;
        
        if (!allSummaries.length) return;
        
        // Store current scroll position to restore later
        const scrollTop = document.querySelector('.schedule-grid-container')?.scrollTop || 0;
        
        // Temporarily reset heights to determine natural height
        allSummaries.forEach(el => {
          el.style.height = 'auto';
          el.style.minHeight = '100px';
          el.style.maxHeight = 'none';
        });
        
        // 2. Let the browser render to calculate actual heights
        setTimeout(() => {
          // 3. Find the tallest summary
          let maxHeight = 100; // minimum
          allSummaries.forEach(el => {
            maxHeight = Math.max(maxHeight, el.scrollHeight);
          });
          
          // Add some padding
          maxHeight += 8;
          
          // 4. Apply the same fixed height to all summaries and the blank space
          if (summarySpace) {
            summarySpace.style.height = `${maxHeight}px`;
          }
          
          allSummaries.forEach(el => {
            el.style.height = `${maxHeight}px`;
            el.style.minHeight = `${maxHeight}px`;
            el.style.maxHeight = `${maxHeight}px`;
          });
          
          // Update state
          setSummaryHeight(maxHeight);
          
          // Restore scroll position
          if (document.querySelector('.schedule-grid-container')) {
            document.querySelector('.schedule-grid-container').scrollTop = scrollTop;
          }
          
          pendingUpdate = false;
        }, 0);
      }, immediate ? 0 : 150);
    };
    
    // Only process content changes when not interacting
    const handleMutation = () => {
      if (!isUserInteracting) {
        recalculateHeights(false);
      }
    };
    
    // Observe content changes
    const observer = new MutationObserver(handleMutation);
    const summaryElements = document.querySelectorAll('.activity-summary');
    summaryElements.forEach(el => {
      observer.observe(el, { childList: true, subtree: true });
    });
    
    // Track user interaction to prevent jumps
    const handleInteractionStart = () => {
      isUserInteracting = true;
    };
    
    const handleInteractionEnd = () => {
      isUserInteracting = false;
      if (pendingUpdate) {
        // Process any updates that were pending during interaction
        setTimeout(() => recalculateHeights(true), 300);
      }
    };
    
    // Add interaction listeners
    document.addEventListener('mousedown', handleInteractionStart);
    document.addEventListener('mouseup', handleInteractionEnd);
    
    // Initial calculation
    recalculateHeights(true);
    
    // Handle window resize
    const handleResize = () => {
      clearTimeout(recalcTimeoutRef.current);
      recalcTimeoutRef.current = setTimeout(() => recalculateHeights(true), 200);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      observer.disconnect();
      clearTimeout(recalcTimeoutRef.current);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleInteractionStart);
      document.removeEventListener('mouseup', handleInteractionEnd);
    };
  }, [people]);

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

  const handleAddPersonClick = () => {
    setIsAddingPerson(true);
  };
  
  const handleAddPersonCancel = () => {
    setIsAddingPerson(false);
    setNewPersonName("");
  };
  
  const handleAddPersonSubmit = (e) => {
    e.preventDefault();
    if (newPersonName.trim()) {
      onAddPerson(newPersonName.trim());
      setNewPersonName("");
      setIsAddingPerson(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleAddPersonCancel();
    }
  };

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
            
            {/* Add Person Column - Just shows a header to add a new person */}
            <div className="add-person-column column-aligned">
                <div className="header-cell add-person-header-cell">
                    {isAddingPerson ? (
                        <form onSubmit={handleAddPersonSubmit} className="add-person-form">
                            <input
                                type="text"
                                value={newPersonName}
                                onChange={(e) => setNewPersonName(e.target.value)}
                                placeholder="Person name"
                                className="add-person-input"
                                ref={newPersonInputRef}
                                onKeyDown={handleKeyDown}
                                onBlur={handleAddPersonCancel}
                            />
                            <button type="submit" className="add-person-submit">+</button>
                        </form>
                    ) : (
                        <div className="add-person-button" onClick={handleAddPersonClick}>
                            <span className="add-person-icon">+</span>
                            <span className="add-person-text">Add Person</span>
                        </div>
                    )}
                </div>
                <div className="summary-space"></div> {/* Empty summary space to match other columns */}
                {timeSlots.map(slot => (
                    <div key={slot.value} className="time-slot-placeholder"></div>
                ))}
            </div>
        </div>
    </div>
  );
}

export default ScheduleGrid;
